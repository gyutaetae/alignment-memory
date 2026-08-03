# Clarify 7: 코드아키텍처 설계

**Asked at:** 2026-08-04T01:00:52+0900

## Agent question

FastAPI와 GitHub Action을 별도 프로젝트로 만들면 분석·검증 로직이 중복됩니다. 하나의 Python 패키지를 두 실행 방식이 공유하는 **모듈형 모놀리스**가 가장 적합합니다.

1. FastAPI와 Action Worker가 동일한 `alignment_memory` Python 패키지를 공유하고, 각각 API와 CLI 진입점만 다르게 두는 구조로 갈까요?

2. 마이크로서비스·Celery·메시지 큐 없이 위의 모듈형 모놀리스와 GitHub Actions만 사용해 MVP 범위를 제한할까요?

3. 개발 도구는 `Python 3.12 + uv + Ruff + pytest`, 프론트엔드는 `Node.js + npm + ESLint + Vitest`로 구성하고, 별도의 Turborepo 같은 모노레포 도구는 사용하지 않아도 될까요? 배포 대안을 위해 FastAPI용 Dockerfile만 추가하겠습니다.

## User answer (원문)

1. 그래 그렇게가자 2.그래 모놀리스와 깃헙액션만 사용하자 . 3.그래 리액트는 왜안쓰는거야?

## Confirmation question

**Asked at:** 2026-08-04T01:03:24+0900

프론트엔드는 `React + TypeScript + Vite + npm`, 백엔드는 `Python 3.12 + FastAPI` 모듈형 모놀리스로 구성하고, 같은 Python 코어를 FastAPI와 GitHub Action Worker가 공유하는 코드 아키텍처로 확정할까요?

## Confirmation user answer (원문)

ㄱㄱ
