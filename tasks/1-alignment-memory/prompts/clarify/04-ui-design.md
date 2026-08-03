# Clarify 4: 화면 설계

**Asked at:** 2026-08-03T16:52:33+0900

## Agent question

19일 일정에 맞춰 화면을 네 개로 제한하는 것을 추천합니다.

1. `GitHub 연결`: 로그인, 저장소 선택, Initial Sync
2. `Project Memory`: 충돌·확인 필요 항목·Sync 상태·그래프 미리보기
3. `Knowledge Graph`: 6개 노드와 관계, 선택한 노드의 근거·변경 이력
4. `Alignment Detail`: PR 충돌 근거, Context Passport, Handshake, Human Override

확정할 사항은 세 가지입니다.

1. 모바일은 제외하고 데스크톱 웹의 위 네 화면으로 제한할까요?
2. 첫 화면은 그래프보다 `Direct Conflict`와 `지금 해야 할 행동`을 먼저 보여주고, 그래프는 아래 미리보기와 별도 화면에서 강하게 보여줄까요?
3. Alignment Detail은 `원문·근거`와 `사용자 언어의 Context Passport`를 나란히 보여주고, 상단에서 `한국 PM 관점 / 영어 개발자 관점`을 전환하며, 하단에 `동의 / 설명 필요 / 반대 / AI 판단 수정` 버튼을 배치할까요?

## User answer (원문)

데스크톱만하자 2. 그래그렇게가자 3.그게 최선이야?

## Confirmation question

**Asked at:** 2026-08-04T00:40:28+0900

화면 설계 결정안은 다음과 같습니다.

- 데스크톱 웹 4개 화면
- Dashboard는 충돌과 다음 행동 우선
- Graph는 별도 탐색 화면
- Alignment Detail은 `Alignment Diff + Context Passport`
- Handshake와 Human Override는 분리
- 전체 이중 번역 대신 사용자 언어 우선 + 원문 펼치기

이 구조로 화면 설계를 확정할까요? 확정하면 Clarify 5/9 API 설계로 넘어가겠습니다.

## Confirmation user answer (원문)

화면은 가장 직관적이고 최소한의 유아이와 한가지의 포인트색상만을 사용해줘 그리고 모호한점있는지 마지막으로 확인해줘
