# Clerk + Supabase 통합 가이드

이 문서는 Clerk와 Supabase를 통합하는 방법을 설명합니다. 2025년 4월부터 권장되는 네이티브 통합 방식을 사용합니다.

## 목차

1. [개요](#개요)
2. [설정 단계](#설정-단계)
3. [코드 사용법](#코드-사용법)
4. [RLS 정책 설정](#rls-정책-설정)
5. [문제 해결](#문제-해결)

## 개요

### 네이티브 통합의 장점

- ✅ **JWT 템플릿 불필요**: Clerk 세션 토큰을 직접 사용
- ✅ **토큰 갱신 자동화**: 각 요청마다 최신 토큰 사용
- ✅ **보안 강화**: Supabase JWT 시크릿을 Clerk와 공유할 필요 없음
- ✅ **지연 시간 감소**: Supabase 전용 JWT 생성 불필요

### 아키텍처

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │────────▶│    Clerk     │────────▶│  Supabase   │
│  Component  │         │   Session    │         │   Database   │
│             │         │    Token     │         │              │
└─────────────┘         └──────────────┘         └─────────────┘
```

1. 사용자가 Clerk를 통해 로그인
2. Clerk가 세션 토큰 생성 (자동으로 `role: authenticated` 클레임 포함)
3. Supabase 클라이언트가 Clerk 토큰을 요청 헤더에 포함
4. Supabase가 Clerk를 서드파티 인증 제공자로 인식하여 토큰 검증
5. RLS 정책에 따라 데이터 접근 제어

## 설정 단계

### 1. Clerk 대시보드 설정

1. [Clerk Dashboard](https://dashboard.clerk.com)에 로그인
2. **Integrations** → **Supabase**로 이동
3. **Activate Supabase integration** 클릭
4. **Clerk domain** 복사 (예: `your-app.clerk.accounts.dev`)

### 2. Supabase 대시보드 설정

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. **Authentication** → **Sign In / Up** → **Third-Party Auth**로 이동
4. **Add provider** 클릭
5. **Clerk** 선택
6. Clerk Dashboard에서 복사한 **Clerk domain** 입력
7. **Save** 클릭

### 3. 환경 변수 설정

`.env` 파일에 다음 변수들이 설정되어 있는지 확인:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # 서버 사이드 전용
```

## 코드 사용법

### Client Component에서 사용

Clerk 공식 문서의 예시를 기반으로 작성되었습니다:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession, useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  // useUser()는 Clerk가 사용자 데이터를 로드했는지 확인하는 데 사용됩니다
  const { user, isLoaded: isUserLoaded } = useUser();
  // useSession()은 Clerk 세션 객체를 가져오는 데 사용됩니다
  const { session } = useSession();

  // Clerk 세션 토큰을 사용하는 Supabase 클라이언트
  const supabase = useClerkSupabaseClient();

  // 사용자 데이터가 로드된 후 tasks를 가져옵니다
  useEffect(() => {
    if (!isUserLoaded || !user) return;

    async function loadTasks() {
      setLoading(true);
      const { data, error } = await supabase.from('tasks').select();

      if (error) {
        console.error('Error loading tasks:', error);
        setLoading(false);
        return;
      }

      setTasks(data || []);
      setLoading(false);
    }

    loadTasks();
  }, [user, isUserLoaded, supabase]);

  async function createTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // tasks 테이블에 새 task 삽입
    const { error } = await supabase.from('tasks').insert({ name });

    if (error) {
      console.error('Error creating task:', error);
      return;
    }

    // 성공 시 폼 초기화 및 목록 새로고침
    setName('');
    window.location.reload();
  }

  if (!isUserLoaded) return <div>Loading...</div>;
  if (!user) return <div>Please sign in to view your tasks.</div>;

  return (
    <div>
      <h1>My Tasks</h1>

      {loading && <p>Loading tasks...</p>}

      {!loading && tasks.length > 0 && (
        <ul>
          {tasks.map((task: any) => (
            <li key={task.id}>{task.name}</li>
          ))}
        </ul>
      )}

      {!loading && tasks.length === 0 && (
        <p>No tasks found. Create your first task below!</p>
      )}

      <form onSubmit={createTask}>
        <input
          autoFocus
          type="text"
          name="name"
          placeholder="Enter new task"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
```

**실제 예시**: `/tasks-example` 페이지에서 확인할 수 있습니다.

### Server Component에서 사용

Supabase 공식 문서의 예시를 기반으로 작성되었습니다:

```tsx
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

// 데이터를 가져오는 비동기 컴포넌트
async function TasksData() {
  const supabase = createClerkSupabaseClient();
  const { data: tasks, error } = await supabase.from('tasks').select();

  if (error) {
    // 에러를 throw하여 Next.js의 에러 바운더리가 처리하도록 합니다
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  return (
    <div>
      {tasks && tasks.length > 0 ? (
        <ul>
          {tasks.map((task: any) => (
            <li key={task.id}>{task.name}</li>
          ))}
        </ul>
      ) : (
        <p>No tasks found.</p>
      )}
    </div>
  );
}

// Suspense로 감싸서 로딩 상태 처리
export default function TasksPage() {
  return (
    <div>
      <h1>My Tasks</h1>
      <Suspense fallback={<div>Loading tasks...</div>}>
        <TasksData />
      </Suspense>
    </div>
  );
}
```

**실제 예시**: `/instruments` 페이지에서 Supabase 공식 문서 스타일의 예시를 확인할 수 있습니다.

### Server Action에서 사용

```ts
'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function addTask(name: string) {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('tasks')
    .insert({ name });

  if (error) {
    throw new Error(`Failed to add task: ${error.message}`);
  }

  return data;
}
```

## RLS 정책 설정

### 기본 원칙

1. **Clerk User ID 확인**: `auth.jwt()->>'sub'`를 사용하여 현재 사용자의 Clerk ID 확인
2. **정책 세분화**: SELECT, INSERT, UPDATE, DELETE별로 각각 정책 작성
3. **authenticated 역할**: 모든 정책은 `TO authenticated`로 제한

### 예시: tasks 테이블

```sql
-- 테이블 생성
CREATE TABLE public.tasks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT (auth.jwt()->>'sub'),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 활성화
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- SELECT 정책: 자신의 tasks만 조회
CREATE POLICY "User can view their own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- INSERT 정책: 자신의 tasks만 생성
CREATE POLICY "Users must insert their own tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- UPDATE 정책: 자신의 tasks만 수정
CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = user_id
)
WITH CHECK (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- DELETE 정책: 자신의 tasks만 삭제
CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = user_id
);
```

### 예시: users 테이블

```sql
-- SELECT 정책: 자신의 프로필만 조회
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = clerk_id
);

-- UPDATE 정책: 자신의 프로필만 수정
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = clerk_id
)
WITH CHECK (
    (SELECT auth.jwt()->>'sub') = clerk_id
);
```

### RLS 정책 확인

```sql
-- 활성화된 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 문제 해결

### 문제: "Invalid JWT" 오류

**원인**: Supabase가 Clerk 토큰을 인식하지 못함

**해결 방법**:
1. Supabase 대시보드에서 Clerk 통합이 올바르게 설정되었는지 확인
2. Clerk domain이 정확히 입력되었는지 확인
3. Clerk Dashboard에서 Supabase 통합이 활성화되어 있는지 확인

### 문제: RLS 정책이 작동하지 않음

**원인**: 
- RLS가 비활성화되어 있음
- 정책이 올바르게 작성되지 않음
- 토큰이 전달되지 않음

**해결 방법**:
1. RLS 활성화 확인:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
2. 정책 확인:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'your_table';
   ```
3. 클라이언트에서 토큰이 전달되는지 확인:
   ```tsx
   const supabase = useClerkSupabaseClient();
   // 네트워크 탭에서 Authorization 헤더 확인
   ```

### 문제: "Unauthorized" 오류

**원인**: 사용자가 로그인하지 않았거나 토큰이 만료됨

**해결 방법**:
1. Clerk 인증 상태 확인:
   ```tsx
   const { isSignedIn, userId } = useAuth();
   ```
2. 토큰 갱신 확인 (자동으로 처리됨)
3. 미들웨어에서 인증이 보호되는지 확인

### 문제: 개발 환경에서 RLS 비활성화

개발 중에는 RLS를 비활성화할 수 있습니다:

```sql
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
```

⚠️ **주의**: 프로덕션에서는 반드시 RLS를 활성화하고 적절한 정책을 설정해야 합니다.

## 예시 코드

프로젝트에 포함된 예시:

- **`/tasks-example`**: Clerk 공식 문서 예시를 기반으로 한 Tasks 페이지 (인증 필요)
- **`/instruments`**: Supabase 공식 문서 예시를 기반으로 한 Instruments 페이지 (공개 데이터)
- **`/auth-test`**: Clerk + Supabase 인증 통합 테스트 페이지

## 참고 자료

- [Clerk 공식 문서: Supabase 통합](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase 공식 문서: Clerk 통합](https://supabase.com/docs/guides/auth/third-party/clerk)
- [Supabase 공식 문서: Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Clerk + Supabase 예제 저장소](https://github.com/clerk/clerk-supabase-nextjs)

## 추가 정보

### 토큰 구조

Clerk 세션 토큰은 다음과 같은 구조를 가집니다:

```json
{
  "sub": "user_2abc123...",  // Clerk User ID
  "role": "authenticated",    // Supabase가 인식하는 역할
  "iat": 1234567890,
  "exp": 1234571490
}
```

### 보안 고려사항

1. **환경 변수 보호**: `.env` 파일을 Git에 커밋하지 마세요
2. **Service Role Key**: 서버 사이드에서만 사용하고 클라이언트에 노출하지 마세요
3. **RLS 정책**: 프로덕션에서는 반드시 활성화하고 테스트하세요
4. **토큰 검증**: Supabase가 자동으로 토큰을 검증하므로 추가 검증이 필요 없습니다

