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

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, PlusSquare, User, LogIn } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { CreatePostModal } from "@/components/post/CreatePostModal";

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  isButton?: boolean; // 버튼으로 렌더링할지 여부
}

// 기본 네비게이션 (로그인 여부와 무관)
const baseNavItems: NavItem[] = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/search", icon: Search, label: "검색" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 로그인 상태에 따라 네비게이션 아이템 동적 생성
  const getNavItems = (): NavItem[] => {
    if (isSignedIn && user?.id) {
      return [
        ...baseNavItems,
        { href: "/create", icon: PlusSquare, label: "만들기", isButton: true },
        { href: `/profile/${user.id}`, icon: User, label: "프로필" },
      ];
    }
    // 미로그인 시 로그인 버튼 표시
    return [
      ...baseNavItems,
      { href: "/sign-in", icon: LogIn, label: "로그인" },
    ];
  };

  const navItems = getNavItems();

  // 게시물 생성 후 콜백
  const handlePostCreated = () => {
    // 홈 페이지로 이동하고 새로고침
    if (pathname === "/") {
      router.refresh();
    } else {
      router.push("/");
    }
  };

  // 네비게이션 아이템 렌더링 (Desktop)
  const renderDesktopNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const href = item.href;
    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href);

    // "만들기" 버튼은 Link 대신 button으로 렌더링
    if (item.isButton) {
      return (
        <button
          key={item.href}
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full flex items-center gap-4 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50"
          style={{ color: 'var(--color-instagram-text-primary)' }}
        >
          <Icon size={24} />
          <span className="text-base">{item.label}</span>
        </button>
      );
    }

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
  };

  // 네비게이션 아이템 렌더링 (Tablet)
  const renderTabletNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const href = item.href;
    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href);

    // "만들기" 버튼은 Link 대신 button으로 렌더링
    if (item.isButton) {
      return (
        <button
          key={item.href}
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-50"
          style={{ color: 'var(--color-instagram-text-primary)' }}
          title={item.label}
        >
          <Icon size={24} />
        </button>
      );
    }

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
  };

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen bg-white border-r z-40 hidden md:block" style={{ borderColor: 'var(--color-instagram-border)' }}>
        {/* Desktop: 244px 너비, 아이콘 + 텍스트 */}
        <div className="hidden lg:flex w-[244px] h-full flex-col pt-8 px-4">
          <div className="mb-8 px-2">
            <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--color-instagram-text-primary)' }}>
              Instagram
            </Link>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map(renderDesktopNavItem)}
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
            {navItems.map(renderTabletNavItem)}
          </nav>
        </div>
      </aside>

      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onPostCreated={handlePostCreated}
      />
    </>
  );
}

