/**
 * @file route.ts
 * @description 댓글 API (POST: 작성, DELETE: 삭제)
 *
 * POST /api/comments - 댓글 작성
 * DELETE /api/comments - 댓글 삭제
 *
 * 기능:
 * 1. Clerk 인증 검증
 * 2. users 테이블에서 clerk_id로 user_id 조회
 * 3. comments 테이블에 INSERT/DELETE
 *
 * @dependencies
 * - @clerk/nextjs/server: auth()
 * - lib/supabase/server: createClerkSupabaseClient
 * - lib/types: CreateCommentRequest, CreateCommentResponse, DeleteCommentRequest, DeleteCommentResponse
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type {
  CreateCommentRequest,
  CreateCommentResponse,
  DeleteCommentRequest,
  DeleteCommentResponse,
} from "@/lib/types";

/**
 * POST /api/comments - 댓글 작성
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
    const { post_id, content } = body;

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

    // 4. comments 테이블에 INSERT
    const { data: commentData, error: insertError } = await supabase
      .from("comments")
      .insert({
        post_id,
        user_id: userId,
        content: content.trim(),
      })
      .select("id, post_id, user_id, content, created_at, updated_at")
      .single();

    if (insertError) {
      console.error("Error inserting comment:", insertError);
      return NextResponse.json<CreateCommentResponse>(
        { success: false, error: "댓글 작성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 5. 성공 응답 (사용자 정보 포함)
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

    // 6. comments 테이블에서 DELETE
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

