/**
 * @file layout.tsx
 * @description 메인 앱 레이아웃 컴포넌트
 *
 * Instagram 스타일 반응형 레이아웃:
 * - Desktop: Sidebar(244px) + Content(max-w-[630px] 중앙)
 * - Tablet: Sidebar(72px) + Content(전체 너비)
 * - Mobile: Header(60px) + Content + BottomNav(50px)
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

      {/* Header: Mobile 전용 */}
      <Header />

      {/* Main Content */}
      <main
        className={`
          pt-0 pb-0
          md:pl-[72px] md:pt-0
          lg:pl-[244px] lg:pt-0
          min-h-screen
        `}
      >
        {/* Mobile: Header 높이만큼 상단 패딩 */}
        <div className="pt-[60px] pb-[50px] lg:pt-0 lg:pb-0">
          {/* Content Container: Desktop에서 최대 630px 중앙 정렬 */}
          <div className="max-w-[630px] mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* BottomNav: Mobile 전용 */}
      <BottomNav />
    </div>
  );
}

