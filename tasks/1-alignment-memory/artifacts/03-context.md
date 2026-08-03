# Context: alignment-memory

## 디렉토리 구조 (최상위)

- `.codex/` — 하네스 로컬 설정과 실행 권한 정책.
- `scripts/` — task phase를 순차 실행하고 문서 diff를 생성하는 Python 하네스.
- `prompts/` — task 생성 완료 알림 등 하네스 공용 프롬프트.
- `tasks/` — task 인덱스, phase 명세, 단계별 artifact와 로그.
- `docs/` — 이번 clarify에서 확정한 제품·흐름·데이터·아키텍처·ADR 문서.
- `persuasion-data/` — 하네스와 직접 관련 없는 기존 참고 데이터. 이번 MVP 범위에서 수정하지 않는다.

추적 파일이 32개이므로 빈 저장소가 아니다. 다만 기존 코드는 제품 애플리케이션이 아니라 Codex phase 실행 하네스뿐이다.

## 진입점

- `scripts/run_phases.py` — `tasks/{id-name}/index.json`을 읽고 pending phase마다 `codex exec`를 실행하는 주 진입점.
- `scripts/gen_docs_diff.py` — phase 0 이후 문서 변경 요약 생성.
- 애플리케이션용 `pyproject.toml`, `package.json`, API 또는 Web 진입점은 아직 없다.

## 관련 기존 모듈

### `scripts/run_phases.py`

주요 export:

- `run_phase(...)` — phase 문서와 이전 결과를 조합해 독립 Codex 세션을 실행한다.
- `main()` — task 상태를 확인하고 phase를 순차 실행하며 실패 시 중단한다.

이번 작업과의 연결: 수정 대상이 아니라 실행 기반이다. 모든 phase는 자신의 상태를 `completed` 또는 `error`로 갱신하고 테스트 결과를 남겨야 한다. phase 0 직전 기존 문서가 먼저 커밋되고, 각 phase 종료 후 코드가 커밋된다.

### `scripts/_utils.py`

주요 export:

- JSON 입출력, task 경로 해석, KST 시간, Git 커밋 보조 함수.

이번 작업과의 연결: task/index 형식과 상태 값의 기준이다. 앱 런타임 코드에서 import하지 않는다.

### `scripts/gen_docs_diff.py`

주요 export:

- 문서 변경을 수집해 `tasks/{task}/artifacts/docs-diff.md`로 기록한다.

이번 작업과의 연결: phase 0 산출물 검토에 사용한다. 제품 코드와 결합하지 않는다.

### `docs/*.md`

주요 인터페이스:

- `prd.md` — 제품 범위와 성공 기준.
- `flow.md` — Initial Sync, PR Analyze, Merge Publish, Passport/Handshake/Override 흐름.
- `data-schema.md` — 신뢰 계층, 불변 source와 versioned knowledge 스키마.
- `code-architecture.md` — FastAPI 모듈러 모놀리스, React, Action worker 경계.
- `adr.md` — 보안, AI 검증, 배포와 비범위 결정.

이번 작업과의 연결: 구현의 canonical specification이다. phase 문서는 이를 요약 복제하지 말고 구체 경로와 인수 조건으로 연결한다.

## 코드 관습

- 기존 하네스: Python 표준 라이브러리 중심, `snake_case`, 타입 힌트, UTF-8 JSON, KST timestamp.
- 상태 저장: `tasks/index.json`과 task별 `index.json`; phase 상태는 `pending/running/completed/error`.
- 테스트: 제품용 프레임워크와 테스트 디렉토리는 아직 없다. 합의대로 Backend는 pytest/Ruff, Web은 TypeScript test/build를 새로 구성한다.
- 에러/로그: runner는 phase 실패를 즉시 중단하고 task/phase에 오류를 기록한다. 제품은 구조화된 API error와 request/job ID를 사용한다.
- 의존성 관리: 기존 제품 의존성이 없다. Backend는 `uv`, Web은 `npm`으로 각각 고정한다.
- Git: runner가 문서와 각 phase 변경을 의도별로 자동 커밋한다. 기존 하네스 파일과 사용자 변경을 덮어쓰지 않는다.

## 충돌 / 주의사항

- 합의한 React/FastAPI/Supabase 앱은 전부 신규다. 재사용할 제품 모듈이 없으므로 scaffold에서 명시적 경계와 실행 명령을 먼저 고정해야 한다.
- 로컬 기본 Python은 3.13.2지만 제품 기준은 Python 3.12다. `pyproject.toml`은 3.12 이상 호환으로 두고 CI는 3.12를 기준으로 검증한다.
- Node는 v26, npm은 11이다. Web 패키지는 lockfile을 커밋하고 지원 Node 범위를 선언해 환경 차이를 줄인다.
- `uv`, `npm`, `codex`는 현재 설치되어 있다. Supabase, OpenRouter, GitHub App, Vercel 자격증명은 저장소에 없을 수 있으므로 비밀 없이 실행되는 로컬 adapter/fixture 테스트와 실제 adapter를 함께 제공해야 한다.
- PR 분석은 불신 입력을 다룬다. `pull_request_target`, PR 코드 실행, PR-head checkout을 금지하고 Action의 Analyze/Publish 비밀과 쓰기 권한을 분리한다.
- AI 생성물은 `knowledge/generated/**`만 쓸 수 있다. 소스와 사람이 작성한 Markdown은 수정하지 않는다.
- 초기 계획의 “승인 후 공식 지식 반영” 및 `Stale Reference` 표현보다 clarify/docs가 최신이다. 공식 지식 반영은 Initial Sync/merge 시 자동이며 결과는 `Aligned`, `Missing Alignment`, `Direct Conflict` 세 종류다.

## plan stage에 전달할 권고

- phase 0은 이미 확정된 5개 canonical 문서를 재작성하지 말고, 실행·자격증명·배포에 필요한 `docs/user-intervention.md`와 검증 명령만 보강한다.
- scaffold, domain/evidence validator, persistence, GitHub/OpenRouter adapter, FastAPI control plane, Actions, React UI, borderless/e2e를 분리해 각 phase가 한 계층에 집중하게 한다.
- 모든 외부 연동에는 port와 fixture/local 구현을 제공해 자격증명 없이도 CI가 결정적으로 통과하게 한다.
- `Direct Conflict` 판정과 exact-quote 검증은 UI보다 먼저 fixture로 잠근다. 최소 3개 aligned와 3개 conflict 사례를 포함한다.
- 마지막 phase는 전체 lint/test/build, 고정 fixture E2E, 보안 정적 점검, 배포 파일, 데모 seed를 함께 검증한다.
- 각 phase 명세는 수정 경로, 금지 경로, 선행 계약, 실행 가능한 acceptance command를 명확히 적는다.
