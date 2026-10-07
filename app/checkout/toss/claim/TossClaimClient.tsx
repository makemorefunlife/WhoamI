"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { localizedPath } from "@/lib/i18n/locale";
import { ROUTES } from "@/constants/routes";
import TossResultShell from "../TossResultShell";

type View = "working" | "done" | "mismatch" | "nothing" | "error";

/**
 * Guest checkout, step 2: the buyer signs in / signs up (Clerk verifies the
 * email) and the paid guest order is attached to this account. The server
 * decides ownership from the account's verified emails only.
 */
function ClaimContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { locale, messages, href } = useLocale();
  const t = messages.payments;
  const orderId = params.get("orderId") ?? "";
  const [view, setView] = useState<View>("working");

  // Only sets state after an await, so it is safe to start from an effect.
  const claim = useCallback(async () => {
    try {
      const res = await fetch("/api/payments/toss/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderId ? { orderId } : {}),
      });
      const body = (await res.json().catch(() => null)) as
        | { claimed: number; results: { result: string }[] }
        | null;
      if (!res.ok || !body) return setView("error");
      if (body.claimed > 0) return setView("done");
      const results = body.results.map((r) => r.result);
      if (results.includes("email_mismatch") || results.includes("claimed_by_other")) return setView("mismatch");
      return setView("nothing");
    } catch {
      setView("error");
    }
  }, [orderId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const timer = setTimeout(() => void claim(), 0);
    return () => clearTimeout(timer);
  }, [claim, isLoaded, isSignedIn]);

  if (isLoaded && !isSignedIn) {
    const back = `/checkout/toss/claim${orderId ? `?${new URLSearchParams({ orderId }).toString()}` : ""}`;
    return <RedirectToSignIn redirectUrl={href(back)} />;
  }

  const goAccount = () => router.push(localizedPath(ROUTES.accountBilling, locale));
  const button = (
    <button type="button" className="stitch-cta-primary w-full" onClick={goAccount}>
      {t.goToAccount}
    </button>
  );

  switch (view) {
    case "working":
      return <TossResultShell tone="progress" title={t.claimWorkingTitle} body={t.tossConfirmingBody} />;
    case "done":
      return <TossResultShell tone="success" title={t.claimDoneTitle} body={t.claimDoneBody}>{button}</TossResultShell>;
    case "mismatch":
      return <TossResultShell tone="warning" title={t.claimMismatchTitle} body={t.claimMismatchBody}>{button}</TossResultShell>;
    case "nothing":
      return <TossResultShell tone="warning" title={t.claimNothingTitle} body={t.claimNothingBody}>{button}</TossResultShell>;
    default:
      return (
        <TossResultShell tone="error" title={t.tossPendingTitle} body={t.tossPendingBody}>
          <button
            type="button"
            className="stitch-cta-primary w-full"
            onClick={() => {
              setView("working");
              void claim();
            }}
          >
            {t.tossRetry}
          </button>
        </TossResultShell>
      );
  }
}

export default function TossClaimClient() {
  return (
    <Suspense fallback={null}>
      <ClaimContent />
    </Suspense>
  );
}
