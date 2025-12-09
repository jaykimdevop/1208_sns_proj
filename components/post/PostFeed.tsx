"use client";

/**
 * @file PostFeed.tsx
 * @description 게시물 피드 컴포넌트
 *
 * 게시물 목록을 표시하고 무한 스크롤을 통해 페이지네이션을 지원합니다.
 * Intersection Observer API를 사용하여 하단 도달 시 자동으로 다음 페이지를 로드합니다.
 *
 * @dependencies
 * - components/post/PostCard: 게시물 카드 컴포넌트
 * - components/post/PostCardSkeleton: 로딩 스켈레톤
 * - app/api/posts/route: 게시물 목록 조회 API
 * - lib/types: PostsResponse, PostWithStats
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import type {
  PostsResponse,
  PostWithStats,
  CommentWithUser,
} from "@/lib/types";

interface PostFeedProps {
  initialPosts?: PostsResponse;
  userId?: string; // 프로필 페이지용 (선택적)
}

export function PostFeed({ initialPosts, userId }: PostFeedProps) {
  const [posts, setPosts] = useState<
    (PostWithStats & { comments: CommentWithUser[]; isLiked: boolean })[]
  >((initialPosts?.data as (PostWithStats & { comments: CommentWithUser[]; isLiked: boolean })[]) || []);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts?.hasMore ?? true);
  const [offset, setOffset] = useState(initialPosts?.data?.length || 0);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 게시물 로드 함수
  const loadPosts = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: "10",
        offset: offset.toString(),
      });

      if (userId) {
        params.append("userId", userId);
      }

      const response = await fetch(`/api/posts?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data: PostsResponse = await response.json();

      setPosts((prev) => [...prev, ...data.data]);
      setHasMore(data.hasMore ?? false);
      setOffset((prev) => prev + data.data.length);
    } catch (err) {
      console.error("Error loading posts:", err);
      setError("게시물을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset, userId]);

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPosts();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px", // 하단 100px 전에 미리 로드
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadPosts, hasMore, loading]);

  // 재시도 함수
  const handleRetry = () => {
    setError(null);
    loadPosts();
  };

  return (
    <div className="py-8">
      {/* 게시물 목록 */}
      {posts.length === 0 && !loading && !error && (
        <div className="text-center py-16">
          <p style={{ color: 'var(--color-instagram-text-secondary)' }}>
            게시물이 없습니다.
          </p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.post_id} post={post} />
      ))}

      {/* 초기 로딩 스켈레톤 */}
      {posts.length === 0 && loading && (
        <>
          {[...Array(3)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="text-center py-8">
          <p className="mb-4" style={{ color: 'var(--color-instagram-text-secondary)' }}>
            {error}
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-70 transition-opacity"
            style={{
              backgroundColor: 'var(--color-instagram-blue)',
              color: '#ffffff',
            }}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 하단 감지 요소 (Intersection Observer용) */}
      {hasMore && !error && (
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-sm" style={{ color: 'var(--color-instagram-text-secondary)' }}>
                로딩 중...
              </p>
            </div>
          )}
        </div>
      )}

      {/* 더 이상 게시물이 없을 때 */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p style={{ color: 'var(--color-instagram-text-secondary)' }}>
            모든 게시물을 불러왔습니다.
          </p>
        </div>
      )}
    </div>
  );
}

