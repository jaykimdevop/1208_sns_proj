/**
 * @file layout.tsx
 * @description 메인 앱 레이아웃 컴포넌트
 *
 * Instagram 스타일 반응형 레이아웃:
 * - Desktop (≥1024px): Sidebar(244px) + Content(max-w-[630px] 중앙), Header/BottomNav 숨김
 * - Tablet (768px~1023px): Sidebar(72px) + Content(전체 너비), Header/BottomNav 숨김
 * - Mobile (<768px): Header(60px) + Content + BottomNav(50px), Sidebar 숨김
 * - 배경색: #FAFAFA
 *
 * @dependencies
 * - components/layout/Sidebar: 사이드바 컴포넌트
 * - components/layout/Header: 모바일 헤더 컴포넌트
 * - components/layout/BottomNav: 하단 네비게이션 컴포넌트
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-instagram-background)' }}>
      {/* Sidebar: Desktop/Tablet 전용 */}
      <Sidebar />

      {/* Header: Mobile 전용 (md:hidden으로 태블릿 이상에서 숨김) */}
      <Header />

      {/* Main Content */}
      {/* 
        전역 CSS의 main 스타일과 충돌 방지를 위해 명시적으로 스타일 재정의
        - max-w-none: 전역 max-w-7xl 오버라이드
        - mx-0: 전역 mx-auto 오버라이드
        - pt-0: 전역 pt-16 오버라이드
        - px-0: 전역 px-4 오버라이드
      */}
      <main
        className="max-w-none mx-0 pt-0 px-0 pb-0 md:pl-[72px] lg:pl-[244px] min-h-screen"
      >
        {/* 
          Mobile만 패딩 적용 (<768px)
          Tablet (≥768px)에서는 Header/BottomNav가 숨겨지므로 패딩 불필요
          md:pt-0 md:pb-0으로 태블릿부터 패딩 제거
        */}
        <div className="pt-[60px] pb-[50px] md:pt-0 md:pb-0">
          {/* Content Container: Desktop에서 최대 630px 중앙 정렬 */}
          <div className="max-w-[630px] mx-auto px-4">
            {children}
          </div>
        </div>
      </main>

      {/* BottomNav: Mobile 전용 (md:hidden으로 태블릿 이상에서 숨김) */}
      <BottomNav />
    </div>
  );
}

