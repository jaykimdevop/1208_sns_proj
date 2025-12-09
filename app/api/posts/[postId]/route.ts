/**
 * @file route.ts
 * @description 게시물 상세 API (삭제)
 *
 * DELETE /api/posts/[postId]
 *
 * 기능:
 * 1. 게시물 삭제 (본인만 삭제 가능)
 * 2. Supabase Storage에서 이미지 삭제
 * 3. 연관 데이터 CASCADE 삭제 (likes, comments, bookmarks)
 *
 * @dependencies
 * - @clerk/nextjs/server: auth()
 * - lib/supabase/server: createClerkSupabaseClient
 * - lib/types: DeletePostResponse
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { DeletePostResponse } from "@/lib/types";

/**
 * DELETE /api/posts/[postId]
 * 게시물 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // 1. Clerk 인증 검증
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json<DeletePostResponse>(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();

    // 3. 현재 사용자의 UUID 조회
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json<DeletePostResponse>(
        { success: false, error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 4. 게시물 조회 (소유자 확인 및 이미지 URL 획득)
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, image_url")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json<DeletePostResponse>(
        { success: false, error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 5. 소유자 확인
    if (post.user_id !== currentUser.id) {
      return NextResponse.json<DeletePostResponse>(
        { success: false, error: "본인의 게시물만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 6. Supabase Storage에서 이미지 삭제
    // image_url에서 파일 경로 추출
    // 예: https://xxx.supabase.co/storage/v1/object/public/posts/userId/filename.jpg
    try {
      const imageUrl = post.image_url;
      const storageUrl = "/storage/v1/object/public/posts/";
      const pathIndex = imageUrl.indexOf(storageUrl);
      
      if (pathIndex !== -1) {
        const filePath = imageUrl.substring(pathIndex + storageUrl.length);
        const { error: storageError } = await supabase.storage
          .from("posts")
          .remove([filePath]);

        if (storageError) {
          console.error("이미지 삭제 실패:", storageError);
          // 이미지 삭제 실패해도 게시물 삭제는 계속 진행
        }
      }
    } catch (storageErr) {
      console.error("이미지 경로 파싱 실패:", storageErr);
      // 이미지 삭제 실패해도 게시물 삭제는 계속 진행
    }

    // 7. 게시물 삭제 (CASCADE로 likes, comments, bookmarks도 삭제됨)
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("게시물 삭제 실패:", deleteError);
      return NextResponse.json<DeletePostResponse>(
        { success: false, error: "게시물 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json<DeletePostResponse>({
      success: true,
    });
  } catch (error) {
    console.error("게시물 삭제 API 오류:", error);
    return NextResponse.json<DeletePostResponse>(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

