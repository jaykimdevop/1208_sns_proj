/**
 * @file PostCardSkeleton.tsx
 * @description 게시물 카드 로딩 스켈레톤 컴포넌트
 *
 * PostCard와 동일한 레이아웃 구조를 가진 로딩 스켈레톤입니다.
 * 귀여운 손그림 스타일과 Shimmer 효과를 사용하여 로딩 상태를 표시합니다.
 *
 * @dependencies
 * - Tailwind CSS: 애니메이션 클래스
 */

export function PostCardSkeleton() {
  return (
    <div className="sketch-card bg-white mb-6 overflow-hidden animate-fade-in">
      {/* 헤더 영역 (60px) */}
      <div className="flex items-center justify-between px-4 h-[60px] border-b-2 border-dashed" style={{ borderColor: 'var(--color-cute-border)' }}>
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 스켈레톤 */}
          <div className="w-8 h-8 sketch-avatar animate-shimmer-cute" />
          {/* 사용자명 스켈레톤 */}
          <div className="h-4 w-24 rounded-full animate-shimmer" />
        </div>
        {/* 메뉴 버튼 스켈레톤 */}
        <div className="w-6 h-6 rounded-full animate-shimmer" />
      </div>

      {/* 이미지 영역 (정사각형) */}
      <div className="w-full aspect-square animate-shimmer-cute" />

      {/* 액션 버튼 영역 (48px) */}
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 rounded-full animate-shimmer" />
          <div className="w-6 h-6 rounded-full animate-shimmer" />
          <div className="w-6 h-6 rounded-full animate-shimmer" />
        </div>
        <div className="w-6 h-6 rounded-full animate-shimmer" />
      </div>

      {/* 좋아요 수 스켈레톤 */}
      <div className="px-4 pb-2">
        <div className="h-4 w-20 rounded-full animate-shimmer" />
      </div>

      {/* 캡션 스켈레톤 */}
      <div className="px-4 pb-2">
        <div className="h-4 w-full rounded-full animate-shimmer mb-2" />
        <div className="h-4 w-3/4 rounded-full animate-shimmer" />
      </div>

      {/* 댓글 미리보기 스켈레톤 */}
      <div className="px-4 pb-4">
        <div className="h-4 w-32 rounded-full animate-shimmer mb-2" />
        <div className="h-4 w-full rounded-full animate-shimmer mb-2" />
        <div className="h-4 w-5/6 rounded-full animate-shimmer" />
      </div>
    </div>
  );
}

