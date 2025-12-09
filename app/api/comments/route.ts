/**
 * @file route.ts
 * @description 댓글 API (GET: 조회, POST: 작성, DELETE: 삭제)
 *
 * GET /api/comments?post_id={postId} - 게시물의 댓글 목록 조회 (Thread 형식, 최신순)
 * POST /api/comments - 댓글/답글 작성
 * DELETE /api/comments - 댓글 삭제
 *
 * 기능:
 * 1. Clerk 인증 검증
 * 2. users 테이블에서 clerk_id로 user_id 조회
 * 3. comments 테이블에 SELECT/INSERT/DELETE
 * 4. Thread 형식 지원 (parent_id를 통한 1단계 답글)
 *
 * @dependencies
 * - @clerk/nextjs/server: auth()
 * - lib/supabase/server: createClerkSupabaseClient
 * - lib/types: CreateCommentRequest, CreateCommentResponse, DeleteCommentRequest, DeleteCommentResponse, ThreadedCommentsResponse
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type {
  CreateCommentRequest,
  CreateCommentResponse,
  DeleteCommentRequest,
  DeleteCommentResponse,
  ThreadedCommentsResponse,
  CommentWithUser,
  CommentWithReplies,
} from "@/lib/types";

/**
 * GET /api/comments - 게시물의 댓글 목록 조회 (Thread 형식, 최신순)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("post_id");

    if (!postId) {
      return NextResponse.json<ThreadedCommentsResponse>(
        { success: false, data: [], total_count: 0, root_count: 0, error: "게시물 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 1. 모든 댓글 조회 (최신순)
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select("id, post_id, user_id, parent_id, content, created_at, updated_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return NextResponse.json<ThreadedCommentsResponse>(
        { success: false, data: [], total_count: 0, root_count: 0, error: "댓글 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    if (!commentsData || commentsData.length === 0) {
      return NextResponse.json<ThreadedCommentsResponse>({
        success: true,
        data: [],
        total_count: 0,
        root_count: 0,
      });
    }

    // 2. 댓글 작성자 정보 조회
    const userIds = [...new Set(commentsData.map((c) => c.user_id))];
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json<ThreadedCommentsResponse>(
        { success: false, data: [], total_count: 0, root_count: 0, error: "사용자 정보 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const usersMap = new Map((usersData || []).map((u) => [u.id, u]));

    // 3. 댓글에 사용자 정보 매핑
    const commentsWithUser: CommentWithUser[] = commentsData.map((comment) => ({
      ...comment,
      user: usersMap.get(comment.user_id) || { id: comment.user_id, clerk_id: "", name: "Unknown", created_at: "" },
    }));

    // 4. Thread 형식으로 그룹화 (루트 댓글 + 답글)
    const rootComments: CommentWithUser[] = [];
    const repliesMap = new Map<string, CommentWithUser[]>();

    for (const comment of commentsWithUser) {
      if (comment.parent_id === null) {
        rootComments.push(comment);
      } else {
        const replies = repliesMap.get(comment.parent_id) || [];
        replies.push(comment);
        repliesMap.set(comment.parent_id, replies);
      }
    }

    // 5. 루트 댓글을 최신순으로 정렬 (ascending: false 이미 적용되어 있지만, 명시적으로 정렬)
    rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 6. 루트 댓글에 답글 연결 (답글은 오래된 순으로 정렬)
    const threadedComments: CommentWithReplies[] = rootComments.map((rootComment) => {
      const replies = repliesMap.get(rootComment.id) || [];
      // 답글은 오래된 순으로 정렬 (시간순)
      replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      return {
        ...rootComment,
        replies,
        replies_count: replies.length,
      };
    });

    return NextResponse.json<ThreadedCommentsResponse>({
      success: true,
      data: threadedComments,
      total_count: commentsData.length,
      root_count: rootComments.length,
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/comments:", error);
    return NextResponse.json<ThreadedCommentsResponse>(
      { success: false, data: [], total_count: 0, root_count: 0, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments - 댓글/답글 작성
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Clerk 인증 검증
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json<CreateCommentResponse>(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body: CreateCommentRequest = await request.json();
    const { post_id, content, parent_id } = body;

    if (!post_id) {
      return NextResponse.json<CreateCommentResponse>(
        { success: false, error: "게시물 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json<CreateCommentResponse>(
        { success: false, error: "댓글 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 3. users 테이블에서 clerk_id로 user_id 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json<CreateCommentResponse>(
        { success: false, error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // 4. parent_id가 있는 경우 검증 (1단계 깊이 제한)
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from("comments")
        .select("id, parent_id, post_id")
        .eq("id", parent_id)
        .single();

      if (parentError || !parentComment) {
        console.error("Error fetching parent comment:", parentError);
        return NextResponse.json<CreateCommentResponse>(
          { success: false, error: "부모 댓글을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      // 부모 댓글이 같은 게시물에 속하는지 확인
      if (parentComment.post_id !== post_id) {
        return NextResponse.json<CreateCommentResponse>(
          { success: false, error: "잘못된 부모 댓글입니다." },
          { status: 400 }
        );
      }

      // 1단계 깊이 제한: 부모 댓글이 이미 답글이면 거부
      if (parentComment.parent_id !== null) {
        return NextResponse.json<CreateCommentResponse>(
          { success: false, error: "답글에는 답글을 달 수 없습니다." },
          { status: 400 }
        );
      }
    }

    // 5. comments 테이블에 INSERT
    const { data: commentData, error: insertError } = await supabase
      .from("comments")
      .insert({
        post_id,
        user_id: userId,
        parent_id: parent_id || null,
        content: content.trim(),
      })
      .select("id, post_id, user_id, parent_id, content, created_at, updated_at")
      .single();

    if (insertError) {
      console.error("Error inserting comment:", insertError);
      return NextResponse.json<CreateCommentResponse>(
        { success: false, error: "댓글 작성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 6. 성공 응답 (사용자 정보 포함)
    return NextResponse.json<CreateCommentResponse>({
      success: true,
      comment: {
        ...commentData,
        user: userData,
      },
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/comments:", error);
    return NextResponse.json<CreateCommentResponse>(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments - 댓글 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Clerk 인증 검증
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json<DeleteCommentResponse>(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body: DeleteCommentRequest = await request.json();
    const { comment_id } = body;

    if (!comment_id) {
      return NextResponse.json<DeleteCommentResponse>(
        { success: false, error: "댓글 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 3. users 테이블에서 clerk_id로 user_id 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json<DeleteCommentResponse>(
        { success: false, error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // 4. 댓글 조회 (본인 댓글인지 확인)
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .select("id, user_id")
      .eq("id", comment_id)
      .single();

    if (commentError || !commentData) {
      console.error("Error fetching comment:", commentError);
      return NextResponse.json<DeleteCommentResponse>(
        { success: false, error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 5. 본인 댓글인지 확인
    if (commentData.user_id !== userId) {
      return NextResponse.json<DeleteCommentResponse>(
        { success: false, error: "본인의 댓글만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 6. comments 테이블에서 DELETE (CASCADE로 답글도 함께 삭제됨)
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", comment_id);

    if (deleteError) {
      console.error("Error deleting comment:", deleteError);
      return NextResponse.json<DeleteCommentResponse>(
        { success: false, error: "댓글 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json<DeleteCommentResponse>({
      success: true,
    });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/comments:", error);
    return NextResponse.json<DeleteCommentResponse>(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
