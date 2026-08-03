# Initial Plan: alignment-memory

## 요구사항 (무엇을 만들 것인가)
- 하나의 공개 GitHub 저장소에서 Markdown, Issue, Pull Request, Commit을 수집한다.
- 수집한 원본에서 Goal, Requirement, Decision, Task, Artifact, Risk의 6개 지식 노드와 출처 관계를 AI가 제안한다.
- AI가 제안한 노드, 관계, 충돌은 사람이 승인하거나 거절한 뒤에만 공식 프로젝트 지식으로 반영한다.
- 새 PR이 기존 Goal, Requirement, Decision과 충돌하는지 Alignment Diff로 판정하고 정확한 GitHub 근거를 표시한다.
- Direct Conflict, Missing Alignment, Stale Reference의 세 가지 정렬 문제만 MVP에서 탐지한다.
- 승인된 지식을 작은 Impact Graph와 사람이 읽을 수 있는 Shared Wiki로 보여준다.
- 승인된 프로젝트 지식을 Wikilink를 포함한 Markdown으로 내보내 Obsidian에서 열고 Git으로 변경 이력을 확인할 수 있게 한다.
- 최초 전체 동기화는 웹의 Sync 버튼으로 실행하고 이후 Issue, PR, Push 변경은 GitHub Action으로 증분 동기화한다.
- 각 판단에 Human Decision, AI Suggestion, AI-Detected Conflict, Human Approved, Developer Implemented 등의 기여 출처를 남긴다.

## 구현 디테일 (어떻게 만들 것인가)
- 이 저장소의 plan-and-build 하네스를 유지하고 애플리케이션 코드와 프로젝트 문서를 같은 저장소 안에 추가한다.
- 현재 가정은 React 웹 UI, Python FastAPI 백엔드, PostgreSQL 계열 DB, GitHub REST API와 GitHub Actions 조합이다.
- GitHub 원본은 Source Record로 보존하고 6개 타입은 원본에서 추출된 Knowledge Node로 분리한다.
- AI는 고정 JSON 스키마로 노드, 관계, 충돌, 근거 문장을 출력하며 공식 지식을 직접 승인하지 않는다.
- 첫 동기화는 전체 스냅샷, 이후 동기화는 updatedAt, commit SHA, contentHash를 이용한 증분 처리로 구성한다.
- 승인 전 결과는 Proposal로 저장하고 승인된 결과만 공식 노드, 관계, Markdown Wiki에 반영한다.
- Obsidian은 운영 DB가 아니라 생성된 Markdown을 검토하고 전체 지식 그래프를 확인하는 선택적 지식 IDE로 사용한다.
- 구체적인 프레임워크, 모델 제공자, 인증 방식, 배포 방식, 그래프 라이브러리는 clarify 단계에서 확정한다.

## 제약 조건 (무엇을 안 할 것인가)
- MVP는 공개 GitHub 저장소 하나와 현재 4인 팀의 PM, 디자인, 개발 협업만 지원한다.
- 브라우저 확장 프로그램, Slack, Notion, Figma 내용 자동 수집은 MVP에서 제외한다.
- 비공개 저장소, 여러 조직, 다중 저장소, 세밀한 엔터프라이즈 권한 관리는 MVP에서 제외한다.
- Neo4j, GraphRAG, 전체 저장소 임베딩과 같은 대규모 지식 인프라는 초기 구현에 포함하지 않는다.
- Obsidian과 DB의 양방향 동기화는 하지 않고 DB에서 승인된 Markdown을 생성하는 단방향 흐름으로 시작한다.
- AI는 승인 없이 기존 Decision을 삭제하거나 main 브랜치를 직접 수정하지 않는다.
- 언어, 문화, 지리 경계의 실제 검증은 내부 MVP 이후 외부 또는 외국인 협업자를 통한 별도 검증 단계로 둔다.

## 완료 기준 (이번 라운드의 끝)
- 실제 공개 GitHub 저장소 하나를 연결하고 웹의 Initial Sync로 Markdown, Issue, PR, Commit을 가져올 수 있다.
- 같은 저장소를 반복 Sync해도 중복 Source Record와 Knowledge Node가 생성되지 않는다.
- 모든 AI 제안에는 원본 GitHub URL과 근거 문장이 표시된다.
- 의도적으로 충돌하는 실제 PR 한 개는 Direct Conflict로 표시되고 정렬된 PR 한 개는 Conflict로 오판되지 않는다.
- GitHub Action이 새 PR 또는 PR 갱신을 백엔드에 전달하고 분석 결과를 실제 PR 댓글 또는 Check 형태로 남긴다.
- 사용자가 AI 제안을 승인하거나 거절할 수 있고 승인 전에는 공식 프로젝트 지식이 변경되지 않는다.
- 승인 후 관련 Impact Graph와 Shared Wiki가 갱신되고 Wikilink Markdown이 생성되어 Obsidian에서 열 수 있다.
- 프론트엔드와 백엔드의 빌드, 핵심 테스트, 실제 GitHub 연동 검증 절차가 재실행 가능한 명령으로 문서화된다.
- 팀의 실제 Issue, PR, Commit, 승인 기록을 사용한 데모 시나리오를 실행할 수 있다.
- evaluate: required
