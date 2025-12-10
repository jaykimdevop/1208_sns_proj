# 성능 최적화 가이드

프로덕션 배포 전 성능 최적화 확인 가이드입니다.

## 1. 빌드 최적화 확인

### 1.1 빌드 결과 분석

```bash
pnpm build
```

빌드 완료 후 다음을 확인:

**번들 크기:**
- First Load JS: 200KB 이하 권장
- 개별 라우트 크기 확인
- 공유 청크 크기 확인

**현재 상태:**
```
First Load JS shared by all: 102 kB
├ chunks/5605-fabb63c9d3cc90f3.js: 45.4 kB
├ chunks/fddd928d-b4e0be7003ad9b1b.js: 54.2 kB
└ other shared chunks (total): 2.27 kB
```

### 1.2 코드 스플리팅 확인

- [ ] 동적 import 사용 확인 (`next/dynamic`)
- [ ] 모달 컴포넌트 lazy loading 확인
- [ ] 큰 컴포넌트 코드 스플리팅 확인

**현재 구현:**
- `PostModal`: 동적 import (검색 모달에서 사용)
- 기타 모달 컴포넌트: 필요시 동적 import 적용

### 1.3 불필요한 의존성 제거

```bash
# 번들 분석 (선택사항)
pnpm add -D @next/bundle-analyzer
```

- [ ] 사용하지 않는 패키지 제거
- [ ] 중복 의존성 확인

## 2. 이미지 최적화

### 2.1 Next.js Image 컴포넌트 사용

**확인 사항:**
- [ ] 모든 이미지에 `next/image` 사용
- [ ] `sizes` prop 적절히 설정
- [ ] `priority` prop 필요한 이미지에만 사용
- [ ] `loading="lazy"` 기본값 사용

**현재 설정 (`next.config.ts`):**
```typescript
images: {
  formats: ["image/avif", "image/webp"], // 최신 포맷 우선
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

### 2.2 이미지 포맷 확인

- [ ] AVIF/WebP 포맷 자동 변환 확인
- [ ] 이미지 크기 최적화 확인
- [ ] 불필요한 고해상도 이미지 제거

## 3. Core Web Vitals

### 3.1 LCP (Largest Contentful Paint)

**목표:** 2.5초 이하

**최적화 방법:**
- [ ] 중요한 이미지에 `priority` prop 사용
- [ ] 폰트 프리로딩 확인
- [ ] 초기 렌더링 최적화

### 3.2 FID (First Input Delay)

**목표:** 100ms 이하

**최적화 방법:**
- [ ] JavaScript 번들 크기 최소화
- [ ] 긴 작업을 비동기로 처리
- [ ] React 19의 자동 배칭 활용

### 3.3 CLS (Cumulative Layout Shift)

**목표:** 0.1 이하

**최적화 방법:**
- [ ] 이미지에 명시적 크기 지정 (`width`, `height`)
- [ ] 동적 콘텐츠 로드 시 스켈레톤 UI 사용
- [ ] 폰트 로딩 최적화

## 4. React 최적화

### 4.1 React.memo 사용

**확인 사항:**
- [ ] 불필요한 리렌더링 방지
- [ ] 무거운 컴포넌트에만 적용
- [ ] 과도한 memo 사용 방지

**현재 구현:**
- 필요한 컴포넌트에만 선택적 적용

### 4.2 useMemo, useCallback 최적화

**확인 사항:**
- [ ] 무거운 계산에 `useMemo` 사용
- [ ] 자식 컴포넌트에 전달하는 함수에 `useCallback` 사용
- [ ] 과도한 최적화 방지

### 4.3 상태 관리 최적화

**확인 사항:**
- [ ] Jotai atom 최적화
- [ ] 불필요한 전역 상태 제거
- [ ] 로컬 상태 우선 사용

## 5. API 최적화

### 5.1 요청 최적화

**확인 사항:**
- [ ] 중복 요청 방지
- [ ] AbortController로 요청 취소
- [ ] 적절한 캐싱 전략

**현재 구현:**
- AbortController 사용
- 중복 요청 방지 로직

### 5.2 데이터베이스 쿼리 최적화

**확인 사항:**
- [ ] N+1 쿼리 문제 해결
- [ ] 필요한 컬럼만 선택
- [ ] 인덱스 활용

**현재 구현:**
- 배치 쿼리 사용
- 필요한 데이터만 조회

## 6. 네트워크 최적화

### 6.1 HTTP/2 활용

Vercel은 자동으로 HTTP/2를 사용합니다.

### 6.2 압축 확인

- [ ] Gzip/Brotli 압축 확인
- [ ] 정적 자산 압축 확인

Vercel은 자동으로 압축을 처리합니다.

## 7. 캐싱 전략

### 7.1 정적 자산 캐싱

- [ ] 이미지 캐싱 확인
- [ ] 폰트 캐싱 확인

### 7.2 API 응답 캐싱

- [ ] 적절한 캐시 헤더 설정
- [ ] ISR (Incremental Static Regeneration) 활용 가능 여부 확인

## 8. Lighthouse 점수 확인

### 8.1 실행 방법

1. Chrome DevTools → **Lighthouse** 탭
2. **Analyze page load** 클릭
3. 결과 확인

### 8.2 목표 점수

- **Performance**: 90+
- **Accessibility**: 90+
- **Best Practices**: 90+
- **SEO**: 90+

### 8.3 개선 사항 확인

Lighthouse가 제안하는 개선 사항을 확인하고 적용:

- [ ] 사용하지 않는 JavaScript 제거
- [ ] 이미지 최적화
- [ ] 렌더링 차단 리소스 최소화
- [ ] 서버 응답 시간 최적화

## 9. 프로덕션 모니터링

### 9.1 Vercel Analytics

Vercel Dashboard → **Analytics**에서:
- 페이지뷰 추적
- 성능 메트릭 확인
- 에러 추적

### 9.2 실시간 모니터링

- [ ] Vercel Dashboard → **Functions** 탭에서 함수 실행 시간 확인
- [ ] 에러 로그 모니터링
- [ ] 성능 저하 감지

## 10. 최적화 체크리스트

### 10.1 빌드 최적화

- [ ] 번들 크기 확인 (200KB 이하)
- [ ] 코드 스플리팅 확인
- [ ] 불필요한 의존성 제거

### 10.2 이미지 최적화

- [ ] Next.js Image 컴포넌트 사용
- [ ] AVIF/WebP 포맷 확인
- [ ] 이미지 크기 최적화

### 10.3 React 최적화

- [ ] React.memo 적절히 사용
- [ ] useMemo, useCallback 최적화
- [ ] 상태 관리 최적화

### 10.4 API 최적화

- [ ] 중복 요청 방지
- [ ] 적절한 캐싱 전략
- [ ] 데이터베이스 쿼리 최적화

### 10.5 Core Web Vitals

- [ ] LCP: 2.5초 이하
- [ ] FID: 100ms 이하
- [ ] CLS: 0.1 이하

### 10.6 Lighthouse 점수

- [ ] Performance: 90+
- [ ] Accessibility: 90+
- [ ] Best Practices: 90+
- [ ] SEO: 90+

## 참고 자료

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

