/**
 * @file layout.tsx
 * @description 루트 레이아웃 컴포넌트
 *
 * 앱 전체에 적용되는 최상위 레이아웃입니다.
 * ClerkProvider, SyncUserProvider 등 전역 프로바이더를 포함합니다.
 *
 * Note: Navbar는 제거됨 - Instagram 스타일 앱은 (main) 레이아웃의 Sidebar 사용
 *
 * @dependencies
 * - @clerk/nextjs: ClerkProvider
 * - components/providers/sync-user-provider: SyncUserProvider
 * - lib/clerk/localization: customKoKR
 */

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";

import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import { customKoKR } from "@/lib/clerk/localization";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineBanner } from "@/components/offline-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "✏️ Instasketch",
  description: "귀여운 손그림 스타일 SNS - Next.js + Clerk + Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={customKoKR}
      appearance={{
        // Tailwind CSS 4 호환성을 위한 설정
        cssLayerName: "clerk",
      }}
    >
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {/* SVG 필터 정의 (손그림 테두리 효과용) */}
          <svg className="absolute w-0 h-0" aria-hidden="true">
            <defs>
              <filter id="sketch-filter">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.04"
                  numOctaves="5"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="2"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>
          </svg>
          {/* 스킵 링크 (접근성) */}
          <a
            href="#main-content"
            className="absolute -top-40 left-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md outline-none ring-2 ring-ring focus:top-4 transition-top duration-200"
            style={{ color: "white", backgroundColor: "var(--color-cute-pink)" }}
          >
            메인 콘텐츠로 건너뛰기
          </a>
          <OfflineBanner />
          <ErrorBoundary>
            <SyncUserProvider>
              <main id="main-content">
                {children}
              </main>
            </SyncUserProvider>
          </ErrorBoundary>
          <Toaster position="bottom-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}
