"use client";

/**
 * @file BottomNav.tsx
 * @description Instagram 스타일 하단 네비게이션 컴포넌트
 *
 * Mobile 전용 하단 네비게이션:
 * - 높이: 50px
 * - 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필
 * - 하단 고정
 * - Desktop/Tablet에서는 숨김
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - next/navigation: usePathname 훅
 * - @clerk/nextjs: useUser 훅
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/search", icon: Search, label: "검색" },
  { href: "/create", icon: PlusSquare, label: "만들기" },
  { href: "/activity", icon: Heart, label: "활동" },
  { href: "/profile", icon: User, label: "프로필" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const getProfileHref = () => {
    if (user?.id) {
      return `/profile/${user.id}`;
    }
    return "/profile";
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-white border-t z-50 flex items-center justify-around" style={{ borderColor: 'var(--color-instagram-border)' }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const href = item.href === "/profile" ? getProfileHref() : item.href;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={href}
            className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
            style={{ 
              color: isActive 
                ? 'var(--color-instagram-text-primary)' 
                : 'var(--color-instagram-text-secondary)' 
            }}
            aria-label={item.label}
          >
            <Icon
              size={24}
              className={isActive ? "fill-current" : ""}
            />
          </Link>
        );
      })}
    </nav>
  );
}

