# 기본 세팅 가이드

이 문서는 Instagram Clone SNS 프로젝트의 기본 세팅을 완료하는 방법을 설명합니다.

## 완료된 작업

다음 작업은 이미 완료되었습니다:

- ✅ Tailwind CSS Instagram 컬러 스키마 설정 (`app/globals.css`)
- ✅ 타이포그래피 설정 (`app/globals.css`)
- ✅ 데이터베이스 마이그레이션 파일 생성 (`supabase/migrations/20251208142021_create_instagram_schema.sql`)
- ✅ Storage 버킷 마이그레이션 파일 생성 (`supabase/migrations/20251208142022_create_posts_storage.sql`)
- ✅ TypeScript 타입 정의 (`lib/types.ts`)

## 다음 단계: Supabase 마이그레이션 적용

### 1. 데이터베이스 마이그레이션 적용

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. **SQL Editor** 메뉴로 이동
4. **New query** 클릭
5. `supabase/migrations/20251208142021_create_instagram_schema.sql` 파일 내용을 복사하여 붙여넣기
6. **Run** 클릭하여 실행
7. 성공 메시지 확인 (`Success. No rows returned`)

**생성되는 테이블:**
- `users`: 사용자 정보
- `posts`: 게시물
- `likes`: 좋아요
- `comments`: 댓글
- `follows`: 팔로우

**생성되는 뷰:**
- `post_stats`: 게시물 통계 (좋아요 수, 댓글 수)
- `user_stats`: 사용자 통계 (게시물 수, 팔로워 수, 팔로잉 수)

**생성되는 트리거:**
- `set_updated_at`: `posts`와 `comments` 테이블의 `updated_at` 자동 업데이트

### 2. Storage 버킷 마이그레이션 적용

1. Supabase Dashboard에서 **SQL Editor** 메뉴로 이동
2. **New query** 클릭
3. `supabase/migrations/20251208142022_create_posts_storage.sql` 파일 내용을 복사하여 붙여넣기
4. **Run** 클릭하여 실행
5. 성공 메시지 확인

**생성되는 버킷:**
- `posts`: 게시물 이미지 저장용 (공개 읽기, 5MB 제한)

### 3. 마이그레이션 검증

#### 데이터베이스 검증

SQL Editor에서 다음 쿼리를 실행하여 테이블이 올바르게 생성되었는지 확인:

```sql
-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 뷰 목록 확인
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 트리거 목록 확인
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**예상 결과:**
- 테이블: `users`, `posts`, `likes`, `comments`, `follows`
- 뷰: `post_stats`, `user_stats`
- 트리거: `set_updated_at` (posts, comments 테이블에 각각 1개씩)

#### Storage 검증

1. Supabase Dashboard에서 **Storage** 메뉴로 이동
2. `posts` 버킷이 생성되었는지 확인
3. 버킷 설정 확인:
   - **Public**: Yes (공개 읽기)
   - **File size limit**: 5MB
   - **Allowed MIME types**: image/jpeg, image/png, image/webp, image/gif

## 환경 변수 확인

`.env` 파일에 다음 변수들이 설정되어 있는지 확인:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Storage 버킷 이름 (선택사항, 기본값: posts)
NEXT_PUBLIC_STORAGE_BUCKET=posts
```

## 타입 정의 사용법

생성된 타입 정의는 `lib/types.ts`에서 import하여 사용할 수 있습니다:

```typescript
import type { Post, User, PostStats, UserStats } from '@/lib/types';

// 게시물 목록 조회 시
const posts: PostStats[] = await fetchPosts();

// 사용자 정보 조회 시
const user: UserStats = await fetchUser(userId);
```

## 문제 해결

### 마이그레이션 실행 시 오류 발생

1. **"relation already exists" 오류**: 테이블이 이미 존재하는 경우
   - `CREATE TABLE IF NOT EXISTS` 구문을 사용했으므로 무시해도 됩니다
   - 또는 기존 테이블을 삭제 후 다시 실행

2. **권한 오류**: 
   - Supabase Dashboard에서 실행하는 경우 권한 문제는 발생하지 않습니다
   - CLI를 사용하는 경우 프로젝트 설정을 확인하세요

3. **트리거 오류**:
   - `DROP TRIGGER IF EXISTS` 구문을 사용했으므로 기존 트리거가 있어도 문제없습니다

### Storage 버킷이 생성되지 않음

1. Supabase Dashboard의 **Storage** 메뉴에서 직접 확인
2. 버킷이 없으면 SQL Editor에서 마이그레이션을 다시 실행
3. 또는 Supabase Dashboard에서 수동으로 버킷 생성:
   - **Storage** → **New bucket**
   - Name: `posts`
   - Public: Yes
   - File size limit: 5MB

## 참고 자료

- [Supabase SQL Editor 가이드](https://supabase.com/docs/guides/database/tables)
- [Supabase Storage 가이드](https://supabase.com/docs/guides/storage)
- [프로젝트 PRD](docs/PRD.md)
- [데이터베이스 스키마](supabase/migrations/db.sql)

