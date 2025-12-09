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

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, PlusSquare, User, LogIn } from "lucide-react";
import { useUser } from "@clerk/nextjs";

// 코드 스플리팅: 모달 컴포넌트를 동적 import
const CreatePostModal = dynamic(
  () => import("@/components/post/CreatePostModal").then((mod) => ({ default: mod.CreatePostModal })),
  { ssr: false }
);

const SearchModal = dynamic(
  () => import("@/components/search/search-modal").then((mod) => ({ default: mod.SearchModal })),
  { ssr: false }
);

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
  isButton?: boolean; // 버튼으로 렌더링할지 여부
  isSearch?: boolean; // 검색 버튼인지 여부
}

// 로그인 사용자용 네비게이션
const signedInNavItems: NavItem[] = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/search", icon: Search, label: "검색", isSearch: true },
  { href: "/create", icon: PlusSquare, label: "만들기", isButton: true },
  { href: "/profile", icon: User, label: "프로필" },
];

// 미로그인 사용자용 네비게이션
const signedOutNavItems: NavItem[] = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/search", icon: Search, label: "검색", isSearch: true },
  { href: "/sign-in", icon: LogIn, label: "로그인" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // 로그인 상태에 따라 네비게이션 아이템 선택
  const navItems = isSignedIn ? signedInNavItems : signedOutNavItems;

  const getProfileHref = () => {
    if (user?.id) {
      return `/profile/${user.id}`;
    }
    return "/sign-in";
  };

  // 게시물 생성 후 콜백
  const handlePostCreated = () => {
    // 홈 페이지로 이동하고 새로고침
    if (pathname === "/") {
      router.refresh();
    } else {
      router.push("/");
    }
  };

  // 네비게이션 아이템 렌더링
  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const href = item.href === "/profile" ? getProfileHref() : item.href;
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
          className="flex flex-col items-center justify-center flex-1 h-full rounded-xl mx-1 transition-all duration-300 cursor-pointer"
          style={{
            color: 'var(--color-instagram-text-primary)',
            background: getBackgroundStyle(),
            transform: isHovered ? 'scale(1.1)' : 'none',
          }}
          aria-label={item.label}
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
          onMouseEnter={() => setHoveredItem(item.href)}
          onMouseLeave={() => setHoveredItem(null)}
          className="flex flex-col items-center justify-center flex-1 h-full rounded-xl mx-1 transition-all duration-300 cursor-pointer"
          style={{
            color: 'var(--color-instagram-text-primary)',
            background: getBackgroundStyle(),
            transform: isHovered ? 'scale(1.1)' : 'none',
          }}
          aria-label={item.label}
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
        onMouseEnter={() => setHoveredItem(item.href)}
        onMouseLeave={() => setHoveredItem(null)}
        className="flex flex-col items-center justify-center flex-1 h-full rounded-xl mx-1 transition-all duration-300"
        style={{
          color: isActive
            ? 'var(--color-cute-border)'
            : 'var(--color-instagram-text-secondary)',
          background: getBackgroundStyle(),
          transform: isHovered ? 'scale(1.1)' : 'none',
        }}
        aria-label={item.label}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-white border-t-4 border-dashed z-50 flex items-center justify-around animate-slide-in-bottom" style={{ borderColor: 'var(--color-cute-border)', background: 'linear-gradient(0deg, #FFF5F5 0%, #FFFFFF 100%)' }}>
        {navItems.map(renderNavItem)}
      </nav>

      {/* 게시물 작성 모달 (로그인 시에만 사용) */}
      {isSignedIn && (
        <CreatePostModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* 검색 모달 */}
      <SearchModal
        open={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
      />
    </>
  );
}

