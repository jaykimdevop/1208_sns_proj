/**
 * @file logger.ts
 * @description 프로덕션 로깅 유틸리티
 *
 * 개발/프로덕션 환경을 분리하여 구조화된 로깅을 제공합니다.
 * 프로덕션에서는 민감한 정보를 제외하고 로깅합니다.
 *
 * @usage
 * ```ts
 * import { logger } from "@/lib/utils/logger";
 *
 * logger.info("User logged in", { userId: "123" });
 * logger.error("API Error", { error, context: "fetchPosts" });
 * ```
 */

// ============================================
// 로그 레벨
// ============================================

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

// ============================================
// 로거 인터페이스
// ============================================

interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
}

// ============================================
// 로거 구현
// ============================================

class LoggerImpl implements Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context: this.sanitizeContext(context) }),
    };

    // 개발 환경: 콘솔에 상세 로그 출력
    if (this.isDevelopment) {
      const consoleMethod = this.getConsoleMethod(level);
      consoleMethod(`[${level}] ${message}`, context || "");
    }

    // 프로덕션 환경: 구조화된 로그 (향후 에러 추적 서비스로 전송 가능)
    // TODO: Sentry, LogRocket 등 에러 추적 서비스 연동
    if (level === LogLevel.ERROR) {
      // 프로덕션에서 에러만 별도 처리
      this.logError(logEntry);
    }
  }

  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * 컨텍스트에서 민감한 정보를 제거합니다.
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized: LogContext = {};
    const sensitiveKeys = ["password", "token", "secret", "key", "authorization"];

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      } else if (value instanceof Error) {
        sanitized[key] = {
          name: value.name,
          message: value.message,
          stack: this.isDevelopment ? value.stack : undefined,
        };
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * 에러 로그를 별도로 처리합니다.
   */
  private logError(logEntry: Record<string, unknown>): void {
    // 프로덕션에서는 에러 추적 서비스로 전송
    // 예: Sentry.captureException(error)
    if (!this.isDevelopment) {
      // 현재는 구조화된 로그만 출력
      // 향후 에러 추적 서비스 연동 시 여기에 추가
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

export const logger = new LoggerImpl();

