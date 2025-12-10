"use client";

/**
 * @file use-view-mode.ts
 * @description 게시물 피드 뷰 모드 상태 관리 훅
 *
 * 뷰 모드(상하 스크롤, 좌우 스크롤)를 관리합니다.
 * 사용자 선호도를 localStorage에 저장하여 다음 방문 시 자동으로 적용합니다.
 * atomWithStorage를 사용하여 localStorage와 자동 동기화하고 깜빡임 방지합니다.
 *
 * @dependencies
 * - jotai: 전역 상태 관리
 * - lib/types: ViewMode
 */

import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai";
import type { ViewMode } from "@/lib/types";

const STORAGE_KEY_VIEW_MODE = "instasketch_view_mode";

const DEFAULT_VIEW_MODE: ViewMode = "vertical";

/**
 * localStorage에서 초기 뷰 모드를 동기적으로 읽어옴
 * 클라이언트 사이드에서만 실행되며, SSR 시에는 기본값 반환
 */
function getInitialViewMode(): ViewMode {
  if (typeof window === "undefined") {
    return DEFAULT_VIEW_MODE;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
    if (stored === "vertical" || stored === "horizontal") {
      return stored;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load view mode from localStorage:", error);
    }
  }

  return DEFAULT_VIEW_MODE;
}

/**
 * 뷰 모드 전역 상태 (Jotai atom with localStorage)
 * atomWithStorage를 사용하여 localStorage와 자동 동기화
 * 초기값을 동기적으로 읽어서 깜빡임 방지
 */
const viewModeAtom = atomWithStorage<ViewMode>(
  STORAGE_KEY_VIEW_MODE,
  getInitialViewMode(), // 동기적으로 localStorage에서 읽은 값으로 초기화
  undefined,
  { getOnInit: true }
);

/**
 * 뷰 모드 상태 관리 훅
 */
export function useViewMode() {
  const [viewMode, setViewMode] = useAtom(viewModeAtom);

  return {
    viewMode,
    setViewMode,
  };
}

