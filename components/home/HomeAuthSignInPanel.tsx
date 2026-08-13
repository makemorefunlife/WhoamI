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
          colorPrimary: "#4a90e2",
          borderRadius: "0.75rem",
          fontSize: "0.9375rem",
        },
        elements: {
          rootBox: "w-full",
          card: "shadow-none border-0 bg-transparent p-0",
          headerTitle: "hidden",
          headerSubtitle: "hidden",
          socialButtonsBlockButton:
            "border-slate-200 bg-white hover:bg-slate-50 text-slate-800",
          formButtonPrimary:
            "bg-gradient-to-r from-[#6bb5ff] to-[#4a90e2] hover:opacity-95",
          footerAction: "text-[#4a90e2]",
          identityPreviewText: "text-slate-700",
          formFieldInput: "border-slate-200 bg-white text-slate-900",
        },
      }}
    />
  );
}
