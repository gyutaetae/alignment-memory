# Phase 8: Vertical-slice hardening and demo proof

## Runner execution contract

- 현재 Codex 세션 자체가 `scripts/run_phases.py`가 생성한 Phase 8 구현 세션이다.
- 다른 runner 또는 Codex child를 실행·검색·감시하지 말고, 이 세션에서 아래 구현과 검증을 직접 수행하라.
- 상위 orchestrator가 이미 `plan-and-build` 절차를 수행했으므로 스킬을 다시 호출하거나 `scripts/run_phases.py`를 재실행하지 마라.
- 현재 worktree의 `index.json` 진행 시각 변경은 상위 runner가 만든 정상 상태다. 사용자 변경으로 오인하지 마라.

## 사전 준비

모든 canonical 문서, 이전 phase 결과, 전체 애플리케이션을 읽어라:

- `docs/prd.md`
- `docs/flow.md`
- `docs/data-schema.md`
- `docs/code-architecture.md`
- `docs/adr.md`
- `docs/user-intervention.md`
- `docs/runbook.md`
- `tasks/1-alignment-memory/docs-diff.md`
- `backend/`, `apps/web/`, `supabase/`, `.github/workflows/`, `knowledge/generated/`

## 작업 내용

1. fixture mode에서 한 번에 실행되는 demo seed와 vertical-slice 검증을 추가한다.
   - 기존 “browser extension 제외” Decision
   - 충돌 PR → `Direct Conflict` + exact evidence
   - supersede 또는 PR 수정 → 후속 `Aligned`
   - merge event → knowledge revision/graph/generated Markdown 정확히 한 번 갱신
   - Korean PM과 English collaborator Passport → Handshake 기록
2. Backend API와 worker를 함께 호출하는 E2E integration test를 만든다. 같은 event/job/merge를 재시도해 source, finding, comment marker, knowledge version, artifact가 중복되지 않는지 검증한다.
3. 여섯 fixture에 대한 평가 report generator를 추가한다. outcome 기대값, evidence quote validity, actual model/provider(실행 시), correction 영향 결과를 machine-readable JSON과 Markdown으로 출력한다. fixture mode 결과를 실제 외부 AI 결과처럼 표현하지 않는다.
4. 배포 파일을 완성한다: Web Vercel 설정, Backend Docker start/healthcheck, CORS/environment validation. 자격증명 누락 시 명확히 fail fast하되 fixture mode는 실행 가능해야 한다.
5. `docs/demo-script.md`에 3분 데모, 심사 기준별 증거, 실제 팀 GitHub trace 수집 지점을 작성한다. mock/fixture와 live proof를 명확히 구분한다.
6. README와 runbook의 실제 명령을 최종 코드에 맞춰 갱신하고 전체 테스트/빌드를 수행한다. 구현 결함은 범위 안에서 수정하되 제품 범위를 확장하지 않는다.

## Acceptance Criteria

```bash
uv sync --project backend --group dev
uv run --project backend ruff check backend/src backend/tests
uv run --project backend pytest -q
uv run --project backend python -m alignment_memory.interfaces.worker.cli demo --output artifacts/demo
test -s artifacts/demo/evaluation.json
test -s artifacts/demo/evaluation.md
npm --prefix apps/web ci
npm --prefix apps/web run lint
npm --prefix apps/web test -- --run
npm --prefix apps/web run build
! rg -n "pull_request_target" .github/workflows
! rg -n "OPENROUTER_API_KEY" .github/workflows/*publish*
test -s docs/demo-script.md
git diff --check
```

## AC 검증 방법

모든 명령이 통과하면 phase 8 status를 `"completed"`로 변경한다. 3회 이상 실패하면 `"error"`와 구체적인 `error_message`를 기록한다.

## 주의사항

- fixture 결과를 live GitHub/OpenRouter/Supabase/Vercel 검증으로 표시하지 마라.
- 외부 자격증명이 없다는 이유로 전체 로컬 E2E를 생략하지 마라.
- 테스트를 삭제하거나 assertion을 약화해 통과시키지 마라.
- MVP 비범위 기능을 추가하지 마라.
