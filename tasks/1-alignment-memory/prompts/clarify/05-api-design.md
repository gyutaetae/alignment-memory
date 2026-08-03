# Clarify 5: API 설계

**Asked at:** 2026-08-04T00:43:07+0900

## Agent question

이제 웹, FastAPI, Supabase, GitHub Actions가 어떤 책임을 가질지 확정합니다.

1. 저장소 연결은 Supabase GitHub 로그인과 별도로 **GitHub App을 설치하는 방식**을 추천합니다. 처음 설정은 조금 늘지만, 개인 토큰을 저장하지 않고 필요한 저장소 권한만 받을 수 있습니다. GitHub App을 처음 만들어보는 것까지 이번 도전에 포함해도 될까요?

2. Initial Sync와 AI 분석은 시간이 걸리므로 `요청 → jobId 반환 → 화면에서 상태 polling` 방식으로 만들겠습니다. WebSocket과 실시간 스트리밍은 제외해도 될까요?

3. GitHub 댓글과 `knowledge/generated/**`의 main 커밋은 백엔드가 직접 하지 않고, **GitHub Action이 기본 `GITHUB_TOKEN`으로 실행**하게 하는 것을 추천합니다. 백엔드는 분석·DB·결과 반환만 담당하고 Action이 실제 GitHub 변경 흔적을 남기는 구조에 동의하나요?

## User answer (원문)

1. 그래그렇게가자 이번에 도전해보자 2.그래그게 최선이야? 3. 그래그렇게하자

## Additional question

**Asked at:** 2026-08-04T00:52:07+0900

FastAPI는 제어와 DB 저장만 담당하고, GitHub Action Worker가 수집·OpenRouter 분석·댓글·main 커밋을 모두 담당하는 수정 구조로 확정할까요? 이 구성이 19일 일정과 실제 GitHub 자동화 증거를 함께 만족합니다.

## Additional user answer (원문)

그래 그게 최선이야? 마지막으로 모호한점 확인해줘
