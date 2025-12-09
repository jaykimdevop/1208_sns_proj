"use client";

/**
 * @file CreatePostModal.tsx
 * @description 게시물 작성 모달 컴포넌트
 *
 * Instagram 스타일의 게시물 작성 모달을 제공합니다.
 *
 * 주요 기능:
 * 1. 이미지 선택 (드래그앤드롭 또는 파일 선택)
 * 2. 이미지 미리보기 (1:1 비율)
 * 3. 캡션 입력 (최대 2,200자)
 * 4. 파일 검증 (크기: 5MB, 타입: jpeg, png, webp, gif)
 * 5. Supabase Storage 업로드
 *
 * @dependencies
 * - @radix-ui/react-dialog: Dialog 컴포넌트
 * - lucide-react: 아이콘
 */

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { useSetAtom } from "jotai";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { postsAtom, type PostItem } from "@/states/posts-atom";
import { handleApiError, handleFetchError, getUserFriendlyMessage } from "@/lib/utils/error-handler";
import type { CreatePostResponse, PostsResponse } from "@/lib/types";

// ============================================
// 상수 정의
// ============================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CAPTION_LENGTH = 2200;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// ============================================
// 타입 정의
// ============================================

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: () => void;
}

// ============================================
// 컴포넌트
// ============================================

export function CreatePostModal({
  open,
  onOpenChange,
  onPostCreated,
}: CreatePostModalProps) {
  // 상태 관리
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 전역 상태 업데이트
  const setPosts = useSetAtom(postsAtom);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      // 약간의 딜레이 후 초기화 (애니메이션 완료 후)
      const timer = setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setCaption("");
        setError(null);
        setIsDragging(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // 미리보기 URL 정리
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 파일 검증
  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return "지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP, GIF만 가능)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "이미지 크기는 5MB 이하여야 합니다.";
    }
    return null;
  }, []);

  // 파일 선택 처리
  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setSelectedFile(file);

      // 기존 미리보기 URL 정리
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // 새 미리보기 URL 생성
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    },
    [validateFile, previewUrl]
  );

  // 파일 input 변경 핸들러
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 이미지 제거
  const handleRemoveImage = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  // 게시물 업로드
  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      setError("이미지를 선택해주세요.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("caption", caption.trim());

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const apiError = await handleApiError(response, "handleSubmit");
        throw new Error(getUserFriendlyMessage(apiError, "게시물 업로드"));
      }

      const data: CreatePostResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "게시물 업로드에 실패했습니다.");
      }

      // 새로 생성된 게시물의 전체 정보 가져오기
      // 게시물 생성은 성공했으므로, 이 단계 실패는 무시하고 모달은 닫음
      try {
        // AbortController로 타임아웃 설정 (5초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const postsResponse = await fetch("/api/posts?limit=1&offset=0", {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (postsResponse.ok) {
          const postsData: PostsResponse = await postsResponse.json();
          if (postsData.data && postsData.data.length > 0) {
            const newPost = postsData.data[0] as PostItem;
            // 전역 상태에 새 게시물 추가 (맨 앞에)
            setPosts((prev) => {
              // 중복 체크
              if (prev.find((p) => p.post_id === newPost.post_id)) {
                return prev;
              }
              return [newPost, ...prev];
            });
          }
        } else {
          console.warn("Failed to fetch new post: HTTP", postsResponse.status);
        }
      } catch (fetchError) {
        // 네트워크 오류, 타임아웃 등은 무시 (게시물은 이미 생성됨)
        if (fetchError instanceof Error) {
          if (fetchError.name === "AbortError") {
            console.warn("Timeout while fetching new post");
          } else {
            console.warn("Error fetching new post:", fetchError.message);
          }
        } else {
          console.warn("Unknown error fetching new post:", fetchError);
        }
        // 게시물 생성은 성공했으므로, 새 게시물 가져오기 실패는 무시하고 진행
      }

      // 성공 시 모달 닫기 및 콜백 호출
      onOpenChange(false);
      onPostCreated?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : handleFetchError(err, "handleSubmit").message;
      setError(errorMessage || "게시물 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, caption, onOpenChange, onPostCreated, setPosts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] p-0 gap-0 overflow-hidden sketch-modal animate-bounce-in"
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
            ✏️ 새 게시물 만들기
          </DialogTitle>
          <DialogDescription className="sr-only">
            이미지를 선택하고 캡션을 입력하여 새 게시물을 작성하세요.
          </DialogDescription>
        </DialogHeader>

        {/* 컨텐츠 영역 */}
        <div className="flex flex-col">
          {/* 이미지 영역 */}
          {!previewUrl ? (
            // 이미지 미선택 시: 드래그앤드롭 영역
            <div
              className={`aspect-square flex flex-col items-center justify-center gap-4 transition-all cursor-pointer m-4 rounded-2xl border-4 border-dashed ${
                isDragging 
                  ? "border-[var(--color-cute-mint)] bg-[var(--color-cute-mint)]/20" 
                  : "border-[var(--color-cute-border)] bg-[var(--color-cute-peach)]/10 hover:bg-[var(--color-cute-pink)]/20"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="이미지 업로드 영역 (드래그 앤 드롭 또는 클릭)"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <ImagePlus
                size={64}
                className={`transition-all ${
                  isDragging
                    ? "text-[var(--color-cute-mint)]"
                    : "text-[var(--color-cute-border)]"
                }`}
                style={{
                  filter: isDragging ? "none" : "drop-shadow(2px 2px 0 rgba(0,0,0,0.1))",
                }}
              />
              <div className="text-center">
                <p
                  className="text-lg font-bold"
                  style={{ color: "var(--color-cute-border)" }}
                >
                  📸 사진을 여기에 끌어다 놓으세요
                </p>
                <p
                  className="text-sm mt-2"
                  style={{ color: "var(--color-instagram-text-secondary)" }}
                >
                  또는 클릭하여 선택
                </p>
              </div>
              <button
                type="button"
                className="sketch-button px-6 py-3 font-bold text-white transition-all hover:scale-105"
                style={{ 
                  background: "linear-gradient(135deg, var(--color-cute-pink) 0%, var(--color-cute-coral) 100%)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                aria-label="컴퓨터에서 이미지 파일 선택"
              >
                💾 컴퓨터에서 선택
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileInputChange}
                aria-label="이미지 파일 선택"
              />
            </div>
          ) : (
            // 이미지 선택 시: 미리보기
            <div className="relative aspect-square m-4 rounded-2xl overflow-hidden border-4 border-[var(--color-cute-border)]" style={{ boxShadow: "4px 4px 0 rgba(0,0,0,0.15)" }}>
              <Image
                src={previewUrl}
                alt="미리보기"
                fill
                className="object-contain bg-black"
                unoptimized
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 p-2 rounded-full transition-all hover:scale-110"
                style={{ 
                  background: "linear-gradient(135deg, var(--color-cute-coral) 0%, var(--color-cute-pink) 100%)",
                  boxShadow: "2px 2px 0 rgba(0,0,0,0.2)",
                }}
                aria-label="이미지 제거"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          )}

          {/* 캡션 입력 영역 */}
          {previewUrl && (
            <div
              className="px-4 pb-4"
            >
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
                placeholder="✍️ 문구 입력..."
                aria-label="게시물 캡션 입력"
                aria-describedby="caption-counter-create"
                className="sketch-input w-full h-24 resize-none p-3 text-sm"
                style={{
                  color: "var(--color-cute-border)",
                  backgroundColor: "rgba(255,255,255,0.8)",
                }}
                maxLength={MAX_CAPTION_LENGTH}
              />
              <div
                id="caption-counter-create"
                className="text-xs text-right mt-1 font-semibold"
                style={{ color: "var(--color-instagram-text-secondary)" }}
                role="status"
                aria-live="polite"
              >
                {caption.length}/{MAX_CAPTION_LENGTH}
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div
              className="mx-4 mb-4 px-4 py-3 text-sm text-center rounded-xl font-semibold"
              style={{ 
                color: "var(--color-cute-coral)",
                background: "rgba(255, 180, 162, 0.2)",
                border: "2px solid var(--color-cute-coral)",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* 공유 버튼 */}
          {previewUrl && (
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isUploading || !selectedFile}
                className="sketch-button w-full py-3 font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02]"
                style={{ 
                  background: "linear-gradient(135deg, var(--color-cute-mint) 0%, var(--color-cute-sky) 100%)",
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  "🚀 공유하기"
                )}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

