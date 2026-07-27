"use client";

import GlowButton from "@/components/space/GlowButton";
import GlassCard from "@/components/space/GlassCard";
import CheckoutWithRefundConsent from "@/components/payment/CheckoutWithRefundConsent";
import { Check, Sparkles, Zap } from "lucide-react";
import { useMessages } from "@/lib/i18n/LocaleProvider";

const PLAN_META = [
  { id: "free", accent: "border-white/12", glow: "", href: "/", highlighted: false },
  {
    id: "plus",
    accent: "border-[#8b9cff]/40",
    glow: "shadow-[0_0_40px_rgba(139,156,255,0.15)]",
    href: "/pricing",
    highlighted: true,
  },
  {
    id: "pro",
    accent: "border-[#34d399]/35",
    glow: "shadow-[0_0_40px_rgba(52,211,153,0.12)]",
    href: "/pricing",
    highlighted: false,
  },
] as const;

export default function PricingCards() {
  const messages = useMessages();
  const PLANS = PLAN_META.map((meta) => ({
    ...meta,
    ...messages.pricing.plans[meta.id],
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
      {PLANS.map((plan) => (
        <article
          key={plan.id}
          className={[
            "relative flex flex-col overflow-hidden rounded-[24px] border bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1",
            plan.accent,
            plan.glow,
            plan.highlighted ? "ring-1 ring-[#8b9cff]/30" : "",
          ].join(" ")}
        >
          {plan.highlighted ? (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#8b9cff]/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#a5b4fc]">
              <Zap className="h-3 w-3" />
              {messages.pricing.popularBadge}
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
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            {plan.tagline}
          </p>

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

          {plan.id === "free" ? (
            <div className="mt-8">
              <GlowButton
                href={plan.href}
                variant="secondary"
                className="w-full text-sm font-semibold"
              >
                {plan.cta}
              </GlowButton>
            </div>
          ) : (
            <CheckoutWithRefundConsent
              planId={plan.id}
              ctaLabel={plan.cta}
              highlighted={plan.highlighted}
            />
          )}
        </article>
      ))}
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
