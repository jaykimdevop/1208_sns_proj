-- ============================================
-- Instagram Clone SNS Storage Bucket
-- Migration: 20251208142022_create_posts_storage.sql
-- ============================================
-- posts 버킷 생성 및 정책 설정
-- 공개 읽기 버킷 (PRD.md 요구사항)
-- ============================================

-- ============================================
-- 1. posts 버킷 생성
-- ============================================
-- 공개 읽기 버킷 (public = true)
-- 파일 크기 제한: 5MB (PRD.md 기준)
-- 이미지 파일만 허용
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,  -- 공개 읽기 버킷
  5242880,  -- 5MB 제한 (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']  -- 이미지 파일만 허용
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- 2. Storage 정책 설정
-- ============================================
-- RLS는 개발 단계에서 비활성화하지만, 정책은 생성해둡니다.
-- 프로덕션에서 RLS 활성화 시 사용할 수 있도록 준비

-- INSERT: 인증된 사용자만 업로드 가능
-- 경로 구조: {user_id}/{filename} 또는 {filename} (애플리케이션에서 결정)
CREATE POLICY IF NOT EXISTS "Authenticated users can upload posts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts'
);

-- SELECT: 공개 읽기 (모든 사용자가 조회 가능)
CREATE POLICY IF NOT EXISTS "Public can read posts"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'posts'
);

-- DELETE: 본인 게시물만 삭제 가능
-- Clerk user ID를 사용하여 본인 확인
CREATE POLICY IF NOT EXISTS "Users can delete own posts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts' AND
  -- 경로에 user_id가 포함되어 있거나, metadata에 user_id가 있는 경우
  -- 실제 구현은 애플리케이션에서 경로 구조에 따라 조정 필요
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
  OR
  (metadata->>'user_id') = (SELECT auth.jwt()->>'sub')
);

-- UPDATE: 본인 게시물만 업데이트 가능
CREATE POLICY IF NOT EXISTS "Users can update own posts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'posts' AND
  ((storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
  OR
  (metadata->>'user_id') = (SELECT auth.jwt()->>'sub'))
)
WITH CHECK (
  bucket_id = 'posts' AND
  ((storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
  OR
  (metadata->>'user_id') = (SELECT auth.jwt()->>'sub'))
);

