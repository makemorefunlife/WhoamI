"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";

/** Clerk — publishable key only; no custom domain/proxy host override */
export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
      afterSignOutUrl="/"
      ui={ui}
    >
      {children}
    </ClerkProvider>
  );
}
