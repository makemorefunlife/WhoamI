"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { localizedPath } from "@/lib/i18n/locale";
import { ROUTES } from "@/constants/routes";
import TossResultShell from "../TossResultShell";

/**
 * Toss redirects here (failUrl) when the buyer cancels or the payment
 * window fails. No money is captured on this path -- capture only happens
 * on our server-side confirm -- so this page only explains and links back.
 */
function FailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { locale, messages } = useLocale();
  const t = messages.payments;
  const code = params.get("code") ?? "";
  const cancelled = code === "PAY_PROCESS_CANCELED" || code === "USER_CANCEL";

  return (
    <TossResultShell
      tone={cancelled ? "warning" : "error"}
      title={cancelled ? t.tossCancelledTitle : t.tossFailedTitle}
      body={cancelled ? t.tossCancelledBody : t.tossFailedBody}
    >
      {code && !cancelled ? <p className="mb-4 text-xs text-[#4A5C52]/70">{code}</p> : null}
      <button
        type="button"
        className="stitch-cta-primary w-full"
        onClick={() => router.push(localizedPath(ROUTES.pricing, locale))}
      >
        {t.tossBackToPricing}
      </button>
    </TossResultShell>
  );
}

export default function TossFailClient() {
  return (
    <Suspense fallback={null}>
      <FailContent />
    </Suspense>
  );
}
