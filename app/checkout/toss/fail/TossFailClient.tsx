"use client";

import { Suspense, useState } from "react";
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
  const message = params.get("message") ?? "";
  const orderId = params.get("orderId") ?? "";
  const cancelled = code === "PAY_PROCESS_CANCELED" || code === "USER_CANCEL";

  // What useTossCheckout actually sent to requestPayment() right before this
  // page's own navigation -- read once (sessionStorage, not console: this
  // page IS the navigation that would otherwise clear a plain console.log)
  // and cleared immediately so a later, unrelated failure never shows stale
  // data. No keys/emails -- only method + foreignEasyPay were ever written.
  const [lastRequest] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem("aha_toss_last_request");
      sessionStorage.removeItem("aha_toss_last_request");
      return raw;
    } catch {
      return null;
    }
  });

  return (
    <TossResultShell
      tone={cancelled ? "warning" : "error"}
      title={cancelled ? t.tossCancelledTitle : t.tossFailedTitle}
      body={cancelled ? t.tossCancelledBody : t.tossFailedBody}
    >
      {/* Diagnostic detail from Toss's own failUrl redirect -- not ours (we
          never set `code`). Shown so a failure can be triaged from the
          screen itself (code, message, orderId to look up in the Toss
          dashboard / toss_payment_orders) without needing DevTools. */}
      {code && !cancelled ? (
        <div className="mb-4 space-y-0.5 text-xs text-[#4A5C52]/70">
          <p>{code}</p>
          {message ? <p>{message}</p> : null}
          {orderId ? <p className="font-mono">{orderId}</p> : null}
        </div>
      ) : null}
      {lastRequest && !cancelled ? (
        <pre className="mb-4 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-[#F5F0E8] p-2.5 text-left text-[10px] leading-relaxed text-[#4A5C52]/80">
          {lastRequest}
        </pre>
      ) : null}
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
