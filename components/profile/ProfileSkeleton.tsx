/**
 * @file ProfileSkeleton.tsx
 * @description 프로필 페이지 로딩 스켈레톤 컴포넌트
 *
 * 프로필 헤더와 게시물 그리드의 로딩 상태를 표시합니다.
 * 귀여운 손그림 스타일과 Shimmer 효과를 사용합니다.
 *
 * @dependencies
 * - Tailwind CSS: 애니메이션 클래스
 */

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen animate-fade-in" style={{ backgroundColor: "var(--color-instagram-bg)" }}>
      {/* 프로필 헤더 스켈레톤 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* 프로필 이미지 스켈레톤 */}
          <div className="w-[150px] h-[150px] md:w-[150px] md:h-[150px] sketch-avatar animate-shimmer-cute" />
          
          {/* 프로필 정보 스켈레톤 */}
          <div className="flex-1 text-center md:text-left">
            {/* 사용자명 */}
            <div className="h-8 w-48 rounded-full animate-shimmer mb-4 mx-auto md:mx-0" />
            
            {/* 통계 */}
            <div className="flex justify-center md:justify-start gap-8 mb-4">
              <div className="text-center">
                <div className="h-6 w-12 rounded-full animate-shimmer mb-1 mx-auto" />
                <div className="h-4 w-16 rounded-full animate-shimmer mx-auto" />
              </div>
              <div className="text-center">
                <div className="h-6 w-12 rounded-full animate-shimmer mb-1 mx-auto" />
                <div className="h-4 w-16 rounded-full animate-shimmer mx-auto" />
              </div>
              <div className="text-center">
                <div className="h-6 w-12 rounded-full animate-shimmer mb-1 mx-auto" />
                <div className="h-4 w-16 rounded-full animate-shimmer mx-auto" />
              </div>
            </div>
            
            {/* 버튼 */}
            <div className="h-10 w-32 rounded-full animate-shimmer mx-auto md:mx-0" />
          </div>
        </div>
      </div>

      {/* 탭 스켈레톤 */}
      <div className="border-t-2 border-dashed max-w-4xl mx-auto" style={{ borderColor: "var(--color-cute-border)" }}>
        <div className="flex justify-center gap-8 py-3">
          <div className="h-6 w-20 rounded-full animate-shimmer" />
          <div className="h-6 w-20 rounded-full animate-shimmer" />
        </div>
      </div>

      {/* 게시물 그리드 스켈레톤 */}
      <div className="max-w-4xl mx-auto pb-16 px-1">
        <div className="grid grid-cols-3 gap-1">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="aspect-square sketch-card animate-shimmer-cute"
              style={{
                opacity: 0,
                animation: `slide-up 0.5s ease-out forwards`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

