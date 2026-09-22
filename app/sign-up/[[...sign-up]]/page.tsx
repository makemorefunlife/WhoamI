"use client";

import { useState } from "react";
import SignUpConsentFields from "@/components/legal/SignUpConsentFields";
import SignUpUsNotice from "@/components/legal/SignUpUsNotice";
import CustomSignUpForm from "@/components/auth/CustomSignUpForm";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function SignUpPage() {
  const { locale, messages } = useLocale();
  const isKr = locale === "ko-KR";

  const [ageChecked, setAgeChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);

  const krReady = ageChecked && termsChecked && privacyChecked;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF7F0] px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_85%_12%,rgba(58,143,110,0.08)_0%,transparent_45%),radial-gradient(circle_at_8%_88%,rgba(196,154,156,0.14)_0%,transparent_40%)]"
      />
      <div className="relative z-10 flex w-full flex-col items-center">
        {isKr ? (
          <>
            <SignUpConsentFields
              ageChecked={ageChecked}
              termsChecked={termsChecked}
              privacyChecked={privacyChecked}
              marketingChecked={marketingChecked}
              onAgeChange={setAgeChecked}
              onTermsChange={setTermsChecked}
              onPrivacyChange={setPrivacyChecked}
              onMarketingChange={setMarketingChecked}
            />
            {krReady ? (
              <CustomSignUpForm fallbackRedirectPath={ROUTES.home} />
            ) : (
              <div className="w-full max-w-[400px] rounded-2xl border border-dashed border-[#D4CFC4] bg-[#FFFDF8] px-5 py-10 text-center shadow-sm">
                <p className="text-sm font-medium text-[#4A5C52]">
                  {messages.legalConsent.gateHint}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <CustomSignUpForm fallbackRedirectPath={ROUTES.home} />
            <SignUpUsNotice
              marketingChecked={marketingChecked}
              onMarketingChange={setMarketingChecked}
            />
          </>
        )}
      </div>
    </div>
  );
}
