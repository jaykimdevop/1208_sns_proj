"use client";

/**
 * @file Header.tsx
 * @description Instagram 스타일 모바일 헤더 컴포넌트
 *
 * Mobile 전용 헤더:
 * - 높이: 60px
 * - 로고 + 버전 정보 (로그인 시) 또는 로그인 버튼 (미로그인 시)
 * - Desktop/Tablet에서는 숨김
 * - 모바일에서는 하단 네비게이션에 프로필 아이콘이 있으므로 헤더에는 프로필 아이콘 제거
 *
 * @dependencies
 * - @clerk/nextjs: useUser 훅
 */

import Link from "next/link";
import { LogIn } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b-4 border-dashed z-50 flex items-center justify-between px-4 animate-slide-in-top" style={{ borderColor: 'var(--color-cute-border)', background: 'linear-gradient(180deg, #FFF5F5 0%, #FFFFFF 100%)' }}>
      {/* 로고 */}
      <Link href="/" className="text-xl font-bold wave-on-hover" style={{ color: 'var(--color-cute-border)' }}>
        ✏️ Instasketch
      </Link>

      {/* 우측 영역 */}
      <div className="flex items-center gap-4">
        {isSignedIn ? (
          // 로그인 시: 버전 정보 표시
          <span
            className="text-xs"
            style={{ color: 'var(--color-instagram-text-secondary)' }}
          >
            Instasketch Beta Ver 1.0
          </span>
        ) : (
          // 미로그인 시: 로그인 버튼
          <Link
            href="/sign-in"
            className="flex items-center gap-1 px-3 py-1.5 sketch-button text-sm font-semibold transition-all"
            style={{ backgroundColor: 'var(--color-cute-pink)', color: 'var(--color-cute-border)' }}
            aria-label="로그인"
          >
            <LogIn size={16} />
            로그인 🔑
          </Link>
        )}
      </div>
    </header>
  );
}

