"use client";

/**
 * @file user-search-result.tsx
 * @description 사용자 검색 결과 아이템 컴포넌트
 *
 * 검색된 사용자 정보를 표시하고 클릭 시 프로필 페이지로 이동합니다.
 *
 * @dependencies
 * - next/link: 페이지 이동
 * - lib/types: SearchUserResult 타입
 */

import Link from "next/link";
import type { SearchUserResult } from "@/lib/types";

interface UserSearchResultProps {
  user: SearchUserResult;
  onSelect?: () => void;
}

/**
 * 이니셜 아바타 배경색 생성
 */
function getAvatarColor(name: string): string {
  const colors = [
    "var(--color-cute-pink)",
    "var(--color-cute-peach)",
    "var(--color-cute-mint)",
    "var(--color-cute-lavender)",
    "var(--color-cute-sky)",
    "var(--color-cute-yellow)",
    "var(--color-cute-coral)",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

/**
 * 숫자 포맷팅 (1000 -> 1K)
 */
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function UserSearchResult({ user, onSelect }: UserSearchResultProps) {
  const initial = user.name.charAt(0).toUpperCase();
  const avatarColor = getAvatarColor(user.name);

  return (
    <Link
      href={`/profile/${user.clerk_id}`}
      onClick={onSelect}
      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background =
          "linear-gradient(135deg, var(--color-cute-pink) 0%, var(--color-cute-peach) 100%)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {/* 프로필 이미지 (이니셜 아바타) */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg sketch-avatar"
        style={{
          background: avatarColor,
        }}
      >
        {initial}
      </div>

      {/* 사용자 정보 */}
      <div className="flex-1 min-w-0">
        <p
          className="font-bold text-base truncate"
          style={{ color: "var(--color-cute-border)" }}
        >
          {user.name}
        </p>
        <p
          className="text-sm"
          style={{ color: "var(--color-instagram-text-secondary)" }}
        >
          게시물 {formatCount(user.posts_count)} · 팔로워{" "}
          {formatCount(user.followers_count)}
        </p>
      </div>
    </Link>
  );
}

