# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Next.js 15.5.6** with React 19 and App Router
- **Authentication**: Clerk (with Korean localization - 커스텀 에러 메시지 포함)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4 (uses `globals.css`, no config file)
- **UI Components**: shadcn/ui (based on Radix UI)
- **Icons**: lucide-react
- **Forms**: react-hook-form + Zod
- **Package Manager**: pnpm
- **Language**: TypeScript (strict typing required)

## Development Commands

```bash
# Development server with turbopack
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

## Project Architecture

### Clerk + Supabase Integration

이 프로젝트는 Clerk와 Supabase의 네이티브 통합 (2025년 4월 이후 권장 방식)을 사용합니다.

**📖 상세 가이드**: [CLERK_SUPABASE_INTEGRATION.md](docs/CLERK_SUPABASE_INTEGRATION.md) 참고

#### 네이티브 통합의 장점

- ✅ **JWT 템플릿 불필요**: Clerk 세션 토큰을 직접 사용
- ✅ **토큰 갱신 자동화**: 각 요청마다 최신 토큰 사용
- ✅ **보안 강화**: Supabase JWT 시크릿을 Clerk와 공유할 필요 없음
- ✅ **지연 시간 감소**: Supabase 전용 JWT 생성 불필요

#### 인증 흐름

1. Clerk가 사용자 인증 처리
2. `SyncUserProvider`가 로그인 시 자동으로 Clerk 사용자를 Supabase `users` 테이블에 동기화
3. Supabase 클라이언트가 Clerk 토큰을 사용하여 인증 (JWT 템플릿 불필요)
4. RLS 정책이 `auth.jwt()->>'sub'`로 Clerk user ID 확인하여 데이터 접근 제어

#### Supabase 클라이언트 파일들 (`lib/supabase/`)

- **`clerk-client.ts`**: Client Component용 (`useClerkSupabaseClient` hook)
  - Clerk 세션 토큰으로 인증된 사용자의 데이터 접근
  - React Hook으로 제공되어 컴포넌트에서 직접 사용
  - `useSession()`과 `useUser()`를 사용하여 Clerk 공식 문서 예시와 일치
  - `session?.getToken()`으로 최신 토큰 자동 획득

- **`server.ts`**: Server Component/Server Action용 (`createClerkSupabaseClient`)
  - 서버 사이드에서 Clerk 인증 사용
  - `auth().getToken()`으로 세션 토큰 획득
  - 각 요청마다 새로운 클라이언트 인스턴스 생성

- **`service-role.ts`**: 관리자 권한 작업용 (`getServiceRoleClient`)
  - RLS 우회, 서버 사이드 전용
  - `SUPABASE_SERVICE_ROLE_KEY` 사용
  - 사용자 동기화 등 관리 작업에 사용

- **`client.ts`**: 인증 불필요한 공개 데이터용
  - anon key만 사용
  - RLS 정책이 `to anon`인 데이터만 접근

#### 사용자 동기화

- `hooks/use-sync-user.ts`: Clerk → Supabase 사용자 동기화 훅
- `components/providers/sync-user-provider.tsx`: RootLayout에서 자동 실행
- `app/api/sync-user/route.ts`: 실제 동기화 로직 (API 라우트)

#### RLS 정책

- 예시 마이그레이션: `supabase/migrations/20250103000000_add_rls_policies_example.sql`
- Clerk User ID 확인: `auth.jwt()->>'sub'` 사용
- 정책 세분화: SELECT, INSERT, UPDATE, DELETE별로 각각 작성
- 개발 중에는 RLS 비활성화 가능, 프로덕션에서는 필수 활성화

### Directory Convention

프로젝트 파일은 `app` 외부에 저장:

- `app/`: 라우팅 전용 (page.tsx, layout.tsx, route.ts 등만)
- `components/`: 재사용 가능한 컴포넌트
  - `components/ui/`: shadcn 컴포넌트 (자동 생성, 수정 금지)
  - `components/providers/`: React Context 프로바이더들
- `lib/`: 유틸리티 함수 및 클라이언트 설정
  - `lib/supabase/`: Supabase 클라이언트들 (환경별로 분리)
  - `lib/utils.ts`: 공통 유틸리티 (cn 함수 등)
- `hooks/`: 커스텀 React Hook들
  - `hooks/use-sync-user.ts`: Clerk → Supabase 사용자 동기화
  - `hooks/use-media-query.ts`: 반응형 미디어 쿼리 훅
- `supabase/`: 데이터베이스 마이그레이션 및 설정
  - `supabase/migrations/`: SQL 마이그레이션 파일들
  - `supabase/config.toml`: Supabase 프로젝트 설정

**예정된 디렉토리** (아직 없지만 필요 시 생성):

- `actions/`: Server Actions (API 대신 우선 사용)
- `types/`: TypeScript 타입 정의
- `constants/`: 상수 값들
- `states/`: 전역 상태 (jotai 사용, 최소화)

### Naming Conventions

- **파일명**: kebab-case (예: `use-sync-user.ts`, `sync-user-provider.tsx`)
- **컴포넌트**: PascalCase (파일명은 여전히 kebab-case)
- **함수/변수**: camelCase
- **타입/인터페이스**: PascalCase

## Database

### Supabase Migrations

마이그레이션 파일 명명 규칙: `YYYYMMDDHHmmss_description.sql`

예시:

```
supabase/migrations/20241030014800_create_users_table.sql
```

**중요**:

- 새 테이블 생성 시 반드시 Row Level Security (RLS) 활성화
- 개발 중에는 RLS를 비활성화할 수 있으나, 프로덕션에서는 활성화 필수
- RLS 정책은 세분화: select, insert, update, delete별로 각각 작성
- `anon`과 `authenticated` 역할별로 별도 정책 작성

### 현재 스키마

#### 데이터베이스 테이블

- `users`: Clerk 사용자와 동기화되는 사용자 정보
  - `id`: UUID (Primary Key)
  - `clerk_id`: TEXT (Unique, Clerk User ID)
  - `name`: TEXT
  - `created_at`: TIMESTAMP
  - RLS: 개발 중 비활성화 (프로덕션에서는 활성화 필요)

#### Storage 버킷

- `uploads`: 사용자 파일 저장소
  - 경로 구조: `{clerk_user_id}/{filename}`
  - RLS 정책:
    - INSERT: 인증된 사용자만 자신의 폴더에 업로드 가능
    - SELECT: 인증된 사용자만 자신의 파일 조회 가능
    - DELETE: 인증된 사용자만 자신의 파일 삭제 가능
    - UPDATE: 인증된 사용자만 자신의 파일 업데이트 가능
  - 정책은 `auth.jwt()->>'sub'` (Clerk user ID)로 사용자 확인

## Environment Variables

`.env.example` 참고하여 `.env` 파일 생성:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

## Development Guidelines

### Server Actions vs API Routes

**우선순위**: Server Actions > API Routes

- 가능하면 항상 Server Actions 사용 (`actions/` 디렉토리)
- API Routes는 불가피한 경우에만 사용 (웹훅, 외부 API 등)
- 현재 `/api/sync-user`는 기존 구조상 API Route로 구현됨

### UI Components

1. **shadcn/ui 설치 확인**: 사용 전 `/components/ui/` 디렉토리 체크
2. **설치 명령어**: `pnpx shadcn@latest add [component-name]`
3. **아이콘**: lucide-react 사용 (`import { Icon } from 'lucide-react'`)

### Styling

- Tailwind CSS v4 사용 (설정은 `app/globals.css`에만)
- `tailwind.config.js` 파일은 사용하지 않음
- 다크/라이트 모드 지원 고려

### TypeScript

- 모든 코드에 타입 정의 필수
- 인터페이스 우선, 타입은 필요시만
- enum 대신 const 객체 사용
- `satisfies` 연산자로 타입 검증

### React 19 & Next.js 15 Patterns

```typescript
// Async Request APIs (항상 await 사용)
const cookieStore = await cookies();
const headersList = await headers();
const params = await props.params;
const searchParams = await props.searchParams;

// Server Component 우선
// 'use client'는 필요한 경우에만
```

## Key Files

- `middleware.ts`: Clerk 미들웨어 (인증 라우트 보호)
- `app/layout.tsx`: RootLayout with ClerkProvider + SyncUserProvider
- `lib/supabase.ts`: 레거시 Supabase 클라이언트 (사용 지양, 새 파일들 사용)
- `components.json`: shadcn/ui 설정

## Feature Components

### 게시물 상세 (Phase 7)

게시물 상세 보기는 화면 크기에 따라 다르게 동작합니다:

- **Desktop (768px 이상)**: `PostModal` 컴포넌트로 모달 형식 표시
  - 좌측 50%: 이미지
  - 우측 50%: 헤더, 캡션, 댓글 목록, 액션 버튼, 댓글 입력
  - 닫기 버튼 및 이전/다음 게시물 네비게이션
  - 키보드 화살표로 이전/다음 이동

- **Mobile (768px 미만)**: `/post/[postId]` 라우트로 전체 페이지 이동
  - 뒤로가기 버튼
  - 세로 스크롤 레이아웃

#### 관련 파일들

- `components/post/post-modal.tsx`: Desktop 모달 컴포넌트
- `components/comment/comment-list.tsx`: Thread 형식 댓글 목록 + 삭제 기능
- `components/comment/CommentForm.tsx`: 댓글/답글 입력 폼
- `app/(main)/post/[postId]/page.tsx`: Mobile 전용 상세 페이지
- `app/(main)/post/[postId]/post-detail-client.tsx`: 상세 페이지 클라이언트 컴포넌트
- `hooks/use-media-query.ts`: 반응형 분기를 위한 미디어 쿼리 훅

#### 댓글 기능

- **댓글 정렬**: 루트 댓글은 최신순, 답글은 오래된 순
- **Thread 형식 (1단계 답글)**:
  - `comments.parent_id` 컬럼으로 부모-자식 관계 표현
  - 답글에는 답글 불가 (1단계 깊이 제한)
  - "답글 N개 보기" / "답글 숨기기" 접기/펼치기 토글
  - 답글은 들여쓰기로 시각적 구분
- **답글 달기**:
  - "답글 달기" 버튼 클릭 시 답글 모드 활성화
  - "@사용자명" 자동 입력
  - 답글 모드 표시 ("@사용자명님에게 답글 남기는 중")
  - ESC 키 또는 X 버튼으로 답글 모드 취소
- **댓글 삭제**:
  - 본인 댓글에만 삭제 버튼 표시
  - 삭제 시 AlertDialog로 확인 요청
  - 루트 댓글 삭제 시 답글도 함께 삭제 (CASCADE)
  - API: `DELETE /api/comments`

#### 댓글 API

- `GET /api/comments?post_id={postId}`: Thread 형식 댓글 목록 조회
- `POST /api/comments`: 댓글/답글 작성 (`parent_id` 파라미터로 답글 구분)
- `DELETE /api/comments`: 댓글 삭제

#### 타입 정의 (`lib/types.ts`)

- `Comment`: 기본 댓글 타입 (`parent_id` 포함)
- `CommentWithUser`: 사용자 정보 포함 댓글
- `CommentWithReplies`: 답글 포함 댓글 (Thread 형식)
- `ThreadedCommentsResponse`: Thread 형식 댓글 목록 API 응답

### 팔로우 기능 (Phase 9)

사용자 간 팔로우/언팔로우 기능을 제공합니다.

#### 관련 파일들

- `app/api/follows/route.ts`: 팔로우 API (POST: 팔로우, DELETE: 언팔로우)
- `components/profile/follow-button.tsx`: 팔로우 버튼 컴포넌트

#### 팔로우 API

- `POST /api/follows`: 팔로우 추가
  - Body: `{ following_id: string }`
  - Clerk 인증 필수
  - 자기 자신 팔로우 방지
  - 중복 팔로우 에러 처리
- `DELETE /api/follows`: 팔로우 제거
  - Body: `{ following_id: string }`
  - Clerk 인증 필수

#### FollowButton 컴포넌트

- Props: `userId`, `initialIsFollowing`, `onFollowChange?`
- UI 상태:
  - 미팔로우: 파란색 "팔로우" 버튼
  - 팔로우 중: 회색 테두리 "팔로잉" 버튼
  - Hover (팔로우 중): 빨간색 테두리 "언팔로우" 텍스트
- Optimistic UI 업데이트 (에러 시 롤백)
- 로딩 상태 표시

#### 타입 정의 (`lib/types.ts`)

- `Follow`: 팔로우 관계 타입
- `FollowRequest`: 팔로우 API 요청 타입
- `FollowResponse`: 팔로우 API 응답 타입

### 인증 기반 UX (Phase 9.5)

미로그인 사용자를 위한 UX를 개선합니다.

#### 인증 페이지

- `app/(auth)/sign-in/[[...sign-in]]/page.tsx`: Clerk 로그인 페이지
- `app/(auth)/sign-up/[[...sign-up]]/page.tsx`: Clerk 회원가입 페이지
- `app/(auth)/layout.tsx`: 인증 페이지 레이아웃 (Sidebar/Header 없음)

#### 로그인 상태에 따른 UI 분기

- **Sidebar/BottomNav/Header**:
  - 로그인 시: 홈, 검색, 만들기, 프로필, 로그아웃
  - 미로그인 시: 홈, 검색, 로그인
- **CommentForm**: 미로그인 시 "로그인하고 댓글을 남겨보세요" 표시, 클릭 시 `/sign-in` 이동
- **LikeButton/FollowButton**: 미로그인 시 클릭하면 `/sign-in` 이동
- **게시물 작성자 프로필**: 미로그인 사용자도 접근 가능

#### 구현 컴포넌트

- `components/layout/Sidebar.tsx`: `isSignedIn` 상태에 따라 네비게이션 아이템 동적 생성
- `components/layout/BottomNav.tsx`: `isSignedIn` 상태에 따라 네비게이션 아이템 동적 생성
- `components/layout/Header.tsx`: 미로그인 시 로그인 버튼 표시
- `components/comment/CommentForm.tsx`: `isSignedIn` 체크 후 로그인 유도
- `components/post/LikeButton.tsx`: `isSignedIn` 체크 후 로그인 유도
- `components/profile/follow-button.tsx`: `isSignedIn` 체크 후 로그인 유도

### 게시물 관리 기능 (Phase 10)

게시물의 공유, 북마크, 삭제 기능을 제공합니다.

#### 공유 기능

- 공유 버튼 클릭 시 게시물 URL을 클립보드에 복사
- Sonner 토스트로 복사 성공/실패 피드백
- 미로그인 시 로그인 페이지로 리다이렉트

#### 북마크 기능

- **DB 테이블**: `bookmarks` (user_id, post_id)
- **API**: `app/api/bookmarks/route.ts`
  - GET: 북마크된 게시물 목록 조회
  - POST: 북마크 추가
  - DELETE: 북마크 제거
- **UI**: 빈 북마크 아이콘 ↔ 채워진 북마크 아이콘
- Optimistic UI 업데이트

#### 저장된 게시물 보기

- 프로필 페이지에 "저장됨" 탭 추가 (본인 프로필에서만 표시)
- `GET /api/bookmarks` API로 북마크 목록 조회
- PostGrid 컴포넌트 재사용
- 무한 스크롤 지원

#### 게시물 삭제 기능

- **API**: `app/api/posts/[postId]/route.ts`
  - DELETE: 본인 게시물만 삭제 가능
  - Supabase Storage에서 이미지 삭제
  - CASCADE로 관련 데이터 삭제 (likes, comments, bookmarks)
- **UI**: PostCard ⋯ 메뉴에 DropdownMenu 추가
  - 본인 게시물: 삭제 옵션 표시
  - 타인 게시물: 공유 옵션 표시
- AlertDialog로 삭제 확인
- 삭제 후 Jotai postsAtom에서 제거

#### 타입 정의 (`lib/types.ts`)

- `Bookmark`: 북마크 타입
- `BookmarkRequest`: 북마크 API 요청 타입
- `BookmarkResponse`: 북마크 API 응답 타입
- `DeletePostResponse`: 게시물 삭제 API 응답 타입

### 반응형 및 애니메이션 (Phase 11)

귀여운 손그림 스타일 UI와 애니메이션을 제공합니다.

#### 커스텀 폰트 및 테마

- **폰트**: SchoolSafeBoardMarker 웹폰트 (손글씨 스타일)
- **앱 이름**: Instasketch (✏️ 이모지 포함)
- **컬러 팔레트**: 파스텔톤 (cute-pink, cute-peach, cute-mint, cute-lavender, cute-sky, cute-yellow, cute-coral)

#### 손그림 스타일 CSS 클래스 (`app/globals.css`)

- `.sketch-border`: 기본 손그림 테두리
- `.sketch-card`: 카드 전용 손그림 스타일 (hover 시 떠오르는 효과)
- `.sketch-button`: 버튼 전용 손그림 스타일
- `.sketch-input`: 입력 필드 손그림 스타일
- `.sketch-avatar`: 프로필 이미지 손그림 테두리
- `.sketch-modal`: 모달 손그림 스타일

#### 애니메이션 클래스

- **페이지 전환**: `.animate-fade-in`, `.animate-slide-up`, `.animate-slide-down`, `.animate-bounce-in`
- **Shimmer 효과**: `.animate-shimmer`, `.animate-shimmer-cute`
- **마이크로 인터랙션**: `.hover-scale`, `.hover-wiggle`, `.heart-pulse`, `.icon-bounce`
- **탭 효과**: `.tab-underline`
- **반응형 전환**: `.sidebar-transition`, `.animate-slide-in-top`, `.animate-slide-in-bottom`
- **Stagger 애니메이션**: `.stagger-1` ~ `.stagger-12`

#### 스켈레톤 컴포넌트

- `components/post/PostCardSkeleton.tsx`: 게시물 카드 로딩 스켈레톤
- `components/profile/ProfileSkeleton.tsx`: 프로필 페이지 로딩 스켈레톤
- `components/post/PostModalSkeleton.tsx`: 모달 로딩 스켈레톤

#### UI 적용 컴포넌트

- `components/post/PostCard.tsx`: 손그림 카드 스타일
- `components/profile/profile-header.tsx`: 귀여운 프로필 헤더
- `components/comment/CommentForm.tsx`: 손그림 입력 필드
- `components/layout/Sidebar.tsx`: 손그림 네비게이션 (동적 하이라이트)
- `components/layout/Header.tsx`: 손그림 헤더
- `components/layout/BottomNav.tsx`: 손그림 하단 네비게이션 (동적 하이라이트)

#### 네비게이션 동적 하이라이트

사이드바와 하단 네비게이션 메뉴에 마우스 호버 시 동적 하이라이트 효과:

- **호버 효과**: 핑크-피치 그라데이션 배경 (`linear-gradient(135deg, cute-pink, cute-peach)`)
- **활성 상태**: 민트-스카이 그라데이션 배경 (`linear-gradient(135deg, cute-mint, cute-sky)`)
- **아이콘 애니메이션**: 확대(1.15배) + 회전(-5도) 효과
- **텍스트 애니메이션**: 오른쪽으로 4px 이동
- **만들기 버튼**: 코랄-피치 그라데이션 배경

#### 프로필 통계 레이아웃

프로필 페이지의 통계 표시 방식:

- **세로 레이아웃**: 숫자 (크게, bold) + 줄바꿈 + 레이블 (작게)
- **Desktop**: `text-2xl font-bold` 숫자, `text-sm` 레이블
- **Mobile**: `text-xl font-bold` 숫자, `text-xs` 레이블
- **레이블 줄바꿈 방지**: `whitespace-nowrap` 적용

#### 프로필 탭 스타일

프로필 페이지의 게시물/저장됨 탭:

- **CSS 클래스**: `.profile-tab`, `.profile-tab-active`
- **아이콘 크기**: 20px (기존 12px에서 증가)
- **텍스트 크기**: `text-sm` (기존 `text-xs`에서 증가)
- **탭-컨텐츠 간격**: `pt-6` 추가
- **활성 탭 언더라인**: 하단 3px 바 표시

## Additional Cursor Rules

프로젝트에는 다음 Cursor 규칙들이 있습니다:

- `.cursor/rules/web/nextjs-convention.mdc`: Next.js 컨벤션
- `.cursor/rules/web/design-rules.mdc`: UI/UX 디자인 가이드
- `.cursor/rules/web/playwright-test-guide.mdc`: 테스트 가이드
- `.cursor/rules/supabase/`: Supabase 관련 규칙들

주요 원칙은 이 CLAUDE.md에 통합되어 있으나, 세부사항은 해당 파일들 참고.
