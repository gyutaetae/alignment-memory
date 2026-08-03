# Clarify 8: 기술적 결정사항 점검

**Asked at:** 2026-08-04T01:06:38+0900

## Agent question

현재 라이브러리와 GitHub 보안 제약을 확인했습니다. 다음 세 가지를 확정하면 구현 중 큰 기술 선택은 남지 않습니다.

1. 지식 그래프는 `@xyflow/react`를 사용하겠습니다. Goal부터 Artifact까지 고정된 가로 흐름으로 배치하고, Risk만 연결된 노드 옆에 표시합니다. 자동으로 흔들리는 force graph와 화려한 애니메이션은 사용하지 않으며, 기본 화면에는 활성 노드 최대 80개만 보여주겠습니다.

2. AI가 JSON을 올바르게 출력했다고 바로 신뢰하지 않겠습니다. OpenRouter strict JSON Schema, Pydantic 재검증, 실제 Source Version 인용 확인, 근거가 있는 Direct Conflict만 Action 실패, 모델·프롬프트 버전 기록과 6개 회귀 시나리오를 적용하겠습니다.

3. 같은 PR의 오래된 분석은 취소하고 main 지식 쓰기는 저장소별 한 번에 하나만 실행하겠습니다. 커밋 전 SHA 재확인, bot 생성 변경 제외, `pull_request_target` 제외, 외국인 검증 참가자의 collaborator 초대, PR 코드를 실행하지 않는 데이터 분석, 최소 권한, OpenRouter 키 작업과 main 쓰기 작업 분리를 적용하겠습니다.

이 세 가지를 제안대로 확정할까요? 수정하고 싶은 항목이 있으면 번호와 함께 말해주세요.

## User answer (원문)

1. 그게최선이야? 2. 그래 바로 신뢰하지안흔ㄴ 검증구조 좋아 3.그게 최선이야?

## Confirmation question

**Asked at:** 2026-08-04T01:11:25+0900

최종 수정안은 다음 두 가지입니다.

- 그래프: `React Flow + Dagre`, 임의의 80개가 아닌 현재 맥락 중심 부분 그래프
- Action: 신뢰된 분석 Job과 쓰기 Job 분리, collaborator 자동 실행, 외부 입력 승인제

이 수정안으로 Clarify 8을 확정할까요? 그러면 마지막 Clarify 9/9에서 구현 Phase와 검증·데모 계획만 정리하겠습니다.

## Confirmation user answer (원문)

그래 이거하기전에 논의한 내용을 바탕으로 문서를 생성하자 
다음문서들이 필요하다 
-prd, flow,data-schema, code-architecture,adr(기술적결정사항)
이문ㄴ서들을 만들때는 에이아이에이전트를 위한것이야 이문서들은 그들의 컨텍스트를 낭비하지않도록 같은내용도 더간결하게 써야해 간결한 문서를 추구하되 의사결정의도와같은 맥락적정보가 아예 제거되어서도안돼 이문서를 보고 에이아이가 우리의 기획적 개발적 철학을 온전히 추론할수있어ㅑ해
