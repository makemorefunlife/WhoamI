"use client";

import CheckoutWithRefundConsent from "@/components/payment/CheckoutWithRefundConsent";
import { Check, Sparkles, Zap } from "lucide-react";
import { useMessages } from "@/lib/i18n/LocaleProvider";
import type { BetaPlanId } from "@/lib/payment/betaPaddlePricing";

const PLAN_META = [
  {
    id: "personal_premium" as const,
    accent: "border-[#D4CFC4]",
    glow: "shadow-[0_10px_30px_rgba(26,51,40,0.05)]",
    highlighted: false,
  },
  {
    id: "relationship_premium" as const,
    accent: "border-[#3A8F6E]/40",
    glow: "shadow-[0_10px_30px_rgba(58,143,110,0.08)]",
    highlighted: false,
  },
  {
    id: "membership_beta" as const,
    accent: "border-[#1A3328]/50",
    glow: "shadow-[0_14px_36px_rgba(26,51,40,0.12)]",
    highlighted: true,
  },
] satisfies { id: BetaPlanId; accent: string; glow: string; highlighted: boolean }[];

export default function PricingCards() {
  const messages = useMessages();
  const t = messages.pricing;
  const PLANS = PLAN_META.map((meta) => ({ ...meta, ...t.plans[meta.id] }));

  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-lg rounded-2xl border border-[#3A8F6E]/30 bg-[#E3F2EC] px-4 py-3 text-center text-xs font-medium leading-relaxed text-[#1A3328]">
        {t.betaNotice}
      </p>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={[
              "relative flex flex-col overflow-hidden rounded-3xl border bg-[#FFFDF8] p-6 transition duration-300 hover:-translate-y-1",
              plan.accent,
              plan.glow,
              plan.highlighted ? "ring-2 ring-[#1A3328]/20" : "",
            ].join(" ")}
          >
            {plan.highlighted ? (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-[#3A8F6E]/40 bg-[#E3F2EC] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1A3328]">
                <Zap className="h-3 w-3 text-[#3A8F6E]" />
                {t.popularBadge}
              </span>
            ) : null}

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
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-[#1A3328]"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3A8F6E]" />
                  {feature}
                </li>
              ))}
            </ul>

            <CheckoutWithRefundConsent
              planId={plan.id}
              ctaLabel={plan.cta}
              highlighted={plan.highlighted}
            />
          </article>
        ))}
      </div>

      <article className="mx-auto flex max-w-lg flex-col gap-3 rounded-2xl border border-[#D4CFC4] bg-[#FFFDF8] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3A8F6E]">
            {t.plans.additional_relationship.name}
          </p>
          <p className="mt-1 text-sm text-[#4A5C52]">{t.plans.additional_relationship.tagline}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xl font-extrabold text-[#1A3328]">
            {t.plans.additional_relationship.price}
          </span>
          <CheckoutWithRefundConsent
            planId="additional_relationship"
            ctaLabel={t.plans.additional_relationship.cta}
          />
        </div>
      </article>
    </div>
  );
}

export function PricingHero() {
  const messages = useMessages();
  return (
    <div className="rounded-3xl border border-[#D4CFC4]/70 bg-[#FFFDF8] p-8 text-center shadow-[0_12px_32px_rgba(26,51,40,0.06)] sm:p-10">
      <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[#3A8F6E]">
        <Sparkles className="h-3.5 w-3.5 text-[#3A8F6E]" />
        Pricing
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-[#1A3328] sm:text-3xl">
        {messages.pricing.heroTitleLine1}
        <br />
        <span className="text-[#4A5C52]">{messages.pricing.heroTitleLine2}</span>
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#4A5C52]">
        {messages.pricing.heroBody}
      </p>
    </div>
  );
}
