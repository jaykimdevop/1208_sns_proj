"use client";

/**
 * @file comment-list.tsx
 * @description Thread 형식 댓글 목록 컴포넌트
 *
 * 게시물 상세 모달/페이지에서 전체 댓글을 Thread 형식으로 표시합니다.
 * - 루트 댓글: 최신순 정렬
 * - 답글: 접기/펼치기 가능, 오래된 순 정렬
 * - 본인 댓글에만 삭제 버튼 표시
 *
 * 주요 기능:
 * 1. Thread 형식 댓글 렌더링 (루트 댓글 + 답글)
 * 2. 답글 접기/펼치기 토글
 * 3. 답글 달기 버튼
 * 4. 본인 댓글에만 삭제 버튼 표시
 * 5. 삭제 확인 다이얼로그
 *
 * @dependencies
 * - @clerk/nextjs: useUser 훅
 * - components/ui/alert-dialog: 삭제 확인 다이얼로그
 * - lib/types: CommentWithUser, CommentWithReplies, DeleteCommentResponse
 * - lib/utils/formatRelativeTime: 상대 시간 표시
 */

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
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
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import type { CommentWithUser, CommentWithReplies, DeleteCommentResponse } from "@/lib/types";

interface CommentListProps {
  comments: CommentWithUser[] | CommentWithReplies[];
  onCommentDeleted?: (commentId: string) => void;
  onReplyClick?: (parentComment: CommentWithUser) => void;
}

// 댓글이 Thread 형식인지 확인하는 타입 가드
function isCommentWithReplies(comment: CommentWithUser | CommentWithReplies): comment is CommentWithReplies {
  return "replies" in comment && Array.isArray(comment.replies);
}

// 플랫 댓글 배열을 Thread 형식으로 변환
function convertToThreaded(comments: CommentWithUser[]): CommentWithReplies[] {
  const rootComments: CommentWithUser[] = [];
  const repliesMap = new Map<string, CommentWithUser[]>();

  // 루트 댓글과 답글 분리
  for (const comment of comments) {
    if (comment.parent_id === null) {
      rootComments.push(comment);
    } else {
      const replies = repliesMap.get(comment.parent_id) || [];
      replies.push(comment);
      repliesMap.set(comment.parent_id, replies);
    }
  }

  // 루트 댓글을 최신순으로 정렬
  rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Thread 형식으로 변환
  return rootComments.map((rootComment) => {
    const replies = repliesMap.get(rootComment.id) || [];
    // 답글은 오래된 순으로 정렬
    replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return {
      ...rootComment,
      replies,
      replies_count: replies.length,
    };
  });
}

export function CommentList({ comments, onCommentDeleted, onReplyClick }: CommentListProps) {
  const { user } = useUser();
  const [threadedComments, setThreadedComments] = useState<CommentWithReplies[]>([]);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<CommentWithUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // comments prop이 변경되면 Thread 형식으로 변환
  useEffect(() => {
    if (comments.length === 0) {
      setThreadedComments([]);
      return;
    }

    // 이미 Thread 형식인지 확인
    if (isCommentWithReplies(comments[0])) {
      setThreadedComments(comments as CommentWithReplies[]);
    } else {
      // 플랫 배열을 Thread 형식으로 변환
      const threaded = convertToThreaded(comments as CommentWithUser[]);
      setThreadedComments(threaded);
    }
  }, [comments]);

  // 답글 펼치기/접기 토글
  const toggleReplies = useCallback((commentId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  // 댓글 삭제 핸들러
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      const response = await fetch("/api/comments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment_id: deleteTarget.id }),
      });

      const data: DeleteCommentResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "댓글 삭제에 실패했습니다.");
      }

      // 로컬 상태에서 댓글 제거
      setThreadedComments((prev) => {
        // 루트 댓글인 경우
        if (deleteTarget.parent_id === null) {
          return prev.filter((c) => c.id !== deleteTarget.id);
        }

        // 답글인 경우
        return prev.map((rootComment) => {
          if (rootComment.id === deleteTarget.parent_id) {
            return {
              ...rootComment,
              replies: rootComment.replies.filter((r) => r.id !== deleteTarget.id),
              replies_count: rootComment.replies_count - 1,
            };
          }
          return rootComment;
        });
      });

      // 부모 컴포넌트에 알림
      onCommentDeleted?.(deleteTarget.id);
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, onCommentDeleted]);

  // 삭제 다이얼로그 열기
  const openDeleteDialog = useCallback((comment: CommentWithUser) => {
    setDeleteTarget(comment);
  }, []);

  // 삭제 다이얼로그 닫기
  const closeDeleteDialog = useCallback(() => {
    if (!isDeleting) {
      setDeleteTarget(null);
    }
  }, [isDeleting]);

  // 본인 댓글인지 확인
  const isOwnComment = useCallback(
    (comment: CommentWithUser) => {
      if (!user) return false;
      return comment.user?.clerk_id === user.id;
    },
    [user]
  );

  // 답글 달기 클릭 핸들러
  const handleReplyClick = useCallback(
    (comment: CommentWithUser) => {
      onReplyClick?.(comment);
    },
    [onReplyClick]
  );

  // 단일 댓글 아이템 렌더링
  const renderCommentItem = (comment: CommentWithUser, isReply: boolean = false) => (
    <div
      key={comment.id}
      className={`flex items-start gap-3 py-3 hover:bg-gray-50 transition-colors ${
        isReply ? "pl-12 pr-4" : "px-4"
      }`}
    >
      {/* 프로필 이미지 */}
      <Link href={`/profile/${comment.user_id}`}>
        <div
          className={`rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 ${
            isReply ? "w-6 h-6" : "w-8 h-8"
          }`}
        >
          {comment.user?.name ? (
            <span
              className={`font-semibold ${isReply ? "text-[10px]" : "text-xs"}`}
              style={{ color: "var(--color-instagram-text-primary)" }}
            >
              {comment.user.name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <div className="w-full h-full bg-gray-300 rounded-full" />
          )}
        </div>
      </Link>

      {/* 댓글 내용 */}
      <div className="flex-1 min-w-0">
        <p
          className={`break-words ${isReply ? "text-xs" : "text-sm"}`}
          style={{ color: "var(--color-instagram-text-primary)" }}
        >
          <Link
            href={`/profile/${comment.user_id}`}
            className="font-semibold mr-2 hover:opacity-70"
          >
            {comment.user?.name || "Unknown"}
          </Link>
          <span>{comment.content}</span>
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span
            className="text-xs"
            style={{ color: "var(--color-instagram-text-secondary)" }}
          >
            {formatRelativeTime(comment.created_at)}
          </span>
          {/* 답글 달기 버튼 (루트 댓글에만 표시) */}
          {!isReply && onReplyClick && (
            <button
              onClick={() => handleReplyClick(comment)}
              className="text-xs font-semibold hover:opacity-70 transition-opacity"
              style={{ color: "var(--color-instagram-text-secondary)" }}
            >
              답글 달기
            </button>
          )}
        </div>
      </div>

      {/* 삭제 버튼 (본인 댓글만) */}
      {isOwnComment(comment) && (
        <button
          onClick={() => openDeleteDialog(comment)}
          className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
          aria-label="댓글 삭제"
        >
          <Trash2
            size={isReply ? 14 : 16}
            style={{ color: "var(--color-instagram-text-secondary)" }}
          />
        </button>
      )}
    </div>
  );

  if (threadedComments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p
          className="text-sm"
          style={{ color: "var(--color-instagram-text-secondary)" }}
        >
          댓글이 없습니다. 첫 댓글을 작성해보세요!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {threadedComments.map((comment) => (
          <div key={comment.id}>
            {/* 루트 댓글 */}
            {renderCommentItem(comment, false)}

            {/* 답글 토글 버튼 */}
            {comment.replies_count > 0 && (
              <div className="pl-12 pr-4 pb-2">
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="flex items-center gap-2 text-xs font-semibold hover:opacity-70 transition-opacity"
                  style={{ color: "var(--color-instagram-text-secondary)" }}
                >
                  <div className="w-6 h-[1px] bg-gray-300" />
                  {expandedComments.has(comment.id) ? (
                    <>
                      <ChevronUp size={14} />
                      답글 숨기기
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      답글 {comment.replies_count}개 보기
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 답글 목록 (펼쳐진 경우에만) */}
            {expandedComments.has(comment.id) && comment.replies.length > 0 && (
              <div className="border-l-2 border-gray-100 ml-6">
                {comment.replies.map((reply) => renderCommentItem(reply, true))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>댓글을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.parent_id === null
                ? "이 댓글을 삭제하면 모든 답글도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
                : "이 작업은 되돌릴 수 없습니다. 댓글이 영구적으로 삭제됩니다."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
