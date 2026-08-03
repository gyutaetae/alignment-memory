# Phase 7: React desktop product surface

## 사전 준비

아래 문서와 완성된 API 계약을 읽어라:

- `docs/prd.md`
- `docs/flow.md`
- `docs/code-architecture.md`
- `docs/adr.md`
- `tasks/1-alignment-memory/docs-diff.md`
- `backend/src/alignment_memory/interfaces/api/routes/`
- Backend OpenAPI schema는 `create_app().openapi()`로 확인하라.
- `apps/web/src/`

## 작업 내용

1. feature-oriented React 구조를 완성한다: `auth`, `repositories`, `dashboard`, `alignment`, `graph`, `passport`, `feedback`, `shared`.
2. 네 화면을 desktop-first로 구현한다.
   - Connect: GitHub login/install/repository/Initial Sync, polling progress.
   - Project Memory: conflict 우선순위, current goal/decision, needs-attention, recent accumulation.
   - Alignment Detail: hero `Alignment Diff`로 existing agreement와 proposed change를 나란히 표시하고 evidence 원문/URL/영향/next action을 제공.
   - Knowledge Graph: `@xyflow/react` + Dagre relevant one/two-hop subgraph, 선택 시 detail 연결.
3. Context Passport는 Alignment의 보조 panel로 구현한다. 선호 언어, timezone, 역할/ownership, original evidence toggle, unresolved questions를 표시한다. 국적/성격 추론 UI를 만들지 않는다.
4. Handshake(`agree/needs_clarification/disagree`)와 Override(`false_positive/supersede_decision/insufficient_evidence` + reason)를 분리된 UI/요청으로 구현한다.
5. TanStack Query API client, loading/empty/error/retry state, fixture-mode mock 서버 또는 deterministic fixture를 제공한다.
6. 디자인 토큰은 neutral + `#2563EB` 한 accent, CSS Modules, desktop only다. status는 text와 icon을 함께 쓰고 색상만으로 구분하지 않는다.
7. 테스트로 dashboard priority, Alignment evidence reveal, graph selection, Passport original toggle, Handshake/Override separation을 검증한다.

## Acceptance Criteria

```bash
npm --prefix apps/web ci
npm --prefix apps/web run lint
npm --prefix apps/web test -- --run
npm --prefix apps/web run build
! rg -n "linear-gradient|radial-gradient|prefers-color-scheme" apps/web/src
rg -n "#2563EB|#2563eb" apps/web/src
git diff --check
```

## AC 검증 방법

모두 통과하면 phase 7 status를 `"completed"`로 변경한다. 3회 이상 실패하면 `"error"`와 `error_message`를 기록한다.

## 주의사항

- graph를 첫 화면의 hero로 만들지 마라. conflicts와 next action이 우선이다.
- 서버 상태를 별도 global store에 복제하지 마라.
- mobile/dark mode/gradient/장식 animation을 추가하지 마라.

