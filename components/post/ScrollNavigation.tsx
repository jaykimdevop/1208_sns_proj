"use client";

/**
 * @file ScrollNavigation.tsx
 * @description 좌우 스크롤 네비게이션 컴포넌트
 *
 * 가로 스크롤 컨테이너에서 이전/다음 버튼을 제공합니다.
 * 스크롤 위치에 따라 버튼의 활성화/비활성화 상태를 관리합니다.
 *
 * @dependencies
 * - lucide-react: 아이콘
 */

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollNavigationProps {
  containerRef: React.RefObject<HTMLElement>;
  scrollAmount?: number; // 한 번에 스크롤할 픽셀 수 (기본값: 컨테이너 너비의 80%)
}

export function ScrollNavigation({
  containerRef,
  scrollAmount,
}: ScrollNavigationProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // 스크롤 위치 확인 함수
  const checkScrollPosition = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1); // 1px 여유
  }, [containerRef]);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 초기 상태 확인
    checkScrollPosition();

    // 스크롤 이벤트 리스너 등록
    container.addEventListener("scroll", checkScrollPosition);
    
    // 리사이즈 이벤트 리스너 등록 (컨테이너 크기 변경 시)
    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, [checkScrollPosition, containerRef]);

  // 이전 버튼 클릭 핸들러
  const handleScrollLeft = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollBy = scrollAmount || container.clientWidth * 0.8;

    container.scrollTo({
      left: container.scrollLeft - scrollBy,
      behavior: "smooth",
    });
  }, [containerRef, scrollAmount]);

  // 다음 버튼 클릭 핸들러
  const handleScrollRight = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollBy = scrollAmount || container.clientWidth * 0.8;

    container.scrollTo({
      left: container.scrollLeft + scrollBy,
      behavior: "smooth",
    });
  }, [containerRef, scrollAmount]);

  return (
    <>
      {/* 이전 버튼 - Fixed positioning으로 페이지 좌측에 고정 */}
      {canScrollLeft && (
        <button
          onClick={handleScrollLeft}
          className="fixed lg:left-[260px] md:left-[88px] left-4 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full sketch-button transition-all duration-300 hover:scale-110"
          style={{
            backgroundColor: "var(--color-cute-pink)",
            color: "white",
            border: "2px solid var(--color-cute-border)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          aria-label="이전 게시물"
          title="이전"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* 다음 버튼 - Fixed positioning으로 페이지 우측에 고정 */}
      {canScrollRight && (
        <button
          onClick={handleScrollRight}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full sketch-button transition-all duration-300 hover:scale-110"
          style={{
            backgroundColor: "var(--color-cute-pink)",
            color: "white",
            border: "2px solid var(--color-cute-border)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          aria-label="다음 게시물"
          title="다음"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </>
  );
}

