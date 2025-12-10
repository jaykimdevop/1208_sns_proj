/**
 * @file page.tsx
 * @description 메인 홈 피드 페이지
 *
 * 게시물 피드를 표시하는 홈 페이지입니다.
 * PostFeed 컴포넌트를 사용하여 게시물 목록을 표시하고 무한 스크롤을 지원합니다.
 *
 * @dependencies
 * - components/post/PostFeed: 게시물 피드 컴포넌트
 * - react: Suspense
 */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { PostCardSkeleton } from "@/components/post/PostCardSkeleton";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { PostFeedClientWrapper } from "@/components/post/PostFeedClientWrapper";
import type { PostsResponse } from "@/lib/types";

async function getInitialPosts(): Promise<PostsResponse | null> {
  try {
    const supabase = createClerkSupabaseClient();

    // 현재 로그인한 사용자 정보 가져오기 (좋아요 여부 확인용)
    const { userId: clerkUserId } = await auth();
    let currentUserId: string | null = null;

    if (clerkUserId) {
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();
      currentUserId = currentUser?.id || null;
    }

    // post_stats 뷰에서 게시물 조회
    const { data: postsData, error: postsError, count } = await supabase
      .from("post_stats")
      .select("post_id, user_id, image_url, caption, created_at, likes_count, comments_count", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(0, 9);

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return null;
    }

    if (!postsData || postsData.length === 0) {
      return {
        data: [],
        count: 0,
        hasMore: false,
      };
    }

    // 사용자 정보 조회
    const userIds = [...new Set(postsData.map((post) => post.user_id))];
    const { data: usersData } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .in("id", userIds);

    const usersMap = new Map(
      (usersData || []).map((user) => [user.id, user])
    );

    // 댓글 조회 (루트 댓글만, parent_id가 null인 것)
    const postIds = postsData.map((post) => post.post_id);
    const { data: commentsData } = await supabase
      .from("comments")
      .select("id, post_id, user_id, parent_id, content, created_at, updated_at")
      .in("post_id", postIds)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    // 댓글 작성자 정보 조회
    const commentUserIds = [
      ...new Set((commentsData || []).map((comment) => comment.user_id)),
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
    const commentsByPostId = new Map<string, typeof commentsData>();
    (commentsData || []).forEach((comment) => {
      if (!commentsByPostId.has(comment.post_id)) {
        commentsByPostId.set(comment.post_id, []);
      }
      const postComments = commentsByPostId.get(comment.post_id)!;
      if (postComments.length < 2) {
        postComments.push(comment);
      }
    });

    // 현재 사용자의 좋아요 여부 조회
    let likedPostIds = new Set<string>();
    if (currentUserId) {
      const { data: userLikes } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", currentUserId)
        .in("post_id", postIds);

      if (userLikes) {
        likedPostIds = new Set(userLikes.map((like) => like.post_id));
      }
    }

    // 데이터 형식 변환
    const formattedPosts = postsData.map((post) => ({
      post_id: post.post_id,
      user_id: post.user_id,
      image_url: post.image_url,
      caption: post.caption,
      created_at: post.created_at,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      user: usersMap.get(post.user_id) || null,
      comments: (commentsByPostId.get(post.post_id) || []).map((comment) => ({
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        parent_id: comment.parent_id || null,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: commentUsersMap.get(comment.user_id) || null,
      })),
      isLiked: likedPostIds.has(post.post_id),
    }));

    return {
      data: formattedPosts,
      count: count || 0,
      hasMore: (count || 0) > 10,
    };
  } catch (error) {
    console.error("Error fetching initial posts:", error);
    return null;
  }
}

function PostFeedWrapper() {
  return (
    <Suspense
      fallback={
        <div className="py-8 animate-fade-in">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`stagger-${i + 1}`} style={{ opacity: 0, animation: `slide-up 0.5s ease-out forwards`, animationDelay: `${i * 0.1}s` }}>
              <PostCardSkeleton />
            </div>
          ))}
        </div>
      }
    >
      <PostFeedContent />
    </Suspense>
  );
}

async function PostFeedContent() {
  const initialPosts = await getInitialPosts();

  return <PostFeedClientWrapper initialPosts={initialPosts || undefined} />;
}

export default function HomePage() {
  // 레이아웃에서 이미 스타일링을 처리하므로 PostFeedWrapper만 반환
  return <PostFeedWrapper />;
}

