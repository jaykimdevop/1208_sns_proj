"use client";

/**
 * @file error-boundary.tsx
 * @description React Error Boundary 컴포넌트
 *
 * React 컴포넌트 트리에서 발생한 에러를 캐치하고,
 * 사용자에게 친화적인 에러 UI를 표시합니다.
 *
 * @dependencies
 * - lib/utils/logger: 로깅 유틸리티
 */

import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "@/lib/utils/logger";

// ============================================
// Props & State
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================
// Error Boundary 컴포넌트
// ============================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 에러 로깅
    logger.error("React Error Boundary caught an error", {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
    });

    // 커스텀 에러 핸들러 호출
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-4">
              <AlertTriangle
                size={64}
                className="text-red-500"
                style={{ color: "var(--color-instagram-like)" }}
              />
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: "var(--color-instagram-text-primary)" }}
            >
              오류가 발생했습니다
            </h2>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--color-instagram-text-secondary)" }}
            >
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 text-left">
                <summary
                  className="cursor-pointer text-sm mb-2"
                  style={{ color: "var(--color-instagram-text-secondary)" }}
                >
                  에러 상세 정보 (개발 모드)
                </summary>
                <pre
                  className="text-xs p-4 bg-gray-100 rounded overflow-auto"
                  style={{ maxHeight: "200px" }}
                >
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 rounded-lg font-semibold transition-all hover:opacity-70"
                style={{
                  backgroundColor: "var(--color-instagram-blue)",
                  color: "#ffffff",
                }}
              >
                <RefreshCw size={16} className="inline mr-2" />
                다시 시도
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 rounded-lg font-semibold transition-all hover:opacity-70"
                style={{
                  backgroundColor: "var(--color-instagram-border)",
                  color: "var(--color-instagram-text-primary)",
                }}
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

