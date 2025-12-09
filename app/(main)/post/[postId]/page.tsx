/**
 * @file page.tsx
 * @description 게시물 상세 페이지
 *
 * Mobile에서 게시물 상세를 전체 페이지로 표시합니다.
 * 이미지 상단, 댓글 하단 레이아웃을 사용합니다.
 *
 * 주요 기능:
 * 1. 게시물 상세 정보 표시
 * 2. 전체 댓글 목록 표시
 * 3. 좋아요, 댓글 입력 기능
 * 4. 뒤로가기 버튼
 *
 * @dependencies
 * - components/comment/comment-list: 전체 댓글 목록
 * - components/comment/CommentForm: 댓글 입력 폼
 * - components/post/LikeButton: 좋아요 버튼
 * - lib/supabase/server: Supabase 클라이언트
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { PostDetailClient } from "./post-detail-client";

interface PostDetailPageProps {
  params: Promise<{
    postId: string;
  }>;
}

async function getPostDetail(postId: string) {
  try {
    const supabase = createClerkSupabaseClient();

    // 현재 로그인한 사용자 정보 가져오기
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

    // 게시물 조회
    const { data: postData, error: postError } = await supabase
      .from("post_stats")
      .select("post_id, user_id, image_url, caption, created_at, likes_count, comments_count")
      .eq("post_id", postId)
      .single();

    if (postError || !postData) {
      console.error("Error fetching post:", postError);
      return null;
    }

    // 사용자 정보 조회
    const { data: userData } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("id", postData.user_id)
      .single();

    // 전체 댓글 조회 (parent_id 포함)
    const { data: commentsData } = await supabase
      .from("comments")
      .select("id, post_id, user_id, parent_id, content, created_at, updated_at")
      .eq("post_id", postId)
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

    // 현재 사용자의 좋아요 여부 조회
    let isLiked = false;
    if (currentUserId) {
      const { data: userLike } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("post_id", postId)
        .single();

      isLiked = !!userLike;
    }

    // 데이터 형식 변환
    const formattedPost = {
      post_id: postData.post_id,
      user_id: postData.user_id,
      image_url: postData.image_url,
      caption: postData.caption,
      created_at: postData.created_at,
      likes_count: postData.likes_count || 0,
      comments_count: postData.comments_count || 0,
      user: userData || null,
      comments: (commentsData || []).map((comment) => ({
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        parent_id: comment.parent_id || null,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: commentUsersMap.get(comment.user_id) || null,
      })),
      isLiked,
    };

    return formattedPost;
  } catch (error) {
    console.error("Error fetching post detail:", error);
    return null;
  }
}

function PostDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 스켈레톤 */}
      <div className="sticky top-0 z-10 bg-white border-b h-[50px] flex items-center px-4">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
        <div className="flex-1 flex justify-center">
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-6" />
      </div>

      {/* 이미지 스켈레톤 */}
      <div className="w-full aspect-square bg-gray-200 animate-pulse" />

      {/* 액션 버튼 스켈레톤 */}
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 좋아요 수 스켈레톤 */}
      <div className="px-4 pb-2">
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 캡션 스켈레톤 */}
      <div className="px-4 pb-4">
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

async function PostDetailContent({ postId }: { postId: string }) {
  const post = await getPostDetail(postId);

  if (!post) {
    notFound();
  }

  return <PostDetailClient post={post} />;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;

  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <PostDetailContent postId={postId} />
    </Suspense>
  );
}

