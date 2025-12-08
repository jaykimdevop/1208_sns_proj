import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * @file client.ts
 * @description Supabase 클라이언트 (인증 불필요한 공개 데이터용)
 *
 * 이 파일은 인증이 필요하지 않은 공개 데이터에 접근하기 위한 Supabase 클라이언트를 제공합니다.
 * RLS 정책이 `to anon`인 데이터만 접근할 수 있습니다.
 *
 * 주의:
 * - 이 클라이언트는 인증 토큰을 포함하지 않으므로 RLS 정책이 `to authenticated`인 데이터는 접근할 수 없습니다.
 * - 인증이 필요한 데이터에 접근하려면 `clerk-client.ts` 또는 `server.ts`의 클라이언트를 사용하세요.
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트 라이브러리
 *
 * @see {@link https://supabase.com/docs/guides/getting-started/quickstarts/nextjs} - Supabase 공식 문서
 *
 * @example
 * ```tsx
 * // Client Component에서 공개 데이터 조회
 * 'use client';
 *
 * import { supabase } from '@/lib/supabase/client';
 *
 * export default function PublicData() {
 *   useEffect(() => {
 *     async function loadData() {
 *       const { data } = await supabase.from('public_table').select('*');
 *       console.log(data);
 *     }
 *     loadData();
 *   }, []);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
