import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { Suspense } from "react";

/**
 * Supabase 공식 문서 예시 기반 Instruments 페이지
 *
 * 이 페이지는 Supabase 공식 문서의 Next.js Quickstart 예시를 기반으로 작성되었습니다.
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 *
 * 사용 방법:
 * 1. Supabase 대시보드의 SQL Editor에서 다음 SQL을 실행하여 테이블 생성:
 *
 * ```sql
 * create table instruments (
 *   id bigint primary key generated always as identity,
 *   name text not null
 * );
 *
 * insert into instruments (name) values
 *   ('violin'),
 *   ('viola'),
 *   ('cello');
 *
 * alter table instruments enable row level security;
 *
 * create policy "public can read instruments"
 * on public.instruments
 * for select
 * to anon
 * using (true);
 * ```
 *
 * 2. 이 페이지를 방문하여 데이터 확인
 */
async function InstrumentsData() {
  const supabase = createClerkSupabaseClient();
  const { data: instruments, error } = await supabase
    .from("instruments")
    .select();

  if (error) {
    // 에러를 throw하여 Next.js의 에러 바운더리가 처리하도록 합니다
    throw new Error(`Failed to fetch instruments: ${error.message}`);
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Instruments</h1>

      {instruments && instruments.length > 0 ? (
        <ul className="space-y-2">
          {instruments.map((instrument: any) => (
            <li
              key={instrument.id}
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              {instrument.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">
          No instruments found. Please create the instruments table in Supabase.
        </p>
      )}

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> This page demonstrates Supabase integration
          following the official documentation. Make sure you have created the
          instruments table in your Supabase project.
        </p>
      </div>
    </div>
  );
}

export default function Instruments() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4">Loading instruments...</div>}>
      <InstrumentsData />
    </Suspense>
  );
}

