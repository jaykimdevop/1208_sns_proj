# Supabase Next.js Quickstart 가이드

이 문서는 [Supabase 공식 문서](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)를 기반으로 작성되었습니다.

## 개요

이 프로젝트는 Clerk를 사용하므로 Supabase의 기본 인증 대신 Clerk 토큰을 사용합니다. 하지만 Supabase의 데이터베이스 기능은 동일하게 사용할 수 있습니다.

## Supabase 프로젝트 설정

### 1. Supabase 프로젝트 생성

1. [database.new](https://database.new)에 접속하여 새 Supabase 프로젝트 생성
2. 또는 [Supabase Dashboard](https://supabase.com/dashboard)에서 프로젝트 생성

### 2. 환경 변수 설정

`.env` 파일에 다음 변수들이 설정되어 있는지 확인:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # 서버 사이드 전용
```

## Supabase 클라이언트 사용법

### 공개 데이터 조회 (인증 불필요)

```tsx
// Client Component
'use client';

import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function PublicData() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('public_table')
        .select('*');

      if (error) {
        console.error('Error:', error);
        return;
      }

      setData(data || []);
    }

    loadData();
  }, []);

  return <div>{/* 데이터 표시 */}</div>;
}
```

### 인증이 필요한 데이터 조회 (Clerk 사용)

```tsx
// Client Component
'use client';

import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function ProtectedData() {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    async function loadData() {
      const { data, error } = await supabase
        .from('protected_table')
        .select('*');

      if (error) {
        console.error('Error:', error);
        return;
      }

      setData(data || []);
    }

    loadData();
  }, [user, isLoaded, supabase]);

  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return <div>{/* 데이터 표시 */}</div>;
}
```

### Server Component에서 사용

```tsx
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

async function DataComponent() {
  const supabase = createClerkSupabaseClient();
  const { data, error } = await supabase.from('table').select();

  if (error) {
    throw new Error(`Failed to fetch data: ${error.message}`);
  }

  return <div>{/* 데이터 표시 */}</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DataComponent />
    </Suspense>
  );
}
```

## 예시: Instruments 테이블 생성

Supabase 공식 문서의 예시를 따라 `instruments` 테이블을 생성할 수 있습니다:

### 1. SQL Editor에서 실행

```sql
-- 테이블 생성
create table instruments (
  id bigint primary key generated always as identity,
  name text not null
);

-- 샘플 데이터 삽입
insert into instruments (name) values
  ('violin'),
  ('viola'),
  ('cello');

-- RLS 활성화
alter table instruments enable row level security;

-- 공개 읽기 정책 추가
create policy "public can read instruments"
on public.instruments
for select
to anon
using (true);
```

### 2. 페이지에서 확인

`/instruments` 페이지를 방문하여 데이터가 올바르게 표시되는지 확인합니다.

## RLS 정책 설정

### 공개 데이터 (anon 역할)

```sql
-- 모든 사용자가 읽을 수 있음
create policy "public can read table"
on public.table_name
for select
to anon
using (true);
```

### 인증된 사용자만 접근 (authenticated 역할)

```sql
-- Clerk User ID를 사용하여 자신의 데이터만 접근
create policy "Users can view their own data"
on public.table_name
for select
to authenticated
using (
  (SELECT auth.jwt()->>'sub') = user_id
);
```

## 참고 자료

- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Clerk + Supabase 통합 가이드](./CLERK_SUPABASE_INTEGRATION.md)

