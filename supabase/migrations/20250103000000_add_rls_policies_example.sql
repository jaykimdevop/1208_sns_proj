-- RLS 정책 예시 마이그레이션
-- Clerk + Supabase 네이티브 통합을 위한 Row Level Security 정책 예시
--
-- 이 마이그레이션은 Clerk 문서의 모범 사례를 기반으로 작성되었습니다.
-- 실제 사용 시에는 프로젝트 요구사항에 맞게 수정하세요.
--
-- 참고:
-- - Clerk 세션 토큰의 'sub' 클레임은 Clerk User ID를 포함합니다
-- - auth.jwt()->>'sub'를 사용하여 현재 사용자의 Clerk ID를 확인할 수 있습니다
-- - RLS 정책은 authenticated 역할에만 적용됩니다
--
-- @see https://clerk.com/docs/guides/development/integrations/databases/supabase
-- @see https://supabase.com/docs/guides/auth/row-level-security

-- 예시: tasks 테이블 생성 (Clerk 문서 예시 기반)
CREATE TABLE IF NOT EXISTS public.tasks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 활성화 (개발 중에는 비활성화 가능)
-- 프로덕션에서는 반드시 활성화해야 합니다
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 정책 1: 사용자는 자신의 tasks만 조회할 수 있음
CREATE POLICY "User can view their own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- 정책 2: 사용자는 자신의 tasks만 생성할 수 있음
CREATE POLICY "Users must insert their own tasks"
ON public.tasks
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- 정책 3: 사용자는 자신의 tasks만 수정할 수 있음
CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = user_id
)
WITH CHECK (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- 정책 4: 사용자는 자신의 tasks만 삭제할 수 있음
CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- users 테이블에 대한 RLS 정책 예시 (기존 users 테이블이 있는 경우)
-- 주의: 이 정책들은 기존 users 테이블의 RLS가 활성화된 경우에만 적용됩니다

-- 사용자는 자신의 정보만 조회할 수 있음
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- RLS 활성화 (필요한 경우)
        -- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        -- 정책 생성 (이미 존재하지 않는 경우에만)
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND policyname = 'Users can view their own profile'
        ) THEN
            CREATE POLICY "Users can view their own profile"
            ON public.users
            FOR SELECT
            TO authenticated
            USING (
                (SELECT auth.jwt()->>'sub') = clerk_id
            );
        END IF;

        -- 사용자는 자신의 정보만 수정할 수 있음
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND policyname = 'Users can update their own profile'
        ) THEN
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
        END IF;
    END IF;
END $$;

