"use client";

/**
 * @file view-mode-selector.tsx
 * @description 게시물 피드 뷰 모드 선택 컴포넌트
 *
 * 데스크탑 뷰에서 게시물 보기 방식을 선택할 수 있는 UI를 제공합니다.
 * 상하 스크롤, 좌우 스크롤 중 선택 가능합니다.
 *
 * @dependencies
 * - hooks/use-view-mode: 뷰 모드 상태 관리
 * - lucide-react: 아이콘
 */

import { LayoutList, ArrowLeftRight } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";

export function ViewModeSelector() {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className="hidden lg:flex items-center gap-4 mb-6 px-0 pt-8" style={{ height: '40px' }}>
      {/* 뷰 모드 선택 버튼들 */}
      <div className="flex items-center gap-3">
        {/* 상하 스크롤 버튼 */}
        <button
          onClick={() => setViewMode("vertical")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 sketch-button ${
            viewMode === "vertical"
              ? "scale-105 shadow-lg"
              : "opacity-70 hover:opacity-90 hover:scale-102"
          }`}
          style={{
            background:
              viewMode === "vertical"
                ? "linear-gradient(135deg, var(--color-cute-mint) 0%, var(--color-cute-sky) 100%)"
                : "transparent",
            color:
              viewMode === "vertical"
                ? "white"
                : "var(--color-instagram-text-primary)",
            border:
              viewMode === "vertical"
                ? "3px solid var(--color-cute-border)"
                : "2px solid var(--color-cute-border)",
            boxShadow:
              viewMode === "vertical"
                ? "0 4px 12px rgba(0,0,0,0.15)"
                : "none",
          }}
          aria-label="상하 스크롤 뷰"
          title="상하 스크롤"
        >
          <LayoutList size={20} />
          <span className="text-sm font-bold">상하</span>
        </button>

        {/* 좌우 스크롤 버튼 */}
        <button
          onClick={() => setViewMode("horizontal")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 sketch-button ${
            viewMode === "horizontal"
              ? "scale-105 shadow-lg"
              : "opacity-70 hover:opacity-90 hover:scale-102"
          }`}
          style={{
            background:
              viewMode === "horizontal"
                ? "linear-gradient(135deg, var(--color-cute-mint) 0%, var(--color-cute-sky) 100%)"
                : "transparent",
            color:
              viewMode === "horizontal"
                ? "white"
                : "var(--color-instagram-text-primary)",
            border:
              viewMode === "horizontal"
                ? "3px solid var(--color-cute-border)"
                : "2px solid var(--color-cute-border)",
            boxShadow:
              viewMode === "horizontal"
                ? "0 4px 12px rgba(0,0,0,0.15)"
                : "none",
          }}
          aria-label="좌우 스크롤 뷰"
          title="좌우 스크롤"
        >
          <ArrowLeftRight size={20} />
          <span className="text-sm font-bold">좌우</span>
        </button>
      </div>
    </div>
  );
}

