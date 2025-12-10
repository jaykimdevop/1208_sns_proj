/**
 * @file use-media-query.ts
 * @description 미디어 쿼리 훅
 *
 * CSS 미디어 쿼리를 React에서 사용할 수 있도록 하는 훅입니다.
 * SSR 환경에서도 안전하게 동작합니다.
 *
 * @example
 * const isDesktop = useMediaQuery("(min-width: 1024px)");
 * const isMobile = useMediaQuery("(max-width: 767px)");
 */

import { useState, useEffect, useCallback } from "react";

/**
 * 현재 미디어 쿼리 상태를 가져오는 함수
 */
function getMatches(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
  // hydration mismatch 방지: SSR 시 false로 시작
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 클라이언트 마운트 완료 표시
    setMounted(true);

    // SSR 환경에서는 window가 없으므로 early return
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);

    // 초기값 설정 (hydration 후 즉시 업데이트)
    setMatches(mediaQuery.matches);

    // 변경 감지 핸들러
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 이벤트 리스너 등록
    mediaQuery.addEventListener("change", handleChange);

    // 클린업
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  // hydration 완료 전에는 false 반환
  return mounted ? matches : false;
}

/**
 * 미디어 쿼리 상태를 즉시 확인하는 함수 (이벤트 핸들러 내에서 사용)
 */
export function checkMediaQuery(query: string): boolean {
  return getMatches(query);
}

