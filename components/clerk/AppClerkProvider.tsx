"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { ROUTES } from "@/constants/routes";

/** Clerk — publishable key only; no custom domain/proxy host override */
export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl={ROUTES.signIn}
      signUpUrl={ROUTES.signUp}
      afterSignInUrl={ROUTES.home}
      afterSignUpUrl={ROUTES.home}
      afterSignOutUrl={ROUTES.home}
      ui={ui}
    >
      {children}
    </ClerkProvider>
  );
}
