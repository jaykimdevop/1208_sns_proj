- [x] `.cursor/` 디렉토리
  - [x] `rules/` 커서룰
  - [ ] `mcp.json` MCP 서버 설정
  - [ ] `dir.md` 프로젝트 디렉토리 구조
- [x] `.github/` 디렉토리
- [ ] `.husky/` 디렉토리
- [x] `app/` 디렉토리
  - [x] `icon.svg` 파일 (favicon 대체)
  - [ ] `not-found.tsx` 파일
  - [ ] `robots.ts` 파일
  - [ ] `sitemap.ts` 파일
  - [ ] `manifest.ts` 파일
- [x] `supabase/` 디렉토리
- [x] `public/` 디렉토리
  - [x] `icons/` 디렉토리
  - [x] `logo.png` 파일
  - [x] `og-image.png` 파일
- [x] `tsconfig.json` 파일
- [x] `.cursorignore` 파일
- [x] `.gitignore` 파일
- [x] `.gitattributes` 파일
- [x] `.prettierignore` 파일
- [x] `.prettierrc` 파일
- [x] `eslint.config.mjs` 파일
- [x] `AGENTS.md` 파일

# 📋 Mini Instagram - 개발 TODO 리스트

## Phase 1. 기본 세팅

- [x] Tailwind CSS 설정 (인스타 컬러 스키마)
  - [x] `app/globals.css`에 Instagram 컬러 변수 추가
  - [x] 타이포그래피 설정
- [x] Supabase 데이터베이스 마이그레이션
  - [x] `db.sql` 파일을 Supabase에 적용
  - [x] 테이블 생성 확인 (users, posts, likes, comments, follows)
  - [x] Views 및 Triggers 확인
- [x] Supabase Storage 버킷 생성
  - [x] `posts` 버킷 생성 (공개 읽기)
  - [x] 업로드 정책 설정
- [x] TypeScript 타입 정의
  - [x] `lib/types.ts` 파일 생성
  - [x] User, Post, Like, Comment, Follow 타입 정의

## Phase 2. 레이아웃 구조

- [x] `app/layout.tsx` 루트 레이아웃 수정
  - [x] Navbar 제거 (Instagram 앱은 Sidebar 사용)
  - [x] `/` URL이 Instagram 홈 피드를 가리키도록 구조 변경
  - [x] 기존 랜딩 페이지는 `/demo`로 이동
- [x] `app/(main)/layout.tsx` 생성
  - [x] Sidebar 통합
  - [x] 반응형 레이아웃 (Desktop/Tablet/Mobile)
- [x] `components/layout/Sidebar.tsx`
  - [x] Desktop: 244px 너비, 아이콘 + 텍스트
  - [x] Tablet: 72px 너비, 아이콘만
  - [x] Mobile: 숨김
  - [x] 메뉴 항목: 홈, 검색, 만들기, 프로필
  - [x] Hover 효과 및 Active 상태 스타일
- [x] `components/layout/Header.tsx`
  - [x] Mobile 전용 (60px 높이)
  - [x] 로고 + 알림/DM/프로필 아이콘
- [x] `components/layout/BottomNav.tsx`
  - [x] Mobile 전용 (50px 높이)
  - [x] 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필

## Phase 3. 홈 피드 페이지

- [x] `app/(main)/page.tsx` 생성
  - [x] PostFeed 컴포넌트 통합
  - [x] 배경색 #FAFAFA 설정
- [x] `components/post/PostCard.tsx`
  - [x] 헤더 (프로필 이미지 32px, 사용자명, 시간, ⋯ 메뉴)
  - [x] 이미지 영역 (1:1 정사각형)
  - [x] 액션 버튼 (좋아요, 댓글, 공유, 북마크)
  - [x] 좋아요 수 표시
  - [x] 캡션 (사용자명 Bold + 내용, 2줄 초과 시 "... 더 보기")
  - [x] 댓글 미리보기 (최신 2개)
- [x] `components/post/PostCardSkeleton.tsx`
  - [x] 로딩 UI (Skeleton + Shimmer 효과)
- [x] `components/post/PostFeed.tsx`
  - [x] 게시물 목록 렌더링
  - [x] 무한 스크롤 (Intersection Observer)
  - [x] 페이지네이션 (10개씩)
- [x] `app/api/posts/route.ts`
  - [x] GET: 게시물 목록 조회 (시간 역순 정렬)
  - [x] 페이지네이션 지원 (limit, offset)
  - [x] userId 파라미터 지원 (프로필 페이지용)
  - [x] N+1 쿼리 문제 해결 (배치 쿼리 사용)
- [x] `lib/utils/formatRelativeTime.ts`
  - [x] 상대 시간 표시 함수 (방금 전, N분 전, N시간 전 등)

## Phase 4. 좋아요 기능

- [x] `app/api/likes/route.ts`
  - [x] POST: 좋아요 추가
  - [x] DELETE: 좋아요 제거
  - [x] 인증 검증 (Clerk)
- [x] `components/post/LikeButton.tsx`
  - [x] 빈 하트 ↔ 빨간 하트 상태 관리
  - [x] 클릭 애니메이션 (scale 1.3 → 1)
  - [x] 더블탭 좋아요 (모바일, 큰 하트 fade in/out)
- [x] `components/post/DoubleTapHeart.tsx`
  - [x] 이미지 더블탭 감지
  - [x] 큰 하트 fade in/out 애니메이션
- [x] PostCard에 LikeButton 통합
  - [x] 좋아요 상태 표시 (isLiked)
  - [x] 좋아요 수 실시간 업데이트
  - [x] Optimistic UI 업데이트

## Phase 5. 게시물 작성

- [x] `components/post/CreatePostModal.tsx`
  - [x] Dialog 컴포넌트 사용
  - [x] 이미지 미리보기 UI (1:1 비율)
  - [x] 드래그앤드롭 지원
  - [x] 텍스트 입력 필드 (최대 2,200자, 글자 수 카운터)
  - [x] 파일 선택 버튼
  - [x] 업로드 버튼 (로딩 상태 포함)
  - [x] 파일 검증 (크기: 5MB, 타입: JPEG, PNG, WebP, GIF)
- [x] `app/api/posts/route.ts`
  - [x] POST: 게시물 생성
  - [x] 이미지 파일 검증 (최대 5MB)
  - [x] Supabase Storage 업로드 (경로: `{user_id}/{timestamp}_{random}.{ext}`)
  - [x] posts 테이블에 데이터 저장
  - [x] 인증 검증 (Clerk)
  - [x] 에러 시 업로드된 이미지 롤백
- [x] `lib/types.ts`
  - [x] CreatePostResponse 타입 추가
- [x] Sidebar "만들기" 버튼 연결
  - [x] CreatePostModal 열기
  - [x] 게시물 생성 후 홈 피드 새로고침
- [x] BottomNav "만들기" 버튼 연결
  - [x] CreatePostModal 열기
  - [x] 게시물 생성 후 홈 피드 새로고침

## Phase 6. 댓글 기능

- [x] `lib/types.ts`
  - [x] CreateCommentResponse 타입 추가
  - [x] DeleteCommentRequest 타입 추가
  - [x] DeleteCommentResponse 타입 추가
- [x] `app/api/comments/route.ts`
  - [x] POST: 댓글 작성 (Clerk 인증, 사용자 정보 포함 응답)
  - [x] DELETE: 댓글 삭제 (본인만, Clerk 인증)
- [x] `components/comment/CommentForm.tsx`
  - [x] 댓글 입력 필드 ("댓글 달기...")
  - [x] Enter 키로 제출
  - [x] "게시" 버튼 (텍스트 있을 때만 활성화)
  - [x] 로딩 상태 표시
  - [x] forwardRef로 ref 노출 (외부에서 포커스 가능)
- [x] PostCard에 댓글 기능 통합
  - [x] 댓글 상태 관리 (comments, commentsCount)
  - [x] CommentForm 통합
  - [x] 새 댓글 추가 시 실시간 업데이트
  - [x] 댓글 버튼 클릭 시 댓글 입력창으로 포커스 이동

## Phase 7. 게시물 상세 모달

- [x] `components/post/PostModal.tsx`
  - [x] Desktop: 모달 형식 (이미지 50% + 댓글 50%)
  - [x] Mobile: 전체 페이지로 전환 (`app/(main)/post/[postId]/page.tsx`)
  - [x] 닫기 버튼 (✕)
  - [x] 이전/다음 게시물 네비게이션 (Desktop)
- [x] PostCard 클릭 시 PostModal 열기
  - [x] 게시물 상세 정보 로드
  - [x] 댓글 전체 목록 표시
- [x] `components/comment/CommentList.tsx`
  - [x] 상세 모달: 전체 댓글 + 스크롤
  - [x] 삭제 버튼 (본인만 표시)
  - [x] 삭제 확인 다이얼로그 (AlertDialog)
- [x] 댓글 최신순 정렬
  - [x] 루트 댓글: 최신순 (newest first)
  - [x] 답글: 오래된 순 (oldest first)
- [x] Thread 형식 댓글 (1단계 답글)
  - [x] DB 마이그레이션: `comments.parent_id` 컬럼 추가
  - [x] API: `parent_id` 파라미터 처리, 1단계 깊이 제한 검증
  - [x] 타입: `CommentWithReplies`, `ThreadedCommentsResponse` 추가
- [x] 답글 접기/펼치기 UI
  - [x] "답글 N개 보기" / "답글 숨기기" 토글 버튼
  - [x] 답글 들여쓰기로 시각적 구분
- [x] 답글 달기 기능
  - [x] "답글 달기" 버튼 (루트 댓글에만 표시)
  - [x] 답글 모드 표시 ("@사용자명님에게 답글 남기는 중")
  - [x] @멘션 자동 입력
  - [x] ESC 키 또는 X 버튼으로 답글 모드 취소

## Phase 8. 프로필 페이지

- [x] `app/(main)/profile/[userId]/page.tsx`
  - [x] 동적 라우트 생성
  - [x] ProfileHeader 통합
  - [x] PostGrid 통합
- [x] `components/profile/profile-header.tsx`
  - [x] 프로필 이미지 (150px Desktop / 90px Mobile) - 이니셜 아바타
  - [x] 사용자명
  - [x] 통계 (게시물 수, 팔로워 수, 팔로잉 수)
  - [x] "팔로우" / "팔로잉" 버튼 (다른 사람 프로필, Phase 9에서 기능 구현)
  - [x] "프로필 편집" 버튼 (본인 프로필, 비활성화)
- [x] `components/profile/post-grid.tsx`
  - [x] 3열 그리드 레이아웃 (반응형)
  - [x] 1:1 정사각형 썸네일
  - [x] Hover 시 좋아요/댓글 수 표시
  - [x] 클릭 시 게시물 상세 모달 열기 (Desktop) / 상세 페이지 이동 (Mobile)
- [x] `app/api/users/[userId]/route.ts`
  - [x] GET: 사용자 정보 조회
  - [x] user_stats 뷰 활용
  - [x] Clerk ID 또는 Supabase UUID로 조회 지원
  - [x] 팔로우 상태 확인 (isFollowing)
  - [x] 본인 프로필 확인 (isOwnProfile)
- [x] Sidebar "프로필" 버튼 연결
  - [x] `/profile/${user.id}`로 이동 (Clerk ID 기반)

## Phase 9. 팔로우 기능

- [x] `app/api/follows/route.ts`
  - [x] POST: 팔로우 추가
  - [x] DELETE: 팔로우 제거
  - [x] 인증 검증 (Clerk)
  - [x] 자기 자신 팔로우 방지
  - [x] 팔로우 대상 사용자 존재 확인
  - [x] 중복 팔로우 에러 처리
- [x] `components/profile/follow-button.tsx`
  - [x] "팔로우" 버튼 (파란색, 미팔로우 상태)
  - [x] "팔로잉" 버튼 (회색 테두리, 팔로우 중 상태)
  - [x] Hover 시 "언팔로우" (빨간 테두리, 빨간 텍스트)
  - [x] 클릭 시 즉시 API 호출 및 UI 업데이트
  - [x] Optimistic UI 업데이트 (에러 시 롤백)
  - [x] 로딩 상태 표시 (Loader2 아이콘)
- [x] ProfileHeader에 FollowButton 통합
  - [x] 팔로우 상태 관리
  - [x] 통계 실시간 업데이트 (followers_count 증감)
- [x] `lib/types.ts`
  - [x] FollowResponse 타입 추가

## Phase 9.5. 인증 기반 UX 개선

- [x] Clerk 로그인/회원가입 페이지 생성
  - [x] `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
  - [x] `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
  - [x] `app/(auth)/layout.tsx`
- [x] Sidebar/BottomNav/Header 로그인 버튼 추가
  - [x] 미로그인 시 "로그인" 버튼 표시
  - [x] 로그인 시 "만들기", "프로필" 버튼 표시
  - [x] Header에 로그인 버튼 추가 (모바일)
- [x] 인증 필요 액션 로그인 유도
  - [x] `CommentForm`: 미로그인 시 "로그인하고 댓글을 남겨보세요" 표시, 클릭 시 로그인 페이지 이동
  - [x] `FollowButton`: 미로그인 시 클릭하면 로그인 페이지 이동
  - [x] `LikeButton`: 미로그인 시 클릭하면 로그인 페이지 이동
  - [x] "만들기" 버튼: 로그인 사용자에게만 표시
  - [x] 공유 버튼 (Send): 미로그인 시 클릭하면 로그인 페이지 이동
  - [x] 북마크 버튼 (Bookmark): 미로그인 시 클릭하면 로그인 페이지 이동
- [x] 게시물 작성자 프로필 접근
  - [x] 미로그인 사용자도 타인 프로필 조회 가능
- [x] 네비게이션 통일
  - [x] 활동(Heart) 메뉴 제거 (미구현 기능)
  - [x] 로그아웃 버튼은 프로필 페이지에서만 접근
  - [x] BottomNav: 홈, 검색, 만들기, 프로필 (로그인) / 홈, 검색, 로그인 (미로그인)
  - [x] Sidebar: 홈, 검색, 만들기, 프로필 (로그인) / 홈, 검색, 로그인 (미로그인)
  - [x] Header: 로고 + 프로필 아이콘 (로그인) / 로고 + 로그인 버튼 (미로그인)

## Phase 10. 게시물 관리 기능

- [x] 공유 기능 완성
  - [x] Sonner (Toast) 컴포넌트 설치 (shadcn/ui)
  - [x] 클립보드 복사 성공 시 토스트 메시지 표시
- [x] 북마크 기능
  - [x] DB 마이그레이션: `bookmarks` 테이블 생성
  - [x] `app/api/bookmarks/route.ts` 생성 (POST, DELETE, GET)
  - [x] 북마크 상태 UI 표시 (빈 아이콘 ↔ 채워진 아이콘)
  - [x] Optimistic UI 업데이트
  - [x] 게시물 조회 시 북마크 상태 포함
- [x] 저장된 게시물 보기
  - [x] `GET /api/bookmarks` API 추가 (북마크 목록 조회)
  - [x] 프로필 페이지에 "저장됨" 탭 추가 (본인 프로필에서만)
  - [x] 저장된 게시물 그리드 표시
  - [x] 무한 스크롤 지원
- [x] 게시물 삭제
  - [x] `app/api/posts/[postId]/route.ts` 생성
  - [x] DELETE: 본인만 삭제 가능 (인증 검증)
  - [x] Supabase Storage에서 이미지 삭제
  - [x] PostCard ⋯ 메뉴에 DropdownMenu 추가
  - [x] 본인 게시물만 삭제 옵션 표시
  - [x] 삭제 확인 다이얼로그 (AlertDialog)
  - [x] 삭제 후 피드에서 제거 (Jotai atom 업데이트)

## Phase 11. 반응형 및 애니메이션

- [x] 커스텀 폰트 및 귀여운 테마 적용
  - [x] SchoolSafeBoardMarker 웹폰트 추가
  - [x] 귀여운 파스텔 컬러 팔레트 추가
  - [x] 손그림(크로마키) 스타일 테두리 CSS 클래스 정의
    - [x] `.sketch-border`: 불규칙한 손그림 테두리 효과
    - [x] `.sketch-card`: 카드 전용 손그림 스타일
    - [x] `.sketch-button`: 버튼 전용 손그림 스타일
    - [x] `.sketch-input`: 입력 필드 손그림 스타일
    - [x] `.sketch-avatar`: 프로필 이미지 손그림 테두리
    - [x] `.sketch-modal`: 모달 손그림 스타일
  - [x] SVG 필터 정의 추가 (손그림 테두리용 turbulence 효과)
- [x] 반응형 브레이크포인트 적용
  - [x] Mobile (< 768px): BottomNav, Header 표시
  - [x] Tablet (768px ~ 1023px): Icon-only Sidebar
  - [x] Desktop (1024px+): Full Sidebar
- [x] 좋아요 애니메이션
  - [x] 클릭 시 scale(1.3) → scale(1) (0.15초)
  - [x] 더블탭 시 큰 하트 fade in/out (1초)
  - [x] hover 시 heart-pulse 효과 추가
- [x] 로딩 상태
  - [x] Skeleton UI (PostCardSkeleton) 개선
  - [x] Shimmer gradient 애니메이션 추가
  - [x] ProfileSkeleton 컴포넌트 생성
  - [x] PostModalSkeleton 컴포넌트 생성
- [x] 페이지 전환 애니메이션
  - [x] fade-in, slide-up, slide-down, bounce-in 애니메이션 정의
  - [x] 메인 페이지 진입 시 fade-in 적용
  - [x] 프로필 페이지 진입 시 애니메이션 적용
  - [x] 그리드 아이템 stagger 애니메이션
- [x] 마이크로 인터랙션
  - [x] 버튼 hover 애니메이션 (hover-scale, hover-wiggle)
  - [x] 탭 전환 애니메이션 (tab-underline)
  - [x] 아이콘 bounce 효과 (icon-bounce)
  - [x] 네비게이션 아이템 hover 효과 개선
- [x] 반응형 전환 애니메이션
  - [x] Sidebar 전환 애니메이션 (sidebar-transition)
  - [x] Header 슬라이드 애니메이션 (animate-slide-in-top)
  - [x] BottomNav 슬라이드 애니메이션 (animate-slide-in-bottom)
- [x] 귀여운 UI 요소 적용
  - [x] PostCard 손그림 스타일 적용
  - [x] ProfileHeader 귀여운 테두리 및 색상 적용
  - [x] CommentForm 손그림 입력 필드 적용
  - [x] 앱 이름 변경 (Instagram → Instasketch)
- [x] 네비게이션 동적 하이라이트
  - [x] Sidebar/BottomNav 메뉴 호버 시 동적 배경 하이라이트
  - [x] 일반 메뉴 (홈, 검색, 프로필 등): 핑크-피치 그라데이션
  - [x] 만들기 버튼: 민트-스카이 그라데이션
  - [x] 아이콘 확대(1.15배) + 회전(-5도) 애니메이션
  - [x] 텍스트 오른쪽 이동 애니메이션
  - [x] 기본 상태는 배경 없음 (호버 시에만 표시)
- [x] 프로필 페이지 UI 개선
  - [x] 통계 레이아웃: 숫자 크게 강조 + 줄바꿈 + 레이블 작게
  - [x] 점선 테두리 전체 너비로 확장 (Desktop 연속성 수정)
  - [x] 탭 뷰 크기 증가 (아이콘 20px, 텍스트 text-sm)
  - [x] 탭-컨텐츠 간격 추가 (pt-6)
  - [x] 프로필 탭 스타일 클래스 추가 (.profile-tab, .profile-tab-active)
- [x] "만들기" 버튼 UX 개선
  - [x] Sidebar/BottomNav "만들기" 버튼에 cursor-pointer 추가
- [x] CreatePostModal 손그림 스타일 적용
  - [x] sketch-modal 클래스 적용 (파스텔 그라데이션 배경, bounce-in 애니메이션)
  - [x] 헤더: 점선 테두리, ✏️ 이모지 추가, 볼드 타이틀
  - [x] 드래그앤드롭 영역: 점선 테두리, 드래그 시 민트색 하이라이트, 📸/💾 이모지
  - [x] 이미지 미리보기: 손그림 테두리 및 그림자 효과
  - [x] 캡션 입력: sketch-input 스타일, ✍️ 이모지 플레이스홀더
  - [x] 에러 메시지: 코랄색 배경/테두리, ⚠️ 이모지
  - [x] 공유 버튼: sketch-button 스타일, 민트-스카이 그라데이션, 🚀 이모지

## Phase 12. 검색 기능

- [x] 검색 API 엔드포인트
  - [x] `app/api/search/route.ts` 생성
  - [x] GET: 통합 검색 (사용자 + 게시물)
  - [x] 쿼리 파라미터: `q` (검색어), `type` (users/posts/all), `limit`, `offset`
  - [x] 사용자 검색: `user_stats` 뷰에서 `name` ILIKE 검색
  - [x] 게시물 검색: `post_stats` 뷰에서 `caption` ILIKE 검색
  - [x] 결과에 통계 정보 포함 (게시물 수, 팔로워 수, 좋아요 수 등)
- [x] 검색 관련 타입 정의
  - [x] `SearchUserResult`: 검색된 사용자 결과 타입
  - [x] `SearchPostResult`: 검색된 게시물 결과 타입
  - [x] `SearchResponse`: 통합 검색 API 응답 타입
- [x] SearchModal 컴포넌트
  - [x] `components/search/search-modal.tsx` 생성
  - [x] 손그림 스타일 모달 (sketch-modal)
  - [x] 검색 입력 필드 (sketch-input, 디바운스 300ms)
  - [x] 탭 전환 (사용자/게시물, profile-tab 스타일)
  - [x] 검색 결과 목록 (무한 스크롤)
  - [x] 로딩 상태 표시
  - [x] 검색 결과 없음 상태 표시
  - [x] ESC 키로 모달 닫기
- [x] UserSearchResult 컴포넌트
  - [x] `components/search/user-search-result.tsx` 생성
  - [x] 이니셜 아바타 (파스텔 색상)
  - [x] 사용자명, 게시물 수, 팔로워 수 표시
  - [x] 클릭 시 프로필 페이지 이동 및 모달 닫기
  - [x] 호버 시 핑크-피치 그라데이션 배경
- [x] PostSearchResult 컴포넌트
  - [x] `components/search/post-search-result.tsx` 생성
  - [x] 썸네일 이미지 (64x64, 손그림 테두리)
  - [x] 캡션 미리보기 (검색어 하이라이트)
  - [x] 작성자 정보, 좋아요/댓글 수 표시
  - [x] 클릭 시 게시물 상세 모달 (Desktop) / 상세 페이지 (Mobile)
- [x] 네비게이션 연결
  - [x] Sidebar "검색" 버튼 클릭 시 SearchModal 열기
  - [x] BottomNav "검색" 버튼 클릭 시 SearchModal 열기

## Phase 13. 에러 핸들링 및 최적화

- [x] 에러 핸들링
  - [x] Error Boundary 컴포넌트 생성 (`components/error-boundary.tsx`)
  - [x] API 에러 처리 표준화 (통합 에러 핸들러 유틸리티)
  - [x] 사용자 친화적 에러 메시지
  - [x] 네트워크 에러 처리 (연결 상태 감지, 타임아웃, 재시도 로직)
- [x] 로깅 시스템
  - [x] 프로덕션 로깅 유틸리티 생성 (`lib/utils/logger.ts`)
  - [x] console.log/error 정리 및 통합 로깅으로 대체 (새 코드에 적용, 기존 코드는 점진적 교체)
  - [x] 에러 추적 및 모니터링 준비 (로깅 시스템에 통합)
- [x] 이미지 최적화
  - [x] Next.js Image 컴포넌트 최적화 (sizes, priority, lazy loading)
  - [x] `next.config.ts`에 Supabase Storage 이미지 도메인 추가
  - [x] 이미지 에러 핸들링 (onError, fallback)
  - [x] 이미지 프리로딩 (중요한 이미지 - priority prop 사용)
- [x] 성능 최적화
  - [x] React.memo 적용 (필요한 컴포넌트만)
  - [x] useMemo, useCallback 최적화
  - [x] API 요청 최적화 (중복 요청 방지, AbortController 활용)
  - [x] 상태 관리 최적화 (Jotai atom 최적화, 불필요한 업데이트 방지)
  - [x] 메모리 누수 방지 (useEffect cleanup, 이벤트 리스너 정리)

## Phase 14. 최종 마무리 및 추가 최적화

- [ ] 추가 최적화 (선택 사항)
  - [ ] 오프라인 상태 안내 (네트워크 상태 감지, 오프라인 시 사용자 안내)
  - [ ] 코드 스플리팅 (동적 import, 모달 컴포넌트 lazy loading)
- [ ] 접근성 개선
  - [ ] 키보드 네비게이션 개선
    - [ ] 모든 인터랙티브 요소에 키보드 접근 가능
    - [ ] 포커스 순서 개선 (Tab 순서)
    - [ ] ESC 키로 모달/드롭다운 닫기 (일부 적용됨, 전체 검토 필요)
  - [ ] ARIA 레이블 추가
    - [ ] 필수 요소에 ARIA 레이블 추가
    - [ ] 버튼, 링크에 명확한 라벨
    - [ ] 폼 요소에 적절한 라벨 연결
  - [ ] 포커스 관리 개선
    - [ ] 모달 열릴 때 포커스 트랩
    - [ ] 모달 닫힐 때 원래 포커스로 복귀
    - [ ] 스킵 링크 추가 (필요 시)
- [ ] 반응형 및 사용성 테스트
  - [ ] 모바일/태블릿 반응형 테스트
    - [ ] 다양한 화면 크기에서 테스트
    - [ ] 터치 인터랙션 테스트
  - [ ] 크로스 브라우저 테스트
    - [ ] Chrome, Firefox, Safari, Edge 테스트
    - [ ] 모바일 브라우저 테스트
- [ ] 코드 정리
  - [ ] 불필요한 주석 제거
  - [ ] 코드 포맷팅 (일관성 확인)
  - [ ] 사용하지 않는 import 제거
  - [ ] 타입 정의 정리
- [ ] 배포 준비
  - [ ] 환경 변수 설정
    - [ ] 프로덕션 환경 변수 확인
    - [ ] 보안 설정 검토
  - [ ] Vercel 배포 설정
    - [ ] 빌드 설정 확인
    - [ ] 도메인 설정
  - [ ] 프로덕션 빌드 테스트
    - [ ] 빌드 성공 확인
    - [ ] 런타임 에러 확인
    - [ ] 성능 최적화 확인
