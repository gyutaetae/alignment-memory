# harness

Codex CLI 기반 자율 구현 하네스. 사용자의 한 줄 요구를 받아 단계별 sub-agent가
artifact를 통해 결과를 전달하며 직렬로 구현까지 끝내는 파이프라인.

한 줄 판단: Codex용 자율 구현 엔진은 codex-harness, 사용자/설득력 검증 루프는 cc-system에서 가져오기.

## Alignment Memory

이 저장소에서 하네스로 구현하는 첫 제품이다. GitHub의 Markdown, Issue, PR, diff, commit message를 근거가 보존된 프로젝트 기억으로 만들고, PR을 `Aligned`, `Missing Alignment`, `Direct Conflict`로 분석한다. merge 뒤에는 공식 지식과 `knowledge/generated/**`만 자동 갱신한다.

제품 코드는 기존 하네스와 분리된다.

```text
apps/web/                 React/Vite Web
backend/                  FastAPI + shared Worker package
supabase/migrations/      Postgres schema와 RLS
.github/workflows/        Analyze/Publish Actions
knowledge/generated/      AI가 쓸 수 있는 유일한 경로
docs/                     canonical 제품·운영 문서
tasks/1-alignment-memory/ phase 계획과 artifact
```

### 제품 빠른 시작

Phase 1 이후 자격증명 없는 fixture mode를 기본으로 실행한다.

```bash
uv sync --project backend --group dev
npm --prefix apps/web ci

# 터미널 1
APP_MODE=fixture uv run --project backend \
  uvicorn alignment_memory.interfaces.api.main:create_app \
  --factory --host 127.0.0.1 --port 8000

# 터미널 2
VITE_API_BASE_URL=http://127.0.0.1:8000 npm --prefix apps/web run dev
```

실제 Supabase/GitHub App/OpenRouter/Vercel 설정은 비밀을 저장소에 넣지 않고 [사용자 개입 가이드](docs/user-intervention.md)를 따른다. Initial Sync, PR Analyze, Merge Publish, 복구와 멱등 재실행은 [runbook](docs/runbook.md)에 있다.

Canonical 문서: [PRD](docs/prd.md) · [Flow](docs/flow.md) · [Data Schema](docs/data-schema.md) · [Code Architecture](docs/code-architecture.md) · [ADR](docs/adr.md)

## 포팅 기준

- `codex-harness`: `.codex/skills/plan-and-build`, `scripts/run_phases.py`, `prompts/`의 task 생성 규격, `tasks/` 기본 구조.
- `cc-system`: `persuasion-review`만 `.codex/skills/persuasion-review`로 포팅.
- Codex CLI는 현재 `--dangerously-skip-permissions`가 아니라 `--dangerously-bypass-approvals-and-sandbox`를 사용한다. runner는 이 플래그를 기본으로 켜며, 필요하면 `CODEX_PERMISSION_FLAGS`로 override한다.

## 파이프라인

```
요구 한 줄
   ↓
[1. initial-plan]   요구사항 / 구현 디테일 / 제약 / 완료 기준
   ↓ artifact: 01-initial-plan.md
[2. clarify]        9단계: feasibility → tech-stack → user-flow → ui → api
   ↓                       → data → architecture → tech-decisions → final-doc
   │                (사용자 프롬프트는 매 단계 자동 기록)
   ↓ artifact: 02-clarify.md + prompts/clarify/01~09-*.md
[3. context-gather] 빈 코드베이스면 스킵
   ↓ artifact: 03-context.md
[4. plan]           prompts/의 task 생성 규격에 따라 task/phase 파일 생성
   ↓ artifact: tasks/{id}-{name}/index.json + phase{N}.md
[5. generate]       scripts/run_phases.py 가 codex 직렬 실행
   ↓
[6. evaluate]       단순 MVP면 스킵
   ↓ artifact: 05-evaluate.md
```

## 디렉토리

```
.codex/skills/plan-and-build/
  SKILL.md            ← 전체 흐름 (orchestrator가 따름)
  agents/             ← stage별 sub-agent prompt 6개

.codex/skills/persuasion-review/
  SKILL.md / SPEC.md   ← 잠재고객 설득력 검증 루프
  scripts/             ← codex exec 기반 시뮬레이션 runner

prompts/             ← plan stage가 따르는 task/phase 생성 규격

scripts/
  run_phases.py       ← codex 직렬 실행 runner
  gen_docs_diff.py    ← phase 0 후 docs-diff.md 자동 생성
  _utils.py

tasks/
  index.json
  {id}-{name}/
    index.json
    artifacts/        ← 각 stage의 출력
    prompts/clarify/  ← clarify 9단계 사용자 프롬프트 원문
    phase{N}.md       ← codex가 실행할 phase 파일
    phase{N}-output.json
    docs-diff.md      ← 자동 생성

docs/                 ← phase 0가 갱신/생성하는 프로젝트 문서
```

## 사용

orchestrator(IDE의 코딩 에이전트)에게 한 줄 요구를 던진다:

```
하네스 시작: <요구사항>
```

orchestrator가 SKILL.md를 따라 stage 1~4까지 사용자와 함께 진행하고, stage 5에서
runner를 실행한다:

```bash
python scripts/run_phases.py {id}-{name}
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `CODEX_BIN` | `codex` | codex CLI 경로 |
| `CODEX_MODEL` | Codex CLI 기본값 | 사용할 모델. 설정하면 `--model`로 전달 |
| `CODEX_PERMISSION_FLAGS` | `--dangerously-bypass-approvals-and-sandbox` | `codex exec` 권한 플래그 |
| `PHASE_TIMEOUT` | `1800` | 각 phase 최대 실행 시간 (초) |
| `SKIP_GIT` | `0` | `1`이면 git 커밋 시도 안 함 |
