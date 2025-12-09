/**
 * @file route.ts
 * @description 통합 검색 API
 *
 * GET /api/search - 사용자 및 게시물 검색
 *
 * 기능:
 * 1. 사용자 검색: users.name ILIKE 검색
 * 2. 게시물 검색: posts.caption ILIKE 검색
 * 3. 통합 검색: 사용자 + 게시물 동시 검색
 *
 * 쿼리 파라미터:
 * - q: 검색 키워드 (필수)
 * - type: 검색 타입 (users | posts | all, 기본값: all)
 * - limit: 결과 개수 (기본값: 10)
 * - offset: 시작 위치 (기본값: 0)
 *
 * @dependencies
 * - lib/supabase/client: Supabase 클라이언트
 * - lib/types: SearchResponse 타입
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SearchResponse, SearchUserResult, SearchPostResult } from "@/lib/types";

// Supabase 클라이언트 생성 (공개 데이터 검색용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/search - 통합 검색
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    // 검색어 검증
    if (!query || query.length === 0) {
      return NextResponse.json<SearchResponse>({
        success: true,
        users: [],
        posts: [],
        users_count: 0,
        posts_count: 0,
      });
    }

    // 검색어가 너무 짧은 경우
    if (query.length < 1) {
      return NextResponse.json<SearchResponse>({
        success: false,
        users: [],
        posts: [],
        users_count: 0,
        posts_count: 0,
        error: "검색어는 최소 1자 이상이어야 합니다.",
      });
    }

    const searchPattern = `%${query}%`;
    let users: SearchUserResult[] = [];
    let posts: SearchPostResult[] = [];
    let usersCount = 0;
    let postsCount = 0;

    // 사용자 검색
    if (type === "users" || type === "all") {
      // user_stats 뷰에서 검색 (통계 포함)
      const { data: usersData, error: usersError, count } = await supabase
        .from("user_stats")
        .select("*", { count: "exact" })
        .ilike("name", searchPattern)
        .order("posts_count", { ascending: false })
        .range(offset, offset + limit - 1);

      if (usersError) {
        console.error("Error searching users:", usersError);
      } else {
        users = (usersData || []).map((user) => ({
          user_id: user.user_id,
          clerk_id: user.clerk_id,
          name: user.name,
          posts_count: Number(user.posts_count) || 0,
          followers_count: Number(user.followers_count) || 0,
          following_count: Number(user.following_count) || 0,
        }));
        usersCount = count || 0;
      }
    }

    // 게시물 검색
    if (type === "posts" || type === "all") {
      // post_stats 뷰에서 검색 (통계 포함)
      const { data: postsData, error: postsError, count } = await supabase
        .from("post_stats")
        .select("*", { count: "exact" })
        .ilike("caption", searchPattern)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) {
        console.error("Error searching posts:", postsError);
      } else if (postsData && postsData.length > 0) {
        // 게시물 작성자 정보 가져오기
        const userIds = [...new Set(postsData.map((post) => post.user_id))];
        const { data: usersData } = await supabase
          .from("users")
          .select("id, clerk_id, name, created_at")
          .in("id", userIds);

        const usersMap = new Map(usersData?.map((u) => [u.id, u]) || []);

        posts = postsData.map((post) => ({
          post_id: post.post_id,
          user_id: post.user_id,
          image_url: post.image_url,
          caption: post.caption,
          created_at: post.created_at,
          likes_count: Number(post.likes_count) || 0,
          comments_count: Number(post.comments_count) || 0,
          user: usersMap.get(post.user_id) || {
            id: post.user_id,
            clerk_id: "",
            name: "Unknown",
            created_at: "",
          },
        }));
        postsCount = count || 0;
      }
    }

    return NextResponse.json<SearchResponse>({
      success: true,
      users,
      posts,
      users_count: usersCount,
      posts_count: postsCount,
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/search:", error);
    return NextResponse.json<SearchResponse>(
      {
        success: false,
        users: [],
        posts: [],
        users_count: 0,
        posts_count: 0,
        error: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

