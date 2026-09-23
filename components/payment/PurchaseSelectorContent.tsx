"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useRegionalCheckout } from "@/lib/payment/useRegionalCheckout";
import type { UsPlanId } from "@/lib/payment/usPricing";
import type { KrPlanId } from "@/lib/payment/krPricing";

export type PurchaseContext = "personal" | "relationship" | "account";

type RegionalPlanId = UsPlanId | KrPlanId;

/**
 * Fixed per-region catalog exposure -- deliberately NOT "every key of
 * US_PLANS/KR_PLANS minus one exclusion". US and KR are two completely
 * separate, hand-listed arrays so neither region can ever surface the
 * other's catalog, or a US-only concept like Annual Membership, on
 * screen -- regardless of what gets added to usPricing.ts/krPricing.ts
 * later. us_additional_relationship is deliberately left out of both:
 * it is eligibility-gated and rendered separately below, exactly like
 * the existing /pricing page (components/pricing/RegionalPricingCards.tsx).
 */
const US_CATALOG: UsPlanId[] = [
  "us_personal_premium",
  "us_relationship_premium",
  "us_insight_pass_30d",
  "us_annual_membership",
];
const KR_CATALOG: KrPlanId[] = [
  "kr_personal_premium",
  "kr_relationship_premium",
  "kr_insight_pass_30d",
  "kr_relationship_triple",
];

/**
 * Context-aware primary plan. Deliberately never falls back to Personal
 * for "account": a visitor who lands here without an active Annual
 * membership is shown Annual itself; one who already has it and has used
 * this cycle's 2 included Relationship credits (additionalEligible) is
 * shown the Additional Relationship top-up instead. KR has no membership
 * concept at all, so "account" falls back to Relationship there, never to
 * a US-only plan.
 */
function primaryPlanFor(
  context: PurchaseContext,
  region: "us" | "kr",
  additionalEligible: boolean,
): RegionalPlanId {
  if (context === "account") {
    if (region === "kr") return "kr_relationship_premium";
    return additionalEligible ? "us_additional_relationship" : "us_annual_membership";
  }
  if (context === "relationship") {
    return region === "us" ? "us_relationship_premium" : "kr_relationship_premium";
  }
  return region === "us" ? "us_personal_premium" : "kr_personal_premium";
}

/**
 * The reusable purchase UI: same regional catalog, same
 * useRegionalCheckout hook, same checkout prepare/complete API and
 * entitlement logic as the standalone /pricing page -- only the plan
 * ORDER and which single plan is highlighted change based on `context`.
 * Rendered as-is inside PurchaseSelectorModal (a dialog) or
 * PurchaseSelectorPage (a full-page shell); this component itself knows
 * nothing about which one it's in.
 */
export default function PurchaseSelectorContent({
  context,
  onSuccess,
}: {
  context: PurchaseContext;
  /** Called once per successful purchase (success or already_processed), before any close/navigate the caller wants to do. */
  onSuccess?: (planId: string) => void;
}) {
  const { locale, messages } = useLocale();
  const { isSignedIn } = useUser();
  const copy = messages.pricing.regionalPlans;
  const { busy, openCheckout, isLoaded: authLoaded } = useRegionalCheckout();
  const [result, setResult] = useState<Record<string, "success" | "error">>({});
  const [additionalEligible, setAdditionalEligible] = useState(false);

  const region: "us" | "kr" = locale === "en-US" ? "us" : "kr";
  const catalog = region === "us" ? US_CATALOG : KR_CATALOG;

  useEffect(() => {
    if (region !== "us" || !isSignedIn) {
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
  }, [region, isSignedIn]);

  const primaryPlanId = useMemo(
    () => primaryPlanFor(context, region, additionalEligible),
    [context, region, additionalEligible],
  );

  const alternativePlanIds = catalog.filter((id) => id !== primaryPlanId);
  // Only ever a separate card when it isn't already the primary (account
  // context can make it the primary itself -- see primaryPlanFor).
  const showAdditionalRelationshipCard =
    region === "us" && additionalEligible && primaryPlanId !== "us_additional_relationship";

  async function handleCheckout(planId: string) {
    if (!authLoaded) return;
    setResult((prev) => ({ ...prev, [planId]: undefined as unknown as "success" }));
    const outcome = await openCheckout(planId, locale);
    if (outcome === "success" || outcome === "already_processed") {
      setResult((prev) => ({ ...prev, [planId]: "success" }));
      onSuccess?.(planId);
    } else if (outcome === "error" || outcome === "ineligible") {
      setResult((prev) => ({ ...prev, [planId]: "error" }));
    }
  }

  const title =
    context === "relationship"
      ? messages.pricing.selectorTitleRelationship
      : context === "account"
        ? messages.pricing.selectorTitleAccount
        : messages.pricing.selectorTitlePersonal;

  function renderCard(planId: RegionalPlanId, primary: boolean) {
    const plan = copy[planId as keyof typeof copy];
    if (!plan) return null;
    return (
      <article
        key={planId}
        className={[
          "relative flex flex-col overflow-hidden rounded-3xl border bg-[#FFFDF8] p-6 shadow-[0_10px_30px_rgba(26,51,40,0.05)] transition duration-300",
          primary ? "border-2 border-[#3A8F6E] sm:col-span-2" : "border-[#D4CFC4] hover:-translate-y-1",
        ].join(" ")}
      >
        {primary ? (
          <span className="mb-2 inline-block w-fit rounded-full bg-[#3A8F6E] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
            {messages.pricing.selectorPrimaryBadge}
          </span>
        ) : null}
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3A8F6E]">{plan.name}</p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight text-[#1A3328]">{plan.price}</span>
          {plan.period ? <span className="text-sm font-medium text-[#4A5C52]">{plan.period}</span> : null}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[#4A5C52]">{plan.tagline}</p>
        <ul className="mt-6 flex-1 space-y-3">
          {plan.features.map((feature: string) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#1A3328]">
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
          disabled={busy || !authLoaded}
          onClick={() => void handleCheckout(planId)}
          className={[
            "mt-6 w-full cursor-pointer rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98]",
            primary
              ? "bg-[#3A8F6E] text-white hover:bg-[#33805f]"
              : "border border-[#1A3328]/30 bg-[#FFFDF8] text-[#1A3328] hover:bg-[#F5F0E8]",
            busy || !authLoaded ? "cursor-not-allowed opacity-60" : "",
          ].join(" ")}
        >
          {plan.cta}
        </button>
      </article>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="stitch-headline text-2xl font-bold text-[#1A3328]">{title}</h2>

      <div className="grid gap-5 sm:grid-cols-2">{renderCard(primaryPlanId, true)}</div>

      {alternativePlanIds.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4A5C52]">
            {messages.pricing.selectorAlternativesHeading}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {alternativePlanIds.map((id) => renderCard(id, false))}
          </div>
        </div>
      ) : null}

      {showAdditionalRelationshipCard ? (
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
              disabled={busy || !authLoaded}
              onClick={() => void handleCheckout("us_additional_relationship")}
              className={[
                "cursor-pointer rounded-full border border-[#1A3328]/30 bg-[#FFFDF8] px-5 py-2.5 text-sm font-semibold text-[#1A3328] shadow-sm transition-all duration-200 hover:bg-[#F5F0E8] active:scale-[0.98]",
                busy || !authLoaded ? "cursor-not-allowed opacity-60" : "",
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
