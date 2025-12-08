"use client";

/**
 * @file Header.tsx
 * @description Instagram 스타일 모바일 헤더 컴포넌트
 *
 * Mobile 전용 헤더:
 * - 높이: 60px
 * - 로고 + 알림/DM/프로필 아이콘
 * - Desktop/Tablet에서는 숨김
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - @clerk/nextjs: useUser 훅
 */

import Link from "next/link";
import { Heart, MessageCircle, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export function Header() {
  const { user } = useUser();

  const getProfileHref = () => {
    if (user?.id) {
      return `/profile/${user.id}`;
    }
    return "/profile";
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b z-50 flex items-center justify-between px-4" style={{ borderColor: 'var(--color-instagram-border)' }}>
      {/* 로고 */}
      <Link href="/" className="text-xl font-bold" style={{ color: 'var(--color-instagram-text-primary)' }}>
        Instagram
      </Link>

      {/* 아이콘들 */}
      <div className="flex items-center gap-4">
        <Link
          href="/activity"
          className="hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-instagram-text-primary)' }}
          aria-label="활동"
        >
          <Heart size={24} />
        </Link>
        <Link
          href="/direct"
          className="hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-instagram-text-primary)' }}
          aria-label="메시지"
        >
          <MessageCircle size={24} />
        </Link>
        <Link
          href={getProfileHref()}
          className="hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-instagram-text-primary)' }}
          aria-label="프로필"
        >
          <User size={24} />
        </Link>
      </div>
    </header>
  );
}

