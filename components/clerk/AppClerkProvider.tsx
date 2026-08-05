"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { koKR } from "@clerk/localizations";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** Clerk — publishable key only; locale-aware sign-in/out URLs + Clerk UI localization */
export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, href } = useLocale();
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Worktree / local DEV without env: skip Clerk rather than crash on null key.
  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={href(ROUTES.signIn)}
      signUpUrl={href(ROUTES.signUp)}
      afterSignOutUrl={href(ROUTES.home)}
      ui={ui}
      localization={locale === "ko-KR" ? koKR : undefined}
    >
      {children}
    </ClerkProvider>
  );
}
