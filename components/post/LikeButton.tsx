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

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import type { LikeResponse } from "@/lib/types";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (liked: boolean, count: number) => void;
}

export function LikeButton({
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

      const data: LikeResponse = await response.json();

      if (!data.success) {
        // API 실패 시 롤백
        setLiked(previousLiked);
        setCount(previousCount);
        console.error("Like API error:", data.error);
      } else {
        // 성공 시 콜백 호출
        onLikeChange?.(newLiked, newCount);
      }
    } catch (error) {
      // 네트워크 에러 시 롤백
      setLiked(previousLiked);
      setCount(previousCount);
      console.error("Like request failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [liked, count, postId, isLoading, onLikeChange, isSignedIn, router]);

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`hover:opacity-70 transition-opacity ${isAnimating ? "animate-like-bounce" : ""}`}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
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
  );
}

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

