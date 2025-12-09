/**
 * @file posts-atom.ts
 * @description 게시물 전역 상태 관리 (jotai)
 *
 * 게시물 목록을 전역으로 관리하여 새 게시물이 즉시 피드에 표시되도록 합니다.
 *
 * @dependencies
 * - jotai: 전역 상태 관리
 * - lib/types: PostWithStats, CommentWithUser
 */

import { atom } from "jotai";
import type {
  PostWithStats,
  CommentWithUser,
} from "@/lib/types";

/**
 * 게시물 타입 (PostCard에서 사용하는 형식)
 */
export type PostItem = PostWithStats & {
  comments: CommentWithUser[];
  isLiked: boolean;
};

/**
 * 게시물 목록 전역 상태
 */
export const postsAtom = atom<PostItem[]>([]);

/**
 * 새 게시물 추가 함수
 */
export const addPostAtom = atom(
  null,
  (get, set, newPost: PostItem) => {
    const currentPosts = get(postsAtom);
    // 중복 체크 (같은 post_id가 이미 있으면 추가하지 않음)
    if (!currentPosts.find((p) => p.post_id === newPost.post_id)) {
      set(postsAtom, [newPost, ...currentPosts]);
    }
  }
);

/**
 * 게시물 목록 새로고침 함수
 */
export const refreshPostsAtom = atom(
  null,
  async (get, set) => {
    try {
      const response = await fetch("/api/posts?limit=10&offset=0");
      if (!response.ok) throw new Error("Failed to fetch posts");
      
      const data = await response.json();
      set(postsAtom, data.data || []);
    } catch (error) {
      console.error("Error refreshing posts:", error);
    }
  }
);

