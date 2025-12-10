"use client";

/**
 * @file post-modal.tsx
 * @description 게시물 상세 모달 컴포넌트
 *
 * Desktop에서 게시물 상세를 모달 형식으로 표시합니다.
 * 좌측 이미지(50%) + 우측 댓글 영역(50%) 레이아웃을 사용합니다.
 *
 * 주요 기능:
 * 1. Desktop 모달 레이아웃 (이미지 50% + 댓글 50%)
 * 2. 닫기 버튼 및 이전/다음 게시물 네비게이션
 * 3. 좋아요, 댓글 입력 기능 재사용
 * 4. 전체 댓글 목록 표시
 *
 * @dependencies
 * - components/ui/dialog: 모달 컴포넌트
 * - components/comment/comment-list: 전체 댓글 목록
 * - components/comment/CommentForm: 댓글 입력 폼
 * - components/post/LikeButton: 좋아요 버튼
 * - lib/types: PostWithStats, CommentWithUser
 */

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Send,
  Bookmark,
} from "lucide-react";
import { CommentList } from "@/components/comment/comment-list";
import { CommentForm, type CommentFormRef } from "@/components/comment/CommentForm";
import { LikeButton, LikeCount } from "@/components/post/LikeButton";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import type { PostWithStats, CommentWithUser, ThreadedCommentsResponse } from "@/lib/types";

interface PostModalProps {
  post: PostWithStats & {
    comments: CommentWithUser[];
    isLiked: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function PostModal({
  post,
  open,
  onOpenChange,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: PostModalProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [comments, setComments] = useState<CommentWithUser[]>(post.comments || []);
  const [replyTo, setReplyTo] = useState<CommentWithUser | null>(null);
  const commentFormRef = useRef<CommentFormRef>(null);

  // 모달이 열릴 때 전체 댓글을 API로 가져오기
  useEffect(() => {
    if (!open) return;

    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/comments?post_id=${post.post_id}`);
        const data: ThreadedCommentsResponse = await response.json();
        
        if (data.success && data.data) {
          // Thread 형식 데이터를 플랫 배열로 변환 (CommentList가 자동으로 Thread로 변환)
          const flatComments: CommentWithUser[] = [];
          for (const rootComment of data.data) {
            flatComments.push(rootComment);
            if (rootComment.replies) {
              flatComments.push(...rootComment.replies);
            }
          }
          setComments(flatComments);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching comments:", error);
        }
      }
    };

    fetchComments();
  }, [open, post.post_id]);

  // 게시물이 변경되면 상태 초기화
  useEffect(() => {
    setLiked(post.isLiked);
    setLikesCount(post.likes_count || 0);
    setReplyTo(null);
  }, [post]);

  // 좋아요 상태 변경 핸들러
  const handleLikeChange = useCallback((newLiked: boolean, newCount: number) => {
    setLiked(newLiked);
    setLikesCount(newCount);
  }, []);

  // 새 댓글 추가 핸들러
  const handleCommentAdded = useCallback((newComment: CommentWithUser) => {
    setComments((prev) => [...prev, newComment]);
    setReplyTo(null);
  }, []);

  // 댓글 삭제 핸들러
  const handleCommentDeleted = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
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
      // 토스트는 PostCard에서 이미 구현됨
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to copy URL:", error);
      }
    }
  };

  // 키보드 네비게이션
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasPrevious, hasNext, onPrevious, onNext]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[calc(100vw-80px)] max-h-[calc(100vh-80px)] w-full h-full p-0 overflow-hidden bg-white"
        style={{ maxWidth: "1200px", aspectRatio: "16/10" }}
        hideCloseButton
      >
        {/* 접근성을 위한 숨겨진 타이틀 */}
        <VisuallyHidden>
          <DialogTitle>게시물 상세</DialogTitle>
        </VisuallyHidden>

        {/* 닫기 버튼 (모달 내부 우측 상단) */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-50"
          aria-label="닫기"
        >
          <X size={20} />
        </button>

        {/* 이전 게시물 버튼 */}
        {hasPrevious && onPrevious && (
          <button
            onClick={onPrevious}
            className="absolute left-[-60px] top-1/2 -translate-y-1/2 p-2 text-white hover:opacity-70 transition-opacity z-50"
            aria-label="이전 게시물"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        {/* 다음 게시물 버튼 */}
        {hasNext && onNext && (
          <button
            onClick={onNext}
            className="absolute right-[-60px] top-1/2 -translate-y-1/2 p-2 text-white hover:opacity-70 transition-opacity z-50"
            aria-label="다음 게시물"
          >
            <ChevronRight size={32} />
          </button>
        )}

        <div className="flex h-full">
          {/* 좌측: 이미지 영역 (50%) */}
          <div className="w-1/2 bg-black flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src={post.image_url}
                alt={post.caption || "게시물 이미지"}
                fill
                className="object-contain"
                sizes="50vw"
                priority
                  onError={(e) => {
                    // 이미지 로드 실패 시 fallback 처리
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    // 향후 기본 이미지 fallback 추가 예정
                  }}
              />
            </div>
          </div>

          {/* 우측: 댓글 영역 (50%) */}
          <div className="w-1/2 flex flex-col h-full">
            {/* 헤더 */}
            <header
              className="flex items-center justify-between px-4 h-[60px] border-b flex-shrink-0"
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
            </header>

            {/* 캡션 + 댓글 목록 (스크롤 영역) */}
            <div className="flex-1 overflow-y-auto">
              {/* 캡션 */}
              {post.caption && (
                <div className="flex items-start gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--color-instagram-border)" }}>
                  <Link href={`/profile/${post.user_id}`}>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      {post.user?.name ? (
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "var(--color-instagram-text-primary)" }}
                        >
                          {post.user.name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <div className="w-full h-full bg-gray-300 rounded-full" />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm break-words"
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
                    <span
                      className="text-xs mt-1 block"
                      style={{ color: "var(--color-instagram-text-secondary)" }}
                    >
                      {formatRelativeTime(post.created_at)}
                    </span>
                  </div>
                </div>
              )}

              {/* 댓글 목록 */}
              <CommentList
                comments={comments}
                onCommentDeleted={handleCommentDeleted}
                onReplyClick={handleReplyClick}
              />
            </div>

            {/* 액션 버튼 영역 */}
            <div
              className="border-t flex-shrink-0"
              style={{ borderColor: "var(--color-instagram-border)" }}
            >
              {/* 버튼 그룹 */}
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

              {/* 게시 시간 */}
              <div className="px-4 pb-2">
                <span
                  className="text-xs uppercase"
                  style={{ color: "var(--color-instagram-text-secondary)" }}
                >
                  {formatRelativeTime(post.created_at)}
                </span>
              </div>
            </div>

            {/* 댓글 입력 폼 */}
            <CommentForm
              ref={commentFormRef}
              postId={post.post_id}
              onCommentAdded={handleCommentAdded}
              replyTo={replyTo}
              onCancelReply={handleCancelReply}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

