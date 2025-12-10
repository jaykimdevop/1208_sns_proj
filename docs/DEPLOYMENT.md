# 배포 가이드

Instasketch 프로젝트를 프로덕션 환경에 배포하기 위한 종합 가이드입니다.

## 목차

1. [사전 준비](#1-사전-준비)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [보안 검토](#3-보안-검토)
4. [빌드 테스트](#4-빌드-테스트)
5. [Vercel 배포](#5-vercel-배포)
6. [배포 후 확인](#6-배포-후-확인)
7. [트러블슈팅](#7-트러블슈팅)

## 1. 사전 준비

### 1.1 필수 계정 및 서비스

- [ ] GitHub/GitLab/Bitbucket 계정
- [ ] Vercel 계정 (무료 계정 가능)
- [ ] Clerk 프로덕션 프로젝트
- [ ] Supabase 프로덕션 프로젝트

### 1.2 프로덕션 키 준비

**Clerk:**
1. [Clerk Dashboard](https://dashboard.clerk.com) → 프로덕션 프로젝트 선택
2. **API Keys** → Production 키 복사
   - Publishable Key: `pk_live_...`
   - Secret Key: `sk_live_...`

**Supabase:**
1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로덕션 프로젝트 선택
2. **Settings** → **API** → 다음 값 복사:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key (⚠️ 서버 사이드 전용)

## 2. 환경 변수 설정

### 2.1 로컬 환경 변수 검증

프로덕션 배포 전 로컬에서 환경 변수를 검증합니다:

```bash
# 환경 변수 검증 스크립트 실행
pnpm verify:env
```

### 2.2 Vercel 환경 변수 설정

1. [Vercel Dashboard](https://vercel.com/dashboard) → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수들을 **Production** 환경에 추가:

#### Clerk 환경 변수

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

#### Supabase 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

**⚠️ 중요:**
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드 전용입니다
- 프로덕션 환경에서는 Production 키(`pk_live_...`, `sk_live_...`)를 사용해야 합니다

## 3. 보안 검토

배포 전 반드시 [보안 검토 가이드](docs/SECURITY_REVIEW.md)를 확인하세요.

### 3.1 주요 확인 사항

- [ ] 서버 사이드 키가 클라이언트에 노출되지 않았는지 확인
- [ ] RLS 정책이 활성화되었는지 확인
- [ ] 모든 API 라우트에 인증 검증이 있는지 확인
- [ ] 프로덕션 키를 사용하고 있는지 확인

## 4. 빌드 테스트

### 4.1 로컬 프로덕션 빌드

```bash
# 프로덕션 빌드 실행
pnpm build

# 프로덕션 서버 실행
pnpm start
```

**확인 사항:**
- [ ] 빌드 성공 확인
- [ ] 빌드 에러/경고 없음
- [ ] `http://localhost:3000`에서 정상 작동 확인

### 4.2 빌드 결과 확인

빌드 성공 시 다음과 같은 출력을 확인할 수 있습니다:

```
Route (app)                                 Size  First Load JS
┌ ƒ /                                    31.3 kB         210 kB
...
```

**확인 사항:**
- [ ] 모든 라우트가 정상적으로 빌드됨
- [ ] First Load JS 크기가 합리적 범위 내 (200KB 이하 권장)

## 5. Vercel 배포

### 5.1 프로젝트 생성

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. **Add New...** → **Project** 클릭
3. Git 저장소 선택 및 연결
4. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `pnpm build` (자동 감지)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `pnpm install` (자동 감지)

### 5.2 환경 변수 설정

[2.2 Vercel 환경 변수 설정](#22-vercel-환경-변수-설정) 참고

### 5.3 배포 실행

**자동 배포:**
- `main` 브랜치에 푸시하면 자동으로 배포됩니다

```bash
git push origin main
```

**수동 배포:**
- Vercel Dashboard → **Deployments** → **Redeploy**

### 5.4 배포 상태 확인

Vercel Dashboard → **Deployments**에서:
- ✅ **Success**: 배포 성공
- ❌ **Error**: 배포 실패 (로그 확인 필요)

## 6. 배포 후 확인

### 6.1 기본 기능 확인

배포된 사이트에서 다음 기능들을 확인하세요:

- [ ] 홈 페이지 로드
- [ ] 로그인/회원가입
- [ ] 게시물 목록 조회
- [ ] 게시물 작성
- [ ] 이미지 업로드
- [ ] 댓글 작성
- [ ] 프로필 페이지
- [ ] 검색 기능

자세한 체크리스트는 [배포 체크리스트](docs/DEPLOYMENT_CHECKLIST.md)를 참고하세요.

### 6.2 성능 확인

**Lighthouse 점수 확인:**
1. Chrome DevTools → Lighthouse 탭
2. **Analyze page load** 실행
3. 목표 점수:
   - Performance: 90+
   - Accessibility: 90+
   - Best Practices: 90+
   - SEO: 90+

### 6.3 에러 모니터링

- [ ] Vercel Dashboard → **Functions** 탭에서 에러 로그 확인
- [ ] 브라우저 Console에서 에러 확인
- [ ] 네트워크 탭에서 실패한 요청 확인

## 7. 트러블슈팅

### 7.1 빌드 실패

**문제:** Vercel에서 빌드가 실패하는 경우

**해결 방법:**
1. Vercel Dashboard → **Deployments** → 실패한 배포 클릭
2. **Build Logs** 탭에서 에러 확인
3. 일반적인 원인:
   - 환경 변수 누락
   - TypeScript 타입 에러
   - 의존성 설치 실패

**로컬에서 재현:**
```bash
pnpm build
```

### 7.2 런타임 에러

**문제:** 배포는 성공했지만 사이트가 작동하지 않는 경우

**해결 방법:**
1. Vercel Dashboard → **Functions** 탭에서 에러 로그 확인
2. 브라우저 개발자 도구 → Console에서 에러 확인
3. 환경 변수가 올바르게 설정되었는지 확인
4. Clerk/Supabase 키가 프로덕션 키인지 확인

### 7.3 인증 실패

**문제:** 로그인이 작동하지 않는 경우

**해결 방법:**
1. Clerk Dashboard → **Settings** → **Domains**
2. Vercel 도메인 추가 (예: `your-app.vercel.app`)
3. Vercel 환경 변수에서 Clerk 키 확인
4. Production 키를 사용하고 있는지 확인

### 7.4 이미지 로드 실패

**문제:** 이미지가 로드되지 않는 경우

**해결 방법:**
1. `next.config.ts`의 `images.remotePatterns` 확인
2. Supabase Storage 버킷이 공개 설정인지 확인
3. CORS 설정 확인

### 7.5 데이터베이스 연결 실패

**문제:** Supabase 연결이 실패하는 경우

**해결 방법:**
1. Supabase Dashboard에서 프로젝트 상태 확인
2. Vercel 환경 변수에서 Supabase URL/Key 확인
3. Supabase 프로젝트가 활성화되어 있는지 확인

## 8. 추가 리소스

- [보안 검토 가이드](docs/SECURITY_REVIEW.md): 보안 설정 상세 가이드
- [Vercel 배포 가이드](docs/VERCEL_DEPLOYMENT.md): Vercel 배포 상세 가이드
- [배포 체크리스트](docs/DEPLOYMENT_CHECKLIST.md): 배포 전 확인 항목
- [환경 변수 검증 스크립트](scripts/verify-env.ts): 환경 변수 자동 검증

## 9. 지속적 배포

### 9.1 자동 배포

기본적으로 Vercel은 `main` 브랜치에 푸시할 때마다 자동으로 배포합니다.

### 9.2 프리뷰 배포

다른 브랜치에 푸시하면 프리뷰 배포가 생성됩니다:
- 각 브랜치마다 고유한 URL 생성
- Pull Request마다 프리뷰 배포 생성

### 9.3 프로덕션 배포

`main` 브랜치에만 프로덕션 배포가 실행됩니다.

## 10. 모니터링 및 유지보수

### 10.1 Vercel Analytics

Vercel Dashboard → **Analytics**에서:
- 페이지뷰 추적
- 성능 메트릭 확인
- 에러 추적

### 10.2 정기 점검

- 주기적으로 의존성 업데이트 (`pnpm update`)
- 보안 취약점 스캔 (`pnpm audit`)
- 성능 모니터링
- 에러 로그 확인

## 참고 자료

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Clerk Production Guide](https://clerk.com/docs/deployments/overview)
- [Supabase Production Guide](https://supabase.com/docs/guides/platform/going-to-prod)

