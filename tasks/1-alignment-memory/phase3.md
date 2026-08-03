# Phase 3: Persistence and version history

## 사전 준비

아래 문서와 이전 구현을 읽어라:

- `docs/data-schema.md`
- `docs/code-architecture.md`
- `docs/adr.md`
- `tasks/1-alignment-memory/docs-diff.md`
- `backend/src/alignment_memory/domain/`
- `backend/src/alignment_memory/contracts/`
- `backend/tests/fixtures/analysis/`

## 작업 내용

1. `supabase/migrations/`에 재실행 안전한 순차 SQL migration을 추가한다.
   - repositories/memberships/installations
   - immutable sources/source_versions
   - knowledge_nodes/knowledge_node_versions/knowledge_edges/evidence_links
   - sync_jobs/ai_runs/alignments/findings/context_passports/handshakes/overrides/generated_artifacts
   - UUID PK, timestamps, foreign keys, enum/check 제약, content hash와 event key 멱등 unique 제약, baseline/main SHA, active version 참조.
   - RLS를 활성화하고 repository membership 기반 user read/write 정책과 service role worker 경계를 명시한다.
2. `ports/repositories.py`에 async repository protocol을 정의한다. application/domain 타입만 노출한다.
3. `adapters/memory/`에 실제 local/demo용 `InMemoryRepository`를 구현한다. immutable source, version append, job compare-and-set, idempotent result persistence, override/handshake append를 지원한다.
4. `adapters/postgres/`에 psycopg 기반 `PostgresRepository`와 transaction boundary를 구현한다. import만으로 연결하지 않고, 설정된 factory가 생성할 때만 pool을 연다.
5. 테스트:
   - in-memory adapter contract suite
   - migration 필수 table/RLS/unique constraint 정적 검증
   - `TEST_DATABASE_URL`이 존재할 때만 실행되는 Postgres integration marker. 없으면 명시적 skip이며 기본 테스트 실패가 아니다.

## Acceptance Criteria

```bash
uv run --project backend pytest -q backend/tests/unit/adapters backend/tests/integration/test_migrations.py
uv run --project backend ruff check backend/src/alignment_memory/ports backend/src/alignment_memory/adapters backend/tests/unit/adapters backend/tests/integration
rg -n "enable row level security|source_versions|knowledge_node_versions|event_key" supabase/migrations
uv run --project backend pytest -q
git diff --check
```

## AC 검증 방법

모두 통과하면 phase 3 status를 `"completed"`로 변경한다. 3회 이상 실패하면 `"error"`와 `error_message`를 기록한다.

## 주의사항

- source/version, finding, override, handshake를 update/delete로 덮어쓰지 마라.
- 외부 DB가 없다고 fake 성공을 만들지 말고 integration test를 이유와 함께 skip하라.
- vector 또는 graph DB 의존성을 추가하지 마라.

