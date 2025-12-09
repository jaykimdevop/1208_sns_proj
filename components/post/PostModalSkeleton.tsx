/**
 * @file PostModalSkeleton.tsx
 * @description 게시물 모달 로딩 스켈레톤 컴포넌트
 *
 * 게시물 상세 모달의 로딩 상태를 표시합니다.
 * 귀여운 손그림 스타일과 Shimmer 효과를 사용합니다.
 *
 * @dependencies
 * - Tailwind CSS: 애니메이션 클래스
 */

export function PostModalSkeleton() {
  return (
    <div className="flex h-full sketch-modal overflow-hidden animate-bounce-in">
      {/* 이미지 영역 (50%) */}
      <div className="w-1/2 aspect-square animate-shimmer-cute" />
      
      {/* 컨텐츠 영역 (50%) */}
      <div className="w-1/2 flex flex-col border-l-4 border-dashed" style={{ borderColor: "var(--color-cute-border)" }}>
        {/* 헤더 */}
        <div className="flex items-center gap-3 p-4 border-b-2 border-dashed" style={{ borderColor: "var(--color-cute-border)" }}>
          <div className="w-10 h-10 sketch-avatar animate-shimmer" />
          <div className="h-4 w-24 rounded-full animate-shimmer" />
        </div>
        
        {/* 캡션 */}
        <div className="p-4 border-b-2 border-dashed" style={{ borderColor: "var(--color-cute-border)" }}>
          <div className="h-4 w-full rounded-full animate-shimmer mb-2" />
          <div className="h-4 w-3/4 rounded-full animate-shimmer" />
        </div>
        
        {/* 댓글 영역 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 mb-4"
              style={{
                opacity: 0,
                animation: `slide-up 0.3s ease-out forwards`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div className="w-8 h-8 sketch-avatar animate-shimmer flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-20 rounded-full animate-shimmer mb-2" />
                <div className="h-3 w-full rounded-full animate-shimmer mb-1" />
                <div className="h-3 w-2/3 rounded-full animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
        
        {/* 액션 버튼 영역 */}
        <div className="p-4 border-t-2 border-dashed" style={{ borderColor: "var(--color-cute-border)" }}>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-6 h-6 rounded-full animate-shimmer" />
            <div className="w-6 h-6 rounded-full animate-shimmer" />
            <div className="w-6 h-6 rounded-full animate-shimmer" />
            <div className="ml-auto w-6 h-6 rounded-full animate-shimmer" />
          </div>
          <div className="h-4 w-24 rounded-full animate-shimmer mb-2" />
          <div className="h-3 w-16 rounded-full animate-shimmer" />
        </div>
        
        {/* 댓글 입력 영역 */}
        <div className="p-4 border-t-2 border-dashed" style={{ borderColor: "var(--color-cute-border)" }}>
          <div className="h-10 w-full rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

