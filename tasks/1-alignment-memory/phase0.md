# Phase 0: Documentation and operations baseline

## 사전 준비

먼저 아래 문서들을 반드시 읽고 제품 범위와 의사결정을 이해하라:

- `docs/prd.md`
- `docs/flow.md`
- `docs/data-schema.md`
- `docs/code-architecture.md`
- `docs/adr.md`
- `tasks/1-alignment-memory/artifacts/02-clarify.md`
- `tasks/1-alignment-memory/artifacts/03-context.md`

이 phase는 구현 전 운영 문서만 보강한다. `tasks/1-alignment-memory/docs-diff.md`는 runner가 phase 완료 후 생성하므로 직접 만들지 마라.

## 작업 내용

1. `docs/user-intervention.md`를 작성하라. 다음 사용자의 외부 작업을 각각 목적, 최소 권한, 환경변수 이름, 설정 위치, 확인 방법, 폐기/회전 방법으로 구분한다.
   - Supabase 프로젝트/Auth/Postgres 준비
   - GitHub App 생성·설치·webhook/callback 설정
   - OpenRouter API key와 모델 환경변수
   - Vercel Web 배포와 FastAPI 배포 URL
   비밀의 실제 값을 문서나 저장소에 넣지 마라.
2. `docs/runbook.md`를 작성하라. 로컬 fixture 모드, 실제 연동 모드, Initial Sync, PR Analyze, Merge Publish, 실패 복구, 멱등 재실행, 데모 순서를 실행 가능한 명령 중심으로 설명한다.
3. 루트 `README.md`에 기존 하네스 사용법을 보존하면서 Alignment Memory의 제품 설명, 저장소 구조, 빠른 시작, canonical docs 링크를 간결하게 추가한다.
4. 다섯 canonical 문서 사이의 용어를 점검한다. 최신 규칙은 자동 merge 반영, 결과 세 종류 `Aligned/Missing Alignment/Direct Conflict`, AI 쓰기 경로 `knowledge/generated/**`이다. 충돌하는 문장만 최소 수정한다.

## Acceptance Criteria

```bash
test -s docs/user-intervention.md
test -s docs/runbook.md
rg -n "Supabase|GitHub App|OpenRouter|Vercel" docs/user-intervention.md
rg -n "Initial Sync|Direct Conflict|knowledge/generated" docs/runbook.md README.md
! rg -n "(sk-|ghp_|github_pat_|service_role[=:][[:space:]]*[A-Za-z0-9])" docs README.md
git diff --check
```

## AC 검증 방법

위 명령을 실행하라. 모두 통과하면 `tasks/1-alignment-memory/index.json`의 phase 0 status를 `"completed"`로 변경하라. 3회 이상 시도해도 실패하면 `"error"`로 변경하고 `error_message`를 기록하라.

## 주의사항

- 확정된 제품 범위나 기술 결정을 새로 바꾸지 마라.
- 실제 자격증명 값, 개인 토큰, 설치 ID를 예시로 커밋하지 마라.
- `docs-diff.md`를 직접 생성하지 마라.

