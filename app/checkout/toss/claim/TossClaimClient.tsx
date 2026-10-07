"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { localizedPath } from "@/lib/i18n/locale";
import { ROUTES } from "@/constants/routes";
import TossResultShell from "../TossResultShell";
import { setAuthPrefillEmail } from "@/lib/auth/prefillEmail";
import { loadReportSession } from "@/lib/home/reportSession";
import { postPurchaseDestination } from "@/lib/payment/postPurchaseDestination";

/**
 * Guest checkout, step 2 -- reached from the success page or the emailed
 * link (via /api/payments/toss/claim-link, so this URL never holds a token).
 *
 * Signed out: shows the order's masked email; "sign up" / "sign in" open
 * Clerk with the purchase email prefilled (when the server confirmed the
 * post-payment / link cookie) and come back here. An expired link can be
 * replaced: a new one is emailed to the order email.
 *
 * Signed in: /api/payments/toss/claim attaches the order only if this
 * account's Clerk-VERIFIED email equals the order email (server-side), and
 * the shared SQL path grants the pass once. Then "start my analysis" follows
 * the existing entry rules for the plan bought.
 */

type Info = { status?: string; maskedEmail?: string | null; prefillEmail?: string | null; linkValid?: boolean };

function SignedOutClaim({ orderId, linkExpired }: { orderId: string; linkExpired: boolean }) {
  const router = useRouter();
  const { messages, href } = useLocale();
  const t = messages.payments;
  const [info, setInfo] = useState<Info | null>(null);
  const [renew, setRenew] = useState<"idle" | "sending" | "done">("idle");

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    fetch("/api/payments/toss/claim-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then((r) => r.json().catch(() => ({})))
      .then((body: Info) => {
        if (!cancelled) setInfo(body ?? {});
      })
      .catch(() => {
        if (!cancelled) setInfo({});
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const returnHere = href(`/checkout/toss/claim${orderId ? `?${new URLSearchParams({ orderId }).toString()}` : ""}`);
  const openAuth = (path: string) => {
    if (info?.prefillEmail) setAuthPrefillEmail(info.prefillEmail);
    router.push(`${href(path)}?${new URLSearchParams({ redirect_url: returnHere }).toString()}`);
  };
  const requestNewLink = async () => {
    setRenew("sending");
    await fetch("/api/payments/toss/claim-link/renew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).catch(() => undefined);
    setRenew("done");
  };

  if (!info && orderId) return <TossResultShell tone="progress" title={t.claimWorkingTitle} body={t.tossConfirmingBody} />;
  if (info?.status === "test_not_allowed") {
    return <TossResultShell tone="warning" title={t.claimTestNotAllowedTitle} body={t.claimTestNotAllowedBody} />;
  }

  const showRenew = Boolean(orderId) && info?.status === "awaiting_claim" && (linkExpired || !info?.linkValid);
  return (
    <TossResultShell
      tone="success"
      title={t.claimSignedOutTitle}
      body={info?.maskedEmail ? t.claimSignedOutBody(info.maskedEmail) : t.claimNoPrefillBody}
    >
      {linkExpired ? <p className="mb-4 text-xs leading-relaxed text-amber-700">{t.claimLinkExpiredNotice}</p> : null}
      <button type="button" className="stitch-cta-primary w-full" onClick={() => openAuth(ROUTES.signUp)}>
        {t.claimSignUpCta}
      </button>
      <button type="button" className="stitch-cta-secondary mt-3 w-full" onClick={() => openAuth(ROUTES.signIn)}>
        {t.claimSignInCta}
      </button>
      {showRenew ? (
        <div className="mt-5 border-t border-[#EDE8DD] pt-4">
          {renew === "done" ? (
            <p role="status" className="text-xs leading-relaxed text-[#3A8F6E]">
              {t.claimNewLinkRequested}
            </p>
          ) : (
            <button
              type="button"
              disabled={renew === "sending"}
              onClick={() => void requestNewLink()}
              className="text-xs font-semibold text-[#3A8F6E] underline underline-offset-2 disabled:opacity-60"
            >
              {t.claimNewLinkCta}
            </button>
          )}
        </div>
      ) : null}
    </TossResultShell>
  );
}

type Result = { kind: "working" } | { kind: "done"; planId: string | null } | { kind: "mismatch" | "nothing" | "test" | "error" };

function SignedInClaim({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const t = messages.payments;
  const [result, setResult] = useState<Result>({ kind: "working" });
  const [starting, setStarting] = useState(false);

  const claim = useCallback(async () => {
    try {
      const res = await fetch("/api/payments/toss/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderId ? { orderId } : {}),
      });
      const body = (await res.json().catch(() => null)) as { results?: { result: string; planId?: string }[] } | null;
      if (!res.ok || !body?.results) return setResult({ kind: "error" });
      const linked = body.results.find((r) => r.result === "claimed" || r.result === "already_claimed");
      if (linked) return setResult({ kind: "done", planId: linked.planId ?? null });
      const codes = body.results.map((r) => r.result);
      if (codes.includes("test_not_allowed")) return setResult({ kind: "test" });
      if (codes.includes("email_mismatch") || codes.includes("claimed_by_other")) return setResult({ kind: "mismatch" });
      setResult({ kind: "nothing" });
    } catch {
      setResult({ kind: "error" });
    }
  }, [orderId]);

  useEffect(() => {
    // Deferred so a StrictMode double-mount schedules one run; the server is idempotent anyway.
    const timer = setTimeout(() => void claim(), 0);
    return () => clearTimeout(timer);
  }, [claim]);

  const start = async (planId: string | null) => {
    setStarting(true);
    const session = await loadReportSession({ forceRefresh: true }).catch(() => null);
    router.push(localizedPath(postPurchaseDestination({ planId, locale, session }), locale));
  };
  const toAccount = (
    <button type="button" className="stitch-cta-primary w-full" onClick={() => router.push(localizedPath(ROUTES.accountBilling, locale))}>
      {t.goToAccount}
    </button>
  );

  switch (result.kind) {
    case "working":
      return <TossResultShell tone="progress" title={t.claimWorkingTitle} body={t.tossConfirmingBody} />;
    case "done":
      // Shown only after the server linked the order and granted the pass.
      return (
        <TossResultShell tone="success" title={t.memberGrantedTitle} body={t.memberGrantedBody}>
          <button type="button" className="stitch-cta-primary w-full" disabled={starting} onClick={() => void start(result.planId)}>
            {t.startAnalysisCta}
          </button>
        </TossResultShell>
      );
    case "test":
      return <TossResultShell tone="warning" title={t.claimTestNotAllowedTitle} body={t.claimTestNotAllowedBody}>{toAccount}</TossResultShell>;
    case "mismatch":
      return <TossResultShell tone="warning" title={t.claimMismatchTitle} body={t.claimMismatchBody}>{toAccount}</TossResultShell>;
    case "nothing":
      return <TossResultShell tone="warning" title={t.claimNothingTitle} body={t.claimNothingBody}>{toAccount}</TossResultShell>;
    default:
      return (
        <TossResultShell tone="error" title={t.tossPendingTitle} body={t.tossPendingBody}>
          <button
            type="button"
            className="stitch-cta-primary w-full"
            onClick={() => {
              setResult({ kind: "working" });
              void claim();
            }}
          >
            {t.tossRetry}
          </button>
        </TossResultShell>
      );
  }
}

function ClaimContent() {
  const params = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const { messages } = useLocale();
  const orderId = /^aha_[a-f0-9]{32}$/.test(params.get("orderId") ?? "") ? (params.get("orderId") as string) : "";
  if (!isLoaded) {
    return <TossResultShell tone="progress" title={messages.payments.claimWorkingTitle} body={messages.payments.tossConfirmingBody} />;
  }
  return isSignedIn ? (
    <SignedInClaim orderId={orderId} />
  ) : (
    <SignedOutClaim orderId={orderId} linkExpired={params.get("link") === "expired"} />
  );
}

export default function TossClaimClient() {
  return (
    <Suspense fallback={null}>
      <ClaimContent />
    </Suspense>
  );
}
