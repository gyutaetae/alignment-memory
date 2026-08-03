# Runbook — Alignment Memory

> 이 문서는 구현 단계가 따라야 할 운영 계약이다. Phase 1 이후 명령이 실행 가능해지고 Phase 8에서 실제 entrypoint와 최종 대조한다. 외부 자격증명 없이 검증할 때는 항상 fixture mode를 사용한다.

## 준비

```bash
python3 --version
uv --version
node --version
npm --version
gh --version
jq --version

uv sync --project backend --group dev
npm --prefix apps/web ci
```

Python 제품 환경은 3.12 기준이다. 실제 연동에 필요한 계정, 권한, 환경변수는 [user-intervention.md](./user-intervention.md)를 따른다.

## 1. 로컬 fixture 모드

fixture mode는 GitHub, Supabase, OpenRouter, Vercel 자격증명을 요구하지 않는다. 결과는 결정적 테스트 데이터이며 live 검증으로 표현하지 않는다.

터미널 1에서 API를 실행한다.

```bash
APP_MODE=fixture uv run --project backend \
  uvicorn alignment_memory.interfaces.api.main:create_app \
  --factory --host 127.0.0.1 --port 8000 --reload
```

터미널 2에서 Web을 실행한다.

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 \
  npm --prefix apps/web run dev -- --host 127.0.0.1
```

상태와 전체 로컬 검증을 실행한다.

```bash
curl -fsS http://127.0.0.1:8000/healthz | jq .
uv run --project backend ruff check backend/src backend/tests
uv run --project backend pytest -q
npm --prefix apps/web run lint
npm --prefix apps/web test -- --run
npm --prefix apps/web run build
```

fixture demo가 추가된 뒤에는 한 명령으로 vertical slice를 확인한다.

```bash
uv run --project backend python -m alignment_memory.interfaces.worker.cli \
  demo --output artifacts/demo
test -s artifacts/demo/evaluation.json
test -s artifacts/demo/evaluation.md
```

## 2. 실제 연동 모드

먼저 예시 파일을 복사하고 값은 로컬 secret store 또는 추적되지 않는 파일에서만 입력한다.

```bash
cp backend/.env.example backend/.env
test -f apps/web/.env.example && cp apps/web/.env.example apps/web/.env.local
git status --short
```

`git status`에 `.env` 또는 `.env.local`이 나타나면 실행을 중지하고 `.gitignore`를 고친다. [user-intervention.md](./user-intervention.md)의 Supabase, GitHub App, OpenRouter, Vercel 확인을 모두 마친 뒤 API를 실행한다.

```bash
APP_MODE=live uv run --project backend \
  uvicorn alignment_memory.interfaces.api.main:create_app \
  --factory --host 127.0.0.1 --port 8000
curl -fsS http://127.0.0.1:8000/healthz | jq .
```

Web은 공개 설정만 읽는다.

```bash
npm --prefix apps/web run dev -- --host 127.0.0.1
```

실제 분석은 trusted `main`의 GitHub Action Analyze Job에서 실행한다. FastAPI 요청 안에서 긴 OpenRouter 호출이나 Git push를 실행하지 않는다.

## 3. Initial Sync

Web의 Connect 화면에서 GitHub 로그인 → App 설치 → 저장소 선택 → Initial Sync를 누르는 것이 기본 경로다. API 확인이 필요하면 production 또는 로컬 URL을 설정하고 access token은 숨겨서 입력한다.

```bash
export ALIGNMENT_API_BASE_URL=http://127.0.0.1:8000
read 'AM_REPOSITORY_ID?Repository ID: '
read -rs 'AM_ACCESS_TOKEN?Supabase access token: '
printf '\n'

AM_SYNC_RESPONSE=$(curl -fsS -X POST \
  "$ALIGNMENT_API_BASE_URL/api/v1/repositories/$AM_REPOSITORY_ID/sync" \
  -H "Authorization: Bearer $AM_ACCESS_TOKEN" \
  -H 'Content-Type: application/json')
AM_JOB_ID=$(printf '%s' "$AM_SYNC_RESPONSE" | jq -er '.jobId')
printf 'jobId=%s\n' "$AM_JOB_ID"
```

terminal 상태가 나올 때까지 poll한다.

```bash
while :; do
  AM_JOB_JSON=$(curl -fsS \
    "$ALIGNMENT_API_BASE_URL/api/v1/jobs/$AM_JOB_ID" \
    -H "Authorization: Bearer $AM_ACCESS_TOKEN")
  AM_JOB_STATUS=$(printf '%s' "$AM_JOB_JSON" | jq -r '.status')
  printf '%s\n' "$AM_JOB_JSON" | jq '{status, progress, error}'
  case "$AM_JOB_STATUS" in
    completed) break ;;
    failed) exit 1 ;;
  esac
  sleep 2
done
unset AM_ACCESS_TOKEN
```

완료 조건:

- 허용된 Markdown, Issue, PR description/diff, commit message만 수집된다.
- `baselineCommitSha`가 DB 저장과 `knowledge/generated/**` commit 성공 뒤에만 전진한다.
- 같은 Initial Sync를 다시 실행해도 source, node, artifact가 중복되지 않는다.

## 4. PR Analyze

대상 PR은 in-repository branch에서 만들고, 분석 대상 변경을 commit/push한 뒤 실행한다.

```bash
AM_BRANCH=$(git branch --show-current)
git push -u origin "$AM_BRANCH"
AM_PR_URL=$(gh pr create --base main --head "$AM_BRANCH" --fill)
AM_PR_NUMBER=$(gh pr view "$AM_PR_URL" --json number --jq '.number')

AM_RUN_ID=$(gh run list --branch "$AM_BRANCH" --limit 10 \
  --json databaseId,event,status \
  --jq '[.[] | select(.event == "pull_request")][0].databaseId')
gh run watch "$AM_RUN_ID" --exit-status
gh pr view "$AM_PR_NUMBER" --comments
gh pr checks "$AM_PR_NUMBER"
```

PR comment와 check summary에는 세 결과 중 하나가 텍스트로 표시되어야 한다.

- `Aligned`: 지원되는 충돌이 없으며 check pass.
- `Missing Alignment`: 의도나 근거가 부족하며 warning comment와 check pass.
- `Direct Conflict`: 활성 Goal/Requirement/Decision과 모순되는 exact evidence가 있으며 check fail.

OpenRouter/provider/schema/evidence 검증 실패는 위 세 결과가 아니다. 이 경우 verdict를 게시하지 않고 job을 실패시킨다. 새 head SHA가 생기면 이전 분석은 취소하고 최신 SHA만 게시한다.

## 5. Merge Publish

Direct Conflict를 해소하거나 이유를 포함해 Decision을 supersede한 뒤 PR을 다시 분석한다. `Aligned` 또는 팀 정책상 허용된 상태가 확인되면 merge한다.

```bash
gh pr merge "$AM_PR_NUMBER" --merge
gh pr view "$AM_PR_NUMBER" \
  --json state,mergedAt,mergeCommit \
  --jq '{state, mergedAt, mergeCommit: .mergeCommit.oid}'

AM_PUBLISH_RUN_ID=$(gh run list --branch main --limit 10 \
  --json databaseId,event,status \
  --jq '[.[] | select(.event == "push")][0].databaseId')
gh run watch "$AM_PUBLISH_RUN_ID" --exit-status

git fetch origin main
git ls-tree -r --name-only origin/main knowledge/generated
```

merge 이후에만 공식 knowledge를 자동 갱신한다. Publish는 고정 template을 사용하고 `knowledge/generated/**` 밖의 파일을 쓰지 않으며, DB와 GitHub write가 모두 성공한 뒤 baseline을 전진시킨다.

## 6. 실패 복구

먼저 job과 Action log를 수집한다. 로그를 공유할 때 secret과 provider 원문 payload를 제거한다.

```bash
curl -fsS "$ALIGNMENT_API_BASE_URL/api/v1/jobs/$AM_JOB_ID" \
  -H "Authorization: Bearer $AM_ACCESS_TOKEN" | jq .
gh run view "$AM_RUN_ID" --log-failed
```

| 증상 | 조치 |
|---|---|
| `401/403` | Supabase session, GitHub App 설치/권한, Actions Secret을 확인하고 재연결한다. 권한을 임의로 넓히지 않는다. |
| GitHub rate limit/OpenRouter outage | 응답의 retry timing을 따르고 자동 retry 최대 2회 뒤 실패로 남긴다. |
| invalid schema/evidence | repair 1회 뒤 `validation_failed`; alignment verdict를 게시하지 않는다. |
| stale PR head | 오래된 run을 취소하고 최신 head SHA로 새 분석을 기다린다. |
| main SHA conflict | force-push하지 않고 최신 `main`을 다시 읽어 serialized publish를 재실행한다. |
| DB 성공/GitHub 실패 또는 반대 | 실패 job과 idempotency key를 보존하고 마지막 완료 state부터 재생한다. baseline을 먼저 전진시키지 않는다. |

동일한 GitHub event를 다시 처리할 때는 새 임의 event key를 만들지 않는다.

```bash
gh run rerun "$AM_RUN_ID" --failed
gh run watch "$AM_RUN_ID" --exit-status
```

## 7. 멱등 재실행 확인

### Initial Sync

같은 저장소의 sync endpoint를 다시 호출하고 dashboard의 source/node 수와 baseline이 불필요하게 증가하지 않는지 비교한다.

```bash
curl -fsS -X POST \
  "$ALIGNMENT_API_BASE_URL/api/v1/repositories/$AM_REPOSITORY_ID/sync" \
  -H "Authorization: Bearer $AM_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' | jq .
```

### PR Analyze

같은 run을 rerun한다. comment marker와 head SHA가 같으면 기존 comment를 update해야 한다.

```bash
gh run rerun "$AM_RUN_ID"
gh run watch "$AM_RUN_ID" --exit-status
gh api "repos/{owner}/{repo}/issues/$AM_PR_NUMBER/comments" --paginate \
  --jq '[.[] | select(.body | contains("<!-- alignment-memory:"))] | length'
```

### Merge Publish

재실행 전후 generated tree를 비교한다. 같은 content hash라면 새 artifact나 commit을 만들지 않는다.

```bash
git fetch origin main
git ls-tree -r origin/main knowledge/generated > /tmp/alignment-before.tree
gh run rerun "$AM_PUBLISH_RUN_ID"
gh run watch "$AM_PUBLISH_RUN_ID" --exit-status
git fetch origin main
git ls-tree -r origin/main knowledge/generated > /tmp/alignment-after.tree
diff -u /tmp/alignment-before.tree /tmp/alignment-after.tree
```

## 8. 데모 순서

먼저 fixture proof를 만든다.

```bash
uv run --project backend python -m alignment_memory.interfaces.worker.cli \
  demo --output artifacts/demo
jq . artifacts/demo/evaluation.json
sed -n '1,200p' artifacts/demo/evaluation.md
```

그다음 live proof를 아래 순서로 보여준다.

1. 기존 “browser extension 제외” Decision과 exact source를 연다.
2. extension sync를 추가하는 PR을 만들고 PR Analyze의 `Direct Conflict`, 실패 check, exact quote를 보여준다.
3. PR을 수정하거나 이유를 포함해 Decision을 supersede하고 같은 PR의 후속 `Aligned` 결과를 보여준다.
4. merge 후 DB revision, graph, `knowledge/generated/**`가 정확히 한 번 자동 갱신된 것을 보여준다.
5. Context Passport를 Korean PM과 English collaborator로 전환하고 original evidence를 연다.
6. Handshake를 기록하고, 같은 event/job/merge 재실행에서 중복이 없음을 보여준다.

fixture report와 live GitHub/Supabase/OpenRouter/Vercel 증거는 화면과 설명에서 명확히 구분한다.
