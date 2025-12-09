/**
 * @file layout.tsx
 * @description 인증 페이지 레이아웃
 *
 * 로그인/회원가입 페이지를 위한 간단한 레이아웃입니다.
 * Sidebar, Header, BottomNav 없이 깔끔한 인증 화면을 제공합니다.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

