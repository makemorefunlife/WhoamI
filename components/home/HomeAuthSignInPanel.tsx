"use client";

import { SignIn } from "@clerk/nextjs";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** 홈 로그인 모달 전용 — dynamic import 대상 (초기 번들 분리) */
export default function HomeAuthSignInPanel() {
  const { href } = useLocale();

  return (
    <SignIn
      routing="hash"
      signUpUrl={href(ROUTES.signUp)}
      fallbackRedirectUrl={href(ROUTES.home)}
      appearance={{
        variables: {
          colorPrimary: "#1a3328",
          borderRadius: "0.75rem",
          fontSize: "0.9375rem",
        },
        elements: {
          rootBox: "w-full",
          card: "shadow-none border-0 bg-transparent p-0",
          headerTitle: "hidden",
          headerSubtitle: "hidden",
          socialButtonsBlockButton:
            "border-outline-variant/40 bg-white hover:bg-surface-container-low text-on-surface",
          formButtonPrimary:
            "bg-gradient-to-r from-secondary to-primary hover:opacity-95",
          footerAction: "text-primary",
          identityPreviewText: "text-on-surface",
          formFieldInput: "border-outline-variant/40 bg-white text-on-surface",
        },
      }}
    />
  );
}
