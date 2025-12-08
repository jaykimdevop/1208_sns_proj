import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * @file server.ts
 * @description Clerk + Supabase 네이티브 통합 클라이언트 (Server Component/Server Action용)
 *
 * 이 파일은 서버 사이드에서 Clerk와 Supabase를 통합하는 클라이언트를 제공합니다.
 * 2025년 4월부터 권장되는 방식으로, JWT 템플릿 없이 Clerk 세션 토큰을 직접 사용합니다.
 *
 * 주요 기능:
 * 1. Server Component와 Server Action에서 사용 가능
 * 2. Clerk 세션 토큰을 Supabase 요청에 자동 주입
 * 3. 각 요청마다 최신 토큰을 가져와 사용
 *
 * 핵심 구현 로직:
 * - auth().getToken()으로 Clerk 세션 토큰 획득
 * - Supabase 클라이언트의 accessToken 옵션에 토큰 제공 함수 전달
 * - 서버 사이드에서만 실행되므로 보안이 보장됨
 *
 * 참고:
 * - Supabase 공식 문서는 `@supabase/ssr`의 cookie 기반 인증을 권장하지만,
 *   이 프로젝트는 Clerk를 사용하므로 `@supabase/supabase-js`의 `createClient`를 사용합니다.
 * - Clerk 토큰을 `accessToken` 옵션으로 전달하여 Supabase가 Clerk를 서드파티 인증 제공자로 인식합니다.
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트 라이브러리
 * - @clerk/nextjs/server: Clerk 서버 사이드 인증 라이브러리
 *
 * @see {@link https://clerk.com/docs/guides/development/integrations/databases/supabase} - Clerk 공식 문서
 * @see {@link https://supabase.com/docs/guides/auth/third-party/clerk} - Supabase 공식 문서
 * @see {@link https://supabase.com/docs/guides/getting-started/quickstarts/nextjs} - Supabase Next.js 공식 문서
 *
 * @example
 * ```tsx
 * // Server Component (Supabase 공식 문서 스타일)
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 * import { Suspense } from 'react';
 *
 * async function DataComponent() {
 *   const supabase = createClerkSupabaseClient();
 *   const { data, error } = await supabase.from('tasks').select('*');
 *
 *   if (error) {
 *     throw error;
 *   }
 *
 *   return <div>{data?.map(task => <p key={task.id}>{task.name}</p>)}</div>;
 * }
 *
 * export default function MyPage() {
 *   return (
 *     <Suspense fallback={<div>Loading...</div>}>
 *       <DataComponent />
 *     </Suspense>
 *   );
 * }
 * ```
 *
 * @example
 * ```ts
 * // Server Action
 * 'use server';
 *
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export async function addTask(name: string) {
 *   const supabase = createClerkSupabaseClient();
 *   const { data, error } = await supabase.from('tasks').insert({ name });
 *
 *   if (error) {
 *     throw new Error('Failed to add task');
 *   }
 *
 *   return data;
 * }
 * ```
 */
export function createClerkSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      try {
        // Clerk 세션 토큰 가져오기
        // 이 토큰은 Supabase가 Clerk를 서드파티 인증 제공자로 인식하도록 합니다
        const token = await (await auth()).getToken();
        return token ?? null;
      } catch (error) {
        // 인증되지 않은 요청의 경우 null 반환
        // 이 경우 RLS 정책에 따라 접근이 제한됩니다
        return null;
      }
    },
  });
}
