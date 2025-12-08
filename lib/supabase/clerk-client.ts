"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession, useUser } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * @file clerk-client.ts
 * @description Clerk + Supabase 네이티브 통합 클라이언트 (Client Component용)
 *
 * 이 파일은 Clerk와 Supabase의 네이티브 통합을 제공합니다.
 * 2025년 4월부터 권장되는 방식으로, JWT 템플릿 없이 Clerk 세션 토큰을 직접 사용합니다.
 *
 * 주요 기능:
 * 1. Clerk 세션 토큰을 Supabase 요청에 자동 주입
 * 2. React Hook으로 제공되어 Client Component에서 사용
 * 3. 토큰이 자동으로 갱신되어 각 요청마다 최신 토큰 사용
 *
 * 핵심 구현 로직:
 * - useSession()으로 Clerk 세션 객체 획득
 * - useUser()로 사용자 정보 확인 (로딩 상태 체크)
 * - session?.getToken()으로 Clerk 세션 토큰 획득
 * - Supabase 클라이언트의 accessToken 옵션에 토큰 제공 함수 전달
 * - useMemo로 클라이언트 인스턴스 메모이제이션 (성능 최적화)
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트 라이브러리
 * - @clerk/nextjs: Clerk 인증 라이브러리
 *
 * @see {@link https://clerk.com/docs/guides/development/integrations/databases/supabase} - Clerk 공식 문서
 * @see {@link https://supabase.com/docs/guides/auth/third-party/clerk} - Supabase 공식 문서
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
 * import { useEffect, useState } from 'react';
 *
 * export default function TasksPage() {
 *   const supabase = useClerkSupabaseClient();
 *   const [tasks, setTasks] = useState([]);
 *
 *   useEffect(() => {
 *     async function loadTasks() {
 *       const { data, error } = await supabase.from('tasks').select('*');
 *       if (error) {
 *         console.error('Error:', error);
 *         return;
 *       }
 *       setTasks(data || []);
 *     }
 *     loadTasks();
 *   }, [supabase]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useClerkSupabaseClient(): SupabaseClient {
  // useUser()는 Clerk가 사용자 데이터를 로드했는지 확인하는 데 사용됩니다
  const { isLoaded: isUserLoaded } = useUser();
  // useSession()은 Clerk 세션 객체를 가져오는 데 사용됩니다
  // 세션 객체는 getToken() 메서드를 통해 세션 토큰을 가져오는 데 사용됩니다
  const { session } = useSession();

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    return createClient(supabaseUrl, supabaseKey, {
      async accessToken() {
        // Clerk가 사용자 데이터를 로드하지 않았거나 세션이 없으면 null 반환
        if (!isUserLoaded || !session) {
          return null;
        }

        try {
          // Clerk 세션 토큰 가져오기
          // 이 토큰은 Supabase가 Clerk를 서드파티 인증 제공자로 인식하도록 합니다
          // Clerk Supabase 통합이 활성화되면 이 토큰에는 자동으로 "role": "authenticated" 클레임이 포함됩니다
          const token = await session.getToken();
          return token ?? null;
        } catch (error) {
          console.error("Failed to get Clerk token:", error);
          return null;
        }
      },
    });
  }, [session, isUserLoaded]);

  return supabase;
}
