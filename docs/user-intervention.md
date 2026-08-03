# User Intervention — Alignment Memory

> 외부 계정과 배포 설정만 다룬다. 실제 비밀값, 개인 토큰, 설치 ID는 문서·커밋·이슈·PR에 남기지 않는다. 로컬 비밀은 추적되지 않는 `backend/.env`에, CI 비밀은 GitHub Actions Secrets에, 배포 비밀은 해당 Vercel 프로젝트의 Environment Variables에 둔다.

## 공통 원칙

- 개발과 데모 기본값은 `APP_MODE=fixture`다. 실제 연동은 아래 네 영역이 모두 준비된 뒤 `APP_MODE=live`로 전환한다.
- 브라우저에 포함되는 `VITE_*` 값에는 비밀을 넣지 않는다. Supabase publishable key와 공개 URL만 허용한다.
- GitHub Actions의 Analyze job에만 OpenRouter와 내부 API 서명 비밀을 제공한다. Publish job에는 OpenRouter 비밀을 제공하지 않는다.
- 비밀을 바꿀 때는 새 값 등록 → health/최소 요청 확인 → 이전 값 폐기 순서로 진행한다.
- 설정 파일에는 변수 이름만 기록한다. 값 예시는 `<set-in-secret-store>` 같은 명시적 자리표시자만 사용한다.

## 1. Supabase 프로젝트, Auth, Postgres

### 목적

Supabase는 GitHub 로그인, PostgreSQL 영속화, RLS 기반 저장소 멤버 접근 제어를 담당한다. FastAPI만 신뢰된 DB 연결을 사용하고, Web은 Auth에 필요한 공개 설정만 사용한다.

### 최소 권한

- MVP 전용 Supabase 프로젝트 하나를 만든다.
- GitHub Auth에는 별도의 GitHub OAuth App을 사용한다. 이는 저장소 연동용 GitHub App과 다른 설정이다.
- Web에는 프로젝트 URL과 publishable key만 제공한다. DB 연결 문자열이나 관리용 비밀은 제공하지 않는다.
- 런타임 DB 역할에는 애플리케이션 스키마에 필요한 권한만 부여한다. RLS는 모든 사용자 노출 테이블에서 활성화한다.
- 마이그레이션 연결과 런타임 연결을 분리할 수 있으면 분리한다. 서버리스 FastAPI에는 transaction pooler 연결을 우선하고, 로컬 마이그레이션에는 direct connection을 사용한다.

### 환경변수 이름

| 변수 | 소비자 | 비밀 여부 |
|---|---|---|
| `APP_MODE` | FastAPI, Worker | 아님. 실제 연동은 `live` |
| `DATABASE_URL` | FastAPI, migration | 비밀 |
| `SUPABASE_URL` | FastAPI | 아님 |
| `SUPABASE_JWT_ISSUER` | FastAPI | 아님 |
| `SUPABASE_JWT_AUDIENCE` | FastAPI | 아님 |
| `SUPABASE_JWKS_URL` | FastAPI | 아님 |
| `VITE_SUPABASE_URL` | Web | 아님 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Web | 공개 클라이언트 키이며 비밀 저장소에 둘 필요 없음 |

### 설정 위치

1. Supabase Dashboard에서 MVP 프로젝트를 만들고 region과 프로젝트 식별자를 기록한다.
2. `Authentication → URL Configuration`에 로컬 Web URL과 Vercel production/preview redirect URL을 허용한다.
3. `Authentication → Sign In / Providers → GitHub`에서 GitHub 로그인을 켠다.
4. GitHub `Settings → Developer settings → OAuth Apps`에 OAuth App을 만든다. Authorization callback은 Supabase Dashboard가 표시하는 Auth callback URL을 그대로 사용한다.
5. Supabase `Connect`에서 연결 문자열을 가져온다. Vercel FastAPI에는 서버리스에 맞는 pooler URL을, 로컬 migration에는 direct URL을 사용한다.
6. 로컬 값은 `backend/.env`, Web 공개 값은 `apps/web/.env.local`, 배포 값은 각 Vercel 프로젝트 설정에 둔다. 두 파일은 Git에서 추적하지 않는다.

공식 참고: [GitHub Auth 설정](https://supabase.com/docs/guides/auth/social-login/auth-github), [Postgres 연결 방식](https://supabase.com/docs/guides/database/connecting-to-postgres).

### 확인 방법

비밀을 화면에 출력하지 말고 연결과 JWT 검증만 확인한다.

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c 'select current_database(), current_user;'
curl -fsS "$ALIGNMENT_API_BASE_URL/healthz"
```

그다음 Web에서 GitHub 로그인 후 `GET /api/v1/repositories`가 로그인 사용자에게 허용되고, 다른 사용자의 저장소 데이터는 거절되는지 확인한다. RLS 검증은 `supabase/migrations/` integration test도 함께 통과해야 한다.

### 폐기와 회전

- DB 비밀번호를 재설정하고 `DATABASE_URL`을 로컬·Vercel에 갱신한 뒤 이전 연결을 종료한다.
- GitHub OAuth App client secret은 새 secret을 만든 뒤 Supabase Provider 설정을 갱신하고 이전 secret을 폐기한다.
- 프로젝트를 폐기할 때는 먼저 배포와 Actions에서 환경변수를 제거하고, 필요한 감사 데이터를 내보낸 뒤 Supabase 프로젝트를 삭제한다.
- publishable key가 노출된 것만으로 관리 권한이 생기면 안 된다. RLS 실패가 발견되면 배포를 중지하고 정책을 수정한 뒤 재검증한다.

## 2. GitHub App 생성, 설치, webhook과 callback

### 목적

GitHub App은 선택한 저장소의 허용된 Markdown, Issue, PR, diff, commit metadata를 읽고 Initial Sync를 dispatch한다. PR 분석과 merge event를 전달하되 PR 코드를 실행하지 않는다.

### 최소 권한

- 설치 범위: `Only select repositories`로 `gyutaetae/harness` 하나만 선택한다.
- Repository permissions: Metadata read, Contents read, Issues read, Pull requests read, Actions read/write.
- Webhook events: Installation, Installation repositories, Issues, Pull request, Push.
- App 자체에는 Contents write나 Pull requests write를 주지 않는다. PR comment와 `knowledge/generated/**` 쓰기는 권한이 분리된 Publish workflow의 `GITHUB_TOKEN`이 담당한다.
- 외부 fork와 신뢰되지 않은 actor의 이벤트는 자동 처리하지 않는다.

### 환경변수 이름

| 변수 | 소비자 | 비밀 여부 |
|---|---|---|
| `GITHUB_APP_ID` | FastAPI, Analyze Worker | 아님 |
| `GITHUB_APP_CLIENT_ID` | FastAPI callback | 아님 |
| `GITHUB_APP_CLIENT_SECRET` | FastAPI callback | 비밀 |
| `GITHUB_APP_PRIVATE_KEY` | FastAPI, Analyze Worker | 비밀 |
| `GITHUB_APP_WEBHOOK_SECRET` | FastAPI webhook | 비밀 |
| `GITHUB_APP_INSTALLATION_ID` | 로컬 live 점검 | 식별자이지만 커밋하지 않음 |
| `GITHUB_REPOSITORY` | 로컬 live 점검 | 아님. `owner/name` 형식 |

### 설정 위치

1. GitHub `Settings → Developer settings → GitHub Apps → New GitHub App`에서 private App을 만든다.
2. Homepage URL은 Web production URL로 둔다.
3. Callback URL은 `${ALIGNMENT_API_BASE_URL}/api/v1/github/installations/callback`으로 둔다.
4. Webhook URL은 `${ALIGNMENT_API_BASE_URL}/api/v1/github/webhooks`로 두고 활성화한다. Webhook secret은 GitHub UI와 FastAPI 비밀 저장소에 같은 값으로 넣는다.
5. 위 최소 권한과 이벤트만 선택하고 App private key를 발급한다.
6. App을 대상 저장소 하나에 설치한다. 설치 ID는 런타임에서 조회하거나 로컬 비밀 설정으로만 전달한다.
7. GitHub repository의 Actions Secrets/Variables에는 Analyze workflow가 요구하는 값만 등록한다.

공식 참고: [GitHub App 등록 필드, 권한, webhook](https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-using-url-parameters).

### 확인 방법

1. GitHub App의 `Advanced → Recent deliveries`에서 test delivery가 `2xx`인지 확인한다.
2. Web에서 App 설치를 완료한 뒤 아래 API가 설치된 저장소 하나만 반환하는지 확인한다.

```bash
read -rs 'AM_ACCESS_TOKEN?Supabase access token: '
printf '\n'
curl -fsS "$ALIGNMENT_API_BASE_URL/api/v1/repositories" \
  -H "Authorization: Bearer $AM_ACCESS_TOKEN" | jq .
unset AM_ACCESS_TOKEN
```

3. Initial Sync를 한 번 실행하고 Actions run이 trusted `main` Worker를 사용했는지 확인한다. Publish workflow에 OpenRouter 환경변수가 없는지도 보안 테스트로 확인한다.

### 폐기와 회전

- Private key: 새 key를 발급하고 로컬/Vercel/Actions를 갱신해 설치 token 발급을 확인한 뒤 이전 key를 삭제한다.
- Client secret: 새 secret으로 callback 로그인을 확인한 뒤 이전 secret을 폐기한다.
- Webhook secret: FastAPI와 GitHub App 설정을 짧은 유지보수 창에서 함께 변경하고 Recent deliveries를 재전송해 확인한다.
- App 폐기: 먼저 대상 저장소에서 uninstall하고 Actions/Vercel의 관련 비밀을 삭제한 뒤 GitHub App을 삭제한다.

## 3. OpenRouter API key와 모델 변수

### 목적

OpenRouter는 semantic extraction, 관계 제안, alignment 설명, Context Passport 생성을 수행한다. 결과는 JSON Schema, Pydantic, exact-quote 검증을 통과해야 하며 provider 실패는 alignment 결과로 바꾸지 않는다.

### 최소 권한

- MVP 전용 API key 하나를 만들고 작은 credit/usage limit과 사용량 알림을 설정한다.
- Key는 Analyze workflow와 명시적 로컬 live Worker에만 준다.
- Publish workflow, Web, PR branch, PR artifact에는 key를 주지 않는다.
- primary/fallback은 structured outputs를 지원하는 고정 모델 ID로 설정한다. 실제 응답 모델과 usage를 기록한다.

### 환경변수 이름

| 변수 | 소비자 | 비밀 여부 |
|---|---|---|
| `OPENROUTER_API_KEY` | Analyze Worker | 비밀 |
| `OPENROUTER_PRIMARY_MODEL` | Analyze Worker | 아님 |
| `OPENROUTER_FALLBACK_MODEL` | Analyze Worker | 아님 |
| `OPENROUTER_BASE_URL` | Analyze Worker | 아님. 기본값은 공식 API URL |

### 설정 위치

- 로컬 live 실행: 추적되지 않는 `backend/.env`.
- GitHub: `Settings → Secrets and variables → Actions`. API key는 Secret, 모델 ID는 Variable에 둔다.
- Vercel FastAPI에는 기본적으로 OpenRouter key를 넣지 않는다. 긴 분석은 Action Analyze Job이 수행한다.

공식 참고: [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs), [모델 fallback](https://openrouter.ai/docs/guides/routing/model-fallbacks).

### 확인 방법

Key를 출력하지 않고 모델 목록 접근과 모델 ID 존재 여부를 확인한다.

```bash
curl -fsS https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  | jq -e --arg model "$OPENROUTER_PRIMARY_MODEL" \
    '.data | any(.id == $model)'
```

이후 contract test에서 primary/fallback, malformed JSON, fabricated quote를 확인하고, live smoke 결과에는 `actualModel`과 usage가 기록되는지 확인한다.

### 폐기와 회전

- 새 key를 발급해 Analyze Secret을 갱신하고 최소 모델 조회를 확인한 뒤 이전 key를 폐기한다.
- 노출이 의심되면 즉시 이전 key를 폐기하고 GitHub run log와 OpenRouter usage를 점검한다.
- 모델 ID 변경은 Actions Variable만 갱신하며, fixture 평가와 structured-output 지원 확인을 통과한 뒤 production에 적용한다.

## 4. Vercel Web 배포와 FastAPI URL

### 목적

React/Vite Web과 FastAPI control plane을 공개 HTTPS URL로 배포한다. Web은 API URL을 빌드 시 주입하고, GitHub App과 Actions는 같은 FastAPI production URL을 사용한다.

### 최소 권한

- 같은 저장소에 Web과 API용 Vercel 프로젝트를 분리하고 각 Root Directory를 제한한다.
- Web 프로젝트에는 공개 `VITE_*` 값만 둔다.
- API 프로젝트에만 DB, GitHub App, 내부 HMAC 비밀을 둔다. OpenRouter key는 두지 않는다.
- Preview와 Production 환경변수를 분리한다. production GitHub App callback/webhook에는 production API URL만 사용한다.

### 환경변수 이름

| 변수 | 설정 위치 | 비밀 여부 |
|---|---|---|
| `ALIGNMENT_WEB_URL` | 운영자 로컬/Actions Variable | 아님 |
| `ALIGNMENT_API_BASE_URL` | 운영자 로컬/Actions Variable | 아님 |
| `VITE_API_BASE_URL` | Vercel Web | 아님 |
| `VITE_SUPABASE_URL` | Vercel Web | 아님 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel Web | 공개 클라이언트 키 |
| `CORS_ALLOWED_ORIGINS` | Vercel API | 아님. 허용할 Web origin만 기재 |
| `INTERNAL_HMAC_SECRET` | Vercel API, Analyze Action | 비밀 |
| `DATABASE_URL` | Vercel API | 비밀 |

API 프로젝트에는 앞 절의 `SUPABASE_*`와 `GITHUB_APP_*` 서버 변수도 등록한다.

### 설정 위치

1. Vercel에서 같은 GitHub 저장소를 두 번 import한다.
2. Web project의 Root Directory는 `apps/web`, Framework Preset은 Vite로 둔다.
3. API project는 phase 8의 FastAPI Vercel entrypoint 설정을 사용한다. Vercel 제약이 확인되면 canonical 결정대로 `backend/Dockerfile`을 지원하는 호스트에 배포해도 된다.
4. Web의 `VITE_API_BASE_URL`을 API production URL로, API의 `CORS_ALLOWED_ORIGINS`를 Web production origin으로 설정한다.
5. API URL을 GitHub App callback/webhook과 GitHub Actions의 `ALIGNMENT_API_BASE_URL`에 동일하게 반영한다.

공식 참고: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [FastAPI on Vercel](https://vercel.com/docs/frameworks/backend/fastapi), [Vercel 환경변수](https://vercel.com/docs/environment-variables).

### 확인 방법

phase 8 배포 설정이 추가된 뒤 CLI 또는 Git 연동으로 배포한다.

```bash
npx vercel --cwd apps/web
npx vercel --prod --cwd apps/web
npx vercel --cwd backend
npx vercel --prod --cwd backend
curl -fsS "$ALIGNMENT_API_BASE_URL/healthz"
curl -fsSI "$ALIGNMENT_WEB_URL" | head -n 1
```

Web에서 로그인 → repository 목록 → Initial Sync까지 실행해 브라우저 CORS 오류가 없고, GitHub callback/webhook이 production API로 도달하는지 확인한다.

### 폐기와 회전

- URL 변경 시 새 API health 확인 → Web/Actions/GitHub App URL 갱신 → callback/webhook 재확인 → 이전 deployment 제거 순서로 진행한다.
- Vercel 비밀은 새 값을 모든 필요한 environment에 등록하고 redeploy한 뒤 이전 값을 제거한다.
- 프로젝트 폐기 전 GitHub App callback/webhook을 비활성화하고 Actions 비밀과 Supabase redirect URL을 제거한다.
