"use client";

import { useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { readAuthPrefillEmail } from "@/lib/auth/prefillEmail";

export default function SignInPage() {
  const { href } = useLocale();
  // Guest-purchase claim flow hands over the purchase email (sessionStorage,
  // never the URL) so Clerk's form starts prefilled. Clerk honors
  // ?redirect_url= for the way back.
  const [prefill] = useState(() => (typeof window === "undefined" ? null : readAuthPrefillEmail()));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a1c2b] to-[#2a2d3e] px-4 py-12">
      <SignIn
        fallbackRedirectUrl={href(ROUTES.home)}
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
