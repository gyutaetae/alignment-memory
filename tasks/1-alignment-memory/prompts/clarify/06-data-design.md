# Clarify 6: 데이터 설계

**Asked at:** 2026-08-04T00:54:30+0900

## Agent question

우리 제품은 지식이 축적될수록 강해져야 하므로, 데이터를 덮어쓰지 않고 변경 이유까지 보존하는 것이 중요합니다.

1. GitHub Issue·PR·Markdown·Commit은 `SourceRecord` 하나로만 저장하지 않고, 원본 정체성을 담는 `sources`와 변경 내용을 보존하는 `sourceVersions`로 나누겠습니다. 수정 전 기록도 삭제하지 않는 방식에 동의하나요?

2. Goal·Requirement·Decision·Task·Artifact·Risk는 PostgreSQL의 `knowledgeNodes`와 `knowledgeEdges`로 관리하고, `active / superseded / disputed` 상태를 사용하겠습니다. MVP에서는 Neo4j와 pgvector 없이 필요한 활성 노드를 직접 조회해 OpenRouter에 전달해도 될까요?

3. 이해관계자 정보는 `선호 언어·시간대·역할·담당 영역`과 GitHub 근거만 저장하겠습니다. AI가 추측한 성격·문화·국적별 성향은 저장하지 않고, Human Override도 기존 데이터를 덮어쓰지 않는 별도 기록으로 보존할까요?

## User answer (원문)

1. 네 2.네 3.그게 최선이야?

## Confirmation question

**Asked at:** 2026-08-04T00:59:02+0900

이 3계층 이해관계자 기억 구조로 데이터 설계를 확정할까요? 확정하면 Clarify 7/9 코드 아키텍처로 넘어가겠습니다.

## Confirmation user answer (원문)

그래 코드아키텍처로 넘어가자
