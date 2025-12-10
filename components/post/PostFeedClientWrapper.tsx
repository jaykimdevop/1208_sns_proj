"use client";

/**
 * @file PostFeedClientWrapper.tsx
 * @description PostFeed를 client-only로 렌더링하는 래퍼 컴포넌트
 *
 * view mode 깜빡임을 방지하기 위해 PostFeed를 클라이언트에서만 렌더링합니다.
 * localStorage에서 저장된 view mode를 즉시 읽어 올바른 뷰로 렌더링합니다.
 *
 * @dependencies
 * - react: useState, useEffect
 * - components/post/PostFeed: 게시물 피드 컴포넌트
 * - components/post/PostCardSkeleton: 로딩 스켈레톤
 * - lib/types: PostsResponse
 */

import { useState, useEffect } from "react";
import { PostFeed } from "./PostFeed";
import { PostCardSkeleton } from "./PostCardSkeleton";
import type { PostsResponse } from "@/lib/types";

interface PostFeedClientWrapperProps {
  initialPosts?: PostsResponse;
  userId?: string;
}

export function PostFeedClientWrapper({ initialPosts, userId }: PostFeedClientWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 마운트되기 전에는 스켈레톤만 표시 (깜빡임 방지)
  if (!mounted) {
    return (
      <>
        {[...Array(3)].map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </>
    );
  }

  // 마운트 후에는 실제 PostFeed 렌더링 (localStorage 값이 이미 로드됨)
  return <PostFeed initialPosts={initialPosts} userId={userId} />;
}
