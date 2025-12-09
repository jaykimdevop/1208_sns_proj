/**
 * @file route.ts
 * @description 게시물 목록 조회 API
 *
 * GET /api/posts?limit=10&offset=0&userId=xxx (선택적)
 *
 * 기능:
 * 1. post_stats 뷰에서 게시물 조회 (created_at DESC 정렬)
 * 2. users 테이블 조인 (사용자 정보)
 * 3. comments 테이블 조인 (최신 2개, created_at DESC)
 * 4. limit, offset으로 페이지네이션
 * 5. userId 파라미터가 있으면 해당 사용자의 게시물만 필터링
 * 6. 현재 사용자의 좋아요 여부 (isLiked) 포함
 *
 * @dependencies
 * - @clerk/nextjs/server: auth()
 * - lib/supabase/server: createClerkSupabaseClient
 * - lib/types: PostWithStats, CommentWithUser, PostsResponse
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type {
  PostWithStats,
  CommentWithUser,
  PostsResponse,
} from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClerkSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

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

    // 쿼리 파라미터 파싱
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const userId = searchParams.get("userId");

    // post_stats 뷰에서 게시물 조회 (기본 쿼리)
    let query = supabase
      .from("post_stats")
      .select(
        `
        post_id,
        user_id,
        image_url,
        caption,
        created_at,
        likes_count,
        comments_count
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // userId 파라미터가 있으면 해당 사용자의 게시물만 필터링
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: postsData, error: postsError, count } = await query;

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 }
      );
    }

    if (!postsData || postsData.length === 0) {
      return NextResponse.json<PostsResponse>({
        data: [],
        count: count || 0,
        hasMore: false,
      });
    }

    // 사용자 ID 목록 수집
    const userIds = [...new Set(postsData.map((post: any) => post.user_id))];

    // 사용자 정보 일괄 조회
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching users:", usersError);
    }

    // 사용자 정보를 Map으로 변환 (빠른 조회를 위해)
    const usersMap = new Map(
      (usersData || []).map((user: any) => [user.id, user])
    );

    // 모든 게시물의 댓글을 배치로 조회 (N+1 쿼리 문제 해결)
    const postIds = postsData.map((post: any) => post.post_id);
    const { data: allComments, error: commentsError } = await supabase
      .from("comments")
      .select("id, post_id, user_id, content, created_at, updated_at")
      .in("post_id", postIds)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
    }

    // 댓글 작성자 ID 수집
    const commentUserIds = [
      ...new Set((allComments || []).map((comment: any) => comment.user_id)),
    ];

    // 댓글 작성자 정보 일괄 조회
    const { data: commentUsersData } =
      commentUserIds.length > 0
        ? await supabase
            .from("users")
            .select("id, clerk_id, name, created_at")
            .in("id", commentUserIds)
        : { data: null };

    const commentUsersMap = new Map(
      (commentUsersData || []).map((user: any) => [user.id, user])
    );

    // 댓글을 게시물별로 그룹화 (최신 2개만)
    const commentsByPostId = new Map<string, typeof allComments>();
    (allComments || []).forEach((comment: any) => {
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
        likedPostIds = new Set(userLikes.map((like: any) => like.post_id));
      }
    }

    // 게시물 데이터 형식 변환
    const postsWithComments = postsData.map((post: any) => {
      const postComments = commentsByPostId.get(post.post_id) || [];
      const formattedComments: CommentWithUser[] = postComments.map(
        (comment: any) => ({
          id: comment.id,
          post_id: comment.post_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          user: commentUsersMap.get(comment.user_id) || null,
        })
      );

      return {
        post_id: post.post_id,
        user_id: post.user_id,
        image_url: post.image_url,
        caption: post.caption,
        created_at: post.created_at,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        user: usersMap.get(post.user_id) || null,
        comments: formattedComments,
        isLiked: likedPostIds.has(post.post_id),
      };
    });

    // 타입 안전성을 위한 형식 변환
    const formattedPosts: (PostWithStats & {
      comments: CommentWithUser[];
      isLiked: boolean;
    })[] = postsWithComments.map((post) => ({
      post_id: post.post_id,
      user_id: post.user_id,
      image_url: post.image_url,
      caption: post.caption,
      created_at: post.created_at,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      user: post.user,
      comments: post.comments,
      isLiked: post.isLiked,
    }));

    const hasMore = count ? offset + limit < count : false;

    return NextResponse.json<PostsResponse>({
      data: formattedPosts,
      count: count || 0,
      hasMore,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

