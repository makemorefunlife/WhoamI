"use client";

import { useState } from "react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useBetaCheckout } from "@/lib/payment/useBetaCheckout";
import type { BetaPlanId } from "@/lib/payment/betaPaddlePricing";
import { ROUTES } from "@/constants/routes";

type Props = {
  planId: BetaPlanId;
  ctaLabel: string;
  highlighted?: boolean;
  /** Fired after a successful (verified, credited) Beta sandbox purchase. */
  onPurchased?: (planId: BetaPlanId) => void;
};

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
      // User closed the Paddle overlay without paying
    } else {
      setResult("error");
    }
  }

  return (
    <div className="mt-8 space-y-3">
      <label className="flex cursor-pointer items-start gap-2.5 text-left text-[12px] leading-snug text-[#4A5C52]">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D4CFC4] text-[#1A3328] focus:ring-[#1A3328]"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked);
            if (e.target.checked) setHint(false);
          }}
        />
        <span>
          {copy.checkboxLabel}{" "}
          <LocaleLink
            href={ROUTES.refund}
            className="underline decoration-[#1A3328]/40 underline-offset-2 hover:text-[#1A3328]"
            target="_blank"
          >
            {copy.refundPolicyLinkLabel}
          </LocaleLink>
        </span>
      </label>

      {hint ? (
        <p className="text-[11px] font-medium text-amber-700">{copy.requiredHint}</p>
      ) : null}

      {result === "success" ? (
        <p className="text-[12px] font-medium text-emerald-700">{copy.betaSandboxSuccess}</p>
      ) : result === "error" ? (
        <p className="text-[12px] font-medium text-rose-700">{copy.betaSandboxError}</p>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void startCheckout()}
        className={[
          "w-full cursor-pointer rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
          highlighted
            ? "bg-gradient-to-b from-[#234A38] to-[#1A3328] text-[#FFFDF8] shadow-[0_10px_24px_rgba(26,51,40,0.22)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(26,51,40,0.28)]"
            : "border border-[#1A3328]/30 bg-[#FFFDF8] text-[#1A3328] shadow-sm hover:bg-[#F5F0E8]",
          busy ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        {busy ? copy.processing : ctaLabel}
      </button>

      <p className="text-center text-[11px] leading-tight text-[#4A5C52]/75">
        {copy.paddleNotice}
      </p>
    </div>
  );
}
