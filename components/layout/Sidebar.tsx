"use client";

/**
 * @file Sidebar.tsx
 * @description Instagram 스타일 사이드바 컴포넌트
 *
 * 반응형 사이드바:
 * - Desktop (≥1024px): 244px 너비, 아이콘 + 텍스트
 * - Tablet (768px~1023px): 72px 너비, 아이콘만
 * - Mobile (<768px): 숨김
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - next/navigation: usePathname 훅
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, User } from "lucide-react";
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
  { href: "/profile", icon: User, label: "프로필" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  // 프로필 링크는 사용자 ID가 있을 때 동적으로 생성
  const getProfileHref = () => {
    if (user?.id) {
      return `/profile/${user.id}`;
    }
    return "/profile";
  };

  return (
    <aside className="fixed left-0 top-0 h-screen bg-white border-r z-40 hidden md:block" style={{ borderColor: 'var(--color-instagram-border)' }}>
      {/* Desktop: 244px 너비, 아이콘 + 텍스트 */}
      <div className="hidden lg:flex w-[244px] h-full flex-col pt-8 px-4">
        <div className="mb-8 px-2">
          <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--color-instagram-text-primary)' }}>
            Instagram
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
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
                className={`
                  flex items-center gap-4 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50
                  ${isActive ? "font-semibold" : ""}
                `}
                style={{ color: 'var(--color-instagram-text-primary)' }}
              >
                <Icon
                  size={24}
                  className={isActive ? "fill-current" : ""}
                />
                <span className="text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tablet: 72px 너비, 아이콘만 */}
      <div className="flex lg:hidden w-[72px] h-full flex-col pt-8 px-2">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="text-xl font-bold" style={{ color: 'var(--color-instagram-text-primary)' }}>
            IG
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
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
                className={`
                  flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-50
                  ${isActive ? "font-semibold" : ""}
                `}
                style={{ color: 'var(--color-instagram-text-primary)' }}
                title={item.label}
              >
                <Icon
                  size={24}
                  className={isActive ? "fill-current" : ""}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

