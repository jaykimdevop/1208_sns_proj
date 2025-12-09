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
  // 초기값을 즉시 계산 (클라이언트에서만)
  const [matches, setMatches] = useState(() => getMatches(query));

  // 현재 상태를 즉시 반환하는 함수 (클릭 핸들러 등에서 사용)
  const getIsMatching = useCallback(() => getMatches(query), [query]);

  useEffect(() => {
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

  return matches;
}

/**
 * 미디어 쿼리 상태를 즉시 확인하는 함수 (이벤트 핸들러 내에서 사용)
 */
export function checkMediaQuery(query: string): boolean {
  return getMatches(query);
}

