# Clarify Summary: alignment-memory

> Canonical detail: [PRD](../../../docs/prd.md), [Flow](../../../docs/flow.md), [Data Schema](../../../docs/data-schema.md), [Code Architecture](../../../docs/code-architecture.md), [ADR](../../../docs/adr.md). This artifact is a pipeline handoff, not a duplicate specification.

## 1. 구현가능성

- **GO:** 19 days, about one hour per day plus one or two focused days; prioritize one deployed vertical slice.
- One public repository and trusted collaborators only. Collect Markdown, Issues, PR descriptions/diffs, and commit messages; no whole-code ingestion.
- Initial full history then `baselineCommitSha` incrementals. AI writes only generated knowledge and only after Initial Sync/merge; no browser extension or external integrations.

## 2. 기술스택

| Concern | Choice |
|---|---|
| Web | React + TypeScript + Vite, npm, TanStack Query, CSS Modules |
| API/Core | Python 3.12, FastAPI modular monolith, uv, Pydantic, Ruff, pytest |
| DB/Auth | Supabase PostgreSQL/Auth/RLS |
| GitHub | GitHub App + two-job GitHub Action Worker |
| Runtime AI | OpenRouter fixed primary/fallback; strict structured output |
| Deployment | Vercel first; backend Docker fallback |
| Graph | React Flow + Dagre relevant subgraph |

Codex Pro is development tooling, not the deployed AI runtime. Java is deferred to avoid first-time Spring and deployment risk inside the hackathon window.

## 3. 사용흐름

1. GitHub login/install → repo select → Initial Sync → poll job → generated memory/graph/Markdown.
2. PR open/update → analyze against immutable knowledge revision → comment and pass/warn/fail; no official update.
3. PR merge → serialized incremental update → versioned DB persistence → generated-only main commit.
4. Context Passport → localized evidence → Handshake; Human Override appends correction and triggers affected reanalysis.

## 4. 화면 설계

- Desktop only: Connect, Project Memory, Knowledge Graph, Alignment Detail.
- Alignment Detail hero: existing agreement versus proposed change; Context Passport is a secondary panel.
- Handshake and Override are separate. Original evidence is available on demand.
- Neutral UI plus `#2563EB`; one primary action per screen; status never depends on color alone.

## 5. API 설계

- User API: Supabase JWT. Internal Action API: timestamped HMAC.
- Main endpoints: repository connect/sync, job polling, dashboard/graph/alignment reads, Handshake/Override writes, internal job context/events/result.
- FastAPI is the control plane. Analyze Action collects/calls AI/validates; Publish Action comments and writes allowed paths.
- Standard error: `{error: {code, message, retryable, requestId}}`.

## 6. 데이터 설계

- Four trust layers: self-declared profile, GitHub-observed actions, evidence-backed AI derivation, human correction.
- Immutable `sources/sourceVersions`; versioned `knowledgeNodes/knowledgeNodeVersions`; relational `knowledgeEdges/evidenceLinks`.
- Preserve AI provenance, job history, findings, Context Passports, Handshakes, Overrides, and generated artifacts.
- No Neo4j, pgvector, hard-delete history, or nationality/personality inference.

## 7. 코드 아키텍처

- One shared `alignment_memory` Python package with FastAPI and Action CLI entrypoints.
- Dependency direction: `interfaces → application → domain ← ports ← adapters`.
- React is feature-oriented. Supabase migrations and workflows are repository-owned. AI can write only `knowledge/generated/**`.
- No microservices, Celery, broker, Next.js, or monorepo framework.

## 8. 기술 결정사항

- AI output is untrusted until JSON Schema, Pydantic, exact-quote, and domain precondition checks pass.
- Direct Conflict requires valid evidence against an active Goal/Requirement/Decision; uncertainty becomes Missing Alignment.
- Analyze and Publish jobs split secrets from write authority. Never execute PR head or use `pull_request_target`.
- Cancel stale PR analyses, serialize writes, recheck main SHA, and enforce DB idempotency.
- Stakeholder personalization uses declared preferences and cited history, never demographic inference.

## 9. 구현 계획 논의점

Suggested phase seams for Stage 4 planning:

1. Documentation baseline and deploy spikes.
2. Supabase schema/Auth/RLS and GitHub App installation.
3. Allowed source ingestion, versioning, baseline, and idempotency.
4. OpenRouter extraction/evidence validation with six fixtures.
5. GitHub Action Analyze/Publish flow and real PR verdicts.
6. React Connect/Dashboard/Alignment/Graph vertical slice.
7. Context Passport, Handshake, and Human Override.
8. Deployment, end-to-end evaluation, foreign-collaborator trace, and demo hardening.

Highest-risk gates: GitHub App dispatch, Action secret isolation, OpenRouter evidence quality, concurrent main writes, and first external deployment. Test these early; do not postpone them to final integration.
