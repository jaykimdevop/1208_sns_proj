"use client";

/**
 * @file DoubleTapHeart.tsx
 * @description 더블탭 좋아요 컴포넌트
 *
 * 이미지 영역에서 더블탭 시 큰 하트가 나타나는 Instagram 스타일 인터랙션을 제공합니다.
 * - 더블탭 감지 (300ms 이내 두 번 탭)
 * - 큰 하트 아이콘 fade in/out (1초)
 * - 좋아요 상태 업데이트 콜백
 *
 * @dependencies
 * - lucide-react: Heart 아이콘
 */

import { useState, useCallback, useRef } from "react";
import { Heart } from "lucide-react";

interface DoubleTapHeartProps {
  children: React.ReactNode;
  onDoubleTap: () => void;
  disabled?: boolean;
}

const DOUBLE_TAP_DELAY_MS = 300;

export function DoubleTapHeart({
  children,
  onDoubleTap,
  disabled = false,
}: DoubleTapHeartProps) {
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = useCallback(() => {
    if (disabled) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_DELAY_MS && timeSinceLastTap > 0) {
      // 더블탭 감지
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 하트 표시
      setShowHeart(true);

      // 좋아요 콜백 호출
      onDoubleTap();

      // 1초 후 하트 숨기기
      timeoutRef.current = setTimeout(() => {
        setShowHeart(false);
      }, 1000);

      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onDoubleTap, disabled]);

  // 마우스 더블클릭 핸들러 (데스크탑)
  const handleDoubleClick = useCallback(() => {
    if (disabled) return;

    // 하트 표시
    setShowHeart(true);

    // 좋아요 콜백 호출
    onDoubleTap();

    // 1초 후 하트 숨기기
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowHeart(false);
    }, 1000);
  }, [onDoubleTap, disabled]);

  return (
    <div
      className="relative select-none"
      onClick={handleTap}
      onDoubleClick={handleDoubleClick}
    >
      {children}

      {/* 큰 하트 오버레이 */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart
            size={80}
            className="fill-current animate-like-heart-appear"
            style={{
              color: "white",
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            }}
          />
        </div>
      )}
    </div>
  );
}

