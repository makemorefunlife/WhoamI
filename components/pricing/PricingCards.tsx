"use client";

import GlassCard from "@/components/space/GlassCard";
import CheckoutWithRefundConsent from "@/components/payment/CheckoutWithRefundConsent";
import { Check, Sparkles, Zap } from "lucide-react";
import { useMessages } from "@/lib/i18n/LocaleProvider";
import type { BetaPlanId } from "@/lib/payment/betaPaddlePricing";

const PLAN_META = [
  {
    id: "personal_premium" as const,
    accent: "border-[#8b9cff]/40",
    glow: "shadow-[0_0_40px_rgba(139,156,255,0.15)]",
    highlighted: false,
  },
  {
    id: "relationship_premium" as const,
    accent: "border-[#34d399]/35",
    glow: "shadow-[0_0_40px_rgba(52,211,153,0.12)]",
    highlighted: false,
  },
  {
    id: "membership_beta" as const,
    accent: "border-[#f6c177]/45",
    glow: "shadow-[0_0_40px_rgba(246,193,119,0.16)]",
    highlighted: true,
  },
] satisfies { id: BetaPlanId; accent: string; glow: string; highlighted: boolean }[];

export default function PricingCards() {
  const messages = useMessages();
  const t = messages.pricing;
  const PLANS = PLAN_META.map((meta) => ({ ...meta, ...t.plans[meta.id] }));

  return (
    <div className="space-y-6">
      <p className="mx-auto max-w-lg rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-center text-[12.5px] leading-relaxed text-amber-100/90">
        {t.betaNotice}
      </p>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={[
              "relative flex flex-col overflow-hidden rounded-[24px] border bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1",
              plan.accent,
              plan.glow,
              plan.highlighted ? "ring-1 ring-[#f6c177]/35" : "",
            ].join(" ")}
          >
            {plan.highlighted ? (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#f6c177]/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#f6c177]">
                <Zap className="h-3 w-3" />
                {t.popularBadge}
              </span>
            ) : null}

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              {plan.name}
            </p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight text-white">
                {plan.price}
              </span>
              {plan.period ? (
                <span className="text-sm text-white/45">{plan.period}</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{plan.tagline}</p>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-white/75"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#34d399]" />
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

      <article className="mx-auto flex max-w-lg flex-col gap-3 rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            {t.plans.additional_relationship.name}
          </p>
          <p className="mt-1 text-sm text-white/70">{t.plans.additional_relationship.tagline}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xl font-semibold text-white">
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
    <GlassCard className="!border-white/10 !bg-white/[0.03] text-center">
      <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.22em] text-[#CBB38E]">
        <Sparkles className="h-3.5 w-3.5" />
        Pricing
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
        {messages.pricing.heroTitleLine1}
        <br />
        <span className="text-white/55">{messages.pricing.heroTitleLine2}</span>
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/55">
        {messages.pricing.heroBody}
      </p>
    </GlassCard>
  );
}
