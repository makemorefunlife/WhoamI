"use client";

import { SignUp } from "@clerk/nextjs";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Inline sign-up panel -- sibling to HomeAuthSignInPanel.tsx, same
 * dynamic-import-target / appearance conventions. Used by the invite/
 * connect birth-first entry (app/invite-birth/page.tsx "signup" state),
 * which shows this right after the person has already entered their
 * birth date/time/place -- signing up here is what saves that result.
 */
export default function HomeAuthSignUpPanel({
  fallbackRedirectPath = ROUTES.home,
}: {
  /**
   * Where Clerk should land the person once sign-up completes -- matters
   * for OAuth providers (Google, etc.), which do a full-page redirect
   * away and back rather than completing in place. Defaults to home; the
   * invite/connect birth-first entry passes its own path instead, so it
   * gets the person back there to finish creating the report and saving
   * the birth data they already entered.
   */
  fallbackRedirectPath?: string;
} = {}) {
  const { href } = useLocale();

  return (
    <SignUp
      routing="hash"
      signInUrl={href(ROUTES.signIn)}
      fallbackRedirectUrl={href(fallbackRedirectPath)}
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
