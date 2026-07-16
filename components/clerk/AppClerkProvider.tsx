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

  return (
    <ClerkProvider
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
