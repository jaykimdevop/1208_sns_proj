"use client";

/**
 * @file post-search-result.tsx
 * @description 게시물 검색 결과 아이템 컴포넌트
 *
 * 검색된 게시물 정보를 표시하고 클릭 시 게시물 상세로 이동합니다.
 *
 * @dependencies
 * - next/image: 이미지 최적화
 * - next/link: 페이지 이동
 * - lib/types: SearchPostResult 타입
 */

import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import type { SearchPostResult } from "@/lib/types";
import { useMediaQuery } from "@/hooks/use-media-query";

interface PostSearchResultProps {
  post: SearchPostResult;
  searchQuery: string;
  onSelect?: () => void;
  onOpenModal?: (postId: string) => void;
}

/**
 * 검색어 하이라이트
 */
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        className="bg-transparent font-bold"
        style={{ color: "var(--color-cute-coral)" }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
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

export function PostSearchResult({
  post,
  searchQuery,
  onSelect,
  onOpenModal,
}: PostSearchResultProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDesktop && onOpenModal) {
      onOpenModal(post.post_id);
    } else {
      // Mobile: 상세 페이지로 이동
      window.location.href = `/post/${post.post_id}`;
    }
    onSelect?.();
  };

  // 캡션 미리보기 (최대 100자)
  const captionPreview = post.caption
    ? post.caption.length > 100
      ? post.caption.slice(0, 100) + "..."
      : post.caption
    : "";

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] text-left"
      aria-label={`${post.user.name}의 게시물 보기`}
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
      {/* 썸네일 이미지 */}
      <div
        className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden"
        style={{
          border: "2px solid var(--color-cute-border)",
        }}
      >
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>

      {/* 게시물 정보 */}
      <div className="flex-1 min-w-0">
        {/* 작성자 */}
        <p
          className="font-bold text-sm truncate"
          style={{ color: "var(--color-cute-border)" }}
        >
          {post.user.name}
        </p>

        {/* 캡션 미리보기 */}
        {captionPreview && (
          <p
            className="text-sm line-clamp-2 mt-1"
            style={{ color: "var(--color-instagram-text-secondary)" }}
          >
            {highlightText(captionPreview, searchQuery)}
          </p>
        )}

        {/* 통계 */}
        <div
          className="flex items-center gap-3 mt-2 text-xs"
          style={{ color: "var(--color-instagram-text-secondary)" }}
        >
          <span className="flex items-center gap-1">
            <Heart size={12} />
            {formatCount(post.likes_count)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={12} />
            {formatCount(post.comments_count)}
          </span>
        </div>
      </div>
    </button>
  );
}

