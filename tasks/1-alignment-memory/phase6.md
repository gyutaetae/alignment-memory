# Phase 6: GitHub Action worker and publishing

## 사전 준비

아래 문서와 API/adapter 코드를 읽어라:

- `docs/flow.md`
- `docs/code-architecture.md`
- `docs/adr.md`
- `docs/runbook.md`
- `tasks/1-alignment-memory/docs-diff.md`
- `backend/src/alignment_memory/interfaces/worker/`
- `backend/src/alignment_memory/interfaces/api/`
- `backend/src/alignment_memory/adapters/github/`
- `knowledge/generated/`

## 작업 내용

1. `alignment_memory.interfaces.worker.cli`에 CLI를 구현한다.
   - `analyze-event`: GitHub event를 allowlisted data로 파싱하고 API context를 받아 OpenRouter 분석 후 검증된 artifact JSON을 출력한다.
   - `publish`: 검증된 artifact만 읽어 고정 템플릿 PR comment/check summary 또는 generated Markdown을 렌더링한다.
   - HMAC API client, event parser, result schema, publish templates를 분리한다.
2. PR comment에는 textual outcome, 기존 agreement, proposed change, exact quote + source URL, 이유, 다음 행동을 포함한다. marker와 head SHA를 사용해 같은 분석 댓글을 update하며 중복 생성하지 않는다.
3. generated wiki renderer는 정렬된 deterministic Markdown과 Wikilink를 만들고 경로를 `knowledge/generated/**`로 강제한다. path traversal과 임의 파일명을 거절한다.
4. `.github/workflows/`에 analyze와 publish 권한을 분리한 workflow를 구현한다.
   - collaborator/owner/member actor만 자동 처리; fork 제외.
   - `pull_request_target`과 PR-head 코드 실행 금지; trusted main worker만 실행.
   - Analyze: read-only permissions, `OPENROUTER_API_KEY`, API HMAC; write 권한 없음.
   - Publish: 필요한 PR/content write 권한, Analyze artifact; OpenRouter secret 없음.
   - PR key는 stale run 취소, repository publish는 직렬화하고 main SHA를 재검증한다.
5. YAML/security tests와 worker unit tests를 작성한다.

## Acceptance Criteria

```bash
uv run --project backend pytest -q backend/tests/unit/interfaces/worker backend/tests/integration/test_workflow_security.py
uv run --project backend ruff check backend/src/alignment_memory/interfaces/worker backend/tests/unit/interfaces/worker
! rg -n "pull_request_target" .github/workflows
! rg -n "OPENROUTER_API_KEY" .github/workflows/*publish*
test -z "$(find knowledge -type f ! -path 'knowledge/generated/*' -print)"
uv run --project backend pytest -q
git diff --check
```

## AC 검증 방법

모두 통과하면 phase 6 status를 `"completed"`로 변경한다. 3회 이상 실패하면 `"error"`와 `error_message`를 기록한다.

## 주의사항

- workflow가 PR branch의 Python, shell, package script를 실행하게 만들지 마라.
- 모델 출력이 comment format, 파일 경로, git command를 직접 선택하게 하지 마라.
- main에 force-push하지 마라.

