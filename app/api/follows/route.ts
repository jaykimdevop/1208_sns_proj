/**
 * @file route.ts
 * @description 팔로우 API (POST: 팔로우, DELETE: 언팔로우)
 *
 * POST /api/follows - 팔로우 추가
 * DELETE /api/follows - 팔로우 제거
 *
 * 기능:
 * 1. Clerk 인증 검증
 * 2. 자기 자신 팔로우 방지
 * 3. follows 테이블에 INSERT/DELETE
 *
 * @dependencies
 * - @clerk/nextjs/server: auth()
 * - lib/supabase/server: createClerkSupabaseClient
 * - lib/types: FollowRequest, FollowResponse
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { FollowRequest, FollowResponse } from "@/lib/types";

/**
 * POST /api/follows - 팔로우 추가
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Clerk 인증 검증
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json<FollowResponse>(
        { success: false, isFollowing: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body: FollowRequest = await request.json();
    const { following_id } = body;

    if (!following_id) {
      return NextResponse.json<FollowResponse>(
        { success: false, isFollowing: false, error: "팔로우할 사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 3. 현재 사용자의 Supabase user_id 조회
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (currentUserError || !currentUser) {
      console.error("Error fetching current user:", currentUserError);
      return NextResponse.json<FollowResponse>(
        { success: false, isFollowing: false, error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const followerId = currentUser.id;

    // 4. 자기 자신 팔로우 방지
    if (followerId === following_id) {
      return NextResponse.json<FollowResponse>(
        { success: false, isFollowing: false, error: "자기 자신을 팔로우할 수 없습니다." },
        { status: 400 }
      );
    }

    // 5. 팔로우 대상 사용자 존재 확인
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", following_id)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json<FollowResponse>(
        { success: false, isFollowing: false, error: "팔로우 대상 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 6. follows 테이블에 INSERT
    const { error: insertError } = await supabase
      .from("follows")
      .insert({
        follower_id: followerId,
        following_id: following_id,
      });

    if (insertError) {
      // 중복 팔로우 에러 처리 (이미 팔로우 중인 경우)
      if (insertError.code === "23505") {
        return NextResponse.json<FollowResponse>({
          success: true,
          isFollowing: true,
        });
      }

      console.error("Error inserting follow:", insertError);
      return NextResponse.json<FollowResponse>(
        { success: false, isFollowing: false, error: "팔로우에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json<FollowResponse>({
      success: true,
      isFollowing: true,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/follows:", error);
    return NextResponse.json<FollowResponse>(
      { success: false, isFollowing: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/follows - 팔로우 제거
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Clerk 인증 검증
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json<FollowResponse>(
        { success: false, isFollowing: true, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body: FollowRequest = await request.json();
    const { following_id } = body;

    if (!following_id) {
      return NextResponse.json<FollowResponse>(
        { success: false, isFollowing: true, error: "언팔로우할 사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 3. 현재 사용자의 Supabase user_id 조회
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (currentUserError || !currentUser) {
      console.error("Error fetching current user:", currentUserError);
      return NextResponse.json<FollowResponse>(
        { success: false, isFollowing: true, error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const followerId = currentUser.id;

    // 4. follows 테이블에서 DELETE
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", following_id);

    if (deleteError) {
      console.error("Error deleting follow:", deleteError);
      return NextResponse.json<FollowResponse>(
        { success: false, isFollowing: true, error: "언팔로우에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json<FollowResponse>({
      success: true,
      isFollowing: false,
    });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/follows:", error);
    return NextResponse.json<FollowResponse>(
      { success: false, isFollowing: true, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

