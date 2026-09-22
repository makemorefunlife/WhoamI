"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Check } from "lucide-react";
import { useLocale, useMessages } from "@/lib/i18n/LocaleProvider";
import { useRegionalCheckout } from "@/lib/payment/useRegionalCheckout";
import { US_PLANS, type UsPlanId } from "@/lib/payment/usPricing";
import { KR_PLANS, type KrPlanId } from "@/lib/payment/krPricing";

/**
 * US/KR regional-catalog pricing cards -- separate from the existing
 * PricingCards (the original Beta lineup), which this leaves untouched.
 * Which plan ids render is decided ONLY by the page's own locale: en-US
 * renders US_PLANS' ids, ko-KR renders KR_PLANS' ids. There is no shared
 * list and no runtime branch that could show a US id on the KR page or
 * vice versa.
 */
export default function RegionalPricingCards() {
  const { locale } = useLocale();
  const { isSignedIn } = useUser();
  const messages = useMessages();
  const copy = messages.pricing.regionalPlans;
  const { busy, openCheckout } = useRegionalCheckout();
  const [result, setResult] = useState<Record<string, "success" | "error">>({});
  const [additionalEligible, setAdditionalEligible] = useState(false);

  const isUs = locale === "en-US";
  const planIds: (UsPlanId | KrPlanId)[] = isUs
    ? (Object.keys(US_PLANS) as UsPlanId[]).filter((id) => id !== "us_additional_relationship")
    : (Object.keys(KR_PLANS) as KrPlanId[]);

  useEffect(() => {
    if (!isUs || !isSignedIn) {
      setAdditionalEligible(false);
      return;
    }
    let cancelled = false;
    fetch("/api/pricing/additional-relationship-eligibility")
      .then((res) => res.json())
      .then((body: { eligible?: boolean }) => {
        if (!cancelled) setAdditionalEligible(body.eligible === true);
      })
      .catch(() => {
        if (!cancelled) setAdditionalEligible(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isUs, isSignedIn]);

  async function handleCheckout(planId: string) {
    setResult((prev) => ({ ...prev, [planId]: undefined as unknown as "success" }));
    const outcome = await openCheckout(planId, locale);
    if (outcome === "success" || outcome === "already_processed") {
      setResult((prev) => ({ ...prev, [planId]: "success" }));
    } else if (outcome === "error") {
      setResult((prev) => ({ ...prev, [planId]: "error" }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        {planIds.map((planId) => {
          const plan = copy[planId as keyof typeof copy];
          if (!plan) return null;
          return (
            <article
              key={planId}
              className="relative flex flex-col overflow-hidden rounded-3xl border border-[#D4CFC4] bg-[#FFFDF8] p-6 shadow-[0_10px_30px_rgba(26,51,40,0.05)] transition duration-300 hover:-translate-y-1"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3A8F6E]">
                {plan.name}
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight text-[#1A3328]">
                  {plan.price}
                </span>
                {plan.period ? (
                  <span className="text-sm font-medium text-[#4A5C52]">{plan.period}</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#4A5C52]">{plan.tagline}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature: string) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-[#1A3328]"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3A8F6E]" />
                    {feature}
                  </li>
                ))}
              </ul>

              {result[planId] === "success" ? (
                <p className="mt-4 text-[12px] font-medium text-emerald-700">
                  {messages.paymentRefund.betaSandboxSuccess}
                </p>
              ) : result[planId] === "error" ? (
                <p className="mt-4 text-[12px] font-medium text-rose-700">
                  {messages.paymentRefund.betaSandboxError}
                </p>
              ) : null}

              <button
                type="button"
                disabled={busy}
                onClick={() => void handleCheckout(planId)}
                className={[
                  "mt-6 w-full cursor-pointer rounded-full border border-[#1A3328]/30 bg-[#FFFDF8] px-5 py-3 text-sm font-semibold text-[#1A3328] shadow-sm transition-all duration-200 hover:bg-[#F5F0E8] active:scale-[0.98]",
                  busy ? "cursor-not-allowed opacity-60" : "",
                ].join(" ")}
              >
                {plan.cta}
              </button>
            </article>
          );
        })}
      </div>

      {isUs && additionalEligible ? (
        <article className="mx-auto flex max-w-lg flex-col gap-3 rounded-2xl border border-[#D4CFC4] bg-[#FFFDF8] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3A8F6E]">
              {copy.us_additional_relationship.name}
            </p>
            <p className="mt-1 text-sm text-[#4A5C52]">{copy.us_additional_relationship.tagline}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-xl font-extrabold text-[#1A3328]">
              {copy.us_additional_relationship.price}
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleCheckout("us_additional_relationship")}
              className={[
                "cursor-pointer rounded-full border border-[#1A3328]/30 bg-[#FFFDF8] px-5 py-2.5 text-sm font-semibold text-[#1A3328] shadow-sm transition-all duration-200 hover:bg-[#F5F0E8] active:scale-[0.98]",
                busy ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              {copy.us_additional_relationship.cta}
            </button>
          </div>
        </article>
      ) : null}
    </div>
  );
}
