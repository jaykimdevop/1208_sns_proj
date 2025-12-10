# 보안 검토 가이드

이 문서는 프로덕션 배포 전 보안 설정을 검토하기 위한 체크리스트입니다.

## 1. 환경 변수 보안

### 1.1 서버 사이드 전용 키 확인

다음 키들은 **절대 클라이언트에 노출되면 안 됩니다**:

- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 관리자 권한 키
- `CLERK_SECRET_KEY`: Clerk 서버 사이드 인증 키

**검증 방법:**
1. 브라우저 개발자 도구 → Network 탭에서 번들 파일 확인
2. `pnpm build` 실행 후 `.next/static/chunks/` 디렉토리에서 키 검색
3. 소스맵 파일(`.next/static/chunks/*.map`)에서 키 검색

**현재 구현 확인:**
- ✅ `lib/supabase/service-role.ts`: 서버 사이드에서만 사용
- ✅ `app/api/**/route.ts`: API 라우트에서만 사용
- ✅ 클라이언트 컴포넌트에서 직접 사용하지 않음

### 1.2 프로덕션 키 사용 확인

**Clerk 키:**
- 개발 환경: `pk_test_...`, `sk_test_...`
- 프로덕션 환경: `pk_live_...`, `sk_live_...`

**검증 방법:**
```bash
pnpm verify:env
```

또는 수동으로 확인:
- Vercel Dashboard → Settings → Environment Variables
- Production 환경의 키가 `live`로 시작하는지 확인

## 2. Supabase 보안

### 2.1 RLS (Row Level Security) 정책 활성화

**중요:** 개발 중에는 RLS를 비활성화했을 수 있으므로, 프로덕션 배포 전 반드시 활성화해야 합니다.

**확인 방법:**
1. Supabase Dashboard → Authentication → Policies
2. 각 테이블별로 RLS가 활성화되어 있는지 확인:
   - `users`
   - `posts`
   - `likes`
   - `comments`
   - `follows`
   - `bookmarks`

**RLS 정책 예시:**
```sql
-- posts 테이블 예시
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 자신의 게시물 조회 가능
CREATE POLICY "Users can view all posts"
ON posts FOR SELECT
TO authenticated
USING (true);

-- 인증된 사용자만 자신의 게시물 생성 가능
CREATE POLICY "Users can insert their own posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.jwt()->>'sub' = user_id::text);
```

**현재 상태:**
- 개발 중: RLS 비활성화 (`.cursor/rules/supabase/disable-rls.mdc` 참고)
- 프로덕션: RLS 활성화 필요

### 2.2 Storage 버킷 정책 확인

**확인 항목:**
1. Supabase Dashboard → Storage → Policies
2. `posts` 버킷의 정책 확인:
   - INSERT: 인증된 사용자만 자신의 폴더에 업로드 가능
   - SELECT: 인증된 사용자만 자신의 파일 조회 가능
   - DELETE: 인증된 사용자만 자신의 파일 삭제 가능

**정책 예시:**
```sql
-- Storage 버킷 정책 예시
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = auth.jwt()->>'sub'
);
```

## 3. API 라우트 보안

### 3.1 인증 검증 확인

모든 API 라우트에서 Clerk 인증을 확인해야 합니다.

**확인할 파일:**
- `app/api/posts/route.ts`
- `app/api/posts/[postId]/route.ts`
- `app/api/likes/route.ts`
- `app/api/comments/route.ts`
- `app/api/follows/route.ts`
- `app/api/bookmarks/route.ts`
- `app/api/sync-user/route.ts`

**검증 패턴:**
```typescript
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // ... 나머지 로직
}
```

### 3.2 권한 검증 확인

사용자가 자신의 리소스만 수정/삭제할 수 있는지 확인:

- 게시물 삭제: 본인 게시물만 삭제 가능
- 댓글 삭제: 본인 댓글만 삭제 가능
- 팔로우: 자기 자신 팔로우 방지

## 4. 클라이언트 사이드 보안

### 4.1 민감 정보 노출 확인

**확인 항목:**
1. 브라우저 개발자 도구 → Console에서 환경 변수 노출 확인
2. Network 탭에서 API 응답에 민감 정보 포함 여부 확인
3. 소스 코드에서 하드코딩된 키 확인

### 4.2 CORS 설정 확인

현재 Next.js API 라우트는 같은 도메인에서만 접근 가능하므로 CORS 설정이 필요 없습니다.

외부 API를 호출하는 경우:
- 적절한 CORS 헤더 설정
- 허용된 도메인만 접근 가능하도록 설정

## 5. 의존성 보안

### 5.1 취약점 스캔

```bash
pnpm audit
```

또는

```bash
npm audit
```

**중요 취약점이 발견되면 즉시 업데이트**

### 5.2 의존성 업데이트

정기적으로 의존성을 업데이트:

```bash
pnpm update
```

## 6. 배포 전 최종 체크리스트

- [ ] 모든 환경 변수가 설정되었는지 확인
- [ ] 프로덕션 키를 사용하고 있는지 확인
- [ ] RLS 정책이 활성화되었는지 확인
- [ ] Storage 버킷 정책이 올바르게 설정되었는지 확인
- [ ] 모든 API 라우트에 인증 검증이 있는지 확인
- [ ] 서버 사이드 키가 클라이언트에 노출되지 않았는지 확인
- [ ] 의존성 취약점이 없는지 확인
- [ ] 프로덕션 빌드가 성공하는지 확인
- [ ] 프로덕션 환경에서 모든 기능이 정상 작동하는지 확인

## 7. 모니터링 및 알림

### 7.1 에러 추적

프로덕션 환경에서 에러를 추적하기 위해 다음을 고려:

- Vercel Analytics 활성화
- Sentry 통합 (선택사항)

### 7.2 로깅

프로덕션 환경에서는:
- `console.log` 제거 또는 조건부 로깅
- 에러 로깅 시스템 활용 (`lib/utils/logger.ts`)

## 8. 참고 자료

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Clerk Security Guide](https://clerk.com/docs/security)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config/headers)

