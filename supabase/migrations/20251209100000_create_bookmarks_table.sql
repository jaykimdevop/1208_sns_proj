-- 북마크 테이블 생성
-- 사용자가 게시물을 저장(북마크)할 수 있는 기능

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- 인덱스 생성 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);

-- 코멘트 추가
COMMENT ON TABLE bookmarks IS '사용자 북마크 (저장된 게시물)';
COMMENT ON COLUMN bookmarks.user_id IS 'Clerk 사용자 ID';
COMMENT ON COLUMN bookmarks.post_id IS '북마크된 게시물 ID';

