"use client";

/**
 * @file HorizontalPostFeed.tsx
 * @description 좌우 스크롤 게시물 피드 컴포넌트
 *
 * 게시물을 가로 스크롤 형식으로 표시합니다.
 * 키보드 네비게이션을 지원하며, 무한 스크롤을 통해 추가 게시물을 로드합니다.
 * 게시물 카드 너비는 고정(500px)되어 브라우저 크기와 무관하게 일정한 크기를 유지합니다.
 * 컨테이너는 사이드바 우측에서 시작하며, 브라우저 크기가 줄어들어도 카드는 그대로 유지되고 스크롤로만 이동합니다.
 *
 * @dependencies
 * - components/post/PostCard: 게시물 카드 컴포넌트
 * - components/post/PostCardSkeleton: 로딩 스켈레톤
 * - states/posts-atom: 전역 게시물 상태
 * - lib/types: PostsResponse, PostWithStats
 * - hooks/use-media-query: 반응형 미디어 쿼리
 */

import { useEffect, useRef, useState, useCallback, useLayoutEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import { postsAtom, type PostItem } from "@/states/posts-atom";
import { handleApiError, handleFetchError, getUserFriendlyMessage } from "@/lib/utils/error-handler";
import type { PostsResponse } from "@/lib/types";

interface HorizontalPostFeedProps {
  initialPosts?: PostsResponse;
  userId?: string; // 프로필 페이지용 (선택적)
}

export function HorizontalPostFeed({ initialPosts, userId }: HorizontalPostFeedProps) {
  // 전역 상태 사용
  const [posts, setPosts] = useAtom(postsAtom);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts?.hasMore ?? true);
  const [offset, setOffset] = useState(initialPosts?.data?.length || 0);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [showRightGradient, setShowRightGradient] = useState(true);

  // 게시물 카드 너비 고정 (브라우저 크기와 무관하게 일정한 크기 유지)
  const cardWidth = "500px";

  // 컨테이너 최소 너비: 3개 카드 + 2개 gap (게시물이 적을 때도 레이아웃 유지)
  const containerMinWidth = useMemo(() => {
    // 3개 카드 (500px * 3) + 2개 gap (1rem * 2 = 32px)
    return "calc(1500px + 2rem)";
  }, []);

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
  }, [initialPosts]); // initialPosts 변경 시에도 실행

  // 스크롤 위치를 맨 왼쪽으로 리셋 (렌더링 전에 실행)
  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  }, [initialPosts]); // initialPosts 변경 시에도 스크롤 리셋

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
        // 중복 제거
        setPosts((prev) => {
          const newPosts = data.data as PostItem[];
          const existingIds = new Set(prev.map((p) => p.post_id));
          const uniqueNewPosts = newPosts.filter((p) => !existingIds.has(p.post_id));
          return [...prev, ...uniqueNewPosts];
        });
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
        root: containerRef.current,
        rootMargin: "200px",
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
  }, [hasMore, loading, loadPosts]);

  // 스크롤 위치 감지 (오른쪽 그라데이션 표시 여부 결정)
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;

      // 오른쪽 끝에 거의 도달했는지 확인 (50px 여유)
      const isNearEnd = scrollLeft + clientWidth >= scrollWidth - 50;
      setShowRightGradient(!isNearEnd && posts.length > 1);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      // 초기 상태 확인
      handleScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [posts.length]);

  // 키보드 네비게이션 (화살표 키)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const scrollBy = container.clientWidth * 0.8;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        container.scrollTo({
          left: container.scrollLeft - scrollBy,
          behavior: "smooth",
        });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        container.scrollTo({
          left: container.scrollLeft + scrollBy,
          behavior: "smooth",
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
      container.setAttribute("tabIndex", "0"); // 키보드 포커스 가능하도록
    }

    return () => {
      if (container) {
        container.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, []);

  // 재시도 함수
  const handleRetry = () => {
    setError(null);
    loadPosts();
  };

  return (
    <div className="relative overflow-hidden">
      {/* 오른쪽 그라데이션 오버레이 (더 스크롤 가능함을 표시) */}
      {showRightGradient && !error && (
        <div
          className="absolute right-0 top-0 bottom-0 pointer-events-none z-10 transition-opacity duration-300"
          style={{
            width: "150px",
            background: "linear-gradient(to left, #FAFAFA 0%, transparent 100%)",
          }}
        />
      )}

      {/* 스크롤 컨테이너 */}
      <div
        ref={containerRef}
        className="flex justify-start gap-6 overflow-x-auto overflow-y-hidden py-8 scrollbar-hide"
        style={{
          paddingLeft: "1rem",
          paddingRight: "100px", // 다음 게시물의 일부(약 100px)만 보이도록 설정
          minWidth: containerMinWidth,
        }}
      >
        {/* 게시물 목록 */}
        {posts.length === 0 && !loading && !error && (
          <div className="flex items-center justify-center min-w-full py-16">
            <p style={{ color: "var(--color-instagram-text-secondary)" }}>
              게시물이 없습니다.
            </p>
          </div>
        )}

        {posts.map((post) => (
          <div
            key={post.post_id}
            className="flex-shrink-0"
            style={{
              width: cardWidth,
              minWidth: cardWidth,
            }}
          >
            <PostCard post={post} onPostDeleted={handlePostDeleted} />
          </div>
        ))}

        {/* 초기 로딩 스켈레톤 */}
        {posts.length === 0 && loading && (
          <>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0"
                style={{
                  width: cardWidth,
                  minWidth: cardWidth,
                }}
              >
                <PostCardSkeleton />
              </div>
            ))}
          </>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="flex items-center justify-center min-w-full py-8">
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
            className="flex-shrink-0 w-20 h-20 flex items-center justify-center"
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
          <div className="flex items-center justify-center min-w-full py-8">
            <p style={{ color: "var(--color-instagram-text-secondary)" }}>
              모든 게시물을 불러왔습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

