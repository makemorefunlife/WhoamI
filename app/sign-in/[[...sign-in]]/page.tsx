"use client";

import { SignIn } from "@clerk/nextjs";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function SignInPage() {
  const { href } = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a1c2b] to-[#2a2d3e] px-4 py-12">
      <SignIn
        fallbackRedirectUrl={href(ROUTES.home)}
        signUpUrl={href(ROUTES.signUp)}
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
