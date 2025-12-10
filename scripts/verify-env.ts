/**
 * @file verify-env.ts
 * @description 환경 변수 검증 스크립트
 *
 * 프로덕션 빌드 전 필수 환경 변수를 확인합니다.
 * 이 스크립트는 CI/CD 파이프라인에서도 사용할 수 있습니다.
 *
 * 사용법:
 *   pnpm verify:env
 *   또는
 *   pnpm tsx scripts/verify-env.ts
 *
 * 주의: tsx가 설치되어 있지 않은 경우 다음 명령어로 설치:
 *   pnpm add -D tsx
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
  defaultValue?: string;
}

const requiredEnvVars: EnvVar[] = [
  {
    name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    required: true,
    description: "Clerk Publishable Key",
    validator: (value) => value.startsWith("pk_"),
    errorMessage: "Clerk Publishable Key는 'pk_'로 시작해야 합니다.",
  },
  {
    name: "CLERK_SECRET_KEY",
    required: true,
    description: "Clerk Secret Key",
    validator: (value) => value.startsWith("sk_"),
    errorMessage: "Clerk Secret Key는 'sk_'로 시작해야 합니다.",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    description: "Supabase Project URL",
    validator: (value) => value.startsWith("https://") && value.includes(".supabase.co"),
    errorMessage: "Supabase URL은 'https://'로 시작하고 '.supabase.co'를 포함해야 합니다.",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    description: "Supabase Anonymous Key",
    validator: (value) => value.startsWith("eyJ"),
    errorMessage: "Supabase Anon Key는 JWT 형식이어야 합니다.",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    description: "Supabase Service Role Key (서버 사이드 전용)",
    validator: (value) => value.startsWith("eyJ"),
    errorMessage: "Supabase Service Role Key는 JWT 형식이어야 합니다.",
  },
];

const optionalEnvVars: EnvVar[] = [
  {
    name: "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
    required: false,
    description: "Clerk Sign In URL",
    defaultValue: "/sign-in",
  },
  {
    name: "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL",
    required: false,
    description: "Clerk Sign In Fallback Redirect URL",
    defaultValue: "/",
  },
  {
    name: "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL",
    required: false,
    description: "Clerk Sign Up Fallback Redirect URL",
    defaultValue: "/",
  },
  {
    name: "NEXT_PUBLIC_STORAGE_BUCKET",
    required: false,
    description: "Supabase Storage Bucket Name",
    defaultValue: "uploads",
  },
];

function checkProductionKeys() {
  const isProduction = process.env.NODE_ENV === "production";
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  if (isProduction) {
    if (clerkPublishableKey?.startsWith("pk_test_")) {
      console.error("❌ 오류: 프로덕션 환경에서 Clerk 테스트 키를 사용하고 있습니다!");
      console.error("   Production 키(pk_live_...)를 사용해야 합니다.");
      return false;
    }
    if (clerkSecretKey?.startsWith("sk_test_")) {
      console.error("❌ 오류: 프로덕션 환경에서 Clerk 테스트 키를 사용하고 있습니다!");
      console.error("   Production 키(sk_live_...)를 사용해야 합니다.");
      return false;
    }
  }

  return true;
}

function verifyEnvVars(): boolean {
  let hasErrors = false;

  console.log("🔍 환경 변수 검증 중...\n");

  // 필수 환경 변수 검증
  console.log("📋 필수 환경 변수 확인:");
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];

    if (!value) {
      console.error(`❌ ${envVar.name}: 누락됨 (필수)`);
      console.error(`   설명: ${envVar.description}`);
      hasErrors = true;
      continue;
    }

    if (envVar.validator && !envVar.validator(value)) {
      console.error(`❌ ${envVar.name}: 형식 오류`);
      console.error(`   ${envVar.errorMessage || "유효하지 않은 형식입니다."}`);
      hasErrors = true;
      continue;
    }

    // 값의 일부만 표시 (보안)
    const maskedValue = value.length > 20 ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}` : "***";
    console.log(`✅ ${envVar.name}: ${maskedValue}`);
  }

  console.log("\n📋 선택적 환경 변수 확인:");
  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar.name];
    if (value) {
      const maskedValue = value.length > 20 ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}` : "***";
      console.log(`✅ ${envVar.name}: ${maskedValue}`);
    } else {
      console.log(`⚠️  ${envVar.name}: 기본값 사용 (${envVar.defaultValue || "없음"})`);
    }
  }

  // 프로덕션 키 확인
  console.log("\n🔒 프로덕션 키 확인:");
  if (!checkProductionKeys()) {
    hasErrors = true;
  } else {
    console.log("✅ 프로덕션 키 검증 통과");
  }

  return !hasErrors;
}

// 스크립트 실행
if (require.main === module) {
  const isValid = verifyEnvVars();

  if (isValid) {
    console.log("\n✅ 모든 환경 변수 검증 완료!");
    process.exit(0);
  } else {
    console.error("\n❌ 환경 변수 검증 실패!");
    console.error("   위의 오류를 수정한 후 다시 시도하세요.");
    process.exit(1);
  }
}

export { verifyEnvVars, checkProductionKeys };

