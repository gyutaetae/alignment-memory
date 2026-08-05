# Alignment Memory

> GitHub에 흩어진 결정과 근거를 프로젝트 기억으로 보존하고, 새 PR이 그 결정과 맞는지 확인하는 협업 도구

**Alignment Memory**는 GitHub의 Markdown, Issue, PR, diff, commit message를 근거가 보존된 프로젝트 기억으로 만들고, PR을 다음 세 상태로 분석합니다.

- **Aligned**: 기존 목표·요구사항·결정과 충돌하지 않음
- **Missing Alignment**: 의도 또는 근거가 더 필요함
- **Direct Conflict**: 검증된 기존 결정과 직접 모순됨

AI가 추측으로 판정하지 않도록, 모든 강한 판정은 원문 인용과 GitHub URL을 함께 보존합니다. PR이 merge된 뒤에만 `knowledge/generated/**` 아래의 공식 프로젝트 기억을 갱신합니다.

## 이 저장소에서 할 수 있는 일

- GitHub 기록에서 검증 가능한 프로젝트 지식과 관계를 생성합니다.
- PR의 변경사항을 기존 목표·요구사항·결정과 비교합니다.
- 한국어 PM과 영어 협업자가 같은 근거를 공유하는 Context Passport와 Handshake를 제공합니다.
- fixture 모드에서는 GitHub·Supabase·OpenRouter 계정 없이 전체 흐름을 재현합니다.
- live 모드에서는 GitHub App, Supabase, OpenRouter, GitHub Actions를 연결해 실제 저장소에서 동작합니다.

> `artifacts/demo/**`는 재현 가능한 **fixture 증거**입니다. 실제 GitHub, AI 제공자, Supabase, 배포 환경에서 실행한 live 증거로 표현하지 않습니다.

## 구조

```text
apps/web/                 React + Vite 사용자 화면
backend/                  FastAPI API와 분석 Worker
supabase/migrations/      PostgreSQL 스키마와 RLS 정책
.github/workflows/        PR Analyze / merge Publish Actions
knowledge/generated/      merge 뒤 자동 생성되는 공식 지식
docs/                     제품, 운영, 배포의 기준 문서
tasks/                    단계별 구현 artifact
```

## 빠른 시작: 외부 계정 없이 실행

### 준비물

- Python 3.12 또는 3.13
- [uv](https://docs.astral.sh/uv/)
- Node.js 20.19+ 또는 22.12+
- npm
- 선택: `jq` (데모 결과 확인), Docker (컨테이너 점검), GitHub CLI (live 연동)

API 키나 `.env` 파일은 fixture 모드에 필요하지 않습니다.

### 1. 의존성 설치

```bash
git clone https://github.com/gyutaetae/alignment-memory.git
cd alignment-memory
make setup
```

`make setup`은 Python 개발 의존성과 Web 의존성을 설치합니다. 개별 실행이 필요하면 아래 명령을 사용합니다.

```bash
uv sync --project backend --group dev
npm --prefix apps/web ci
```

### 2. API와 Web 실행

터미널 1에서 fixture API를 시작합니다.

```bash
APP_MODE=fixture uv run --project backend \
  uvicorn alignment_memory.interfaces.api.main:create_app \
  --factory --host 127.0.0.1 --port 8000 --reload
```

터미널 2에서 Web을 시작합니다.

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 \
  npm --prefix apps/web run dev -- --host 127.0.0.1
```

브라우저에서 Vite가 출력한 URL(기본값 `http://127.0.0.1:5173`)을 엽니다. API 상태는 다음으로 확인합니다.

```bash
curl -fsS http://127.0.0.1:8000/healthz | jq .
```

### 3. 한 번에 데모 검증

```bash
uv run --project backend python -m alignment_memory.interfaces.worker.cli \
  demo --output artifacts/demo

jq '{execution, summary, correctionImpact}' artifacts/demo/evaluation.json
```

`execution.mode`이 `fixture`이고 `externalServicesCalled`가 `false`인지 확인하세요. 이 명령은 충돌 판정 → 수정 → merge 뒤 지식 갱신의 결정적 샘플을 만듭니다.

## 사용 플레이북

### A. 로컬 fixture 데모

1. 위의 API와 Web을 실행합니다.
2. Web의 Connect 화면에서 fixture 저장소를 선택합니다.
3. Project Memory에서 GitHub 기록이 어떤 목표·결정·근거로 정리됐는지 확인합니다.
4. Alignment 화면에서 PR의 `Aligned`, `Missing Alignment`, `Direct Conflict` 판정과 인용 근거를 확인합니다.
5. Context Passport에서 협업자별 요약과 원문 근거를 비교하고 Handshake를 기록합니다.
6. `demo` 명령으로 `artifacts/demo/`의 conflict/resolution/evaluation 결과를 다시 생성해 결정 규칙과 멱등성을 확인합니다.

### B. 실제 GitHub 저장소 연동

live 모드는 다음 네 가지가 모두 준비된 뒤에만 사용합니다.

1. **Supabase**: GitHub 로그인, Postgres, RLS
2. **GitHub App**: 선택된 저장소만 읽는 설치·webhook
3. **OpenRouter**: Analyze Action에서만 사용하는 모델 키
4. **배포 환경**: Vercel Web과 공개 HTTPS FastAPI URL

예시 파일을 복사하되, 비밀값은 커밋하지 않습니다.

```bash
cp backend/.env.example backend/.env
cp apps/web/.env.example apps/web/.env.local
git status --short
```

`backend/.env`나 `apps/web/.env.local`이 Git 상태에 보이면 실행을 멈추고 `.gitignore`를 먼저 확인하세요. 설정 항목·최소 권한·secret 회전 절차는 [사용자 개입 가이드](docs/user-intervention.md)를 따릅니다.

설정 후 live API를 시작하기 전 fail-fast 검증을 실행합니다.

```bash
APP_MODE=live uv run --project backend python -c \
  "from alignment_memory.settings import Settings; Settings().validate_runtime(); print('live configuration valid')"
```

그 다음 Web에서 GitHub 로그인 → App 설치 → 저장소 선택 → **Initial Sync**를 진행합니다. 긴 분석은 API 요청 안에서 실행하지 않고, trusted `main`의 GitHub Action이 처리합니다.

### C. PR 분석과 merge 이후 갱신

1. 저장소 내 브랜치에서 PR을 만들고 푸시합니다.
2. Analyze Action이 최신 PR head만 분석합니다.
3. PR check와 comment에서 판정, 원문 인용, 다음 행동을 확인합니다.
4. `Direct Conflict`는 변경을 고치거나 이유를 포함한 새 Decision으로 supersede합니다.
5. `Aligned` 또는 팀이 허용한 상태만 merge합니다.
6. merge Publish Action이 `knowledge/generated/**`만 갱신했는지 확인합니다.

실행 명령, 재시도, 실패 복구, 멱등성 확인은 [운영 runbook](docs/runbook.md)에 있습니다.

## 개발 검증

```bash
# 전체 검사: Python lint/test + Web lint/test/build + whitespace
make check

# 개별 실행
make lint
make test
make build
```

Docker로 API 시작 계약을 확인할 수도 있습니다.

```bash
docker build -f backend/Dockerfile -t alignment-memory-api:local backend
docker run --rm -e APP_MODE=fixture -e PORT=8000 -p 8000:8000 \
  alignment-memory-api:local
```

## 개발 하네스 사용하기

이 저장소에는 요구를 바로 코딩하지 않고 단계별 artifact를 남기는 Codex 구현 하네스도 포함돼 있습니다.

```text
요구 한 줄
  → initial-plan
  → clarify 9단계
  → context-gather
  → task/phase 계획
  → Codex 직렬 구현
  → 평가
```

IDE의 Codex에게 아래처럼 요청합니다.

```text
하네스 시작: <구현하려는 요구사항>
```

계획이 생성된 뒤에만 phase runner를 실행합니다.

```bash
python scripts/run_phases.py {id}-{name}
```

runner의 환경 변수와 단계별 산출물 규칙은 `.codex/skills/plan-and-build/SKILL.md`와 `tasks/`의 기존 작업을 참고하세요.

## 보안과 운영 원칙

- `VITE_*`에는 공개 URL과 publishable key만 넣고, DB 연결·GitHub App private key·OpenRouter key는 넣지 않습니다.
- OpenRouter key는 Analyze workflow에만 주고 Publish workflow나 Web에는 주지 않습니다.
- 외부 fork나 신뢰되지 않은 actor의 이벤트를 자동 처리하지 않습니다.
- 생성 작업은 `knowledge/generated/**` 밖을 수정하지 않으며, DB와 GitHub 쓰기가 모두 성공한 뒤에만 기준 SHA를 전진시킵니다.
- 실제 설정 방법과 secret 회전은 [사용자 개입 가이드](docs/user-intervention.md), 발표 시 fixture/live 증거 구분은 [3분 데모 스크립트](docs/demo-script.md)를 따릅니다.

## 참고 문서

- [PRD](docs/prd.md)
- [제품 흐름](docs/flow.md)
- [데이터 스키마](docs/data-schema.md)
- [코드 구조](docs/code-architecture.md)
- [아키텍처 결정](docs/adr.md)
- [운영 runbook](docs/runbook.md)
- [사용자 개입 가이드](docs/user-intervention.md)
