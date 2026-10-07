"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { localizedPath } from "@/lib/i18n/locale";
import { ROUTES } from "@/constants/routes";
import TossResultShell from "../TossResultShell";

type ConfirmBody =
  | { status: "granted"; alreadyProcessed: boolean; planId: string }
  | { status: "payment_failed"; code: string }
  | { status: "pending_retry"; reason: string }
  | { status: "refunded_automatically"; reason: string }
  | { status: "needs_attention"; reason: string }
  | { status: "rejected"; reason: string }
  | { status: "invalid_request" | "unauthorized" };

type ViewState =
  | { kind: "confirming" }
  | { kind: "granted" }
  | { kind: "pending" }
  | { kind: "failed" }
  | { kind: "refunded" }
  | { kind: "attention" }
  | { kind: "invalid" };

const AUTO_RETRIES = 4;
const RETRY_DELAY_MS = 3000;

function safeReturnPath(raw: string | null): string | null {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { locale, messages } = useLocale();
  const t = messages.payments;
  const paymentKey = params.get("paymentKey") ?? "";
  const orderId = params.get("orderId") ?? "";
  const amount = params.get("amount") ?? "";
  const hasParams = Boolean(paymentKey && orderId && amount);
  const [view, setView] = useState<ViewState>(() => (hasParams ? { kind: "confirming" } : { kind: "invalid" }));
  const returnPath = safeReturnPath(params.get("redirect")) ?? ROUTES.accountBilling;

  // Only sets state after an await, so it is safe to start from an effect.
  const confirm = useCallback(async () => {
    for (let attempt = 0; attempt <= AUTO_RETRIES; attempt++) {
      let body: ConfirmBody | null = null;
      try {
        const res = await fetch("/api/payments/toss/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-aha-locale": locale },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });
        body = (await res.json().catch(() => null)) as ConfirmBody | null;
      } catch {
        body = null;
      }
      const status = body?.status;
      if (status === "granted") return setView({ kind: "granted" });
      if (status === "payment_failed") return setView({ kind: "failed" });
      if (status === "refunded_automatically") return setView({ kind: "refunded" });
      if (status === "needs_attention") return setView({ kind: "attention" });
      if (status === "invalid_request" || status === "unauthorized") return setView({ kind: "invalid" });
      if (status === "rejected" && body && "reason" in body && body.reason !== "in_progress") {
        return setView({ kind: "invalid" });
      }
      // pending_retry / in_progress / network error: wait and try again
      // (the server side is idempotent on orderId + paymentKey).
      if (attempt < AUTO_RETRIES) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
    setView({ kind: "pending" });
  }, [amount, locale, orderId, paymentKey]);

  useEffect(() => {
    if (!hasParams) return;
    // Deferred so a StrictMode double-mount schedules exactly one run (the
    // first timer is cleared by cleanup). The server is idempotent anyway.
    const timer = setTimeout(() => void confirm(), 0);
    return () => clearTimeout(timer);
  }, [confirm, hasParams]);

  const goNext = () => router.push(localizedPath(returnPath, locale));
  const goPricing = () => router.push(localizedPath(ROUTES.pricing, locale));
  const primaryButton = "stitch-cta-primary w-full";
  const secondaryButton = "stitch-cta-secondary mt-3 w-full";

  switch (view.kind) {
    case "confirming":
      return <TossResultShell tone="progress" title={t.tossConfirmingTitle} body={t.tossConfirmingBody} />;
    case "granted":
      return (
        <TossResultShell tone="success" title={t.tossSuccessTitle} body={t.tossSuccessBody}>
          <button type="button" className={primaryButton} onClick={goNext}>
            {t.tossContinue}
          </button>
        </TossResultShell>
      );
    case "pending":
      return (
        <TossResultShell tone="warning" title={t.tossPendingTitle} body={t.tossPendingBody}>
          <button type="button" className={primaryButton} onClick={() => {
              setView({ kind: "confirming" });
              void confirm();
            }}>
            {t.tossRetry}
          </button>
        </TossResultShell>
      );
    case "failed":
      return (
        <TossResultShell tone="error" title={t.tossFailedTitle} body={t.tossFailedBody}>
          <button type="button" className={primaryButton} onClick={goPricing}>
            {t.tossBackToPricing}
          </button>
        </TossResultShell>
      );
    case "refunded":
      return (
        <TossResultShell tone="warning" title={t.tossAutoRefundedTitle} body={t.tossAutoRefundedBody}>
          <button type="button" className={primaryButton} onClick={goNext}>
            {t.tossContinue}
          </button>
        </TossResultShell>
      );
    case "attention":
      return <TossResultShell tone="warning" title={t.tossAttentionTitle} body={t.tossAttentionBody} />;
    case "invalid":
    default:
      return (
        <TossResultShell tone="error" title={t.tossInvalidTitle} body={t.tossInvalidBody}>
          <button type="button" className={secondaryButton} onClick={goPricing}>
            {t.tossBackToPricing}
          </button>
        </TossResultShell>
      );
  }
}

export default function TossSuccessClient() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
