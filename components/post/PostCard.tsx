"use client";

/**
 * @file PostCard.tsx
 * @description 게시물 카드 컴포넌트
 *
 * Instagram 스타일의 게시물 카드를 표시합니다.
 * 헤더, 이미지, 액션 버튼, 좋아요 수, 캡션, 댓글 미리보기를 포함합니다.
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - lib/utils/formatRelativeTime: 상대 시간 표시
 * - lib/types: PostWithStats, CommentWithUser
 * - next/image: 이미지 최적화
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import type { PostWithStats, CommentWithUser } from "@/lib/types";

interface PostCardProps {
  post: PostWithStats & {
    comments: CommentWithUser[];
  };
  isLiked?: boolean; // 추후 좋아요 API 연동 시 사용
}

export function PostCard({ post, isLiked = false }: PostCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  // 캡션이 2줄을 초과하는지 확인 (대략적인 계산)
  const captionLines = post.caption
    ? Math.ceil(post.caption.length / 50)
    : 0;
  const shouldTruncate = captionLines > 2;

  // 좋아요 버튼 클릭 핸들러 (추후 API 연동)
  const handleLikeClick = () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    // TODO: API 호출하여 좋아요 상태 업데이트
  };

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

      {/* 이미지 영역 (1:1 정사각형) */}
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

      {/* 액션 버튼 영역 (48px) */}
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <button
            onClick={handleLikeClick}
            className="hover:opacity-70 transition-opacity"
            aria-label="좋아요"
          >
            <Heart
              size={24}
              className={liked ? "fill-current" : ""}
              style={{
                color: liked
                  ? "var(--color-instagram-like)"
                  : "var(--color-instagram-text-primary)",
              }}
            />
          </button>
          {/* 댓글 버튼 */}
          <Link
            href={`/post/${post.post_id}`}
            className="hover:opacity-70 transition-opacity"
            aria-label="댓글"
          >
            <MessageCircle
              size={24}
              style={{ color: 'var(--color-instagram-text-primary)' }}
            />
          </Link>
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
      {likesCount > 0 && (
        <div className="px-4 pb-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-instagram-text-primary)' }}>
            좋아요 {likesCount.toLocaleString()}개
          </p>
        </div>
      )}

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
      {post.comments_count > 0 && (
        <div className="px-4 pb-4">
          {post.comments_count > 2 && (
            <Link
              href={`/post/${post.post_id}`}
              className="text-sm mb-2 block hover:opacity-70"
              style={{ color: 'var(--color-instagram-text-secondary)' }}
            >
              댓글 {post.comments_count}개 모두 보기
            </Link>
          )}
          {post.comments.slice(0, 2).map((comment) => (
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
    </article>
  );
}

