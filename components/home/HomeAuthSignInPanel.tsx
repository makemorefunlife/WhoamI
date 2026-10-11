"use client";

import { continueHref } from "@/lib/auth/returnPath";
import { SignIn } from "@clerk/nextjs";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** 홈 로그인 모달 전용 — dynamic import 대상 (초기 번들 분리) */
export default function HomeAuthSignInPanel({
  fallbackRedirectPath = ROUTES.home,
}: {
  /**
   * Where Clerk should land the person once auth completes -- matters for
   * OAuth providers (Google, etc.), which do a full-page redirect away
   * and back rather than completing in place. Defaults to home, matching
   * every existing call site; the invite/connect birth-first entry
   * (app/invite-birth/page.tsx) passes its own path instead, so it gets
   * the person back there instead of dropping them on "/".
   */
  fallbackRedirectPath?: string;
} = {}) {
  const { href } = useLocale();

  return (
    <SignIn
      routing="hash"
      // Sign-up from this panel and OAuth both come back to the same place
      // (server-checked), not to a bare home page.
      signUpUrl={`${href(ROUTES.signUp)}?redirect_url=${encodeURIComponent(href(fallbackRedirectPath))}`}
      fallbackRedirectUrl={continueHref(href(fallbackRedirectPath))}
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
