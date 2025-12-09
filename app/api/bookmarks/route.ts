/**
 * @file route.ts
 * @description 북마크 API 라우트
 *
 * 게시물 북마크 추가/제거/조회 기능을 제공합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: 인증
 * - lib/supabase/server: Supabase 클라이언트
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { BookmarkRequest, BookmarkResponse, PostWithStats, CommentWithUser } from "@/lib/types";

// 북마크 목록 응답 타입
interface BookmarkedPostsResponse {
  success: boolean;
  data: (PostWithStats & { comments: CommentWithUser[]; isLiked: boolean; isBookmarked: boolean })[];
  count: number;
  hasMore: boolean;
  error?: string;
}

/**
 * GET /api/bookmarks
 * 북마크된 게시물 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json<BookmarkedPostsResponse>(
        { success: false, data: [], count: 0, hasMore: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = await createClerkSupabaseClient();

    // 현재 사용자의 UUID 조회
    const { data: currentUser } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    const currentUserId = currentUser?.id || null;

    // 북마크된 게시물 ID 목록 조회
    const { data: bookmarks, error: bookmarksError, count } = await supabase
      .from("bookmarks")
      .select("post_id, created_at", { count: "exact" })
      .eq("user_id", clerkUserId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (bookmarksError) {
      console.error("북마크 조회 실패:", bookmarksError);
      return NextResponse.json<BookmarkedPostsResponse>(
        { success: false, data: [], count: 0, hasMore: false, error: "북마크 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    if (!bookmarks || bookmarks.length === 0) {
      return NextResponse.json<BookmarkedPostsResponse>({
        success: true,
        data: [],
        count: 0,
        hasMore: false,
      });
    }

    const postIds = bookmarks.map((b) => b.post_id);

    // 게시물 정보 조회 (post_stats 뷰 사용)
    const { data: postsData, error: postsError } = await supabase
      .from("post_stats")
      .select("post_id, user_id, image_url, caption, created_at, likes_count, comments_count")
      .in("post_id", postIds);

    if (postsError) {
      console.error("게시물 조회 실패:", postsError);
      return NextResponse.json<BookmarkedPostsResponse>(
        { success: false, data: [], count: 0, hasMore: false, error: "게시물 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 사용자 정보 조회
    const userIds = [...new Set(postsData?.map((post) => post.user_id) || [])];
    const { data: usersData } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .in("id", userIds);

    const usersMap = new Map((usersData || []).map((user) => [user.id, user]));

    // 댓글 조회 (최신 2개)
    const { data: commentsData } = await supabase
      .from("comments")
      .select("id, post_id, user_id, parent_id, content, created_at, updated_at")
      .in("post_id", postIds)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    // 댓글 작성자 정보 조회
    const commentUserIds = [...new Set((commentsData || []).map((c) => c.user_id))];
    const { data: commentUsersData } = commentUserIds.length > 0
      ? await supabase.from("users").select("id, clerk_id, name, created_at").in("id", commentUserIds)
      : { data: null };

    const commentUsersMap = new Map((commentUsersData || []).map((user) => [user.id, user]));

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

    // 좋아요 여부 조회
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

    // 북마크 순서대로 게시물 정렬
    const postsMap = new Map((postsData || []).map((post) => [post.post_id, post]));
    const orderedPosts = postIds
      .map((postId) => postsMap.get(postId))
      .filter((post): post is NonNullable<typeof post> => post !== undefined);

    // 데이터 형식 변환
    const formattedPosts = orderedPosts.map((post) => {
      const postComments = commentsByPostId.get(post.post_id) || [];
      const formattedComments: CommentWithUser[] = postComments.map((comment) => ({
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        parent_id: comment.parent_id || null,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: commentUsersMap.get(comment.user_id) || null,
      }));

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
        isBookmarked: true, // 이 API는 북마크된 게시물만 반환하므로 항상 true
      };
    });

    const hasMore = count ? offset + limit < count : false;

    return NextResponse.json<BookmarkedPostsResponse>({
      success: true,
      data: formattedPosts,
      count: count || 0,
      hasMore,
    });
  } catch (error) {
    console.error("북마크 API 오류:", error);
    return NextResponse.json<BookmarkedPostsResponse>(
      { success: false, data: [], count: 0, hasMore: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookmarks
 * 북마크 추가
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json<BookmarkResponse>(
        { success: false, isBookmarked: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body: BookmarkRequest = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json<BookmarkResponse>(
        { success: false, isBookmarked: false, error: "게시물 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 게시물 존재 확인
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json<BookmarkResponse>(
        { success: false, isBookmarked: false, error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 북마크 추가 (이미 존재하면 무시)
    const { error: insertError } = await supabase
      .from("bookmarks")
      .insert({
        user_id: userId,
        post_id: post_id,
      });

    if (insertError) {
      // 중복 에러인 경우 (이미 북마크됨)
      if (insertError.code === "23505") {
        return NextResponse.json<BookmarkResponse>({
          success: true,
          isBookmarked: true,
        });
      }
      console.error("북마크 추가 실패:", insertError);
      return NextResponse.json<BookmarkResponse>(
        { success: false, isBookmarked: false, error: "북마크 추가에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json<BookmarkResponse>({
      success: true,
      isBookmarked: true,
    });
  } catch (error) {
    console.error("북마크 API 오류:", error);
    return NextResponse.json<BookmarkResponse>(
      { success: false, isBookmarked: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookmarks
 * 북마크 제거
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json<BookmarkResponse>(
        { success: false, isBookmarked: true, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body: BookmarkRequest = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json<BookmarkResponse>(
        { success: false, isBookmarked: true, error: "게시물 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 북마크 제거
    const { error: deleteError } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", post_id);

    if (deleteError) {
      console.error("북마크 제거 실패:", deleteError);
      return NextResponse.json<BookmarkResponse>(
        { success: false, isBookmarked: true, error: "북마크 제거에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json<BookmarkResponse>({
      success: true,
      isBookmarked: false,
    });
  } catch (error) {
    console.error("북마크 API 오류:", error);
    return NextResponse.json<BookmarkResponse>(
      { success: false, isBookmarked: true, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

