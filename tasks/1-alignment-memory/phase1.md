# Phase 1: Application scaffold

## 재실행 컨텍스트

이 phase의 이전 시도는 npm lockfile 생성 지연으로 30분 timeout됐지만, 의도한 scaffold와 `backend/uv.lock`, `apps/web/package-lock.json`은 이미 작업 트리에 남아 있을 수 있다. 기존 파일을 폐기하거나 처음부터 다시 만들지 말고 먼저 검토한 뒤 부족한 부분만 수정하고 Acceptance Criteria를 즉시 실행하라.

프로세스 목록에 보이는 `scripts/run_phases.py 1-alignment-memory`와 그 Codex child는 **현재 너를 실행한 부모/자기 프로세스**다. 이를 중복 실행으로 오인해 기다리거나 poll·kill하지 말고, 다른 runner를 시작하지도 마라. 저장소 루트의 untracked `.npm-cache/`가 이전 시도의 패키지 캐시로 존재하면 내용이 npm cache뿐인지 확인한 뒤 제거하고 커밋에 포함하지 마라.

## 사전 준비

아래 문서와 phase 0 결과를 읽어라:

- `docs/code-architecture.md`
- `docs/adr.md`
- `docs/runbook.md`
- `tasks/1-alignment-memory/docs-diff.md`
- `README.md`

기존 `scripts/`, `prompts/`, `tasks/`는 plan-and-build 하네스다. 제품 코드와 분리하고 runner를 수정하지 마라.

## 작업 내용

1. Backend scaffold를 `backend/`에 만든다.
   - `pyproject.toml`: Python `>=3.12,<3.14`, uv, FastAPI, Pydantic v2, pydantic-settings, httpx, psycopg, PyJWT, pytest, pytest-asyncio, Ruff.
   - 패키지 루트 `backend/src/alignment_memory/`와 `domain`, `application`, `ports`, `adapters`, `contracts`, `interfaces/api`, `interfaces/worker` 패키지.
   - `alignment_memory.interfaces.api.main:create_app()`과 `/healthz`만 우선 제공한다.
   - 중앙 설정 객체는 환경변수를 읽되 import 시 비밀이나 네트워크를 요구하지 않는다.
   - `backend/Dockerfile`, `.env.example`, 최소 health/config 테스트를 추가한다.
2. Web scaffold를 `apps/web/`에 만든다.
   - React + TypeScript + Vite + npm, TanStack Query, React Router, CSS Modules, Vitest, Testing Library.
   - 빈 제품 shell과 `/health`에 의존하지 않는 기본 render test를 만든다.
   - Node 지원 범위와 scripts(`dev`, `build`, `test`, `lint`)를 선언하고 lockfile을 커밋한다.
3. 루트에 `.gitignore`와 편의 명령을 최소 보강하되 기존 하네스 산출물을 무시하지 않는다.
4. `knowledge/generated/.gitkeep`을 추가한다. 다른 경로에 AI 생성 파일을 두지 않는다.

## Acceptance Criteria

```bash
uv sync --project backend --group dev
uv run --project backend ruff check backend/src backend/tests
uv run --project backend pytest -q
npm --prefix apps/web ci
npm --prefix apps/web run lint
npm --prefix apps/web test -- --run
npm --prefix apps/web run build
git diff --check
```

## AC 검증 방법

모든 명령이 통과하면 phase 1 status를 `"completed"`로 변경하라. 3회 이상 실패하면 `"error"`와 `error_message`를 기록하라.

## 주의사항

- 이 phase에서는 실제 도메인 규칙, DB 스키마, GitHub/OpenRouter 호출을 구현하지 마라.
- import 또는 테스트 수집만으로 외부 네트워크나 자격증명을 요구하면 안 된다.
- 하네스의 Python 환경과 Backend uv 환경을 섞지 마라.
