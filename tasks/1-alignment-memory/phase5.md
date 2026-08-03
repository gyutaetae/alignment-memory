# Phase 5: FastAPI control plane

## 사전 준비

아래 문서와 기존 Backend를 읽어라:

- `docs/flow.md`
- `docs/data-schema.md`
- `docs/code-architecture.md`
- `docs/user-intervention.md`
- `tasks/1-alignment-memory/docs-diff.md`
- `backend/src/alignment_memory/application/`
- `backend/src/alignment_memory/ports/`
- `backend/src/alignment_memory/adapters/`
- `backend/src/alignment_memory/interfaces/api/main.py`

## 작업 내용

1. FastAPI app factory와 dependency composition root를 완성한다. `APP_MODE=fixture`에서는 seeded in-memory adapters, 실제 모드에서는 Postgres/GitHub/OpenRouter 설정을 사용한다. import 시 연결하지 않는다.
2. Supabase JWT 검증을 구현한다. issuer/audience/expiry/signature를 검증하고 repository membership을 모든 user route에서 확인한다. fixture mode auth bypass는 명시적 test header와 test 설정에서만 가능하다.
3. 사용자 API를 구현한다.
   - repositories/list/connect callback/sync
   - job polling
   - dashboard, relevant graph, alignment detail
   - context passport read/generate
   - handshake append, override append
4. internal Action API를 구현한다.
   - job create/context/event/result
   - timestamp + body digest HMAC, constant-time compare, replay window, idempotency key
   - validated result만 transactionally persist하고 stale head/main SHA를 거절한다.
5. 공통 오류 envelope `{error:{code,message,retryable,requestId}}`, request ID, secret-safe structured logging을 적용한다.
6. TestClient/httpx 테스트로 auth failure, membership, initial sync idempotency, polling transition, HMAC tamper/replay, alignment/graph/passport, handshake/override를 검증한다.

## Acceptance Criteria

```bash
uv run --project backend pytest -q backend/tests/unit/interfaces/api backend/tests/integration/test_api_flow.py
uv run --project backend ruff check backend/src/alignment_memory/interfaces backend/tests/unit/interfaces backend/tests/integration/test_api_flow.py
uv run --project backend python -c "from alignment_memory.interfaces.api.main import create_app; app=create_app(); assert app.openapi()['info']['title']=='Alignment Memory'"
uv run --project backend pytest -q
git diff --check
```

## AC 검증 방법

모두 통과하면 phase 5 status를 `"completed"`로 변경한다. 3회 이상 실패하면 `"error"`와 `error_message`를 기록한다.

## 주의사항

- FastAPI 요청 처리 중 장시간 OpenRouter 분석이나 Git push를 직접 실행하지 마라.
- provider 원문 오류나 secret을 응답/로그에 노출하지 마라.
- override는 과거 finding/version을 삭제하거나 수정하면 안 된다.

