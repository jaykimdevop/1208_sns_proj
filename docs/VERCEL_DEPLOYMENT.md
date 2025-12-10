# Vercel 배포 가이드

이 문서는 Instasketch 프로젝트를 Vercel에 배포하는 단계별 가이드를 제공합니다.

## 사전 요구사항

- GitHub/GitLab/Bitbucket 계정
- Vercel 계정 (무료 계정으로 시작 가능)
- Clerk 프로덕션 키
- Supabase 프로덕션 프로젝트

## 1. Git 저장소 준비

### 1.1 저장소에 푸시

```bash
# 변경사항 커밋
git add .
git commit -m "Prepare for deployment"

# 원격 저장소에 푸시
git push origin main
```

### 1.2 .gitignore 확인

다음 파일들이 `.gitignore`에 포함되어 있는지 확인:
- `.env`
- `.env.local`
- `.env.production`
- `.next/`
- `node_modules/`

## 2. Vercel 프로젝트 생성

### 2.1 Vercel 대시보드에서 프로젝트 추가

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. **Add New...** → **Project** 클릭
3. Git 저장소 선택 (GitHub/GitLab/Bitbucket)
4. 프로젝트 선택

### 2.2 프로젝트 설정

**프로젝트 이름:** `instasketch` (또는 원하는 이름)

**Framework Preset:** Next.js (자동 감지)

**Root Directory:** `./` (기본값)

**Build Command:** `pnpm build` (자동 감지)

**Output Directory:** `.next` (기본값)

**Install Command:** `pnpm install` (자동 감지)

## 3. 환경 변수 설정

### 3.1 Vercel Dashboard에서 환경 변수 추가

Vercel Dashboard → 프로젝트 → **Settings** → **Environment Variables**

다음 환경 변수들을 **Production** 환경에 추가:

#### Clerk 환경 변수

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

**⚠️ 중요:** 프로덕션 환경에서는 `pk_live_...`, `sk_live_...` 형식의 Production 키를 사용해야 합니다.

#### Supabase 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

**⚠️ 중요:** `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드 전용이므로 절대 클라이언트에 노출되면 안 됩니다.

### 3.2 환경 변수 확인

모든 환경 변수를 추가한 후:

1. **Save** 클릭
2. 환경 변수 목록에서 모든 변수가 올바르게 설정되었는지 확인

## 4. 빌드 설정 확인

### 4.1 package.json 확인

`package.json`에 다음 스크립트가 있는지 확인:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

### 4.2 Next.js 설정 확인

`next.config.ts` 파일이 올바르게 설정되어 있는지 확인:

- 이미지 도메인 설정
- 기타 최적화 설정

## 5. 배포 실행

### 5.1 자동 배포

Vercel은 Git 저장소에 푸시할 때마다 자동으로 배포를 실행합니다:

```bash
git push origin main
```

### 5.2 수동 배포

Vercel Dashboard에서:
1. **Deployments** 탭
2. **Redeploy** 버튼 클릭

## 6. 배포 후 확인

### 6.1 배포 상태 확인

Vercel Dashboard → **Deployments**에서 배포 상태 확인:
- ✅ Success: 배포 성공
- ❌ Error: 배포 실패 (로그 확인 필요)

### 6.2 빌드 로그 확인

배포 실패 시:
1. **Deployments** → 실패한 배포 클릭
2. **Build Logs** 탭에서 에러 확인
3. 일반적인 문제:
   - 환경 변수 누락
   - 빌드 에러
   - 의존성 설치 실패

### 6.3 프로덕션 사이트 확인

배포 성공 후:
1. Vercel이 제공하는 URL로 접속 (예: `https://instasketch.vercel.app`)
2. 다음 기능 확인:
   - 홈 페이지 로드
   - 로그인/회원가입
   - 게시물 목록 조회
   - 게시물 작성
   - 이미지 업로드
   - 댓글 작성
   - 프로필 페이지

## 7. 커스텀 도메인 설정 (선택사항)

### 7.1 도메인 추가

1. Vercel Dashboard → 프로젝트 → **Settings** → **Domains**
2. **Add Domain** 클릭
3. 도메인 입력 (예: `instasketch.com`)
4. DNS 설정 안내에 따라 도메인 제공업체에서 DNS 레코드 추가

### 7.2 DNS 설정

일반적으로 다음 DNS 레코드를 추가:

**A 레코드:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME 레코드:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 8. 환경 변수 검증

배포 후 환경 변수가 올바르게 설정되었는지 확인:

```bash
# 로컬에서 환경 변수 검증 스크립트 실행 (참고용)
pnpm verify:env
```

또는 Vercel Dashboard에서:
1. **Settings** → **Environment Variables**
2. 모든 변수가 올바르게 설정되었는지 확인

## 9. 트러블슈팅

### 9.1 빌드 실패

**문제:** 빌드가 실패하는 경우

**해결 방법:**
1. 빌드 로그 확인
2. 환경 변수 누락 확인
3. `package.json`의 의존성 확인
4. Node.js 버전 확인 (Vercel은 자동으로 감지)

### 9.2 런타임 에러

**문제:** 배포는 성공했지만 사이트가 작동하지 않는 경우

**해결 방법:**
1. Vercel Dashboard → **Functions** 탭에서 에러 로그 확인
2. 브라우저 개발자 도구 → Console에서 에러 확인
3. 환경 변수가 올바르게 설정되었는지 확인
4. Clerk/Supabase 키가 프로덕션 키인지 확인

### 9.3 이미지 로드 실패

**문제:** 이미지가 로드되지 않는 경우

**해결 방법:**
1. `next.config.ts`의 `images.remotePatterns` 확인
2. Supabase Storage 버킷이 공개 설정인지 확인
3. CORS 설정 확인

### 9.4 인증 실패

**문제:** 로그인이 작동하지 않는 경우

**해결 방법:**
1. Clerk Dashboard에서 프로덕션 키 확인
2. Vercel 환경 변수에서 Clerk 키 확인
3. Clerk Dashboard → **Settings** → **Domains**에서 Vercel 도메인 추가

## 10. 지속적 배포 설정

### 10.1 자동 배포

기본적으로 Vercel은 `main` 브랜치에 푸시할 때마다 자동으로 배포합니다.

### 10.2 프리뷰 배포

다른 브랜치에 푸시하면 프리뷰 배포가 생성됩니다:
- 각 브랜치마다 고유한 URL 생성
- Pull Request마다 프리뷰 배포 생성

### 10.3 프로덕션 배포

`main` 브랜치에만 프로덕션 배포가 실행됩니다.

## 11. 모니터링 및 분석

### 11.1 Vercel Analytics

Vercel Dashboard → **Analytics**에서:
- 페이지뷰
- 성능 메트릭
- 에러 추적

### 11.2 실시간 로그

Vercel Dashboard → **Deployments** → 배포 클릭 → **Functions** 탭:
- 실시간 함수 로그 확인
- 에러 추적

## 12. 참고 자료

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

