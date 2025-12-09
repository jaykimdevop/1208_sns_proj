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

// 로그인 사용자용 네비게이션
const signedInNavItems: NavItem[] = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/search", icon: Search, label: "검색" },
  { href: "/create", icon: PlusSquare, label: "만들기", isButton: true },
  { href: "/profile", icon: User, label: "프로필" },
];

// 미로그인 사용자용 네비게이션
const signedOutNavItems: NavItem[] = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/search", icon: Search, label: "검색" },
  { href: "/sign-in", icon: LogIn, label: "로그인" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

    // "만들기" 버튼은 Link 대신 button으로 렌더링
    if (item.isButton) {
      return (
        <button
          key={item.href}
          onClick={() => setIsCreateModalOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
          style={{ color: 'var(--color-instagram-text-secondary)' }}
          aria-label={item.label}
        >
          <Icon size={24} />
        </button>
      );
    }

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
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-white border-t z-50 flex items-center justify-around" style={{ borderColor: 'var(--color-instagram-border)' }}>
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
    </>
  );
}

