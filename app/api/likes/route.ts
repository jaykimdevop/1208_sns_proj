/**
 * @file route.ts
 * @description 좋아요 API (POST: 추가, DELETE: 제거)
 *
 * POST /api/likes - 좋아요 추가
 * DELETE /api/likes - 좋아요 제거
 *
 * 기능:
 * 1. Clerk 인증 검증
 * 2. users 테이블에서 clerk_id로 user_id 조회
 * 3. likes 테이블에 INSERT/DELETE
 *
 * @dependencies
 * - @clerk/nextjs/server: auth()
 * - lib/supabase/server: createClerkSupabaseClient
 * - lib/types: LikeRequest, LikeResponse
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { LikeRequest, LikeResponse } from "@/lib/types";

/**
 * POST /api/likes - 좋아요 추가
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Clerk 인증 검증
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json<LikeResponse>(
        { success: false, liked: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body: LikeRequest = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json<LikeResponse>(
        { success: false, liked: false, error: "post_id is required" },
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
      return NextResponse.json<LikeResponse>(
        { success: false, liked: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // 4. 이미 좋아요를 눌렀는지 확인
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", post_id)
      .eq("user_id", userId)
      .single();

    if (existingLike) {
      // 이미 좋아요가 있으면 성공으로 응답 (idempotent)
      return NextResponse.json<LikeResponse>({
        success: true,
        liked: true,
      });
    }

    // 5. likes 테이블에 INSERT
    const { error: insertError } = await supabase
      .from("likes")
      .insert({
        post_id,
        user_id: userId,
      });

    if (insertError) {
      console.error("Error inserting like:", insertError);
      return NextResponse.json<LikeResponse>(
        { success: false, liked: false, error: "Failed to add like" },
        { status: 500 }
      );
    }

    return NextResponse.json<LikeResponse>({
      success: true,
      liked: true,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/likes:", error);
    return NextResponse.json<LikeResponse>(
      { success: false, liked: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/likes - 좋아요 제거
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Clerk 인증 검증
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json<LikeResponse>(
        { success: false, liked: true, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body: LikeRequest = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json<LikeResponse>(
        { success: false, liked: true, error: "post_id is required" },
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
      return NextResponse.json<LikeResponse>(
        { success: false, liked: true, error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // 4. likes 테이블에서 DELETE
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", post_id)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting like:", deleteError);
      return NextResponse.json<LikeResponse>(
        { success: false, liked: true, error: "Failed to remove like" },
        { status: 500 }
      );
    }

    return NextResponse.json<LikeResponse>({
      success: true,
      liked: false,
    });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/likes:", error);
    return NextResponse.json<LikeResponse>(
      { success: false, liked: true, error: "Internal server error" },
      { status: 500 }
    );
  }
}

