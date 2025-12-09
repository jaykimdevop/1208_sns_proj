/**
 * @file page.tsx
 * @description Clerk 회원가입 페이지
 *
 * Clerk의 SignUp 컴포넌트를 사용하여 회원가입 UI를 제공합니다.
 * - Google OAuth 지원
 * - 한국어 로컬라이제이션
 *
 * @dependencies
 * - @clerk/nextjs: SignUp 컴포넌트
 */

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignUp
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

