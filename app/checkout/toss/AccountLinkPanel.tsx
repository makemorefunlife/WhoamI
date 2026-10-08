"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";
import { setAuthPrefillEmail } from "@/lib/auth/prefillEmail";
import { accountLinkCopy } from "@/lib/payment/accountLinkCopy";

export type ClaimInfo = {
  status?: string;
  planId?: string | null;
  approvedAt?: string | null;
  maskedEmail?: string | null;
  prefillEmail?: string | null;
  linkValid?: boolean;
};

/** Read-only order facts for the guest order (masked email, plan, purchase time). */
export function useClaimInfo(orderId: string): ClaimInfo | null {
  const [info, setInfo] = useState<ClaimInfo | null>(null);
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    fetch("/api/payments/toss/claim-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then((r) => r.json().catch(() => ({})))
      .then((body: ClaimInfo) => {
        if (!cancelled) setInfo(body ?? {});
      })
      .catch(() => {
        if (!cancelled) setInfo({});
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);
  return info;
}

/**
 * "Sign up / log in with the purchase email" block for an account product
 * (Relationship / Triple / 30-day pass). Used on the success page (right
 * after paying) and on the claim page (from the email), so the buyer reads
 * it once and goes straight to Clerk; Clerk returns to the claim page, which
 * links the pass automatically.
 */
export default function AccountLinkPanel({ orderId, info }: { orderId: string; info: ClaimInfo | null }) {
  const router = useRouter();
  const { messages, href, locale } = useLocale();
  const copy = accountLinkCopy(messages, locale, info?.planId, { maskedEmail: info?.maskedEmail, approvedAt: info?.approvedAt });
  const t = messages.payments;
  const returnHere = href(`/checkout/toss/claim${orderId ? `?${new URLSearchParams({ orderId }).toString()}` : ""}`);
  const openAuth = (path: string) => {
    if (info?.prefillEmail) setAuthPrefillEmail(info.prefillEmail);
    router.push(`${href(path)}?${new URLSearchParams({ redirect_url: returnHere }).toString()}`);
  };
  return (
    <>
      {copy?.extras.length ? (
        <div className="mb-4 space-y-1 rounded-xl bg-[#F5F0E8] px-3.5 py-2.5 text-left">
          {copy.extras.map((x) => (
            <p key={x} className="text-xs leading-relaxed text-[#4A5C52]">{x}</p>
          ))}
        </div>
      ) : null}
      <p className="mb-4 text-sm font-semibold leading-relaxed text-[#1A3328]">
        {copy?.emailLine ?? (info?.maskedEmail ? t.claimSignedOutBody(info.maskedEmail) : t.claimNoPrefillBody)}
      </p>
      <button type="button" className="stitch-cta-primary w-full" onClick={() => openAuth(ROUTES.signUp)}>
        {copy?.primaryCta ?? t.claimSignUpCta}
      </button>
      <button type="button" className="stitch-cta-secondary mt-3 w-full" onClick={() => openAuth(ROUTES.signIn)}>
        {copy?.secondaryCta ?? t.claimSignInCta}
      </button>
      {copy ? (
        <div className="mt-4 space-y-1 text-center">
          {copy.footers.map((x) => (
            <p key={x} className="text-[11px] leading-relaxed text-[#4A5C52]">{x}</p>
          ))}
        </div>
      ) : null}
    </>
  );
}
