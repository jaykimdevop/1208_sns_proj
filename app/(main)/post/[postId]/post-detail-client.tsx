"use client";

/**
 * @file post-detail-client.tsx
 * @description 게시물 상세 클라이언트 컴포넌트
 *
 * Mobile에서 게시물 상세를 전체 페이지로 표시하는 클라이언트 컴포넌트입니다.
 *
 * @dependencies
 * - components/comment/comment-list: 전체 댓글 목록
 * - components/comment/CommentForm: 댓글 입력 폼
 * - components/post/LikeButton: 좋아요 버튼
 */

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { CommentList } from "@/components/comment/comment-list";
import { CommentForm, type CommentFormRef } from "@/components/comment/CommentForm";
import { LikeButton, LikeCount } from "@/components/post/LikeButton";
import { DoubleTapHeart } from "@/components/post/DoubleTapHeart";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import type { PostWithStats, CommentWithUser, LikeResponse } from "@/lib/types";

interface PostDetailClientProps {
  post: PostWithStats & {
    comments: CommentWithUser[];
    isLiked: boolean;
  };
}

export function PostDetailClient({ post }: PostDetailClientProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [comments, setComments] = useState<CommentWithUser[]>(post.comments || []);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [replyTo, setReplyTo] = useState<CommentWithUser | null>(null);
  const commentFormRef = useRef<CommentFormRef>(null);

  // 좋아요 상태 변경 핸들러
  const handleLikeChange = useCallback((newLiked: boolean, newCount: number) => {
    setLiked(newLiked);
    setLikesCount(newCount);
  }, []);

  // 새 댓글 추가 핸들러
  const handleCommentAdded = useCallback((newComment: CommentWithUser) => {
    setComments((prev) => [...prev, newComment]);
    setCommentsCount((prev) => prev + 1);
    setReplyTo(null);
  }, []);

  // 댓글 삭제 핸들러
  const handleCommentDeleted = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsCount((prev) => Math.max(0, prev - 1));
  }, []);

  // 답글 달기 클릭 핸들러
  const handleReplyClick = useCallback((comment: CommentWithUser) => {
    setReplyTo(comment);
    commentFormRef.current?.focus();
  }, []);

  // 답글 취소 핸들러
  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  // 댓글 버튼 클릭 핸들러
  const handleCommentClick = useCallback(() => {
    commentFormRef.current?.focus();
  }, []);

  // 공유 버튼 클릭 핸들러
  const handleShareClick = async () => {
    const url = `${window.location.origin}/post/${post.post_id}`;
    try {
      await navigator.clipboard.writeText(url);
      // TODO: 토스트 메시지 표시
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  // 더블탭 좋아요 핸들러
  const handleDoubleTap = useCallback(async () => {
    if (liked) return;

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
        setLiked(false);
        setLikesCount((prev) => prev - 1);
        console.error("Like API error:", data.error);
      }
    } catch (error) {
      setLiked(false);
      setLikesCount((prev) => prev - 1);
      console.error("Like request failed:", error);
    }
  }, [liked, post.post_id]);

  // 뒤로가기 핸들러
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <header
        className="sticky top-0 z-10 bg-white border-b h-[50px] flex items-center px-4"
        style={{ borderColor: "var(--color-instagram-border)" }}
      >
        <button
          onClick={handleBack}
          className="p-1 hover:opacity-70 transition-opacity"
          aria-label="뒤로가기"
        >
          <ArrowLeft
            size={24}
            style={{ color: "var(--color-instagram-text-primary)" }}
          />
        </button>
        <div className="flex-1 flex justify-center">
          <span
            className="font-semibold"
            style={{ color: "var(--color-instagram-text-primary)" }}
          >
            게시물
          </span>
        </div>
        <div className="w-6" /> {/* 균형을 위한 빈 공간 */}
      </header>

      {/* 게시물 작성자 정보 */}
      <div
        className="flex items-center justify-between px-4 h-[50px] border-b"
        style={{ borderColor: "var(--color-instagram-border)" }}
      >
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 */}
          <Link href={`/profile/${post.user_id}`}>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {post.user?.name ? (
                <span
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-instagram-text-primary)" }}
                >
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
            style={{ color: "var(--color-instagram-text-primary)" }}
          >
            {post.user?.name || "Unknown"}
          </Link>
        </div>
        {/* 메뉴 버튼 */}
        <button
          className="p-1 hover:opacity-70 transition-opacity"
          aria-label="더보기"
        >
          <MoreHorizontal
            size={20}
            style={{ color: "var(--color-instagram-text-primary)" }}
          />
        </button>
      </div>

      {/* 이미지 영역 */}
      <DoubleTapHeart onDoubleTap={handleDoubleTap}>
        <div className="w-full aspect-square relative bg-gray-100">
          <Image
            src={post.image_url}
            alt={post.caption || "게시물 이미지"}
            fill
            className="object-cover"
            sizes="100vw"
            priority
              onError={(e) => {
                // 이미지 로드 실패 시 fallback 처리
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                // 향후 기본 이미지 fallback 추가 예정
              }}
          />
        </div>
      </DoubleTapHeart>

      {/* 액션 버튼 영역 */}
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
              style={{ color: "var(--color-instagram-text-primary)" }}
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
              style={{ color: "var(--color-instagram-text-primary)" }}
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
            style={{ color: "var(--color-instagram-text-primary)" }}
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
          <p
            className="text-sm"
            style={{ color: "var(--color-instagram-text-primary)" }}
          >
            <Link
              href={`/profile/${post.user_id}`}
              className="font-semibold mr-2 hover:opacity-70"
            >
              {post.user?.name || "Unknown"}
            </Link>
            <span>{post.caption}</span>
          </p>
        </div>
      )}

      {/* 게시 시간 */}
      <div className="px-4 pb-4">
        <span
          className="text-xs uppercase"
          style={{ color: "var(--color-instagram-text-secondary)" }}
        >
          {formatRelativeTime(post.created_at)}
        </span>
      </div>

      {/* 댓글 섹션 */}
      <div
        className="border-t flex-1"
        style={{ borderColor: "var(--color-instagram-border)" }}
      >
        <div className="px-4 py-3">
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--color-instagram-text-primary)" }}
          >
            댓글 {commentsCount}개
          </span>
        </div>

        {/* 댓글 목록 */}
        <CommentList
          comments={comments}
          onCommentDeleted={handleCommentDeleted}
          onReplyClick={handleReplyClick}
        />
      </div>

      {/* 댓글 입력 폼 (하단 고정) */}
      <div
        className="sticky bottom-0 bg-white border-t"
        style={{ borderColor: "var(--color-instagram-border)" }}
      >
        <CommentForm
          ref={commentFormRef}
          postId={post.post_id}
          onCommentAdded={handleCommentAdded}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
        />
      </div>
    </div>
  );
}

