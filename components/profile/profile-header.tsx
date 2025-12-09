"use client";

/**
 * @file profile-header.tsx
 * @description Instagram 스타일 프로필 헤더 컴포넌트
 *
 * 사용자 프로필 정보와 통계를 표시합니다.
 * - 프로필 이미지 (이니셜 아바타)
 * - 사용자명
 * - 통계: 게시물 수, 팔로워 수, 팔로잉 수
 * - 팔로우/프로필 편집 버튼
 *
 * @dependencies
 * - lib/types: UserStats
 */

import { Button } from "@/components/ui/button";
import type { UserStats } from "@/lib/types";

interface ProfileHeaderProps {
  user: UserStats;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollowClick?: () => void;
}

export function ProfileHeader({
  user,
  isOwnProfile,
  isFollowing,
  onFollowClick,
}: ProfileHeaderProps) {
  // 숫자 포맷팅 (1000 -> 1K, 1000000 -> 1M)
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <header className="px-4 py-6 md:px-8 md:py-10">
      <div className="flex items-start gap-6 md:gap-16 max-w-4xl mx-auto">
        {/* 프로필 이미지 */}
        <div className="flex-shrink-0">
          <div
            className="w-[90px] h-[90px] md:w-[150px] md:h-[150px] rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--color-instagram-border)" }}
          >
            <span
              className="text-3xl md:text-5xl font-semibold"
              style={{ color: "var(--color-instagram-text-primary)" }}
            >
              {user.name?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
        </div>

        {/* 프로필 정보 */}
        <div className="flex-1 min-w-0">
          {/* 사용자명 + 버튼 */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-4 md:mb-6">
            <h1
              className="text-xl md:text-2xl font-normal truncate"
              style={{ color: "var(--color-instagram-text-primary)" }}
            >
              {user.name}
            </h1>

            {/* 버튼 영역 */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                // 본인 프로필: 프로필 편집 버튼 (1차에서는 비활성화)
                <Button
                  variant="outline"
                  size="sm"
                  className="font-semibold"
                  disabled
                >
                  프로필 편집
                </Button>
              ) : (
                // 타인 프로필: 팔로우/팔로잉 버튼
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className={`font-semibold min-w-[100px] ${
                    isFollowing
                      ? "hover:bg-red-50 hover:text-red-500 hover:border-red-500"
                      : ""
                  }`}
                  onClick={onFollowClick}
                >
                  {isFollowing ? "팔로잉" : "팔로우"}
                </Button>
              )}
            </div>
          </div>

          {/* 통계 (Desktop) */}
          <div className="hidden md:flex gap-10 mb-4">
            <div className="flex gap-1">
              <span
                className="font-semibold"
                style={{ color: "var(--color-instagram-text-primary)" }}
              >
                {formatCount(user.posts_count)}
              </span>
              <span style={{ color: "var(--color-instagram-text-primary)" }}>
                게시물
              </span>
            </div>
            <button className="flex gap-1 hover:opacity-70 transition-opacity">
              <span
                className="font-semibold"
                style={{ color: "var(--color-instagram-text-primary)" }}
              >
                {formatCount(user.followers_count)}
              </span>
              <span style={{ color: "var(--color-instagram-text-primary)" }}>
                팔로워
              </span>
            </button>
            <button className="flex gap-1 hover:opacity-70 transition-opacity">
              <span
                className="font-semibold"
                style={{ color: "var(--color-instagram-text-primary)" }}
              >
                {formatCount(user.following_count)}
              </span>
              <span style={{ color: "var(--color-instagram-text-primary)" }}>
                팔로잉
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 통계 (Mobile) */}
      <div
        className="flex md:hidden justify-around py-4 mt-4 border-t"
        style={{ borderColor: "var(--color-instagram-border)" }}
      >
        <div className="flex flex-col items-center">
          <span
            className="font-semibold"
            style={{ color: "var(--color-instagram-text-primary)" }}
          >
            {formatCount(user.posts_count)}
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--color-instagram-text-secondary)" }}
          >
            게시물
          </span>
        </div>
        <button className="flex flex-col items-center hover:opacity-70 transition-opacity">
          <span
            className="font-semibold"
            style={{ color: "var(--color-instagram-text-primary)" }}
          >
            {formatCount(user.followers_count)}
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--color-instagram-text-secondary)" }}
          >
            팔로워
          </span>
        </button>
        <button className="flex flex-col items-center hover:opacity-70 transition-opacity">
          <span
            className="font-semibold"
            style={{ color: "var(--color-instagram-text-primary)" }}
          >
            {formatCount(user.following_count)}
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--color-instagram-text-secondary)" }}
          >
            팔로잉
          </span>
        </button>
      </div>
    </header>
  );
}

