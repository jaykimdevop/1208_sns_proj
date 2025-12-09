"use client";

/**
 * @file profile-client.tsx
 * @description 프로필 페이지 클라이언트 컴포넌트
 *
 * 프로필 헤더와 게시물 그리드를 렌더링합니다.
 * 무한 스크롤로 추가 게시물을 로드합니다.
 * 팔로우 상태 변경 시 통계를 실시간으로 업데이트합니다.
 * 본인 프로필에서는 "저장됨" 탭으로 북마크된 게시물을 볼 수 있습니다.
 *
 * @dependencies
 * - components/profile/profile-header: 프로필 헤더
 * - components/profile/post-grid: 게시물 그리드
 */

import { useState, useCallback, useEffect } from "react";
import { Grid3X3, Bookmark } from "lucide-react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PostGrid } from "@/components/profile/post-grid";
import type { UserStats, PostWithStats, CommentWithUser, PostsResponse } from "@/lib/types";

type TabType = "posts" | "saved";

interface ProfileClientProps {
  user: UserStats;
  isOwnProfile: boolean;
  isFollowing: boolean;
  initialPosts: (PostWithStats & { comments: CommentWithUser[]; isLiked: boolean })[];
}

export function ProfileClient({
  user: initialUser,
  isOwnProfile,
  isFollowing: initialIsFollowing,
  initialPosts,
}: ProfileClientProps) {
  const [user, setUser] = useState(initialUser);
  const [posts, setPosts] = useState(initialPosts);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 12);
  const [offset, setOffset] = useState(initialPosts.length);

  // 탭 상태 (본인 프로필에서만 저장됨 탭 사용 가능)
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  
  // 저장된 게시물 상태
  const [savedPosts, setSavedPosts] = useState<(PostWithStats & { comments: CommentWithUser[]; isLiked: boolean })[]>([]);
  const [savedPostsLoading, setSavedPostsLoading] = useState(false);
  const [savedPostsHasMore, setSavedPostsHasMore] = useState(true);
  const [savedPostsOffset, setSavedPostsOffset] = useState(0);
  const [savedPostsLoaded, setSavedPostsLoaded] = useState(false);

  // 팔로우 상태 변경 핸들러
  const handleFollowChange = useCallback((newIsFollowing: boolean) => {
    setIsFollowing(newIsFollowing);
    // 팔로워 수 실시간 업데이트
    setUser((prevUser) => ({
      ...prevUser,
      followers_count: prevUser.followers_count + (newIsFollowing ? 1 : -1),
    }));
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

  // 저장된 게시물 로드
  const loadSavedPosts = useCallback(async (reset = false) => {
    if (savedPostsLoading || (!reset && !savedPostsHasMore)) return;

    setSavedPostsLoading(true);
    const currentOffset = reset ? 0 : savedPostsOffset;

    try {
      const response = await fetch(
        `/api/bookmarks?limit=12&offset=${currentOffset}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        if (reset) {
          setSavedPosts(data.data);
          setSavedPostsOffset(data.data.length);
        } else {
          setSavedPosts((prev) => [...prev, ...data.data]);
          setSavedPostsOffset((prev) => prev + data.data.length);
        }
        setSavedPostsHasMore(data.hasMore || false);
        setSavedPostsLoaded(true);
      }
    } catch (error) {
      console.error("Error loading saved posts:", error);
    } finally {
      setSavedPostsLoading(false);
    }
  }, [savedPostsLoading, savedPostsHasMore, savedPostsOffset]);

  // 저장됨 탭 클릭 시 데이터 로드
  useEffect(() => {
    if (activeTab === "saved" && isOwnProfile && !savedPostsLoaded) {
      loadSavedPosts(true);
    }
  }, [activeTab, isOwnProfile, savedPostsLoaded, loadSavedPosts]);

  // 저장된 게시물 더 로드
  const handleLoadMoreSaved = useCallback(() => {
    loadSavedPosts(false);
  }, [loadSavedPosts]);

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
        onFollowChange={handleFollowChange}
      />

      {/* 탭 */}
      <div
        className="border-t max-w-4xl mx-auto"
        style={{ borderColor: "var(--color-instagram-border)" }}
      >
        <div className="flex justify-center gap-8">
          {/* 게시물 탭 */}
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 px-4 py-3 border-t-2 transition-colors ${
              activeTab === "posts" ? "border-current" : "border-transparent"
            }`}
            style={{
              color: activeTab === "posts"
                ? "var(--color-instagram-text-primary)"
                : "var(--color-instagram-text-secondary)",
            }}
          >
            <Grid3X3 size={12} />
            <span className="text-xs font-semibold tracking-wider uppercase">
              게시물
            </span>
          </button>

          {/* 저장됨 탭 (본인 프로필에서만 표시) */}
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-2 px-4 py-3 border-t-2 transition-colors ${
                activeTab === "saved" ? "border-current" : "border-transparent"
              }`}
              style={{
                color: activeTab === "saved"
                  ? "var(--color-instagram-text-primary)"
                  : "var(--color-instagram-text-secondary)",
              }}
            >
              <Bookmark size={12} />
              <span className="text-xs font-semibold tracking-wider uppercase">
                저장됨
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 게시물 그리드 */}
      <div className="max-w-4xl mx-auto pb-16">
        {activeTab === "posts" ? (
          <PostGrid
            posts={posts}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            isLoading={isLoading}
          />
        ) : (
          <PostGrid
            posts={savedPosts}
            onLoadMore={handleLoadMoreSaved}
            hasMore={savedPostsHasMore}
            isLoading={savedPostsLoading}
            emptyMessage="저장된 게시물이 없습니다."
          />
        )}
      </div>
    </div>
  );
}

