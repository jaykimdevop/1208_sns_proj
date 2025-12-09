"use client";

/**
 * @file post-grid.tsx
 * @description Instagram 스타일 게시물 그리드 컴포넌트
 *
 * 프로필 페이지에서 사용자의 게시물을 3열 그리드로 표시합니다.
 * - 1:1 정사각형 썸네일
 * - Hover 시 좋아요/댓글 수 오버레이
 * - 클릭 시 게시물 상세 모달 (Desktop) / 상세 페이지 이동 (Mobile)
 *
 * @dependencies
 * - next/image: 이미지 최적화
 * - next/navigation: 라우터
 * - lucide-react: 아이콘
 * - components/post/post-modal: 게시물 상세 모달
 * - hooks/use-media-query: 반응형 체크
 * - lib/types: PostWithStats, CommentWithUser
 */

import { useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Grid3X3 } from "lucide-react";
import { PostModal } from "@/components/post/post-modal";
import type { PostWithStats, CommentWithUser } from "@/lib/types";

// 게시물 타입 (그리드용)
type GridPost = PostWithStats & {
  comments: CommentWithUser[];
  isLiked: boolean;
};

interface PostGridProps {
  posts: GridPost[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function PostGrid({
  posts,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  emptyMessage = "아직 게시물이 없습니다.",
}: PostGridProps) {
  const router = useRouter();
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);

  // 게시물 클릭 핸들러
  const handlePostClick = useCallback(
    (index: number) => {
      // Desktop 체크 (768px 이상)
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;

      if (isDesktop) {
        setSelectedPostIndex(index);
      } else {
        // Mobile: 상세 페이지로 이동
        router.push(`/post/${posts[index].post_id}`);
      }
    },
    [router, posts]
  );

  // 모달 닫기
  const handleCloseModal = useCallback(() => {
    setSelectedPostIndex(null);
  }, []);

  // 이전 게시물
  const handlePrevious = useCallback(() => {
    if (selectedPostIndex !== null && selectedPostIndex > 0) {
      setSelectedPostIndex(selectedPostIndex - 1);
    }
  }, [selectedPostIndex]);

  // 다음 게시물
  const handleNext = useCallback(() => {
    if (selectedPostIndex !== null && selectedPostIndex < posts.length - 1) {
      setSelectedPostIndex(selectedPostIndex + 1);
    }
  }, [selectedPostIndex, posts.length]);

  // 숫자 포맷팅
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div
          className="w-16 h-16 rounded-full border-2 flex items-center justify-center mb-4"
          style={{ borderColor: "var(--color-instagram-text-primary)" }}
        >
          <Grid3X3
            size={32}
            style={{ color: "var(--color-instagram-text-primary)" }}
          />
        </div>
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--color-instagram-text-primary)" }}
        >
          게시물 없음
        </h2>
        <p style={{ color: "var(--color-instagram-text-secondary)" }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 그리드 */}
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {posts.map((post, index) => (
          <button
            key={post.post_id}
            onClick={() => handlePostClick(index)}
            className="relative aspect-square group overflow-hidden sketch-card hover-scale"
            style={{
              opacity: 0,
              animation: `slide-up 0.4s ease-out forwards`,
              animationDelay: `${(index % 12) * 0.05}s`,
            }}
          >
            {/* 썸네일 이미지 */}
            <Image
              src={post.image_url}
              alt={post.caption || "게시물 이미지"}
              fill
              sizes="(max-width: 768px) 33vw, 300px"
              className="object-cover"
              unoptimized={post.image_url.startsWith("http")}
            />

            {/* Hover 오버레이 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Heart size={20} fill="white" />
                <span>{formatCount(post.likes_count)}</span>
              </div>
              <div className="flex items-center gap-2 text-white font-semibold">
                <MessageCircle size={20} fill="white" />
                <span>{formatCount(post.comments_count)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 더 보기 버튼 */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-6 py-2 sketch-button font-semibold transition-all"
            style={{
              backgroundColor: "var(--color-cute-pink)",
              color: "var(--color-cute-border)",
            }}
          >
            {isLoading ? "로딩 중..." : "더 보기 ✨"}
          </button>
        </div>
      )}

      {/* 게시물 상세 모달 */}
      {selectedPostIndex !== null && posts[selectedPostIndex] && (
        <PostModal
          post={posts[selectedPostIndex]}
          open={selectedPostIndex !== null}
          onOpenChange={(open) => {
            if (!open) handleCloseModal();
          }}
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={selectedPostIndex > 0}
          hasNext={selectedPostIndex < posts.length - 1}
        />
      )}
    </>
  );
}

