"use client";

/**
 * @file LikeButton.tsx
 * @description 좋아요 버튼 컴포넌트
 *
 * Instagram 스타일의 좋아요 버튼을 제공합니다.
 * - 빈 하트 ↔ 빨간 하트 상태 관리
 * - Optimistic UI 업데이트
 * - 클릭 애니메이션 (scale 1.3 → 1, 0.15초)
 * - API 실패 시 롤백
 *
 * @dependencies
 * - lucide-react: Heart 아이콘
 * - lib/types: LikeResponse
 */

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import { handleApiError, handleFetchError, getUserFriendlyMessage } from "@/lib/utils/error-handler";
import { toast } from "sonner";
import type { LikeResponse } from "@/lib/types";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (liked: boolean, count: number) => void;
}

function LikeButtonComponent({
  postId,
  initialLiked,
  initialCount,
  onLikeChange,
}: LikeButtonProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    // 미로그인 시 로그인 페이지로 이동
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (isLoading) return;

    // Optimistic UI 업데이트
    const previousLiked = liked;
    const previousCount = count;
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : count - 1;

    setLiked(newLiked);
    setCount(newCount);
    setIsAnimating(true);
    setIsLoading(true);

    // 애니메이션 종료 후 상태 리셋
    setTimeout(() => setIsAnimating(false), 150);

    try {
      const response = await fetch("/api/likes", {
        method: newLiked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id: postId }),
      });

      if (!response.ok) {
        const apiError = await handleApiError(response, "handleClick");
        setLiked(previousLiked);
        setCount(previousCount);
        toast.error(getUserFriendlyMessage(apiError, "좋아요"));
        return;
      }

      const data: LikeResponse = await response.json();

      if (!data.success) {
        // API 실패 시 롤백
        setLiked(previousLiked);
        setCount(previousCount);
        toast.error(data.error || "좋아요 처리에 실패했습니다");
      } else {
        // 성공 시 콜백 호출
        onLikeChange?.(newLiked, newCount);
      }
    } catch (error) {
      // 네트워크 에러 시 롤백
      const apiError = handleFetchError(error, "handleClick");
      setLiked(previousLiked);
      setCount(previousCount);
      toast.error(getUserFriendlyMessage(apiError, "좋아요"));
    } finally {
      setIsLoading(false);
    }
  }, [liked, count, postId, isLoading, onLikeChange, isSignedIn, router]);

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`hover-scale heart-pulse transition-all ${isAnimating ? "animate-like-bounce" : ""}`}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
      aria-pressed={liked}
      aria-busy={isLoading}
    >
      <Heart
        size={24}
        className={`${liked ? "fill-current" : ""} transition-transform`}
        style={{
          color: liked
            ? "var(--color-instagram-like)"
            : "var(--color-instagram-text-primary)",
        }}
      />
    </button>
  );
}

// React.memo로 메모이제이션
export const LikeButton = memo(LikeButtonComponent, (prevProps, nextProps) => {
  return (
    prevProps.postId === nextProps.postId &&
    prevProps.initialLiked === nextProps.initialLiked &&
    prevProps.initialCount === nextProps.initialCount &&
    prevProps.onLikeChange === nextProps.onLikeChange
  );
});

/**
 * 좋아요 수 표시 컴포넌트
 */
interface LikeCountProps {
  count: number;
}

export function LikeCount({ count }: LikeCountProps) {
  if (count <= 0) return null;

  return (
    <p
      className="text-sm font-semibold"
      style={{ color: "var(--color-instagram-text-primary)" }}
    >
      좋아요 {count.toLocaleString()}개
    </p>
  );
}

