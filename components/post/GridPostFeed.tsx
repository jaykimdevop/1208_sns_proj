"use client";

/**
 * @file GridPostFeed.tsx
 * @description 그리드 레이아웃 게시물 피드 컴포넌트
 *
 * 게시물을 그리드 형식으로 표시합니다.
 * 사용자가 선택한 그리드 옵션(2x3, 3x2, 4x4 등)에 따라 동적으로 레이아웃을 조정합니다.
 * 상하 또는 좌우 스크롤을 지원하며, 무한 스크롤을 통해 추가 게시물을 로드합니다.
 *
 * @dependencies
 * - components/post/PostCard: 게시물 카드 컴포넌트
 * - components/post/PostCardSkeleton: 로딩 스켈레톤
 * - components/post/ScrollNavigation: 좌우 이동 버튼 (좌우 스크롤 모드)
 * - states/posts-atom: 전역 게시물 상태
 * - lib/types: PostsResponse, PostWithStats, GridLayoutConfig
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import { ScrollNavigation } from "./ScrollNavigation";
import { postsAtom, type PostItem } from "@/states/posts-atom";
import { handleApiError, handleFetchError, getUserFriendlyMessage } from "@/lib/utils/error-handler";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { PostsResponse } from "@/lib/types";

interface GridPostFeedProps {
  initialPosts?: PostsResponse;
  userId?: string; // 프로필 페이지용 (선택적)
  scrollDirection?: "vertical" | "horizontal"; // 스크롤 방향 (기본값: vertical)
}

export function GridPostFeed({
  initialPosts,
  userId,
  scrollDirection = "vertical",
}: GridPostFeedProps) {
  // 전역 상태 사용
  const [posts, setPosts] = useAtom(postsAtom);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts?.hasMore ?? true);
  const [offset, setOffset] = useState(initialPosts?.data?.length || 0);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 반응형 그리드 열 수 계산
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  const responsiveColumns = useMemo(() => {
    if (isDesktop) return 3; // 데스크톱: 최대 3개
    if (isTablet) return 2; // 태블릿: 최대 2개
    return 1; // 모바일: 1개
  }, [isDesktop, isTablet]);

  // 게시물 삭제 핸들러
  const handlePostDeleted = useCallback(
    (postId: string) => {
      setPosts((prev) => prev.filter((p) => p.post_id !== postId));
    },
    [setPosts]
  );

  // 컴포넌트 마운트 시 초기 데이터로 전역 상태 초기화
  useEffect(() => {
    if (initialPosts?.data) {
      setPosts(initialPosts.data as PostItem[]);
      setOffset(initialPosts.data.length);
      setHasMore(initialPosts.hasMore ?? true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시에만 실행

  // AbortController ref (요청 취소용)
  const abortControllerRef = useRef<AbortController | null>(null);

  // 게시물 로드 함수
  const loadPosts = useCallback(async () => {
    if (loading || !hasMore) return;

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성
    const controller = new AbortController();
    abortControllerRef.current = controller;

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

      // 타임아웃 설정 (10초)
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`/api/posts?${params.toString()}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const apiError = await handleApiError(response, "loadPosts");
        setError(getUserFriendlyMessage(apiError, "게시물 로드"));
        return;
      }

      const data: PostsResponse = await response.json();

      if (data.data && data.data.length > 0) {
        setPosts((prev) => [...prev, ...(data.data as PostItem[])]);
        setOffset((prev) => prev + data.data.length);
        setHasMore(data.hasMore ?? false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return; // 요청 취소는 에러로 처리하지 않음
      }

      const fetchError = handleFetchError(error, "loadPosts");
      setError(getUserFriendlyMessage(fetchError, "게시물 로드"));
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset, userId, setPosts]);

  // Intersection Observer로 무한 스크롤 구현
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPosts();
        }
      },
      {
        root: scrollDirection === "horizontal" ? containerRef.current : null,
        rootMargin: scrollDirection === "horizontal" ? "200px" : "100px",
        threshold: 0.1,
      }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasMore, loading, loadPosts, scrollDirection]);

  // 재시도 함수
  const handleRetry = () => {
    setError(null);
    loadPosts();
  };

  // 그리드 스타일 계산 (반응형 열 수 사용)
  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `repeat(${responsiveColumns}, minmax(0, 1fr))`,
    gap: "1rem",
  }), [responsiveColumns]);

  return (
    <div className="relative w-full">
      {/* 스크롤 컨테이너 */}
      <div
        ref={containerRef}
        className={`py-8 px-4 ${
          scrollDirection === "horizontal"
            ? "overflow-x-auto overflow-y-hidden scrollbar-hide"
            : "overflow-y-auto overflow-x-hidden"
        }`}
        style={{
          ...(scrollDirection === "horizontal" && {
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }),
          maxHeight: scrollDirection === "vertical" ? "calc(100vh - 200px)" : "auto",
        }}
      >
        {/* 그리드 컨테이너 */}
        <div
          className="grid w-full"
          style={gridStyle}
        >
          {/* 게시물 목록 */}
          {posts.length === 0 && !loading && !error && (
            <div className="col-span-full flex items-center justify-center py-16">
              <p style={{ color: "var(--color-instagram-text-secondary)" }}>
                게시물이 없습니다.
              </p>
            </div>
          )}

          {posts.map((post) => (
            <div key={post.post_id} className="w-full">
              <PostCard post={post} onPostDeleted={handlePostDeleted} />
            </div>
          ))}

          {/* 초기 로딩 스켈레톤 */}
          {posts.length === 0 && loading && (
            <>
              {[...Array(responsiveColumns * 2)].map((_, i) => (
                <div key={i} className="w-full">
                  <PostCardSkeleton />
                </div>
              ))}
            </>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="col-span-full flex items-center justify-center py-8">
              <div className="text-center">
                <p className="mb-4" style={{ color: "var(--color-instagram-text-secondary)" }}>
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-70 transition-opacity"
                  style={{
                    backgroundColor: "var(--color-instagram-blue)",
                    color: "#ffffff",
                  }}
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}

          {/* 하단 감지 요소 (Intersection Observer용) */}
          {hasMore && !error && (
            <div
              ref={observerTarget}
              className="col-span-full flex items-center justify-center h-20"
            >
              {loading && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-sm" style={{ color: "var(--color-instagram-text-secondary)" }}>
                    로딩 중...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 더 이상 게시물이 없을 때 */}
          {!hasMore && posts.length > 0 && (
            <div className="col-span-full flex items-center justify-center py-8">
              <p style={{ color: "var(--color-instagram-text-secondary)" }}>
                모든 게시물을 불러왔습니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 좌우 이동 버튼 (좌우 스크롤 모드일 때만) */}
      {scrollDirection === "horizontal" && (
        <ScrollNavigation containerRef={containerRef} />
      )}
    </div>
  );
}

