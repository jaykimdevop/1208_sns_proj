"use client";

/**
 * @file CommentForm.tsx
 * @description 댓글/답글 입력 폼 컴포넌트
 *
 * Instagram 스타일의 댓글 입력 폼을 제공합니다.
 * Thread 형식의 답글 작성도 지원합니다.
 *
 * 주요 기능:
 * 1. 댓글 입력 필드 (placeholder: "댓글 달기...")
 * 2. "게시" 버튼 (텍스트가 있을 때만 활성화)
 * 3. Enter 키로 제출 (Shift+Enter는 줄바꿈 없이 무시)
 * 4. 답글 작성 시 @멘션 자동 입력
 * 5. 답글 모드 취소 기능
 * 6. Optimistic UI 업데이트
 *
 * @dependencies
 * - lib/types: CommentWithUser, CreateCommentResponse
 */

import { useState, useCallback, useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2, X } from "lucide-react";
import type { CommentWithUser, CreateCommentResponse } from "@/lib/types";

interface CommentFormProps {
  postId: string;
  onCommentAdded: (comment: CommentWithUser) => void;
  /** 답글 대상 댓글 (답글 모드) */
  replyTo?: CommentWithUser | null;
  /** 답글 모드 취소 핸들러 */
  onCancelReply?: () => void;
}

export interface CommentFormRef {
  focus: () => void;
  /** 답글 모드 설정 (외부에서 호출) */
  setReplyMode: (comment: CommentWithUser) => void;
}

export const CommentForm = forwardRef<CommentFormRef, CommentFormProps>(
  ({ postId, onCommentAdded, replyTo, onCancelReply }, ref) => {
    const router = useRouter();
    const { isSignedIn } = useUser();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [internalReplyTo, setInternalReplyTo] = useState<CommentWithUser | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 실제 사용할 replyTo (props 또는 내부 상태)
    const activeReplyTo = replyTo ?? internalReplyTo;

    // 외부에서 포커스 및 답글 모드 설정 가능하도록 ref 노출
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      },
      setReplyMode: (comment: CommentWithUser) => {
        setInternalReplyTo(comment);
        // @멘션 자동 입력
        const mention = `@${comment.user?.name || "Unknown"} `;
        setContent(mention);
        inputRef.current?.focus();
        // 커서를 멘션 뒤로 이동
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(mention.length, mention.length);
          }
        }, 0);
      },
    }));

    // replyTo prop이 변경되면 @멘션 자동 입력
    useEffect(() => {
      if (replyTo) {
        const mention = `@${replyTo.user?.name || "Unknown"} `;
        setContent(mention);
        inputRef.current?.focus();
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(mention.length, mention.length);
          }
        }, 0);
      }
    }, [replyTo]);

    // 답글 모드 취소
    const handleCancelReply = useCallback(() => {
      setInternalReplyTo(null);
      setContent("");
      onCancelReply?.();
    }, [onCancelReply]);

    const handleSubmit = useCallback(async () => {
      // 미로그인 시 로그인 페이지로 이동
      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      const trimmedContent = content.trim();
      if (!trimmedContent || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch("/api/comments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            post_id: postId,
            content: trimmedContent,
            parent_id: activeReplyTo?.id || null,
          }),
        });

        const data: CreateCommentResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "댓글 작성에 실패했습니다.");
        }

        if (data.comment) {
          onCommentAdded(data.comment);
          setContent("");
          setInternalReplyTo(null);
          onCancelReply?.();
          inputRef.current?.focus();
        }
      } catch (err) {
        console.error("Error creating comment:", err);
        setError(err instanceof Error ? err.message : "댓글 작성에 실패했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    }, [content, isSubmitting, postId, activeReplyTo, onCommentAdded, onCancelReply, isSignedIn, router]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
        // ESC 키로 답글 모드 취소
        if (e.key === "Escape" && activeReplyTo) {
          e.preventDefault();
          handleCancelReply();
        }
      },
      [handleSubmit, activeReplyTo, handleCancelReply]
    );

    const hasContent = content.trim().length > 0;

    return (
      <div ref={containerRef}>
        {/* 답글 모드 표시 */}
        {activeReplyTo && (
          <div
            className="flex items-center justify-between px-4 py-2 bg-gray-50"
            style={{ borderBottom: "1px solid var(--color-instagram-border)" }}
          >
            <span
              className="text-xs"
              style={{ color: "var(--color-instagram-text-secondary)" }}
            >
              <span className="font-semibold" style={{ color: "var(--color-instagram-text-primary)" }}>
                {activeReplyTo.user?.name || "Unknown"}
              </span>
              님에게 답글 남기는 중
            </span>
            <button
              onClick={handleCancelReply}
              className="p-1 hover:opacity-70 transition-opacity"
              aria-label="답글 취소"
            >
              <X size={14} style={{ color: "var(--color-instagram-text-secondary)" }} />
            </button>
          </div>
        )}

        {/* 입력 폼 */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-t"
          style={{ borderColor: "var(--color-instagram-border)" }}
        >
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={() => {
              // 미로그인 시 입력창 클릭하면 로그인 페이지로 이동
              if (!isSignedIn) {
                router.push("/sign-in");
              }
            }}
            placeholder={
              isSignedIn
                ? activeReplyTo
                  ? "답글 달기..."
                  : "댓글 달기..."
                : "로그인하고 댓글을 남겨보세요"
            }
            disabled={isSubmitting}
            readOnly={!isSignedIn}
            className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-gray-400 disabled:opacity-50 cursor-pointer"
            style={{ color: "var(--color-instagram-text-primary)" }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={(!hasContent || isSubmitting) && isSignedIn}
            className="text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            style={{
              color: hasContent || !isSignedIn
                ? "var(--color-instagram-primary)"
                : "var(--color-instagram-text-secondary)",
            }}
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isSignedIn ? (
              "게시"
            ) : (
              "로그인"
            )}
          </button>
          {error && (
            <span
              className="text-xs"
              style={{ color: "var(--color-instagram-like)" }}
            >
              {error}
            </span>
          )}
        </div>
      </div>
    );
  }
);

CommentForm.displayName = "CommentForm";
