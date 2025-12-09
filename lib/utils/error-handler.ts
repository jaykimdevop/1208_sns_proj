/**
 * @file error-handler.ts
 * @description 통합 에러 핸들링 유틸리티
 *
 * API 에러 타입 분류, 사용자 친화적 에러 메시지 매핑,
 * 에러 로깅을 제공하는 유틸리티 함수들입니다.
 *
 * @dependencies
 * - lib/utils/logger: 로깅 유틸리티
 */

import { logger } from "./logger";

// ============================================
// 에러 타입 정의
// ============================================

/**
 * API 에러 타입
 */
export enum ApiErrorType {
  NETWORK = "NETWORK", // 네트워크 에러 (연결 실패, 타임아웃)
  SERVER = "SERVER", // 서버 에러 (5xx)
  CLIENT = "CLIENT", // 클라이언트 에러 (4xx)
  UNKNOWN = "UNKNOWN", // 알 수 없는 에러
}

/**
 * API 에러 인터페이스
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  statusCode?: number;
  originalError?: Error;
}

// ============================================
// 에러 타입 분류
// ============================================

/**
 * 에러를 타입별로 분류합니다.
 */
export function classifyError(error: unknown, statusCode?: number): ApiError {
  // 네트워크 에러 (fetch 실패, 타임아웃 등)
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      type: ApiErrorType.NETWORK,
      message: "네트워크 연결에 실패했습니다.",
      originalError: error,
    };
  }

  if (error instanceof Error && error.name === "AbortError") {
    return {
      type: ApiErrorType.NETWORK,
      message: "요청 시간이 초과되었습니다.",
      originalError: error,
    };
  }

  // HTTP 상태 코드 기반 분류
  if (statusCode) {
    if (statusCode >= 500) {
      return {
        type: ApiErrorType.SERVER,
        message: "서버 오류가 발생했습니다.",
        statusCode,
        originalError: error instanceof Error ? error : undefined,
      };
    }

    if (statusCode >= 400) {
      return {
        type: ApiErrorType.CLIENT,
        message: getClientErrorMessage(statusCode),
        statusCode,
        originalError: error instanceof Error ? error : undefined,
      };
    }
  }

  // 알 수 없는 에러
  return {
    type: ApiErrorType.UNKNOWN,
    message: "알 수 없는 오류가 발생했습니다.",
    originalError: error instanceof Error ? error : undefined,
  };
}

/**
 * 클라이언트 에러 (4xx) 메시지 매핑
 */
function getClientErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "잘못된 요청입니다.";
    case 401:
      return "로그인이 필요합니다.";
    case 403:
      return "권한이 없습니다.";
    case 404:
      return "요청한 리소스를 찾을 수 없습니다.";
    case 409:
      return "이미 처리된 요청입니다.";
    case 413:
      return "파일 크기가 너무 큽니다.";
    case 422:
      return "입력한 정보가 올바르지 않습니다.";
    case 429:
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    default:
      return "요청 처리에 실패했습니다.";
  }
}

// ============================================
// 사용자 친화적 에러 메시지
// ============================================

/**
 * 사용자에게 표시할 친화적인 에러 메시지를 반환합니다.
 */
export function getUserFriendlyMessage(error: ApiError, context?: string): string {
  // 컨텍스트가 있으면 추가 정보 포함
  const contextPrefix = context ? `[${context}] ` : "";

  // 에러 타입별 기본 메시지
  let message = error.message;

  // 원본 에러 메시지가 있고 개발 환경이면 추가 정보 표시
  if (error.originalError && process.env.NODE_ENV === "development") {
    message += ` (${error.originalError.message})`;
  }

  return contextPrefix + message;
}

// ============================================
// 에러 처리 헬퍼 함수
// ============================================

/**
 * API 응답에서 에러를 추출하고 분류합니다.
 */
export async function handleApiError(
  response: Response,
  context?: string
): Promise<ApiError> {
  let errorData: { error?: string; message?: string } = {};
  const statusCode = response.status;

  try {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      errorData = await response.json();
    }
  } catch {
    // JSON 파싱 실패 시 무시
  }

  const errorMessage = errorData.error || errorData.message || response.statusText;
  const error = new Error(errorMessage);

  const apiError = classifyError(error, statusCode);
  apiError.message = errorMessage || apiError.message;

  // 에러 로깅
  logger.error("API Error", {
    context,
    type: apiError.type,
    statusCode: apiError.statusCode,
    message: apiError.message,
    originalError: apiError.originalError,
  });

  return apiError;
}

/**
 * fetch 에러를 처리합니다.
 */
export function handleFetchError(
  error: unknown,
  context?: string
): ApiError {
  const apiError = classifyError(error);

  // 에러 로깅
  logger.error("Fetch Error", {
    context,
    type: apiError.type,
    message: apiError.message,
    originalError: apiError.originalError,
  });

  return apiError;
}

/**
 * 재시도 가능한 에러인지 확인합니다.
 */
export function isRetryableError(error: ApiError): boolean {
  return (
    error.type === ApiErrorType.NETWORK ||
    (error.type === ApiErrorType.SERVER && error.statusCode && error.statusCode >= 500)
  );
}

/**
 * 지수 백오프를 사용한 재시도 지연 시간을 계산합니다.
 */
export function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000); // 최대 10초
}

