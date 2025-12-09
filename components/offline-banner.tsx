"use client";

/**
 * @file offline-banner.tsx
 * @description 오프라인 상태를 알리는 배너 컴포넌트
 *
 * 네트워크가 오프라인일 때 상단에 표시되는 배너입니다.
 * 온라인 상태로 복구되면 자동으로 사라집니다.
 *
 * @dependencies
 * - hooks/use-online-status: 네트워크 상태 감지
 */

import { useState, useEffect } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  // 온라인 상태면 배너를 표시하지 않음
  if (isOnline) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-semibold animate-slide-down"
      style={{
        backgroundColor: "var(--color-cute-coral)",
        color: "white",
        borderBottom: "2px solid var(--color-cute-border)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff size={18} />
        <span>오프라인 상태입니다. 네트워크 연결을 확인해주세요.</span>
      </div>
    </div>
  );
}

/**
 * 온라인 복구 배너 (선택 사항)
 * 네트워크가 복구되었을 때 잠깐 표시되는 배너
 */
export function OnlineBanner() {
  const isOnline = useOnlineStatus();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isOnline) {
      // 온라인 상태로 복구되면 배너 표시
      setShowBanner(true);
      // 3초 후 자동으로 사라짐
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [isOnline]);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-semibold animate-slide-down"
      style={{
        backgroundColor: "var(--color-cute-mint)",
        color: "var(--color-cute-border)",
        borderBottom: "2px solid var(--color-cute-border)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2">
        <Wifi size={18} />
        <span>네트워크 연결이 복구되었습니다.</span>
      </div>
    </div>
  );
}

