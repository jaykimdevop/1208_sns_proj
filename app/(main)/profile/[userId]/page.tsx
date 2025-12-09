/**
 * @file page.tsx
 * @description 사용자 프로필 페이지
 *
 * 사용자의 프로필 정보와 게시물 그리드를 표시합니다.
 * - ProfileHeader: 프로필 이미지, 사용자명, 통계
 * - PostGrid: 3열 그리드로 게시물 표시
 *
 * @dependencies
 * - components/profile/profile-header: 프로필 헤더
 * - components/profile/post-grid: 게시물 그리드
 */

import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { ProfileClient } from "./profile-client";
import type { UserStats, PostWithStats, CommentWithUser } from "@/lib/types";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;

  if (!userId) {
    notFound();
  }

  // 현재 로그인한 사용자 정보
  const { userId: currentClerkId } = await auth();

  const supabase = createClerkSupabaseClient();

  // userId가 UUID 형식인지 Clerk ID 형식인지 확인
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId
    );

  // 1. user_stats 뷰에서 사용자 통계 조회
  let userStatsQuery = supabase.from("user_stats").select("*");

  if (isUUID) {
    userStatsQuery = userStatsQuery.eq("user_id", userId);
  } else {
    // Clerk ID로 조회
    userStatsQuery = userStatsQuery.eq("clerk_id", userId);
  }

  const { data: userStats, error: userStatsError } =
    await userStatsQuery.single();

  if (userStatsError || !userStats) {
    console.error("Error fetching user stats:", userStatsError);
    notFound();
  }

  // 2. 본인 프로필인지 확인
  const isOwnProfile = currentClerkId === userStats.clerk_id;

  // 3. 팔로우 상태 확인 (로그인한 경우에만)
  let isFollowing = false;

  if (currentClerkId && !isOwnProfile) {
    // 현재 사용자의 Supabase user_id 조회
    const { data: currentUser } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", currentClerkId)
      .single();

    if (currentUser) {
      // follows 테이블에서 팔로우 관계 확인
      const { data: followData } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", userStats.user_id)
        .single();

      isFollowing = !!followData;
    }
  }

  // 4. 사용자의 게시물 조회 (초기 로드)
  const { data: postsData } = await supabase
    .from("post_stats")
    .select("*")
    .eq("user_id", userStats.user_id)
    .order("created_at", { ascending: false })
    .limit(12);

  // 5. 게시물에 필요한 추가 데이터 조회
  let posts: (PostWithStats & { comments: CommentWithUser[]; isLiked: boolean })[] = [];

  if (postsData && postsData.length > 0) {
    const postIds = postsData.map((post) => post.post_id);

    // 현재 사용자의 좋아요 여부 조회
    let likedPostIds = new Set<string>();
    if (currentClerkId) {
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", currentClerkId)
        .single();

      if (currentUser) {
        const { data: userLikes } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", currentUser.id)
          .in("post_id", postIds);

        if (userLikes) {
          likedPostIds = new Set(userLikes.map((like) => like.post_id));
        }
      }
    }

    // 댓글 조회 (각 게시물당 최신 2개)
    const { data: allComments } = await supabase
      .from("comments")
      .select("id, post_id, user_id, parent_id, content, created_at, updated_at")
      .in("post_id", postIds)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    // 댓글 작성자 정보 조회
    const commentUserIds = [
      ...new Set((allComments || []).map((comment) => comment.user_id)),
    ];

    const { data: commentUsersData } =
      commentUserIds.length > 0
        ? await supabase
            .from("users")
            .select("id, clerk_id, name, created_at")
            .in("id", commentUserIds)
        : { data: null };

    const commentUsersMap = new Map(
      (commentUsersData || []).map((user) => [user.id, user])
    );

    // 댓글을 게시물별로 그룹화 (최신 2개만)
    const commentsByPostId = new Map<string, CommentWithUser[]>();
    (allComments || []).forEach((comment) => {
      if (!commentsByPostId.has(comment.post_id)) {
        commentsByPostId.set(comment.post_id, []);
      }
      const postComments = commentsByPostId.get(comment.post_id)!;
      if (postComments.length < 2) {
        postComments.push({
          ...comment,
          user: commentUsersMap.get(comment.user_id) || {
            id: comment.user_id,
            clerk_id: "",
            name: "Unknown",
            created_at: "",
          },
        });
      }
    });

    // 게시물 데이터 형식 변환
    posts = postsData.map((post) => ({
      post_id: post.post_id,
      user_id: post.user_id,
      image_url: post.image_url,
      caption: post.caption,
      created_at: post.created_at,
      likes_count: Number(post.likes_count) || 0,
      comments_count: Number(post.comments_count) || 0,
      user: {
        id: userStats.user_id,
        clerk_id: userStats.clerk_id,
        name: userStats.name,
        created_at: "",
      },
      comments: commentsByPostId.get(post.post_id) || [],
      isLiked: likedPostIds.has(post.post_id),
    }));
  }

  // 6. 사용자 데이터 형식 변환
  const user: UserStats = {
    user_id: userStats.user_id,
    clerk_id: userStats.clerk_id,
    name: userStats.name,
    posts_count: Number(userStats.posts_count) || 0,
    followers_count: Number(userStats.followers_count) || 0,
    following_count: Number(userStats.following_count) || 0,
  };

  return (
    <ProfileClient
      user={user}
      isOwnProfile={isOwnProfile}
      isFollowing={isFollowing}
      initialPosts={posts}
    />
  );
}

