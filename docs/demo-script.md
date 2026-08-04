# 3-Minute Demo — Alignment Memory

> 발표 전에 증거 라벨을 확인한다. `artifacts/demo/**`는 **fixture proof**, 실제 PR/Action/API/배포 화면은 **live proof**다. fixture 결과를 GitHub, OpenRouter, Supabase, Vercel에서 실제 실행한 결과로 설명하지 않는다.

## 발표 전 30초 준비

```bash
uv run --project backend python -m alignment_memory.interfaces.worker.cli \
  demo --output artifacts/demo
jq -e '.execution.mode == "fixture" and .summary.passed == true' \
  artifacts/demo/evaluation.json
jq -e '.execution.mode == "fixture" and .passed == true' \
  artifacts/demo/vertical-slice.json
```

화면은 다음 순서로 연다.

1. `docs/adr.md`의 브라우저 확장 제외 Decision
2. `artifacts/demo/conflict-comment.md`
3. `artifacts/demo/resolved-comment.md`
4. `artifacts/demo/project-memory.md`와 `vertical-slice.json`
5. Web의 Alignment Diff → Context Passport → Handshake
6. live proof가 준비된 경우 실제 GitHub PR/Actions/Supabase/배포 화면

## 0:00–0:35 — 기록된 결정을 작업 시점에 되살린다

- 보여줄 것: “browser extension 제외” Decision과 원본 URL.
- 말할 것: “Alignment Memory는 대화를 추측하지 않고 GitHub에 기록된 결정과 exact quote만 프로젝트 기억으로 사용합니다.”
- fixture 증거: `vertical-slice.json.decision`의 exact quote와 source URL.
- live 증거: 실제 저장소의 Decision commit SHA와 GitHub blob URL.

## 0:35–1:15 — 충돌 PR을 Direct Conflict로 막는다

- 보여줄 것: 확장 동기화를 추가하는 PR, `Direct Conflict`, 기존 결정의 exact quote, 다음 행동.
- 말할 것: “AI 문장이 그럴듯해서 실패시키는 것이 아닙니다. 활성 Decision, 실제 포함된 quote, source URL이 모두 검증될 때만 Direct Conflict가 됩니다.”
- fixture 증거: `conflict-comment.md`; `vertical-slice.json.idempotencyAssertions.conflictExactEvidence`.
- live 증거: 실제 PR comment ID, check run ID/conclusion, analyzed head SHA, Action run URL, OpenRouter `actualModel`이 저장된 API/DB record.

## 1:15–1:45 — 수정 또는 supersede 뒤 Aligned로 바뀐다

- 보여줄 것: 브라우저 확장을 제거한 후속 PR revision 또는 이유가 있는 `supersede_decision`, 이어지는 `Aligned`.
- 말할 것: “이전 finding은 삭제하지 않습니다. 수정된 head 또는 사람의 correction evidence를 다음 분석에 반영합니다.”
- fixture 증거: `resolved-comment.md`, 평가 report의 `correctionImpact`와 `priorFindingPreserved=true`.
- live 증거: 같은 PR의 이전/새 head SHA, 같은 comment marker로 update된 comment, Override ID와 reason.

## 1:45–2:20 — merge가 지식을 정확히 한 번 갱신한다

- 보여줄 것: merge 후 knowledge revision, graph의 새 Task/edge, `knowledge/generated/project-memory.md`.
- 말할 것: “동일 merge를 재실행해도 source, knowledge version, generated artifact가 증가하지 않습니다.”
- fixture 증거: `vertical-slice.json.merge.firstApply`와 `retryApply`가 동일하고 `artifactCount=1`, `knowledgeRevision=2`.
- live 증거: merge commit SHA, `generated_artifacts` row의 path/content hash/revision, generated Markdown commit SHA, 재실행 전후 row 수와 tree diff.

## 2:20–2:50 — Korean PM과 English collaborator가 같은 근거로 Handshake한다

- 보여줄 것: Korean PM Passport, English collaborator Passport, original evidence toggle, 두 `agree` Handshake.
- 말할 것: “언어만 현지화하고 근거는 공유합니다. 국적이나 성격은 추론하지 않습니다.”
- fixture 증거: `vertical-slice.json.passport.participants`와 `handshakeCount=2`.
- live 증거: 서로 다른 profile ID, language/timezone 설정, 두 Handshake row와 같은 alignment/source version IDs.

## 2:50–3:00 — fixture와 live proof를 분리해 결론낸다

- 말할 것: “로컬 fixture는 결정 규칙과 멱등성을 재현합니다. 실제 협업 주장은 지금 보신 live GitHub trace와 배포 health로만 증명합니다.”
- live proof가 아직 없으면 솔직히 말할 것: “오늘 확보한 것은 fixture vertical slice입니다. 아래 trace 지점은 실제 팀 실행 때 채울 항목이며 아직 live 검증으로 주장하지 않습니다.”

## 심사 기준별 증거

| 기준 | fixture proof | 필요한 live proof |
|---|---|---|
| 문제/가치 | 충돌→수정→merge의 한 흐름 | 팀의 실제 Decision과 충돌/정렬 PR |
| AI 필요성 | 3 aligned + 3 conflict, exact quote validation | OpenRouter provider, requested/actual model, usage가 기록된 run |
| 신뢰/안전 | fabricated quote rejection, generated-only path, retry counts | Analyze/Publish 권한 분리와 실제 check/comment/artifact IDs |
| Borderless | ko/en Passport + Handshake fixture | Korean PM/English collaborator의 실제 profile과 Handshake |
| 완성도 | 전체 pytest, Web lint/test/build, Docker health contract | public Web URL, API `/healthz`, GitHub App delivery와 Action run |

## 실제 팀 GitHub trace 수집 지점

비밀이나 provider 원문 payload를 복사하지 않는다. ID, URL, SHA, count, timestamp만 수집한다.

```bash
# PR과 check/comment
gh pr view "$AM_PR_NUMBER" --json url,headRefOid,baseRefOid,comments,statusCheckRollup
gh run view "$AM_RUN_ID" --json url,event,headSha,conclusion,createdAt,updatedAt

# merge와 generated path
gh pr view "$AM_PR_NUMBER" --json mergedAt,mergeCommit
git fetch origin main
git ls-tree -r origin/main knowledge/generated

# 배포
curl -fsS "$ALIGNMENT_API_BASE_URL/healthz" | jq .
curl -fsSI "$ALIGNMENT_WEB_URL" | head -n 1
```

DB에서는 대상 repository에 한정해 다음을 전후 비교한다: `sources`, `source_versions`, `alignment_analyses`, `alignment_findings`, `knowledge_node_versions`, `generated_artifacts`, `context_passports`, `handshakes`. 같은 event/job/merge 재실행 후 unique key별 count가 증가하지 않아야 한다.
