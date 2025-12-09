"use client";

/**
 * @file PostCard.tsx
 * @description 게시물 카드 컴포넌트
 *
 * Instagram 스타일의 게시물 카드를 표시합니다.
 * 헤더, 이미지, 액션 버튼, 좋아요 수, 캡션, 댓글 미리보기, 댓글 입력을 포함합니다.
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - lib/utils/formatRelativeTime: 상대 시간 표시
 * - lib/types: PostWithStats, CommentWithUser
 * - next/image: 이미지 최적화
 * - components/post/LikeButton: 좋아요 버튼
 * - components/post/DoubleTapHeart: 더블탭 좋아요
 * - components/comment/CommentForm: 댓글 입력 폼
 */

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import { LikeButton, LikeCount } from "@/components/post/LikeButton";
import { DoubleTapHeart } from "@/components/post/DoubleTapHeart";
import { CommentForm, type CommentFormRef } from "@/components/comment/CommentForm";
import type { PostWithStats, CommentWithUser, LikeResponse } from "@/lib/types";

interface PostCardProps {
  post: PostWithStats & {
    comments: CommentWithUser[];
    isLiked: boolean;
  };
}

export function PostCard({ post }: PostCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [comments, setComments] = useState<CommentWithUser[]>(post.comments || []);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const commentFormRef = useRef<CommentFormRef>(null);

  // 캡션이 2줄을 초과하는지 확인 (대략적인 계산)
  const captionLines = post.caption
    ? Math.ceil(post.caption.length / 50)
    : 0;
  const shouldTruncate = captionLines > 2;

  // 새 댓글 추가 핸들러
  const handleCommentAdded = useCallback((newComment: CommentWithUser) => {
    // 최신 댓글을 맨 앞에 추가하고 최대 2개만 유지
    setComments((prev) => [newComment, ...prev].slice(0, 2));
    setCommentsCount((prev) => prev + 1);
  }, []);

  // 댓글 버튼 클릭 핸들러
  const handleCommentClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // 댓글 입력창으로 포커스 이동
    commentFormRef.current?.focus();
  }, []);

  // 좋아요 상태 변경 핸들러
  const handleLikeChange = useCallback((newLiked: boolean, newCount: number) => {
    setLiked(newLiked);
    setLikesCount(newCount);
  }, []);

  // 더블탭 좋아요 핸들러
  const handleDoubleTap = useCallback(async () => {
    // 이미 좋아요를 눌렀으면 아무것도 하지 않음
    if (liked) return;

    // Optimistic UI 업데이트
    setLiked(true);
    setLikesCount((prev) => prev + 1);

    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id: post.post_id }),
      });

      const data: LikeResponse = await response.json();

      if (!data.success) {
        // API 실패 시 롤백
        setLiked(false);
        setLikesCount((prev) => prev - 1);
        console.error("Like API error:", data.error);
      }
    } catch (error) {
      // 네트워크 에러 시 롤백
      setLiked(false);
      setLikesCount((prev) => prev - 1);
      console.error("Like request failed:", error);
    }
  }, [liked, post.post_id]);

  // 공유 버튼 클릭 핸들러 (URL 복사)
  const handleShareClick = async () => {
    const url = `${window.location.origin}/post/${post.post_id}`;
    try {
      await navigator.clipboard.writeText(url);
      // TODO: 토스트 메시지 표시
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  return (
    <article className="bg-white rounded-lg border mb-6" style={{ borderColor: 'var(--color-instagram-border)' }}>
      {/* 헤더 영역 (60px) */}
      <header className="flex items-center justify-between px-4 h-[60px] border-b" style={{ borderColor: 'var(--color-instagram-border)' }}>
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 */}
          <Link href={`/profile/${post.user_id}`}>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {post.user?.name ? (
                <span className="text-xs font-semibold" style={{ color: 'var(--color-instagram-text-primary)' }}>
                  {post.user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>
          </Link>
          {/* 사용자명 */}
          <Link
            href={`/profile/${post.user_id}`}
            className="font-semibold text-sm"
            style={{ color: 'var(--color-instagram-text-primary)' }}
          >
            {post.user?.name || "Unknown"}
          </Link>
          {/* 시간 */}
          <span
            className="text-xs"
            style={{ color: 'var(--color-instagram-text-secondary)' }}
          >
            {formatRelativeTime(post.created_at)}
          </span>
        </div>
        {/* 메뉴 버튼 */}
        <button
          className="p-1 hover:opacity-70 transition-opacity"
          aria-label="더보기"
        >
          <MoreHorizontal
            size={20}
            style={{ color: 'var(--color-instagram-text-primary)' }}
          />
        </button>
      </header>

      {/* 이미지 영역 (1:1 정사각형) - 더블탭 좋아요 */}
      <DoubleTapHeart onDoubleTap={handleDoubleTap}>
        <div className="w-full aspect-square relative bg-gray-100">
          <Image
            src={post.image_url}
            alt={post.caption || "게시물 이미지"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 630px"
            unoptimized={post.image_url.startsWith("http")} // 외부 URL인 경우 unoptimized
          />
        </div>
      </DoubleTapHeart>

      {/* 액션 버튼 영역 (48px) */}
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <LikeButton
            postId={post.post_id}
            initialLiked={liked}
            initialCount={likesCount}
            onLikeChange={handleLikeChange}
          />
          {/* 댓글 버튼 */}
          <button
            onClick={handleCommentClick}
            className="hover:opacity-70 transition-opacity"
            aria-label="댓글"
          >
            <MessageCircle
              size={24}
              style={{ color: 'var(--color-instagram-text-primary)' }}
            />
          </button>
          {/* 공유 버튼 */}
          <button
            onClick={handleShareClick}
            className="hover:opacity-70 transition-opacity"
            aria-label="공유"
          >
            <Send
              size={24}
              style={{ color: 'var(--color-instagram-text-primary)' }}
            />
          </button>
        </div>
        {/* 북마크 버튼 */}
        <button
          className="hover:opacity-70 transition-opacity"
          aria-label="저장"
        >
          <Bookmark
            size={24}
            style={{ color: 'var(--color-instagram-text-primary)' }}
          />
        </button>
      </div>

      {/* 좋아요 수 */}
      <div className="px-4 pb-2">
        <LikeCount count={likesCount} />
      </div>

      {/* 캡션 영역 */}
      {post.caption && (
        <div className="px-4 pb-2">
          <p className="text-sm" style={{ color: 'var(--color-instagram-text-primary)' }}>
            <Link
              href={`/profile/${post.user_id}`}
              className="font-semibold mr-2 hover:opacity-70"
            >
              {post.user?.name || "Unknown"}
            </Link>
            {shouldTruncate && !showFullCaption ? (
              <>
                <span>
                  {post.caption.slice(0, 100)}
                  {post.caption.length > 100 ? "..." : ""}
                </span>
                <button
                  onClick={() => setShowFullCaption(true)}
                  className="ml-1 opacity-70 hover:opacity-100"
                  style={{ color: 'var(--color-instagram-text-secondary)' }}
                >
                  더 보기
                </button>
              </>
            ) : (
              <span>{post.caption}</span>
            )}
          </p>
        </div>
      )}

      {/* 댓글 미리보기 */}
      {commentsCount > 0 && (
        <div className="px-4 pb-2">
          {commentsCount > 2 && (
            <Link
              href={`/post/${post.post_id}`}
              className="text-sm mb-2 block hover:opacity-70"
              style={{ color: 'var(--color-instagram-text-secondary)' }}
            >
              댓글 {commentsCount}개 모두 보기
            </Link>
          )}
          {comments.slice(0, 2).map((comment) => (
            <p key={comment.id} className="text-sm mb-1" style={{ color: 'var(--color-instagram-text-primary)' }}>
              <Link
                href={`/profile/${comment.user_id}`}
                className="font-semibold mr-2 hover:opacity-70"
              >
                {comment.user?.name || "Unknown"}
              </Link>
              <span>{comment.content}</span>
            </p>
          ))}
        </div>
      )}

      {/* 댓글 입력 폼 */}
      <CommentForm ref={commentFormRef} postId={post.post_id} onCommentAdded={handleCommentAdded} />
    </article>
  );
}
