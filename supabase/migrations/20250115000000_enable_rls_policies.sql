-- ============================================
-- RLS 활성화 및 정책 설정
-- 프로덕션 배포 전 필수 마이그레이션
-- ============================================
-- Clerk + Supabase 네이티브 통합을 위한 Row Level Security 정책
-- auth.jwt()->>'sub'는 Clerk User ID를 포함합니다
-- ============================================
-- 주의: 기존 정책이 있으면 먼저 삭제한 후 재생성합니다
-- ============================================

-- ============================================
-- 1. Users 테이블 RLS 정책
-- ============================================

-- 기존 정책 삭제 (존재하는 경우)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;

-- RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 인증된 사용자는 모든 사용자 프로필을 조회할 수 있음 (공개 프로필)
CREATE POLICY "Users can view all profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- 정책: 사용자는 자신의 프로필만 수정할 수 있음
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = clerk_id
)
WITH CHECK (
    (SELECT auth.jwt()->>'sub') = clerk_id
);

-- 정책: 사용자는 자신의 프로필만 삭제할 수 있음
CREATE POLICY "Users can delete their own profile"
ON public.users
FOR DELETE
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = clerk_id
);

-- ============================================
-- 2. Posts 테이블 RLS 정책
-- ============================================

-- 기존 정책 삭제 (존재하는 경우)
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

-- RLS 활성화
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 인증된 사용자는 모든 게시물을 조회할 수 있음
CREATE POLICY "Users can view all posts"
ON public.posts
FOR SELECT
TO authenticated
USING (true);

-- 정책: 사용자는 자신의 게시물만 생성할 수 있음
CREATE POLICY "Users can create their own posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
        AND clerk_id = (SELECT auth.jwt()->>'sub')
    )
);

-- 정책: 사용자는 자신의 게시물만 수정할 수 있음
CREATE POLICY "Users can update their own posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
        AND clerk_id = (SELECT auth.jwt()->>'sub')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
        AND clerk_id = (SELECT auth.jwt()->>'sub')
    )
);

-- 정책: 사용자는 자신의 게시물만 삭제할 수 있음
CREATE POLICY "Users can delete their own posts"
ON public.posts
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
        AND clerk_id = (SELECT auth.jwt()->>'sub')
    )
);

-- ============================================
-- 3. Likes 테이블 RLS 정책
-- ============================================

-- 기존 정책 삭제 (존재하는 경우)
DROP POLICY IF EXISTS "Users can view all likes" ON public.likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;

-- RLS 활성화
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 인증된 사용자는 모든 좋아요를 조회할 수 있음
CREATE POLICY "Users can view all likes"
ON public.likes
FOR SELECT
TO authenticated
USING (true);

-- 정책: 사용자는 자신의 좋아요만 생성할 수 있음
CREATE POLICY "Users can create their own likes"
ON public.likes
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
        AND clerk_id = (SELECT auth.jwt()->>'sub')
    )
);

-- 정책: 사용자는 자신의 좋아요만 삭제할 수 있음
CREATE POLICY "Users can delete their own likes"
ON public.likes
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
        AND clerk_id = (SELECT auth.jwt()->>'sub')
    )
);

-- ============================================
-- 4. Comments 테이블 RLS 정책
-- ============================================

-- 기존 정책 삭제 (존재하는 경우)
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- RLS 활성화
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 인증된 사용자는 모든 댓글을 조회할 수 있음
CREATE POLICY "Users can view all comments"
ON public.comments
FOR SELECT
TO authenticated
USING (true);

-- 정책: 사용자는 자신의 댓글만 생성할 수 있음
CREATE POLICY "Users can create their own comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
        AND clerk_id = (SELECT auth.jwt()->>'sub')
    )
);

-- 정책: 사용자는 자신의 댓글만 수정할 수 있음
CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
        AND clerk_id = (SELECT auth.jwt()->>'sub')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
        AND clerk_id = (SELECT auth.jwt()->>'sub')
    )
);

-- 정책: 사용자는 자신의 댓글만 삭제할 수 있음
CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
        AND clerk_id = (SELECT auth.jwt()->>'sub')
    )
);

-- ============================================
-- 5. Follows 테이블 RLS 정책
-- ============================================

-- 기존 정책 삭제 (존재하는 경우)
DROP POLICY IF EXISTS "Users can view all follows" ON public.follows;
DROP POLICY IF EXISTS "Users can create their own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;

-- RLS 활성화
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 인증된 사용자는 모든 팔로우 관계를 조회할 수 있음
CREATE POLICY "Users can view all follows"
ON public.follows
FOR SELECT
TO authenticated
USING (true);

-- 정책: 사용자는 자신의 팔로우만 생성할 수 있음
CREATE POLICY "Users can create their own follows"
ON public.follows
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = follower_id
        AND clerk_id = (SELECT auth.jwt()->>'sub')
    )
);

-- 정책: 사용자는 자신의 팔로우만 삭제할 수 있음
CREATE POLICY "Users can delete their own follows"
ON public.follows
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = follower_id
        AND clerk_id = (SELECT auth.jwt()->>'sub')
    )
);

-- ============================================
-- 6. Bookmarks 테이블 RLS 정책
-- ============================================
-- 주의: bookmarks 테이블의 user_id는 TEXT 타입이며 Clerk ID를 직접 저장합니다

-- 기존 정책 삭제 (존재하는 경우)
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;

-- RLS 활성화 및 정책 생성 (bookmarks 테이블이 있는 경우)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookmarks') THEN
        ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

        -- 정책: 사용자는 자신의 북마크만 조회할 수 있음
        -- bookmarks.user_id는 TEXT 타입이며 Clerk ID를 직접 저장
        CREATE POLICY "Users can view their own bookmarks"
        ON public.bookmarks
        FOR SELECT
        TO authenticated
        USING (
            user_id = (SELECT auth.jwt()->>'sub')
        );

        -- 정책: 사용자는 자신의 북마크만 생성할 수 있음
        CREATE POLICY "Users can create their own bookmarks"
        ON public.bookmarks
        FOR INSERT
        TO authenticated
        WITH CHECK (
            user_id = (SELECT auth.jwt()->>'sub')
        );

        -- 정책: 사용자는 자신의 북마크만 삭제할 수 있음
        CREATE POLICY "Users can delete their own bookmarks"
        ON public.bookmarks
        FOR DELETE
        TO authenticated
        USING (
            user_id = (SELECT auth.jwt()->>'sub')
        );
    END IF;
END $$;

