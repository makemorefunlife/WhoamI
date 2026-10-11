"use client";

import { useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { readAuthPrefillEmail, safeRelativeRedirect } from "@/lib/auth/prefillEmail";
import { continueHref } from "@/lib/auth/returnPath";

export default function SignInPage() {
  const { href } = useLocale();
  // Guest-purchase claim flow hands over the purchase email (sessionStorage,
  // never the URL) so Clerk's form starts prefilled. Clerk honors
  // ?redirect_url= for the way back.
  const [prefill] = useState(() => (typeof window === "undefined" ? null : readAuthPrefillEmail()));
  // Way back: ?redirect_url (same-origin relative only), always through the
  // server-checked continue route. No redirect_url -> home.
  const [afterSignIn] = useState(() =>
    continueHref(
      typeof window === "undefined"
        ? null
        : safeRelativeRedirect(new URLSearchParams(window.location.search).get("redirect_url")),
      href(ROUTES.home),
    ),
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a1c2b] to-[#2a2d3e] px-4 py-12">
      <SignIn
        forceRedirectUrl={afterSignIn}
        fallbackRedirectUrl={afterSignIn}
        signUpUrl={href(ROUTES.signUp)}
        initialValues={prefill ? { emailAddress: prefill } : undefined}
        appearance={{
          variables: { colorPrimary: "#7c3aed" },
          elements: {
            card: "bg-slate-900/90 border border-white/10 shadow-xl",
            headerTitle: "text-white",
            headerSubtitle: "text-slate-400",
            socialButtonsBlockButton: "border-white/20",
          },
        }}
      />
    </div>
  );
}
