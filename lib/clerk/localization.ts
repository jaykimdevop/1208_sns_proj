import { koKR } from "@clerk/localizations";

/**
 * @file localization.ts
 * @description Clerk 한국어 로컬라이제이션 설정
 *
 * 이 파일은 Clerk 컴포넌트의 한국어 로컬라이제이션을 정의합니다.
 * 기본 koKR 로컬라이제이션을 확장하여 커스텀 메시지를 추가할 수 있습니다.
 *
 * @see {@link https://clerk.com/docs/guides/customizing-clerk/localization} - Clerk 공식 문서
 *
 * @example
 * ```tsx
 * import { customKoKR } from '@/lib/clerk/localization';
 * import { ClerkProvider } from '@clerk/nextjs';
 *
 * <ClerkProvider localization={customKoKR}>
 *   {children}
 * </ClerkProvider>
 * ```
 */

/**
 * 커스텀 한국어 로컬라이제이션
 *
 * 기본 koKR 로컬라이제이션을 확장하여 프로젝트에 맞는 커스텀 메시지를 추가합니다.
 *
 * @see {@link https://clerk.com/docs/guides/customizing-clerk/localization#customize-error-messages} - 에러 메시지 커스터마이징 가이드
 */
export const customKoKR = {
  ...koKR,
  // 에러 메시지 커스터마이징
  // unstable__errors 키를 사용하여 특정 에러 메시지를 커스터마이징할 수 있습니다
  unstable__errors: {
    ...koKR.unstable__errors,
    // 허용되지 않은 도메인으로 접근 시도 시 표시되는 메시지
    not_allowed_access:
      "이 이메일 도메인은 접근이 허용되지 않습니다. 접근 권한이 필요하시면 관리자에게 문의해주세요.",
    // 폼 식별자를 찾을 수 없을 때
    form_identifier_not_found: "사용자를 찾을 수 없습니다.",
    // 인증 실패 시
    form_password_incorrect: "비밀번호가 올바르지 않습니다.",
    // 이메일이 이미 사용 중일 때
    form_identifier_exists: "이 이메일은 이미 사용 중입니다.",
    // 필수 필드가 비어있을 때
    form_param_nil: "필수 입력 항목을 모두 입력해주세요.",
    // 세션이 만료되었을 때
    session_exists: "세션이 만료되었습니다. 다시 로그인해주세요.",
  },
  // 필요에 따라 다른 텍스트도 커스터마이징할 수 있습니다
  // 예: signIn, signUp 등의 텍스트
};

