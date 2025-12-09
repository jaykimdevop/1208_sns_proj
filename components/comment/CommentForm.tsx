"use client";

/**
 * @file CommentForm.tsx
 * @description 댓글 입력 폼 컴포넌트
 *
 * Instagram 스타일의 댓글 입력 폼을 제공합니다.
 *
 * 주요 기능:
 * 1. 댓글 입력 필드 (placeholder: "댓글 달기...")
 * 2. "게시" 버튼 (텍스트가 있을 때만 활성화)
 * 3. Enter 키로 제출 (Shift+Enter는 줄바꿈 없이 무시)
 * 4. Optimistic UI 업데이트
 *
 * @dependencies
 * - lib/types: CommentWithUser, CreateCommentResponse
 */

import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { Loader2 } from "lucide-react";
import type { CommentWithUser, CreateCommentResponse } from "@/lib/types";

interface CommentFormProps {
  postId: string;
  onCommentAdded: (comment: CommentWithUser) => void;
}

export interface CommentFormRef {
  focus: () => void;
}

export const CommentForm = forwardRef<CommentFormRef, CommentFormProps>(
  ({ postId, onCommentAdded }, ref) => {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 외부에서 포커스할 수 있도록 ref 노출
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
        // 부드럽게 스크롤하여 입력창이 보이도록
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      },
    }));

    const handleSubmit = useCallback(async () => {
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
          }),
        });

        const data: CreateCommentResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "댓글 작성에 실패했습니다.");
        }

        if (data.comment) {
          onCommentAdded(data.comment);
          setContent("");
          inputRef.current?.focus();
        }
      } catch (err) {
        console.error("Error creating comment:", err);
        setError(err instanceof Error ? err.message : "댓글 작성에 실패했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    }, [content, isSubmitting, postId, onCommentAdded]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      },
      [handleSubmit]
    );

    const hasContent = content.trim().length > 0;

    return (
      <div
        ref={containerRef}
        className="flex items-center gap-2 px-4 py-3 border-t"
        style={{ borderColor: "var(--color-instagram-border)" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="댓글 달기..."
          disabled={isSubmitting}
          className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-gray-400 disabled:opacity-50"
          style={{ color: "var(--color-instagram-text-primary)" }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasContent || isSubmitting}
          className="text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          style={{
            color: hasContent
              ? "var(--color-instagram-primary)"
              : "var(--color-instagram-text-secondary)",
          }}
        >
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            "게시"
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
    );
  }
);

CommentForm.displayName = "CommentForm";

