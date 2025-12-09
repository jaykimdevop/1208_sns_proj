"use client";

/**
 * @file use-online-status.ts
 * @description 네트워크 온라인/오프라인 상태를 감지하는 커스텀 훅
 *
 * navigator.onLine API와 online/offline 이벤트를 사용하여
 * 네트워크 상태를 실시간으로 감지합니다.
 *
 * @returns {boolean} 온라인 상태 여부
 */

import { useState, useEffect } from "react";

/**
 * 네트워크 온라인/오프라인 상태를 감지하는 훅
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // SSR 안전: 브라우저 환경에서만 navigator.onLine 사용
    if (typeof window !== "undefined") {
      return navigator.onLine;
    }
    return true; // 기본값: 온라인으로 가정
  });

  useEffect(() => {
    // 초기 상태 설정
    setIsOnline(navigator.onLine);

    // 온라인 이벤트 리스너
    const handleOnline = () => {
      setIsOnline(true);
    };

    // 오프라인 이벤트 리스너
    const handleOffline = () => {
      setIsOnline(false);
    };

    // 이벤트 리스너 등록
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 클린업: 이벤트 리스너 제거
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

