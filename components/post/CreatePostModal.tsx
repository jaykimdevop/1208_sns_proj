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

      const data: CreatePostResponse = await response.json();

      if (!response.ok || !data.success) {
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
      console.error("Error creating post:", err);
      setError(
        err instanceof Error ? err.message : "게시물 업로드에 실패했습니다."
      );
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, caption, onOpenChange, onPostCreated, setPosts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] p-0 gap-0 overflow-hidden"
        style={{ backgroundColor: "var(--color-instagram-bg)" }}
      >
        {/* 헤더 */}
        <DialogHeader
          className="px-4 py-3 border-b"
          style={{ borderColor: "var(--color-instagram-border)" }}
        >
          <DialogTitle
            className="text-center font-semibold"
            style={{ color: "var(--color-instagram-text-primary)" }}
          >
            새 게시물 만들기
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
              className={`aspect-square flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer ${
                isDragging ? "bg-blue-50" : "bg-gray-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus
                size={64}
                className={`transition-colors ${
                  isDragging
                    ? "text-blue-500"
                    : "text-gray-400"
                }`}
              />
              <div className="text-center">
                <p
                  className="text-lg font-medium"
                  style={{ color: "var(--color-instagram-text-primary)" }}
                >
                  사진을 여기에 끌어다 놓으세요
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--color-instagram-text-secondary)" }}
                >
                  또는 클릭하여 선택
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--color-instagram-primary)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                컴퓨터에서 선택
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
          ) : (
            // 이미지 선택 시: 미리보기
            <div className="relative aspect-square bg-black">
              <Image
                src={previewUrl}
                alt="미리보기"
                fill
                className="object-contain"
                unoptimized
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label="이미지 제거"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* 캡션 입력 영역 */}
          {previewUrl && (
            <div
              className="p-4 border-t"
              style={{ borderColor: "var(--color-instagram-border)" }}
            >
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
                placeholder="문구 입력..."
                className="w-full h-24 resize-none border-none outline-none text-sm"
                style={{
                  color: "var(--color-instagram-text-primary)",
                  backgroundColor: "transparent",
                }}
                maxLength={MAX_CAPTION_LENGTH}
              />
              <div
                className="text-xs text-right"
                style={{ color: "var(--color-instagram-text-secondary)" }}
              >
                {caption.length}/{MAX_CAPTION_LENGTH}
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div
              className="px-4 py-2 text-sm text-center"
              style={{ color: "var(--color-instagram-like)" }}
            >
              {error}
            </div>
          )}

          {/* 공유 버튼 */}
          {previewUrl && (
            <div
              className="p-4 border-t"
              style={{ borderColor: "var(--color-instagram-border)" }}
            >
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isUploading || !selectedFile}
                className="w-full py-2.5 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--color-instagram-primary)" }}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  "공유"
                )}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

