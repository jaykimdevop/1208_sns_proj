# 배포 체크리스트

프로덕션 배포 전 확인해야 할 항목들을 정리한 체크리스트입니다.

## 1. 환경 변수 설정

### 1.1 필수 환경 변수 확인

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Production 키: `pk_live_...`)
- [ ] `CLERK_SECRET_KEY` (Production 키: `sk_live_...`)
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (서버 사이드 전용)
- [ ] `NEXT_PUBLIC_STORAGE_BUCKET=uploads`

### 1.2 환경 변수 검증

```bash
pnpm verify:env
```

## 2. 보안 검토

### 2.1 서버 사이드 키 노출 확인

- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 클라이언트 번들에 포함되지 않았는지 확인
- [ ] `CLERK_SECRET_KEY`가 클라이언트 번들에 포함되지 않았는지 확인
- [ ] 브라우저 개발자 도구 → Network에서 번들 파일 확인
- [ ] 소스맵 파일에서 민감 정보 검색

### 2.2 Supabase 보안

- [ ] RLS (Row Level Security) 정책 활성화 확인
  - [ ] `users` 테이블
  - [ ] `posts` 테이블
  - [ ] `likes` 테이블
  - [ ] `comments` 테이블
  - [ ] `follows` 테이블
  - [ ] `bookmarks` 테이블
- [ ] Storage 버킷 정책 확인
- [ ] Service Role Key가 클라이언트에 노출되지 않았는지 확인

### 2.3 API 보안

- [ ] 모든 API 라우트에 인증 검증 적용 확인
- [ ] 권한 검증 확인 (본인 리소스만 수정/삭제 가능)

## 3. 빌드 테스트

### 3.1 로컬 프로덕션 빌드

```bash
pnpm build
```

- [ ] 빌드 성공 확인
- [ ] 빌드 에러/경고 확인 및 수정
- [ ] 빌드 시간 확인 (정상 범위 내)

### 3.2 프로덕션 서버 실행

```bash
pnpm start
```

- [ ] 서버 정상 시작 확인
- [ ] 포트 3000에서 접근 가능 확인

## 4. 런타임 기능 테스트

### 4.1 인증 플로우

- [ ] 홈 페이지 로드 확인
- [ ] 로그인 페이지 접근 (`/sign-in`)
- [ ] 회원가입 페이지 접근 (`/sign-up`)
- [ ] 로그인 성공 후 리다이렉트 확인
- [ ] 로그아웃 기능 확인

### 4.2 게시물 기능

- [ ] 게시물 목록 조회 확인
- [ ] 무한 스크롤 작동 확인
- [ ] 게시물 작성 확인
  - [ ] 이미지 선택/미리보기
  - [ ] 캡션 입력
  - [ ] 업로드 성공
  - [ ] 피드에 새 게시물 표시
- [ ] 게시물 상세 보기 확인
  - [ ] Desktop: 모달 형식
  - [ ] Mobile: 전체 페이지
- [ ] 게시물 삭제 확인 (본인 게시물만)

### 4.3 좋아요 기능

- [ ] 좋아요 추가/제거 확인
- [ ] 좋아요 수 실시간 업데이트 확인
- [ ] 더블탭 좋아요 확인 (모바일)

### 4.4 댓글 기능

- [ ] 댓글 작성 확인
- [ ] 댓글 목록 표시 확인
- [ ] 답글 작성 확인
- [ ] 댓글 삭제 확인 (본인 댓글만)
- [ ] Thread 형식 댓글 표시 확인

### 4.5 프로필 기능

- [ ] 프로필 페이지 접근 확인
- [ ] 프로필 정보 표시 확인
- [ ] 게시물 그리드 표시 확인
- [ ] "저장됨" 탭 확인 (본인 프로필만)
- [ ] 팔로우/언팔로우 기능 확인

### 4.6 검색 기능

- [ ] 사용자 검색 확인
- [ ] 게시물 검색 확인
- [ ] 검색 결과 클릭 시 이동 확인

### 4.7 북마크 기능

- [ ] 북마크 추가/제거 확인
- [ ] 북마크 상태 표시 확인
- [ ] 저장된 게시물 목록 확인

### 4.8 뷰 모드 (Desktop)

- [ ] 상하 스크롤 모드 확인
- [ ] 좌우 스크롤 모드 확인
- [ ] 뷰 모드 전환 확인

## 5. 성능 확인

### 5.1 Lighthouse 점수

- [ ] Performance: 90+ 목표
- [ ] Accessibility: 90+ 목표
- [ ] Best Practices: 90+ 목표
- [ ] SEO: 90+ 목표

### 5.2 Core Web Vitals

- [ ] LCP (Largest Contentful Paint): 2.5초 이하
- [ ] FID (First Input Delay): 100ms 이하
- [ ] CLS (Cumulative Layout Shift): 0.1 이하

### 5.3 이미지 최적화

- [ ] Next.js Image 컴포넌트 사용 확인
- [ ] AVIF/WebP 포맷 확인
- [ ] 이미지 크기 최적화 확인

### 5.4 번들 크기

- [ ] First Load JS 크기 확인 (목표: 200KB 이하)
- [ ] 불필요한 의존성 제거 확인
- [ ] 코드 스플리팅 확인

## 6. 반응형 확인

### 6.1 Desktop (1024px+)

- [ ] Sidebar 표시 확인
- [ ] 전체 레이아웃 확인
- [ ] 뷰 모드 선택 기능 확인

### 6.2 Tablet (768px ~ 1023px)

- [ ] Icon-only Sidebar 표시 확인
- [ ] 레이아웃 확인

### 6.3 Mobile (< 768px)

- [ ] Header 표시 확인
- [ ] BottomNav 표시 확인
- [ ] Sidebar 숨김 확인
- [ ] 터치 인터랙션 확인

## 7. 접근성 확인

### 7.1 키보드 네비게이션

- [ ] Tab 키로 모든 인터랙티브 요소 접근 가능
- [ ] Enter/Space로 버튼 활성화
- [ ] ESC 키로 모달 닫기

### 7.2 ARIA 레이블

- [ ] 모든 버튼에 명확한 라벨
- [ ] 모든 링크에 명확한 텍스트
- [ ] 폼 요소에 적절한 라벨

### 7.3 스크린 리더

- [ ] 스킵 링크 작동 확인
- [ ] 포커스 순서 확인

## 8. 에러 처리 확인

### 8.1 네트워크 에러

- [ ] 오프라인 상태 안내 표시
- [ ] 네트워크 에러 시 재시도 기능

### 8.2 API 에러

- [ ] 사용자 친화적 에러 메시지 표시
- [ ] 에러 발생 시 적절한 폴백 UI

## 9. Vercel 배포 확인

### 9.1 배포 설정

- [ ] Git 저장소 연결 확인
- [ ] 자동 배포 설정 확인
- [ ] 환경 변수 설정 확인 (Vercel Dashboard)

### 9.2 배포 후 확인

- [ ] 배포 성공 확인
- [ ] 프로덕션 URL 접근 확인
- [ ] 모든 기능 정상 작동 확인
- [ ] 빌드 로그 확인 (에러 없음)

## 10. 모니터링 설정

### 10.1 에러 추적

- [ ] Vercel Analytics 활성화 (선택사항)
- [ ] 에러 로그 확인 방법 문서화

### 10.2 로깅

- [ ] 프로덕션 환경에서 console.log 제거 확인
- [ ] 에러 로깅 시스템 확인

## 참고 문서

- [보안 검토 가이드](docs/SECURITY_REVIEW.md)
- [Vercel 배포 가이드](docs/VERCEL_DEPLOYMENT.md)
- [환경 변수 검증 스크립트](scripts/verify-env.ts)

