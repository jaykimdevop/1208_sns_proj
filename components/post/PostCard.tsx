"use client";

/**
 * @file PostCard.tsx
 * @description 게시물 카드 컴포넌트
 *
 * Instagram 스타일의 게시물 카드를 표시합니다.
 * 헤더, 이미지, 액션 버튼, 좋아요 수, 캡션, 댓글 미리보기, 댓글 입력을 포함합니다.
 * 이미지 클릭 시 Desktop에서는 PostModal, Mobile에서는 상세 페이지로 이동합니다.
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - lib/utils/formatRelativeTime: 상대 시간 표시
 * - lib/types: PostWithStats, CommentWithUser
 * - next/image: 이미지 최적화
 * - components/post/LikeButton: 좋아요 버튼
 * - components/post/DoubleTapHeart: 더블탭 좋아요
 * - components/comment/CommentForm: 댓글 입력 폼
 * - components/post/post-modal: 게시물 상세 모달 (Desktop)
 * - hooks/use-media-query: 미디어 쿼리 훅
 */

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  MessageCircle,
  Send,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import { LikeButton, LikeCount } from "@/components/post/LikeButton";
import { DoubleTapHeart } from "@/components/post/DoubleTapHeart";
import { CommentForm, type CommentFormRef } from "@/components/comment/CommentForm";
import { PostModal } from "@/components/post/post-modal";
import { checkMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PostWithStats, CommentWithUser, LikeResponse, BookmarkResponse, DeletePostResponse } from "@/lib/types";

interface PostCardProps {
  post: PostWithStats & {
    comments: CommentWithUser[];
    isLiked: boolean;
    isBookmarked?: boolean;
  };
  onPostDeleted?: (postId: string) => void;
}

export function PostCard({ post, onPostDeleted }: PostCardProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [comments, setComments] = useState<CommentWithUser[]>(post.comments || []);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked || false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const commentFormRef = useRef<CommentFormRef>(null);

  // 본인 게시물인지 확인
  const isOwnPost = user?.id === post.user?.clerk_id;

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
  const handleShareClick = useCallback(async () => {
    // Clerk이 로드되지 않았으면 무시
    if (!isLoaded) return;
    // 로그인되지 않았으면 로그인 페이지로 이동
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    const url = `${window.location.origin}/post/${post.post_id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("링크가 복사되었습니다");
    } catch (error) {
      console.error("Failed to copy URL:", error);
      toast.error("링크 복사에 실패했습니다");
    }
  }, [isLoaded, isSignedIn, router, post.post_id]);

  // 북마크 버튼 클릭 핸들러
  const handleBookmarkClick = useCallback(async () => {
    // Clerk이 로드되지 않았으면 무시
    if (!isLoaded) return;
    // 로그인되지 않았으면 로그인 페이지로 이동
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    // 이미 로딩 중이면 무시
    if (isBookmarkLoading) return;

    // Optimistic UI 업데이트
    const prevBookmarked = bookmarked;
    setBookmarked(!bookmarked);
    setIsBookmarkLoading(true);

    try {
      const response = await fetch("/api/bookmarks", {
        method: bookmarked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id: post.post_id }),
      });

      const data: BookmarkResponse = await response.json();

      if (!data.success) {
        // API 실패 시 롤백
        setBookmarked(prevBookmarked);
        toast.error(data.error || "북마크 처리에 실패했습니다");
      } else {
        toast.success(data.isBookmarked ? "게시물을 저장했습니다" : "저장 목록에서 삭제했습니다");
      }
    } catch (error) {
      // 네트워크 에러 시 롤백
      setBookmarked(prevBookmarked);
      toast.error("북마크 처리에 실패했습니다");
      console.error("Bookmark request failed:", error);
    } finally {
      setIsBookmarkLoading(false);
    }
  }, [isLoaded, isSignedIn, router, bookmarked, isBookmarkLoading, post.post_id]);

  // 게시물 상세 열기 핸들러 (Desktop: 모달, Mobile: 라우트 이동)
  const handleOpenDetail = useCallback(() => {
    // 클릭 시점에 미디어 쿼리 확인 (hydration 문제 방지)
    const isDesktopNow = checkMediaQuery("(min-width: 768px)");
    if (isDesktopNow) {
      setIsModalOpen(true);
    } else {
      router.push(`/post/${post.post_id}`);
    }
  }, [router, post.post_id]);

  // 게시물 삭제 핸들러
  const handleDeletePost = useCallback(async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${post.post_id}`, {
        method: "DELETE",
      });

      const data: DeletePostResponse = await response.json();

      if (data.success) {
        toast.success("게시물이 삭제되었습니다");
        setIsDeleteDialogOpen(false);
        // 부모 컴포넌트에 삭제 알림
        onPostDeleted?.(post.post_id);
        // 홈으로 이동 (프로필 페이지에서 삭제한 경우)
        router.refresh();
      } else {
        toast.error(data.error || "게시물 삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("게시물 삭제 실패:", error);
      toast.error("게시물 삭제에 실패했습니다");
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, post.post_id, onPostDeleted, router]);

  // 현재 게시물 데이터 (모달에 전달용)
  const currentPostData = {
    ...post,
    isLiked: liked,
    likes_count: likesCount,
    comments_count: commentsCount,
    comments,
  };

  return (
    <>
    {/* PostModal (Desktop 전용) */}
    <PostModal
      post={currentPostData}
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
    />

    {/* 삭제 확인 다이얼로그 */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>게시물을 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            이 작업은 되돌릴 수 없습니다. 게시물과 관련된 모든 댓글, 좋아요가 함께 삭제됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeletePost}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                삭제 중...
              </>
            ) : (
              "삭제"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 hover:opacity-70 transition-opacity"
              aria-label="더보기"
            >
              <MoreHorizontal
                size={20}
                style={{ color: 'var(--color-instagram-text-primary)' }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwnPost && (
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500 cursor-pointer"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            )}
            {!isOwnPost && (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleShareClick}
              >
                <Send className="mr-2 h-4 w-4" />
                공유
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* 이미지 영역 (1:1 정사각형) - 더블탭 좋아요, 클릭 시 상세 열기 */}
      <DoubleTapHeart onDoubleTap={handleDoubleTap}>
        <div
          className="w-full aspect-square relative bg-gray-100 cursor-pointer"
          onClick={handleOpenDetail}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleOpenDetail()}
        >
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
          onClick={handleBookmarkClick}
          className="hover:opacity-70 transition-opacity disabled:opacity-50"
          aria-label={bookmarked ? "저장 취소" : "저장"}
          disabled={isBookmarkLoading}
        >
          {bookmarked ? (
            <BookmarkCheck
              size={24}
              style={{ color: 'var(--color-instagram-text-primary)' }}
              fill="currentColor"
            />
          ) : (
            <Bookmark
              size={24}
              style={{ color: 'var(--color-instagram-text-primary)' }}
            />
          )}
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
            <button
              onClick={handleOpenDetail}
              className="text-sm mb-2 block hover:opacity-70 text-left"
              style={{ color: 'var(--color-instagram-text-secondary)' }}
            >
              댓글 {commentsCount}개 모두 보기
            </button>
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
    </>
  );
}
