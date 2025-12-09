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
import { SearchModal } from "@/components/search/search-modal";

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  isButton?: boolean; // 버튼으로 렌더링할지 여부
  isSearch?: boolean; // 검색 버튼인지 여부
}

// 기본 네비게이션 (로그인 여부와 무관)
const baseNavItems: NavItem[] = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/search", icon: Search, label: "검색", isSearch: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
    const isHovered = hoveredItem === item.href;

    // 동적 배경 스타일
    const getBackgroundStyle = () => {
      // 호버 시에만 배경 표시
      if (isHovered) {
        // "만들기" 버튼: 민트-스카이 그라데이션 (파란색 계열)
        if (item.isButton) {
          return 'linear-gradient(135deg, var(--color-cute-mint) 0%, var(--color-cute-sky) 100%)';
        }
        // 모든 일반 메뉴 (홈, 검색, 프로필 등): 핑크-피치 그라데이션
        return 'linear-gradient(135deg, var(--color-cute-pink) 0%, var(--color-cute-peach) 100%)';
      }
      // 기본 상태: 배경 없음
      return 'transparent';
    };

    // "만들기" 버튼은 Link 대신 button으로 렌더링
    if (item.isButton) {
      return (
        <button
          key={item.href}
          onClick={() => setIsCreateModalOpen(true)}
          onMouseEnter={() => setHoveredItem(item.href)}
          onMouseLeave={() => setHoveredItem(null)}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 cursor-pointer"
          style={{
            color: 'var(--color-instagram-text-primary)',
            background: getBackgroundStyle(),
            transform: isHovered ? 'translateX(4px) scale(1.02)' : 'none',
          }}
        >
          <Icon
            size={24}
            style={{
              transform: isHovered ? 'scale(1.15) rotate(-5deg)' : 'none',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
          <span
            className="text-base"
            style={{
              transform: isHovered ? 'translateX(4px)' : 'none',
              transition: 'transform 0.3s ease',
            }}
          >
            {item.label}
          </span>
        </button>
      );
    }

    // "검색" 버튼은 Link 대신 button으로 렌더링
    if (item.isSearch) {
      return (
        <button
          key={item.href}
          onClick={() => setIsSearchModalOpen(true)}
          onMouseEnter={() => setHoveredItem(item.href)}
          onMouseLeave={() => setHoveredItem(null)}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 cursor-pointer"
          style={{
            color: 'var(--color-instagram-text-primary)',
            background: getBackgroundStyle(),
            transform: isHovered ? 'translateX(4px) scale(1.02)' : 'none',
          }}
        >
          <Icon
            size={24}
            style={{
              transform: isHovered ? 'scale(1.15) rotate(-5deg)' : 'none',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
          <span
            className="text-base"
            style={{
              transform: isHovered ? 'translateX(4px)' : 'none',
              transition: 'transform 0.3s ease',
            }}
          >
            {item.label}
          </span>
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={href}
        onMouseEnter={() => setHoveredItem(item.href)}
        onMouseLeave={() => setHoveredItem(null)}
        className="flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300"
        style={{
          color: 'var(--color-instagram-text-primary)',
          background: getBackgroundStyle(),
          transform: isHovered ? 'translateX(4px) scale(1.02)' : 'none',
        }}
      >
        <Icon
          size={24}
          className={isActive ? "fill-current" : ""}
          style={{
            transform: isHovered ? 'scale(1.15) rotate(-5deg)' : 'none',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        <span
          className="text-base"
          style={{
            transform: isHovered ? 'translateX(4px)' : 'none',
            transition: 'transform 0.3s ease',
          }}
        >
          {item.label}
        </span>
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
    const isHovered = hoveredItem === `tablet-${item.href}`;

    // 동적 배경 스타일
    const getBackgroundStyle = () => {
      // 호버 시에만 배경 표시
      if (isHovered) {
        // "만들기" 버튼: 민트-스카이 그라데이션 (파란색 계열)
        if (item.isButton) {
          return 'linear-gradient(135deg, var(--color-cute-mint) 0%, var(--color-cute-sky) 100%)';
        }
        // 모든 일반 메뉴 (홈, 검색, 프로필 등): 핑크-피치 그라데이션
        return 'linear-gradient(135deg, var(--color-cute-pink) 0%, var(--color-cute-peach) 100%)';
      }
      // 기본 상태: 배경 없음
      return 'transparent';
    };

    // "만들기" 버튼은 Link 대신 button으로 렌더링
    if (item.isButton) {
      return (
        <button
          key={item.href}
          onClick={() => setIsCreateModalOpen(true)}
          onMouseEnter={() => setHoveredItem(`tablet-${item.href}`)}
          onMouseLeave={() => setHoveredItem(null)}
          className="flex items-center justify-center p-3 rounded-xl transition-all duration-300 cursor-pointer"
          style={{
            color: 'var(--color-instagram-text-primary)',
            background: getBackgroundStyle(),
            transform: isHovered ? 'scale(1.1)' : 'none',
          }}
          title={item.label}
        >
          <Icon
            size={24}
            style={{
              transform: isHovered ? 'scale(1.15) rotate(-5deg)' : 'none',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </button>
      );
    }

    // "검색" 버튼은 Link 대신 button으로 렌더링
    if (item.isSearch) {
      return (
        <button
          key={item.href}
          onClick={() => setIsSearchModalOpen(true)}
          onMouseEnter={() => setHoveredItem(`tablet-${item.href}`)}
          onMouseLeave={() => setHoveredItem(null)}
          className="flex items-center justify-center p-3 rounded-xl transition-all duration-300 cursor-pointer"
          style={{
            color: 'var(--color-instagram-text-primary)',
            background: getBackgroundStyle(),
            transform: isHovered ? 'scale(1.1)' : 'none',
          }}
          title={item.label}
        >
          <Icon
            size={24}
            style={{
              transform: isHovered ? 'scale(1.15) rotate(-5deg)' : 'none',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={href}
        onMouseEnter={() => setHoveredItem(`tablet-${item.href}`)}
        onMouseLeave={() => setHoveredItem(null)}
        className="flex items-center justify-center p-3 rounded-xl transition-all duration-300"
        style={{
          color: 'var(--color-instagram-text-primary)',
          background: getBackgroundStyle(),
          transform: isHovered ? 'scale(1.1)' : 'none',
        }}
        title={item.label}
      >
        <Icon
          size={24}
          className={isActive ? "fill-current" : ""}
          style={{
            transform: isHovered ? 'scale(1.15) rotate(-5deg)' : 'none',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </Link>
    );
  };

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen bg-white border-r-4 border-dashed z-40 hidden md:block sidebar-transition animate-slide-in-top" style={{ borderColor: 'var(--color-cute-border)', background: 'linear-gradient(180deg, #FFF5F5 0%, #FFFFFF 100%)' }}>
        {/* Desktop: 244px 너비, 아이콘 + 텍스트 */}
        <div className="hidden lg:flex w-[244px] h-full flex-col pt-8 px-4">
          <div className="mb-8 px-2">
            <Link href="/" className="text-2xl font-bold wave-on-hover inline-block" style={{ color: 'var(--color-cute-border)' }}>
              ✏️ Instasketch
            </Link>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map(renderDesktopNavItem)}
          </nav>
        </div>

        {/* Tablet: 72px 너비, 아이콘만 */}
        <div className="flex lg:hidden w-[72px] h-full flex-col pt-8 px-2">
          <div className="mb-8 flex justify-center">
            <Link href="/" className="text-xl font-bold wave-on-hover" style={{ color: 'var(--color-cute-border)' }}>
              ✏️
            </Link>
          </div>

          <nav className="flex-1 space-y-2">
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

      {/* 검색 모달 */}
      <SearchModal
        open={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
      />
    </>
  );
}

