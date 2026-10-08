"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { localizedPath } from "@/lib/i18n/locale";
import { ROUTES } from "@/constants/routes";
import TossResultShell from "../TossResultShell";
import { loadReportSession } from "@/lib/home/reportSession";
import { postPurchaseDestination } from "@/lib/payment/postPurchaseDestination";
import { isGuestUsePlan } from "@/lib/payment/tossCatalog";

type ConfirmBody =
  | { status: "granted"; alreadyProcessed: boolean; planId: string }
  | { status: "awaiting_claim"; planId: string; maskedEmail: string | null; emailStatus?: string }
  | { status: "test_no_grant"; reason: string }
  | { status: "payment_failed"; code: string }
  | { status: "pending_retry"; reason: string }
  | { status: "refunded_automatically"; reason: string }
  | { status: "needs_attention"; reason: string }
  | { status: "rejected"; reason: string }
  | { status: "invalid_request" | "unauthorized" };

type ViewState =
  | { kind: "confirming" }
  | { kind: "granted"; planId: string }
  | { kind: "awaiting_claim"; maskedEmail: string; emailSent: boolean; planId: string }
  | { kind: "test_no_grant" }
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
  const guest = params.get("guest") === "1";
  const [view, setView] = useState<ViewState>(() => (hasParams ? { kind: "confirming" } : { kind: "invalid" }));
  const returnPath = safeReturnPath(params.get("redirect")) ?? ROUTES.accountBilling;
  const explicitReturn = safeReturnPath(params.get("redirect"));
  const [starting, setStarting] = useState(false);

  // Only sets state after an await, so it is safe to start from an effect.
  const confirm = useCallback(async () => {
    for (let attempt = 0; attempt <= AUTO_RETRIES; attempt++) {
      let body: ConfirmBody | null = null;
      try {
        const res = await fetch("/api/payments/toss/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-aha-locale": locale },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), guest }),
        });
        body = (await res.json().catch(() => null)) as ConfirmBody | null;
      } catch {
        body = null;
      }
      const status = body?.status;
      if (status === "granted" && body && "planId" in body) return setView({ kind: "granted", planId: body.planId });
      if (status === "awaiting_claim" && body && "maskedEmail" in body) {
        // "sent" only when the mail provider accepted the message.
        return setView({
          kind: "awaiting_claim",
          maskedEmail: body.maskedEmail ?? "",
          emailSent: body.emailStatus === "sent",
          planId: body.planId,
        });
      }
      if (status === "test_no_grant") return setView({ kind: "test_no_grant" });
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
  }, [amount, guest, locale, orderId, paymentKey]);

  useEffect(() => {
    if (!hasParams) return;
    // Deferred so a StrictMode double-mount schedules exactly one run (the
    // first timer is cleared by cleanup). The server is idempotent anyway.
    const timer = setTimeout(() => void confirm(), 0);
    return () => clearTimeout(timer);
  }, [confirm, hasParams]);

  const goNext = () => router.push(localizedPath(returnPath, locale));
  // Existing entry rules (report / survey / birth state + the plan bought),
  // not a fixed /analysis route.
  const startAnalysis = async (planId: string) => {
    setStarting(true);
    let session = null;
    try {
      session = await loadReportSession({ forceRefresh: true });
    } catch {
      session = null;
    }
    router.push(localizedPath(postPurchaseDestination({ planId, locale, session, explicitReturnPath: explicitReturn }), locale));
  };
  const goPricing = () => router.push(localizedPath(ROUTES.pricing, locale));
  const primaryButton = "stitch-cta-primary w-full";
  const secondaryButton = "stitch-cta-secondary mt-3 w-full";

  switch (view.kind) {
    case "confirming":
      return <TossResultShell tone="progress" title={t.tossConfirmingTitle} body={t.tossConfirmingBody} />;
    case "granted":
      // Shown only after the server confirmed the entitlement grant.
      return (
        <TossResultShell tone="success" title={t.memberGrantedTitle} body={t.memberGrantedBody}>
          <button type="button" className={primaryButton} disabled={starting} onClick={() => void startAnalysis(view.planId)}>
            {t.startAnalysisCta}
          </button>
        </TossResultShell>
      );
    case "awaiting_claim":
      // Shown only after the server confirmed the Toss approval.
      return (
        <TossResultShell
          tone="success"
          title={t.guestDoneTitle}
          body={
            isGuestUsePlan(view.planId)
              ? view.emailSent
                ? t.guestUse.successBodySent
                : t.guestUse.successBodyPending
              : view.emailSent
                ? t.guestDoneBodyEmailSent
                : t.guestDoneBodyEmailPending
          }
        >
          {view.maskedEmail ? (
            <p className="mb-4 text-center text-xs text-[#4A5C52]">{t.guestPurchaseEmailMasked(view.maskedEmail)}</p>
          ) : null}
          {isGuestUsePlan(view.planId) ? (
            // Single Personal: usable without an account (purchase verification first).
            <button
              type="button"
              className={primaryButton}
              onClick={() => router.push(localizedPath(`/checkout/toss/use?${new URLSearchParams({ orderId }).toString()}`, locale))}
            >
              {t.guestUse.useCtaFromSuccess}
            </button>
          ) : (
            <button
              type="button"
              className={primaryButton}
              onClick={() =>
                router.push(localizedPath(`/checkout/toss/claim?${new URLSearchParams({ orderId }).toString()}`, locale))
              }
            >
              {t.guestLinkCta}
            </button>
          )}
        </TossResultShell>
      );
    case "test_no_grant":
      return (
        <TossResultShell tone="warning" title={t.testNoGrantTitle} body={t.testNoGrantBody}>
          <button type="button" className={primaryButton} onClick={goPricing}>
            {t.tossBackToPricing}
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
