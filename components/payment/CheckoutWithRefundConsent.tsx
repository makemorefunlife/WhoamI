"use client";

import { useState } from "react";
import GlowButton from "@/components/space/GlowButton";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type PlanId = "plus" | "pro";

type Props = {
  planId: PlanId;
  ctaLabel: string;
  highlighted?: boolean;
};

/**
 * 결제 직전 환불 불가 필수 동의.
 * 체크하지 않으면 onPay(토스/Paddle)가 실행되지 않습니다.
 *
 * 실제 SDK 연동 시 startCheckout 안의 TODO만 채우면 됩니다.
 */
export default function CheckoutWithRefundConsent({
  planId,
  ctaLabel,
  highlighted,
}: Props) {
  const { locale, messages } = useLocale();
  const copy = messages.paymentRefund;
  const [agreed, setAgreed] = useState(false);
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);

  async function startCheckout() {
    if (!agreed) {
      setHint(true);
      return;
    }
    setHint(false);
    setBusy(true);
    try {
      if (locale === "ko-KR") {
        // TODO: 토스페이먼츠 결제창 호출
        // await openTossCheckout({ planId });
        window.alert(
          `[Toss Payments stub]\nplan=${planId}\n환불 동의 확인됨. SDK 연동 시 이 위치가 결제 시작점입니다.`,
        );
      } else {
        // TODO: Paddle checkout 호출
        // await openPaddleCheckout({ planId });
        window.alert(
          `[Paddle stub]\nplan=${planId}\nRefund consent confirmed. Wire the Paddle SDK here.`,
        );
      }
    } finally {
      setBusy(false);
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
