/**
 * @file types.ts
 * @description Instagram Clone SNS TypeScript 타입 정의
 *
 * 이 파일은 데이터베이스 스키마를 기반으로 한 TypeScript 타입 정의를 포함합니다.
 * Supabase에서 생성된 타입과 호환되도록 작성되었습니다.
 *
 * @see {@link supabase/migrations/20251208142021_create_instagram_schema.sql} - 데이터베이스 스키마
 */

// ============================================
// 기본 엔티티 타입
// ============================================

/**
 * 사용자 타입
 * Clerk 인증과 연동되는 사용자 정보
 */
export interface User {
  id: string; // UUID
  clerk_id: string; // Clerk User ID
  name: string;
  created_at: string; // ISO 8601 timestamp
}

/**
 * 게시물 타입
 */
export interface Post {
  id: string; // UUID
  user_id: string; // UUID (users.id 참조)
  image_url: string; // Supabase Storage URL
  caption: string | null; // 최대 2,200자
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * 좋아요 타입
 */
export interface Like {
  id: string; // UUID
  post_id: string; // UUID (posts.id 참조)
  user_id: string; // UUID (users.id 참조)
  created_at: string; // ISO 8601 timestamp
}

/**
 * 댓글 타입
 */
export interface Comment {
  id: string; // UUID
  post_id: string; // UUID (posts.id 참조)
  user_id: string; // UUID (users.id 참조)
  parent_id: string | null; // UUID (comments.id 참조) - 부모 댓글 ID (NULL이면 루트 댓글)
  content: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * 팔로우 타입
 */
export interface Follow {
  id: string; // UUID
  follower_id: string; // UUID (users.id 참조) - 팔로우하는 사람
  following_id: string; // UUID (users.id 참조) - 팔로우받는 사람
  created_at: string; // ISO 8601 timestamp
}

/**
 * 북마크 타입
 */
export interface Bookmark {
  id: string; // UUID
  user_id: string; // Clerk User ID
  post_id: string; // UUID (posts.id 참조)
  created_at: string; // ISO 8601 timestamp
}

// ============================================
// 뷰 기반 타입
// ============================================

/**
 * 게시물 통계 뷰 타입
 * 좋아요 수와 댓글 수를 포함한 게시물 정보
 */
export interface PostStats {
  post_id: string; // UUID
  user_id: string; // UUID
  image_url: string;
  caption: string | null;
  created_at: string; // ISO 8601 timestamp
  likes_count: number; // 좋아요 수
  comments_count: number; // 댓글 수
}

/**
 * 사용자 통계 뷰 타입
 * 게시물 수, 팔로워 수, 팔로잉 수를 포함한 사용자 정보
 */
export interface UserStats {
  user_id: string; // UUID
  clerk_id: string;
  name: string;
  posts_count: number; // 게시물 수
  followers_count: number; // 팔로워 수
  following_count: number; // 팔로잉 수
}

// ============================================
// 확장 타입 (관계 포함)
// ============================================

/**
 * 사용자 정보를 포함한 게시물 타입
 */
export interface PostWithUser extends Post {
  user: User;
}

/**
 * 통계를 포함한 게시물 타입
 */
export interface PostWithStats extends PostStats {
  user: User;
}

/**
 * 사용자 정보를 포함한 댓글 타입
 */
export interface CommentWithUser extends Comment {
  user: User;
}

/**
 * 답글 포함 댓글 타입 (Thread 형식)
 * 루트 댓글과 그에 대한 답글들을 포함
 */
export interface CommentWithReplies extends CommentWithUser {
  replies: CommentWithUser[];
  replies_count: number;
}

/**
 * 사용자 정보를 포함한 좋아요 타입
 */
export interface LikeWithUser extends Like {
  user: User;
}

// ============================================
// API 응답 타입
// ============================================

/**
 * 게시물 목록 조회 응답 타입
 */
export interface PostsResponse {
  data: (PostWithStats & { comments: CommentWithUser[]; isLiked: boolean; isBookmarked?: boolean })[];
  count?: number; // 전체 게시물 수 (페이지네이션용)
  hasMore?: boolean; // 더 많은 게시물이 있는지 여부
}

/**
 * 게시물 상세 조회 응답 타입
 */
export interface PostDetailResponse {
  post: PostWithStats;
  comments: CommentWithUser[];
  isLiked: boolean; // 현재 사용자가 좋아요를 눌렀는지 여부
}

/**
 * 사용자 정보 조회 응답 타입
 */
export interface UserResponse {
  user: UserStats;
  isFollowing: boolean; // 현재 사용자가 팔로우 중인지 여부
  isOwnProfile: boolean; // 본인 프로필인지 여부
  error?: string; // 에러 메시지
}

/**
 * 댓글 목록 조회 응답 타입
 */
export interface CommentsResponse {
  data: CommentWithUser[];
  count: number;
}

/**
 * Thread 형식 댓글 목록 조회 응답 타입
 */
export interface ThreadedCommentsResponse {
  success: boolean;
  data: CommentWithReplies[];
  total_count: number; // 전체 댓글 수 (답글 포함)
  root_count: number; // 루트 댓글 수
  error?: string;
}

/**
 * 좋아요 목록 조회 응답 타입
 */
export interface LikesResponse {
  data: LikeWithUser[];
  count: number;
}

// ============================================
// API 요청 타입
// ============================================

/**
 * 게시물 생성 요청 타입
 */
export interface CreatePostRequest {
  image_url: string; // Supabase Storage URL
  caption?: string; // 최대 2,200자
}

/**
 * 댓글 작성 요청 타입
 */
export interface CreateCommentRequest {
  post_id: string;
  content: string;
  parent_id?: string; // 답글인 경우 부모 댓글 ID
}

/**
 * 팔로우 요청 타입
 */
export interface FollowRequest {
  following_id: string; // 팔로우할 사용자 ID
}

/**
 * 좋아요 API 요청 타입
 */
export interface LikeRequest {
  post_id: string;
}

/**
 * 좋아요 API 응답 타입
 */
export interface LikeResponse {
  success: boolean;
  liked: boolean;
  error?: string;
}

/**
 * 게시물 생성 API 응답 타입
 */
export interface CreatePostResponse {
  success: boolean;
  post?: {
    id: string;
    image_url: string;
    caption: string | null;
    created_at: string;
  };
  error?: string;
}

/**
 * 댓글 생성 API 응답 타입
 */
export interface CreateCommentResponse {
  success: boolean;
  comment?: CommentWithUser;
  error?: string;
}

/**
 * 댓글 삭제 API 요청 타입
 */
export interface DeleteCommentRequest {
  comment_id: string;
}

/**
 * 댓글 삭제 API 응답 타입
 */
export interface DeleteCommentResponse {
  success: boolean;
  error?: string;
}

/**
 * 팔로우 API 응답 타입
 */
export interface FollowResponse {
  success: boolean;
  isFollowing: boolean;
  error?: string;
}

/**
 * 북마크 API 요청 타입
 */
export interface BookmarkRequest {
  post_id: string;
}

/**
 * 북마크 API 응답 타입
 */
export interface BookmarkResponse {
  success: boolean;
  isBookmarked: boolean;
  error?: string;
}

/**
 * 게시물 삭제 API 응답 타입
 */
export interface DeletePostResponse {
  success: boolean;
  error?: string;
}

// ============================================
// 페이지네이션 타입
// ============================================

/**
 * 페이지네이션 파라미터 타입
 */
export interface PaginationParams {
  limit?: number; // 기본값: 10
  offset?: number; // 기본값: 0
}

/**
 * 페이지네이션 응답 타입
 */
export interface PaginatedResponse<T> {
  data: T[];
  count: number; // 전체 항목 수
  hasMore: boolean; // 더 많은 항목이 있는지 여부
}

