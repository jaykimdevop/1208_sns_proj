/**
 * @file page.tsx
 * @description 데모/테스트 페이지
 *
 * SaaS 템플릿의 기능 테스트를 위한 페이지입니다.
 * Storage 테스트, Auth 테스트 등의 링크를 제공합니다.
 *
 * @route /demo
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RiSupabaseFill } from "react-icons/ri";

export default function DemoPage() {
  return (
    <main className="min-h-screen flex items-center px-8 py-16 lg:py-24 bg-white">
      <section className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start lg:items-center">
        {/* 좌측: 환영 메시지 */}
        <div className="flex flex-col gap-8">
          <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
            SaaS 앱 템플릿 데모
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Next.js, Shadcn, Clerk, Supabase, TailwindCSS로 구동되는 완전한
            기능의 템플릿으로 다음 프로젝트를 시작하세요.
          </p>
          <Link href="/" className="text-blue-500 hover:underline">
            ← 홈으로 돌아가기
          </Link>
        </div>

        {/* 우측: 버튼 두 개 세로 정렬 */}
        <div className="flex flex-col gap-6">
          <Link href="/storage-test" className="w-full">
            <Button className="w-full h-28 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl transition-shadow">
              <RiSupabaseFill className="w-8 h-8" />
              <span>Storage 파일 업로드 테스트</span>
            </Button>
          </Link>
          <Link href="/auth-test" className="w-full">
            <Button
              className="w-full h-28 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl transition-shadow"
              variant="outline"
            >
              <RiSupabaseFill className="w-8 h-8" />
              <span>Clerk + Supabase 인증 연동</span>
            </Button>
          </Link>
          <Link href="/tasks-example" className="w-full">
            <Button
              className="w-full h-28 flex items-center justify-center gap-4 text-xl shadow-lg hover:shadow-xl transition-shadow"
              variant="outline"
            >
              <RiSupabaseFill className="w-8 h-8" />
              <span>Tasks 예제 (Clerk + Supabase)</span>
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

