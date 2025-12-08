# Clerk 한국어 로컬라이제이션 가이드

이 문서는 Clerk 컴포넌트를 한국어로 설정하는 방법을 설명합니다.

## 개요

이 프로젝트는 Clerk의 한국어 로컬라이제이션을 사용하여 모든 Clerk 컴포넌트의 텍스트를 한국어로 표시합니다.

## 설정 방법

### 1. 패키지 설치

`@clerk/localizations` 패키지가 이미 설치되어 있습니다:

```bash
npm install @clerk/localizations
```

### 2. 로컬라이제이션 적용

`app/layout.tsx`에서 `ClerkProvider`에 한국어 로컬라이제이션을 적용합니다:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { customKoKR } from "@/lib/clerk/localization";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={customKoKR}>
      <html lang="ko">
        {/* ... */}
      </html>
    </ClerkProvider>
  );
}
```

## 커스텀 로컬라이제이션

프로젝트는 기본 `koKR` 로컬라이제이션을 확장하여 커스텀 메시지를 추가합니다.

### 파일 위치

`lib/clerk/localization.ts` 파일에서 커스텀 로컬라이제이션을 관리합니다.

### 커스텀 에러 메시지

다음과 같이 에러 메시지를 커스터마이징할 수 있습니다:

```tsx
import { koKR } from "@clerk/localizations";

export const customKoKR = {
  ...koKR,
  unstable__errors: {
    ...koKR.unstable__errors,
    not_allowed_access:
      "이 이메일 도메인은 접근이 허용되지 않습니다. 접근 권한이 필요하시면 관리자에게 문의해주세요.",
    form_identifier_not_found: "사용자를 찾을 수 없습니다.",
    form_password_incorrect: "비밀번호가 올바르지 않습니다.",
  },
};
```

### 사용 가능한 에러 키

Clerk의 모든 에러 키는 [영어 로컬라이제이션 파일](https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts)에서 확인할 수 있습니다. `unstable__errors` 객체를 검색하여 커스터마이징할 수 있는 키를 찾을 수 있습니다.

## 지원되는 언어

Clerk는 다음 언어를 지원합니다:

- 한국어 (ko-KR) - `koKR`
- 영어 (en-US) - `enUS`
- 일본어 (ja-JP) - `jaJP`
- 중국어 간체 (zh-CN) - `zhCN`
- 중국어 번체 (zh-TW) - `zhTW`
- 기타 50개 이상의 언어

전체 언어 목록은 [Clerk 공식 문서](https://clerk.com/docs/guides/customizing-clerk/localization#languages)를 참고하세요.

## 주의사항

### 실험적 기능

로컬라이제이션 기능은 현재 실험적(experimental) 단계입니다. 예상치 못한 동작이 발생할 수 있으므로, 문제가 발생하면 [Clerk 지원팀](https://clerk.com/contact/support)에 문의하세요.

### 적용 범위

로컬라이제이션은 다음에만 적용됩니다:

- ✅ **Clerk 컴포넌트**: SignIn, SignUp, UserButton 등 앱에서 사용하는 컴포넌트
- ❌ **Clerk Account Portal**: 호스팅된 계정 포털은 여전히 영어로 표시됩니다

### Tailwind CSS 4 호환성

Tailwind CSS 4를 사용하는 경우 `appearance` prop에 `cssLayerName: "clerk"`을 설정해야 합니다:

```tsx
<ClerkProvider
  localization={customKoKR}
  appearance={{
    cssLayerName: "clerk", // Tailwind CSS 4 호환성
  }}
>
  {/* ... */}
</ClerkProvider>
```

## 예시

### 기본 사용

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";

<ClerkProvider localization={koKR}>
  {/* ... */}
</ClerkProvider>
```

### 커스텀 메시지 추가

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";

const customKoKR = {
  ...koKR,
  unstable__errors: {
    ...koKR.unstable__errors,
    not_allowed_access: "커스텀 에러 메시지",
  },
};

<ClerkProvider localization={customKoKR}>
  {/* ... */}
</ClerkProvider>
```

## 참고 자료

- [Clerk 로컬라이제이션 공식 문서](https://clerk.com/docs/guides/customizing-clerk/localization)
- [영어 로컬라이제이션 파일 (GitHub)](https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts)
- [한국어 로컬라이제이션 파일 (GitHub)](https://github.com/clerk/javascript/blob/main/packages/localizations/src/ko-KR.ts)

