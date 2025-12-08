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
  title: "Mini Instagram",
  description: "Instagram Clone SNS - Next.js + Clerk + Supabase",
  icons: {
    icon: "/favicon.ico",
  },
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
          <SyncUserProvider>
            {children}
          </SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
