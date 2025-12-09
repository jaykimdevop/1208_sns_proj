"use client";

/**
 * @file profile-client.tsx
 * @description 프로필 페이지 클라이언트 컴포넌트
 *
 * 프로필 헤더와 게시물 그리드를 렌더링합니다.
 * 무한 스크롤로 추가 게시물을 로드합니다.
 *
 * @dependencies
 * - components/profile/profile-header: 프로필 헤더
 * - components/profile/post-grid: 게시물 그리드
 */

import { useState, useCallback } from "react";
import { Grid3X3 } from "lucide-react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PostGrid } from "@/components/profile/post-grid";
import type { UserStats, PostWithStats, CommentWithUser, PostsResponse } from "@/lib/types";

interface ProfileClientProps {
  user: UserStats;
  isOwnProfile: boolean;
  isFollowing: boolean;
  initialPosts: (PostWithStats & { comments: CommentWithUser[]; isLiked: boolean })[];
}

export function ProfileClient({
  user,
  isOwnProfile,
  isFollowing: initialIsFollowing,
  initialPosts,
}: ProfileClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 12);
  const [offset, setOffset] = useState(initialPosts.length);

  // 팔로우 버튼 클릭 핸들러 (Phase 9에서 구현 예정)
  const handleFollowClick = useCallback(() => {
    // TODO: Phase 9에서 팔로우 API 연동
    console.log("Follow button clicked - to be implemented in Phase 9");
  }, []);

  // 더 많은 게시물 로드
  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/posts?userId=${user.user_id}&limit=12&offset=${offset}`
      );
      const data: PostsResponse = await response.json();

      if (data.data && data.data.length > 0) {
        setPosts((prev) => [...prev, ...data.data]);
        setOffset((prev) => prev + data.data.length);
        setHasMore(data.hasMore || false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset, user.user_id]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-instagram-bg)" }}
    >
      {/* 프로필 헤더 */}
      <ProfileHeader
        user={user}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollowClick={handleFollowClick}
      />

      {/* 탭 (게시물만 표시, 추후 확장 가능) */}
      <div
        className="border-t max-w-4xl mx-auto"
        style={{ borderColor: "var(--color-instagram-border)" }}
      >
        <div className="flex justify-center">
          <button
            className="flex items-center gap-2 px-4 py-3 border-t transition-colors"
            style={{
              borderColor: "var(--color-instagram-text-primary)",
              color: "var(--color-instagram-text-primary)",
            }}
          >
            <Grid3X3 size={12} />
            <span className="text-xs font-semibold tracking-wider uppercase">
              게시물
            </span>
          </button>
        </div>
      </div>

      {/* 게시물 그리드 */}
      <div className="max-w-4xl mx-auto pb-16">
        <PostGrid
          posts={posts}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

