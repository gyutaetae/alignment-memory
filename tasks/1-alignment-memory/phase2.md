# Phase 2: Domain and evidence contracts

## 사전 준비

아래 문서와 scaffold를 읽어라:

- `docs/prd.md`
- `docs/data-schema.md`
- `docs/adr.md`
- `tasks/1-alignment-memory/docs-diff.md`
- `backend/pyproject.toml`
- `backend/src/alignment_memory/`
- `backend/tests/`

## 작업 내용

1. `backend/src/alignment_memory/domain/`에 provider-independent 타입과 규칙을 구현한다.
   - enum: `NodeType`, `AlignmentOutcome`, `JobType`, `JobStatus`, `OverrideType`, `HandshakeResponse`, `KnowledgeStatus`, `EvidenceRole`.
   - 불변 엔티티/값 객체: repository identity, source/source version, evidence reference, knowledge node/version/edge, finding, alignment, override, handshake, context passport, job.
   - 상태 전이와 append-only 규칙은 pure function 또는 명시적 policy로 둔다.
2. `contracts/analysis.py`에 OpenRouter 경계용 Pydantic 모델을 만든다. 모든 node/finding/edge는 source version ID, URL, exact quote를 요구한다. 추가 필드는 금지한다.
3. 다음 결정 규칙을 구현한다.
   - exact quote는 정규화된 저장 본문에 실제 포함되어야 한다.
   - `Direct Conflict`는 활성 Goal/Requirement/Decision과 모순되고 유효 근거가 있을 때만 가능하다.
   - 불확실하거나 근거가 부족하면 `Missing Alignment`; 지원되는 충돌이 없으면 `Aligned`.
   - Override는 이유가 필수이고 이전 finding을 삭제하지 않으며 후속 분석용 correction evidence를 만든다.
   - 인구통계·국적·성격 추론 필드는 계약에 존재하면 안 된다.
4. `backend/tests/fixtures/analysis/`에 실제 GitHub 형태의 고정 fixture를 6개 만든다: aligned 3개, direct-conflict 3개. 브라우저 확장 제외 Decision과 이를 위반/준수하는 PR 사례를 포함한다.
5. 도메인 단위 테스트로 schema rejection, exact quote, conflict precondition, state transition, override append-only를 검증한다.

## Acceptance Criteria

```bash
uv run --project backend pytest -q backend/tests/unit/domain backend/tests/unit/contracts
uv run --project backend ruff check backend/src/alignment_memory/domain backend/src/alignment_memory/contracts backend/tests/unit
uv run --project backend python -c "from alignment_memory.contracts.analysis import AnalysisResult; print(AnalysisResult.model_json_schema()['title'])"
test "$(find backend/tests/fixtures/analysis -type f -name '*.json' | wc -l | tr -d ' ')" -ge 6
git diff --check
```

## AC 검증 방법

모두 통과하면 phase 2 status를 `"completed"`로 변경한다. 3회 이상 실패하면 `"error"`와 `error_message`를 기록한다.

## 주의사항

- domain은 FastAPI, httpx, psycopg, GitHub, OpenRouter를 import하지 마라.
- AI 설명이 그럴듯하다는 이유로 exact quote 검증을 우회하지 마라.
- `Stale Reference`를 다시 추가하지 마라.

