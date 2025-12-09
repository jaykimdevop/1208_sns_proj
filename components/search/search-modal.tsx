"use client";

/**
 * @file search-modal.tsx
 * @description 검색 모달 컴포넌트
 *
 * 사용자와 게시물을 검색할 수 있는 모달입니다.
 * 탭으로 사용자/게시물 검색을 전환하고, 디바운스 적용된 실시간 검색을 제공합니다.
 *
 * @dependencies
 * - @radix-ui/react-dialog: Dialog 컴포넌트
 * - lucide-react: 아이콘
 * - lib/types: SearchResponse 타입
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Users, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserSearchResult } from "./user-search-result";
import { PostSearchResult } from "./post-search-result";
import { PostModal } from "@/components/post/post-modal";
import { handleApiError, handleFetchError } from "@/lib/utils/error-handler";
import type { SearchResponse, SearchUserResult, SearchPostResult } from "@/lib/types";

// ============================================
// 상수 정의
// ============================================

const DEBOUNCE_DELAY_MS = 300;
const RESULTS_PER_PAGE = 10;

// ============================================
// 타입 정의
// ============================================

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SearchTab = "users" | "posts";

// ============================================
// 컴포넌트
// ============================================

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  // 상태 관리
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("users");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<SearchUserResult[]>([]);
  const [posts, setPosts] = useState<SearchPostResult[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [usersOffset, setUsersOffset] = useState(0);
  const [postsOffset, setPostsOffset] = useState(0);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 게시물 모달 상태
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postIds, setPostIds] = useState<string[]>([]);

  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // 모달이 열릴 때 입력창에 포커스
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // 모달이 닫힐 때 상태 초기화
      setQuery("");
      setUsers([]);
      setPosts([]);
      setUsersCount(0);
      setPostsCount(0);
      setUsersOffset(0);
      setPostsOffset(0);
      setHasMoreUsers(false);
      setHasMorePosts(false);
    }
  }, [open]);

  // AbortController ref (요청 취소용)
  const abortControllerRef = useRef<AbortController | null>(null);

  // 검색 함수
  const performSearch = useCallback(
    async (searchQuery: string, type: SearchTab, offset: number = 0) => {
      if (!searchQuery.trim()) {
        setUsers([]);
        setPosts([]);
        setUsersCount(0);
        setPostsCount(0);
        setHasMoreUsers(false);
        setHasMorePosts(false);
        return;
      }

      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 새로운 AbortController 생성
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const isInitialSearch = offset === 0;
      if (isInitialSearch) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          type,
          limit: RESULTS_PER_PAGE.toString(),
          offset: offset.toString(),
        });

        // 타임아웃 설정 (10초)
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`/api/search?${params}`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const apiError = await handleApiError(response, "performSearch");
          // 검색 에러는 조용히 처리 (사용자에게는 빈 결과 표시)
          if (isInitialSearch) {
            setUsers([]);
            setPosts([]);
            setUsersCount(0);
            setPostsCount(0);
          }
          return;
        }

        const data: SearchResponse = await response.json();

        if (data.success) {
          if (type === "users") {
            if (isInitialSearch) {
              setUsers(data.users);
              setUsersOffset(RESULTS_PER_PAGE);
            } else {
              setUsers((prev) => [...prev, ...data.users]);
              setUsersOffset((prev) => prev + RESULTS_PER_PAGE);
            }
            setUsersCount(data.users_count);
            setHasMoreUsers(offset + RESULTS_PER_PAGE < data.users_count);
          } else {
            if (isInitialSearch) {
              setPosts(data.posts);
              setPostsOffset(RESULTS_PER_PAGE);
              setPostIds(data.posts.map((p) => p.post_id));
            } else {
              setPosts((prev) => [...prev, ...data.posts]);
              setPostsOffset((prev) => prev + RESULTS_PER_PAGE);
              setPostIds((prev) => [...prev, ...data.posts.map((p) => p.post_id)]);
            }
            setPostsCount(data.posts_count);
            setHasMorePosts(offset + RESULTS_PER_PAGE < data.posts_count);
          }
        } else if (data.error) {
          // 검색 실패 시 빈 결과 표시
          if (isInitialSearch) {
            setUsers([]);
            setPosts([]);
            setUsersCount(0);
            setPostsCount(0);
          }
        }
      } catch (error) {
        // AbortError는 무시 (의도적인 취소)
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        const apiError = handleFetchError(error, "performSearch");
        // 검색 에러는 조용히 처리 (사용자에게는 빈 결과 표시)
        if (isInitialSearch) {
          setUsers([]);
          setPosts([]);
          setUsersCount(0);
          setPostsCount(0);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // 컴포넌트 언마운트 시 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 컴포넌트 언마운트 시 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 디바운스된 검색
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query, activeTab, 0);
    }, DEBOUNCE_DELAY_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, activeTab, performSearch]);

  // 탭 변경 시 검색 결과 초기화 및 재검색
  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    if (tab === "users") {
      setUsersOffset(0);
    } else {
      setPostsOffset(0);
    }
  };

  // 더 보기
  const handleLoadMore = () => {
    if (activeTab === "users" && hasMoreUsers && !isLoadingMore) {
      performSearch(query, "users", usersOffset);
    } else if (activeTab === "posts" && hasMorePosts && !isLoadingMore) {
      performSearch(query, "posts", postsOffset);
    }
  };

  // 스크롤 이벤트로 무한 스크롤
  const handleScroll = useCallback(() => {
    const container = resultsContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

  // 게시물 모달 열기
  const handleOpenPostModal = (postId: string) => {
    setSelectedPostId(postId);
  };

  // 모달에서 선택 시 검색 모달 닫기
  const handleSelect = () => {
    onOpenChange(false);
  };

  // 현재 탭의 결과
  const currentResults = activeTab === "users" ? users : posts;
  const currentCount = activeTab === "users" ? usersCount : postsCount;
  const hasMore = activeTab === "users" ? hasMoreUsers : hasMorePosts;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[500px] max-h-[80vh] p-0 gap-0 overflow-hidden sketch-modal animate-bounce-in"
          style={{
            background: "linear-gradient(180deg, #FFF5F5 0%, #FFFFFF 100%)",
          }}
        >
          {/* 헤더 */}
          <DialogHeader
            className="px-4 py-4 border-b-4 border-dashed"
            style={{ borderColor: "var(--color-cute-border)" }}
          >
            <DialogTitle
              className="text-center text-xl font-bold"
              style={{ color: "var(--color-cute-border)" }}
            >
              🔍 검색
            </DialogTitle>
            <DialogDescription className="sr-only">
              사용자 또는 게시물을 검색하세요.
            </DialogDescription>
          </DialogHeader>

          {/* 검색 입력 */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-instagram-text-secondary)" }}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="검색어를 입력하세요..."
                className="sketch-input w-full pl-10 pr-10 py-3 text-sm"
                style={{
                  color: "var(--color-cute-border)",
                  backgroundColor: "rgba(255,255,255,0.8)",
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X
                    size={16}
                    style={{ color: "var(--color-instagram-text-secondary)" }}
                  />
                </button>
              )}
            </div>
          </div>

          {/* 탭 */}
          <div
            className="flex border-b-2 border-dashed px-4"
            style={{ borderColor: "var(--color-cute-border)" }}
          >
            <button
              onClick={() => handleTabChange("users")}
              className={`profile-tab flex-1 flex items-center justify-center gap-2 py-3 transition-all ${
                activeTab === "users" ? "profile-tab-active" : ""
              }`}
            >
              <Users size={18} />
              <span className="text-sm font-semibold">
                사용자 {usersCount > 0 && `(${usersCount})`}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("posts")}
              className={`profile-tab flex-1 flex items-center justify-center gap-2 py-3 transition-all ${
                activeTab === "posts" ? "profile-tab-active" : ""
              }`}
            >
              <ImageIcon size={18} />
              <span className="text-sm font-semibold">
                게시물 {postsCount > 0 && `(${postsCount})`}
              </span>
            </button>
          </div>

          {/* 검색 결과 */}
          <div
            ref={resultsContainerRef}
            className="flex-1 overflow-y-auto px-4 py-3"
            style={{ maxHeight: "400px" }}
            onScroll={handleScroll}
          >
            {/* 로딩 상태 */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  size={32}
                  className="animate-spin"
                  style={{ color: "var(--color-cute-coral)" }}
                />
              </div>
            )}

            {/* 검색어 없음 */}
            {!isLoading && !query && (
              <div className="text-center py-8">
                <Search
                  size={48}
                  className="mx-auto mb-3"
                  style={{ color: "var(--color-instagram-text-secondary)" }}
                />
                <p
                  className="text-sm"
                  style={{ color: "var(--color-instagram-text-secondary)" }}
                >
                  사용자 이름이나 게시물 내용을 검색해보세요
                </p>
              </div>
            )}

            {/* 검색 결과 없음 */}
            {!isLoading && query && currentResults.length === 0 && (
              <div className="text-center py-8">
                <p
                  className="text-sm"
                  style={{ color: "var(--color-instagram-text-secondary)" }}
                >
                  &quot;{query}&quot;에 대한 검색 결과가 없습니다
                </p>
              </div>
            )}

            {/* 사용자 검색 결과 */}
            {!isLoading && activeTab === "users" && users.length > 0 && (
              <div className="space-y-1">
                {users.map((user) => (
                  <UserSearchResult
                    key={user.user_id}
                    user={user}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}

            {/* 게시물 검색 결과 */}
            {!isLoading && activeTab === "posts" && posts.length > 0 && (
              <div className="space-y-1">
                {posts.map((post) => (
                  <PostSearchResult
                    key={post.post_id}
                    post={post}
                    searchQuery={query}
                    onSelect={handleSelect}
                    onOpenModal={handleOpenPostModal}
                  />
                ))}
              </div>
            )}

            {/* 더 보기 로딩 */}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2
                  size={24}
                  className="animate-spin"
                  style={{ color: "var(--color-cute-coral)" }}
                />
              </div>
            )}

            {/* 더 보기 버튼 */}
            {!isLoading && !isLoadingMore && hasMore && (
              <button
                onClick={handleLoadMore}
                className="w-full py-3 text-sm font-semibold transition-colors hover:opacity-70"
                style={{ color: "var(--color-cute-coral)" }}
              >
                더 보기
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 게시물 상세 모달 */}
      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          postIds={postIds}
          onClose={() => setSelectedPostId(null)}
          onNavigate={setSelectedPostId}
        />
      )}
    </>
  );
}

