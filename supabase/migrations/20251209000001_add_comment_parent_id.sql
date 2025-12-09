-- Migration: Add parent_id column to comments table for thread/reply support
-- Description: Enables 1-level deep reply threads (Instagram style)
-- parent_id가 NULL이면 루트 댓글, 값이 있으면 해당 댓글에 대한 답글

-- 1. parent_id 컬럼 추가
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2. parent_id 인덱스 생성 (답글 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- 3. 복합 인덱스 생성 (게시물별 루트 댓글 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_comments_post_root ON public.comments(post_id, created_at DESC) 
WHERE parent_id IS NULL;

-- 4. 복합 인덱스 생성 (부모 댓글별 답글 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_comments_parent_created ON public.comments(parent_id, created_at ASC)
WHERE parent_id IS NOT NULL;

COMMENT ON COLUMN public.comments.parent_id IS '부모 댓글 ID (NULL이면 루트 댓글, 값이 있으면 답글)';

