# Phase 4: GitHub and OpenRouter integrations

## 사전 준비

아래 문서와 도메인/저장소 계약을 읽어라:

- `docs/prd.md`
- `docs/flow.md`
- `docs/code-architecture.md`
- `docs/adr.md`
- `tasks/1-alignment-memory/docs-diff.md`
- `backend/src/alignment_memory/domain/`
- `backend/src/alignment_memory/contracts/analysis.py`
- `backend/src/alignment_memory/ports/`
- `backend/src/alignment_memory/adapters/memory/`

## 작업 내용

1. `ports/github.py`와 `ports/llm.py`에 async protocol과 typed adapter error를 정의한다.
2. `adapters/github/`에 GitHub App REST adapter를 구현한다.
   - installation token 발급, rate-limit/retry/timeout, actor association 확인.
   - 허용 입력만 수집: Markdown blob, Issue title/body, PR title/body/diff, commit message.
   - 전체 코드 blob, PR code 실행, PR-head checkout은 금지한다.
   - initial sync와 `baselineCommitSha` 이후 incremental source 수집을 지원한다.
   - stable external ID + content hash로 정규화한다.
3. `adapters/openrouter/`에 OpenRouter adapter를 구현한다.
   - configurable fixed primary/fallback model, timeout, bounded retry, response model/usage 기록.
   - `AnalysisResult` JSON Schema를 요청하고 Pydantic으로 파싱한다.
   - schema/evidence 검증 실패는 provider 성공으로 취급하지 않는다.
   - repository text를 instruction이 아니라 quoted data로 분리하는 prompt builder를 둔다.
4. fixture adapter를 두고 외부 네트워크 없이 GitHub pagination, incremental boundary, OpenRouter primary/fallback, malformed JSON, fabricated quote를 contract test한다.
5. application service에서 allowed source normalization → AI call → exact evidence validation → deterministic outcome을 조합하되 side effect는 repository port를 통해서만 수행한다.

## Acceptance Criteria

```bash
uv run --project backend pytest -q backend/tests/unit/adapters/github backend/tests/unit/adapters/openrouter backend/tests/unit/application
uv run --project backend ruff check backend/src/alignment_memory/ports backend/src/alignment_memory/adapters backend/src/alignment_memory/application backend/tests/unit
uv run --project backend pytest -q backend/tests/fixtures/test_alignment_cases.py
! rg -n "pull_request_target|checkout.*head|subprocess.*repo" backend/src
git diff --check
```

## AC 검증 방법

모두 통과하면 phase 4 status를 `"completed"`로 변경한다. 3회 이상 실패하면 `"error"`와 `error_message`를 기록한다.

## 주의사항

- 모델 이름을 UI나 도메인에 하드코딩하지 마라. 설정 기본값과 실제 사용 모델을 기록하라.
- retry로 중복 source/analysis를 만들지 마라.
- GitHub 원문이나 모델 출력에서 shell/path/tool 지시를 실행하지 마라.

