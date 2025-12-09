/**
 * @file route.ts
 * @description 게시물 API (조회 및 생성)
 *
 * GET /api/posts?limit=10&offset=0&userId=xxx (선택적)
 * POST /api/posts (FormData: image, caption)
 *
 * 기능:
 * 1. GET: post_stats 뷰에서 게시물 조회 (created_at DESC 정렬)
 * 2. GET: users 테이블 조인 (사용자 정보)
 * 3. GET: comments 테이블 조인 (최신 2개, created_at DESC)
 * 4. GET: limit, offset으로 페이지네이션
 * 5. GET: userId 파라미터가 있으면 해당 사용자의 게시물만 필터링
 * 6. GET: 현재 사용자의 좋아요 여부 (isLiked) 포함
 * 7. POST: 이미지 업로드 및 게시물 생성
 *
 * @dependencies
 * - @clerk/nextjs/server: auth()
 * - lib/supabase/server: createClerkSupabaseClient
 * - lib/types: PostWithStats, CommentWithUser, PostsResponse, CreatePostResponse
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type {
  PostWithStats,
  CommentWithUser,
  PostsResponse,
  CreatePostResponse,
} from "@/lib/types";

// ============================================
// 상수 정의
// ============================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_CAPTION_LENGTH = 2200;

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
      .select("id, post_id, user_id, parent_id, content, created_at, updated_at")
      .in("post_id", postIds)
      .is("parent_id", null)
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

    // 현재 사용자의 북마크 여부 조회
    let bookmarkedPostIds = new Set<string>();
    if (clerkUserId) {
      const { data: userBookmarks } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", clerkUserId)
        .in("post_id", postIds);

      if (userBookmarks) {
        bookmarkedPostIds = new Set(userBookmarks.map((bookmark: any) => bookmark.post_id));
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
          parent_id: comment.parent_id || null,
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
        isBookmarked: bookmarkedPostIds.has(post.post_id),
      };
    });

    // 타입 안전성을 위한 형식 변환
    const formattedPosts: (PostWithStats & {
      comments: CommentWithUser[];
      isLiked: boolean;
      isBookmarked: boolean;
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
      isBookmarked: post.isBookmarked,
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

// ============================================
// POST: 게시물 생성
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. Clerk 인증 검증
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json<CreatePostResponse>(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. FormData 파싱
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const caption = (formData.get("caption") as string) || "";

    // 3. 이미지 파일 검증
    if (!imageFile) {
      return NextResponse.json<CreatePostResponse>(
        { success: false, error: "이미지를 선택해주세요." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(imageFile.type)) {
      return NextResponse.json<CreatePostResponse>(
        {
          success: false,
          error: "지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP, GIF만 가능)",
        },
        { status: 400 }
      );
    }

    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json<CreatePostResponse>(
        { success: false, error: "이미지 크기는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 4. 캡션 길이 검증
    if (caption.length > MAX_CAPTION_LENGTH) {
      return NextResponse.json<CreatePostResponse>(
        { success: false, error: `캡션은 ${MAX_CAPTION_LENGTH}자 이하여야 합니다.` },
        { status: 400 }
      );
    }

    // 5. Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 6. users 테이블에서 clerk_id로 user_id 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json<CreatePostResponse>(
        { success: false, error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // 7. 파일명 생성 (중복 방지)
    const timestamp = Date.now();
    const fileExt = imageFile.name.split(".").pop() || "jpg";
    const fileName = `${userId}/${timestamp}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    // 8. 이미지를 Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("posts")
      .upload(fileName, imageFile, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return NextResponse.json<CreatePostResponse>(
        { success: false, error: "이미지 업로드에 실패했습니다." },
        { status: 500 }
      );
    }

    // 9. 업로드된 이미지의 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from("posts")
      .getPublicUrl(uploadData.path);

    const imageUrl = publicUrlData.publicUrl;

    // 10. posts 테이블에 데이터 저장
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        image_url: imageUrl,
        caption: caption.trim() || null,
      })
      .select("id, image_url, caption, created_at")
      .single();

    if (postError) {
      console.error("Error creating post:", postError);
      // 업로드된 이미지 삭제 시도 (롤백)
      await supabase.storage.from("posts").remove([uploadData.path]);
      return NextResponse.json<CreatePostResponse>(
        { success: false, error: "게시물 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 11. 성공 응답
    return NextResponse.json<CreatePostResponse>({
      success: true,
      post: {
        id: postData.id,
        image_url: postData.image_url,
        caption: postData.caption,
        created_at: postData.created_at,
      },
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/posts:", error);
    return NextResponse.json<CreatePostResponse>(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

