"use client";

import { useState } from "react";
import GlowButton from "@/components/space/GlowButton";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useBetaCheckout } from "@/lib/payment/useBetaCheckout";
import type { BetaPlanId } from "@/lib/payment/betaPaddlePricing";

type Props = {
  planId: BetaPlanId;
  ctaLabel: string;
  highlighted?: boolean;
  /** Fired after a successful (verified, credited) Beta sandbox purchase. */
  onPurchased?: (planId: BetaPlanId) => void;
};

/**
 * 결제 직전 환불 불가 필수 동의 + Paddle SANDBOX checkout.
 *
 * Both locales go through Paddle sandbox (the earlier Toss-for-ko-KR
 * branch was dropped — no Toss sandbox credentials exist in this app, and
 * running two payment providers for a 1-week Beta was unnecessary scope).
 * See useBetaCheckout.ts: the actual grant only happens after the server
 * re-verifies the transaction against Paddle's own Sandbox API — this
 * component never grants anything itself, it only reports the outcome.
 */
export default function CheckoutWithRefundConsent({
  planId,
  ctaLabel,
  highlighted,
  onPurchased,
}: Props) {
  const { locale, messages } = useLocale();
  const copy = messages.paymentRefund;
  const { busy, openCheckout } = useBetaCheckout();
  const [agreed, setAgreed] = useState(false);
  const [hint, setHint] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  async function startCheckout() {
    if (!agreed) {
      setHint(true);
      return;
    }
    setHint(false);
    setResult(null);
    const outcome = await openCheckout(planId, locale);
    if (outcome === "success" || outcome === "already_processed") {
      setResult("success");
      onPurchased?.(planId);
    } else if (outcome === "cancelled") {
      // User closed the Paddle overlay without paying — no message needed.
    } else {
      setResult("error");
    }
  }

  return (
    <div className="mt-8 space-y-3">
      <label className="flex cursor-pointer items-start gap-2.5 text-left text-[12px] leading-snug text-white/70">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked);
            if (e.target.checked) setHint(false);
          }}
        />
        <span>{copy.checkboxLabel}</span>
      </label>

      {hint ? (
        <p className="text-[11px] text-amber-200/95">{copy.requiredHint}</p>
      ) : null}

      {result === "success" ? (
        <p className="text-[12px] font-medium text-emerald-300/95">{copy.betaSandboxSuccess}</p>
      ) : result === "error" ? (
        <p className="text-[12px] font-medium text-rose-300/95">{copy.betaSandboxError}</p>
      ) : null}

      <GlowButton
        type="button"
        variant={highlighted ? "primary" : "secondary"}
        className="w-full text-sm font-semibold"
        disabled={busy}
        onClick={() => void startCheckout()}
      >
        {busy ? copy.processing : ctaLabel}
      </GlowButton>
    </div>
  );
}
