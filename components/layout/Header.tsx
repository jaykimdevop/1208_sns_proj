"use client";

/**
 * @file Header.tsx
 * @description Instagram 스타일 모바일 헤더 컴포넌트
 *
 * Mobile 전용 헤더:
 * - 높이: 60px
 * - 로고 + 프로필 아이콘 (로그인 시) 또는 로그인 버튼 (미로그인 시)
 * - Desktop/Tablet에서는 숨김
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - @clerk/nextjs: useUser 훅
 */

import Link from "next/link";
import { User, LogIn } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export function Header() {
  const { user, isSignedIn } = useUser();

  const getProfileHref = () => {
    if (user?.id) {
      return `/profile/${user.id}`;
    }
    return "/sign-in";
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b z-50 flex items-center justify-between px-4" style={{ borderColor: 'var(--color-instagram-border)' }}>
      {/* 로고 */}
      <Link href="/" className="text-xl font-bold" style={{ color: 'var(--color-instagram-text-primary)' }}>
        Instagram
      </Link>

      {/* 아이콘들 */}
      <div className="flex items-center gap-4">
        {isSignedIn ? (
          <Link
            href={getProfileHref()}
            className="hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-instagram-text-primary)' }}
            aria-label="프로필"
          >
            <User size={24} />
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
            aria-label="로그인"
          >
            <LogIn size={16} />
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}

