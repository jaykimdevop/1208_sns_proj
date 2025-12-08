/**
 * @file page.tsx
 * @description 메인 홈 페이지 (임시 테스트용)
 *
 * 레이아웃 구조 테스트를 위한 임시 페이지입니다.
 * 추후 PostFeed 컴포넌트로 교체 예정입니다.
 */

export default function HomePage() {
  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: 'var(--color-instagram-background)' }}>
      <div className="max-w-[630px] mx-auto px-4">
        <div className="bg-white rounded-lg border p-8" style={{ borderColor: 'var(--color-instagram-border)' }}>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-instagram-text-primary)' }}>
            레이아웃 구조 테스트
          </h1>
          <p className="mb-4" style={{ color: 'var(--color-instagram-text-secondary)' }}>
            이 페이지는 레이아웃 구조가 제대로 작동하는지 확인하기 위한 테스트 페이지입니다.
          </p>
          <div className="space-y-2 text-sm" style={{ color: 'var(--color-instagram-text-secondary)' }}>
            <p>• Desktop (≥1024px): 왼쪽에 244px 너비 사이드바 표시</p>
            <p>• Tablet (768px~1023px): 왼쪽에 72px 너비 아이콘 전용 사이드바 표시</p>
            <p>• Mobile (&lt;768px): 상단 헤더와 하단 네비게이션 표시</p>
          </div>
        </div>
      </div>
    </div>
  );
}

