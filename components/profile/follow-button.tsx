"use client";

/**
 * @file follow-button.tsx
 * @description Instagram 스타일 팔로우 버튼 컴포넌트
 *
 * 팔로우/언팔로우 기능을 제공하는 버튼입니다.
 * - 미팔로우: 파란색 "팔로우" 버튼
 * - 팔로우 중: 회색 테두리 "팔로잉" 버튼
 * - Hover (팔로우 중): 빨간색 테두리 "언팔로우" 텍스트
 *
 * @dependencies
 * - components/ui/button: 버튼 컴포넌트
 * - lib/types: FollowResponse
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { handleApiError, handleFetchError, getUserFriendlyMessage } from "@/lib/utils/error-handler";
import { toast } from "sonner";
import type { FollowResponse } from "@/lib/types";

interface FollowButtonProps {
  userId: string; // 팔로우 대상 사용자 ID
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
}

export function FollowButton({
  userId,
  initialIsFollowing,
  onFollowChange,
  className = "",
}: FollowButtonProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(async () => {
    // 미로그인 시 로그인 페이지로 이동
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (isLoading) return;

    const previousState = isFollowing;
    const newState = !isFollowing;

    // Optimistic UI 업데이트
    setIsFollowing(newState);
    setIsLoading(true);

    try {
      const response = await fetch("/api/follows", {
        method: newState ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ following_id: userId }),
      });

      if (!response.ok) {
        const apiError = await handleApiError(response, "handleClick");
        setIsFollowing(previousState);
        toast.error(getUserFriendlyMessage(apiError, "팔로우"));
        return;
      }

      const data: FollowResponse = await response.json();

      if (!data.success) {
        // 에러 시 롤백
        setIsFollowing(previousState);
        toast.error(data.error || "팔로우 처리에 실패했습니다");
        return;
      }

      // 성공 시 콜백 호출
      onFollowChange?.(data.isFollowing);
    } catch (error) {
      // 네트워크 에러 시 롤백
      const apiError = handleFetchError(error, "handleClick");
      setIsFollowing(previousState);
      toast.error(getUserFriendlyMessage(apiError, "팔로우"));
    } finally {
      setIsLoading(false);
    }
  }, [isFollowing, isLoading, userId, onFollowChange, isSignedIn, router]);

  // 버튼 텍스트 결정
  const getButtonText = () => {
    if (isLoading) {
      return <Loader2 size={16} className="animate-spin" />;
    }
    if (isFollowing) {
      return isHovered ? "언팔로우" : "팔로잉";
    }
    return "팔로우";
  };

  // 버튼 스타일 결정
  const getButtonVariant = (): "default" | "outline" => {
    return isFollowing ? "outline" : "default";
  };

  // 추가 클래스 결정
  const getButtonClassName = () => {
    const baseClasses = "font-semibold min-w-[100px] transition-all sketch-button";
    
    if (isFollowing && isHovered) {
      return `${baseClasses} border-red-500 text-red-500 hover:bg-red-50`;
    }
    
    return baseClasses;
  };

  const getAriaLabel = () => {
    if (isLoading) {
      return isFollowing ? "언팔로우 처리 중" : "팔로우 처리 중";
    }
    if (isFollowing) {
      return isHovered ? "언팔로우" : "팔로잉 중";
    }
    return "팔로우";
  };

  return (
    <Button
      variant={getButtonVariant()}
      size="sm"
      className={`${getButtonClassName()} ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
      aria-label={getAriaLabel()}
      aria-pressed={isFollowing}
      aria-busy={isLoading}
      style={{
        backgroundColor: !isFollowing ? "var(--color-cute-pink)" : undefined,
        borderColor: isFollowing && !isHovered ? "var(--color-cute-border)" : undefined,
      }}
    >
      {getButtonText()}
    </Button>
  );
}

