/**
 * @file route.ts
 * @description 사용자 정보 조회 API
 *
 * GET /api/users/[userId] - 사용자 프로필 정보 조회
 *
 * 기능:
 * 1. user_stats 뷰를 활용하여 사용자 통계 조회 (게시물 수, 팔로워 수, 팔로잉 수)
 * 2. Clerk ID 또는 Supabase UUID로 조회 지원
 * 3. 현재 사용자가 해당 프로필을 팔로우 중인지 확인 (isFollowing)
 * 4. 본인 프로필인지 확인 (isOwnProfile)
 *
 * @dependencies
 * - @clerk/nextjs/server: auth()
 * - lib/supabase/server: createClerkSupabaseClient
 * - lib/types: UserResponse, UserStats
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { UserResponse, UserStats } from "@/lib/types";

/**
 * GET /api/users/[userId] - 사용자 프로필 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json<UserResponse>(
        {
          user: null as unknown as UserStats,
          isFollowing: false,
          isOwnProfile: false,
          error: "사용자 ID가 필요합니다.",
        },
        { status: 400 }
      );
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
      return NextResponse.json<UserResponse>(
        {
          user: null as unknown as UserStats,
          isFollowing: false,
          isOwnProfile: false,
          error: "사용자를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
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

    // 4. 응답 데이터 구성
    const response: UserResponse = {
      user: {
        user_id: userStats.user_id,
        clerk_id: userStats.clerk_id,
        name: userStats.name,
        posts_count: Number(userStats.posts_count) || 0,
        followers_count: Number(userStats.followers_count) || 0,
        following_count: Number(userStats.following_count) || 0,
      },
      isFollowing,
      isOwnProfile,
    };

    return NextResponse.json<UserResponse>(response);
  } catch (error) {
    console.error("Unexpected error in GET /api/users/[userId]:", error);
    return NextResponse.json<UserResponse>(
      {
        user: null as unknown as UserStats,
        isFollowing: false,
        isOwnProfile: false,
        error: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

