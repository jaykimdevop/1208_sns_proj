/**
 * @file page.tsx
 * @description Clerk 로그인 페이지
 *
 * Clerk의 SignIn 컴포넌트를 사용하여 로그인 UI를 제공합니다.
 * - Google OAuth 지원
 * - 한국어 로컬라이제이션
 *
 * @dependencies
 * - @clerk/nextjs: SignIn 컴포넌트
 */

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
      />
    </div>
  );
}

