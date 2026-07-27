"use client";

import { useState } from "react";
import { SignUp } from "@clerk/nextjs";
import SignUpConsentFields from "@/components/legal/SignUpConsentFields";
import SignUpUsNotice from "@/components/legal/SignUpUsNotice";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const clerkAppearance = {
  variables: { colorPrimary: "#7c3aed" },
  elements: {
    card: "bg-slate-900/90 border border-white/10 shadow-xl",
    headerTitle: "text-white",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButton: "border-white/20",
  },
} as const;

export default function SignUpPage() {
  const { locale, href, messages } = useLocale();
  const isKr = locale === "ko-KR";

  const [ageChecked, setAgeChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);

  const krReady = ageChecked && termsChecked;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1a1c2b] to-[#2a2d3e] px-4 py-12">
      {isKr ? (
        <>
          <SignUpConsentFields
            ageChecked={ageChecked}
            termsChecked={termsChecked}
            marketingChecked={marketingChecked}
            onAgeChange={setAgeChecked}
            onTermsChange={setTermsChecked}
            onMarketingChange={setMarketingChecked}
          />
          {krReady ? (
            <SignUp
              fallbackRedirectUrl={href(ROUTES.home)}
              signInUrl={href(ROUTES.signIn)}
              appearance={clerkAppearance}
            />
          ) : (
            <div className="w-full max-w-[400px] rounded-xl border border-dashed border-white/15 bg-slate-900/40 px-5 py-10 text-center">
              <p className="text-sm text-slate-400">
                {messages.legalConsent.gateHint}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <SignUp
            fallbackRedirectUrl={href(ROUTES.home)}
            signInUrl={href(ROUTES.signIn)}
            appearance={clerkAppearance}
          />
          <SignUpUsNotice
            marketingChecked={marketingChecked}
            onMarketingChange={setMarketingChecked}
          />
        </>
      )}
    </div>
  );
}
