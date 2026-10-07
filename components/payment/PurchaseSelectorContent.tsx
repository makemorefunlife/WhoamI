"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useUser } from "@clerk/nextjs";
import { Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useRegionalCheckout } from "@/lib/payment/useRegionalCheckout";
import type { UsPlanId } from "@/lib/payment/usPricing";
import type { KrPlanId } from "@/lib/payment/krPricing";
import { redeemReasonCopy } from "@/lib/redeem/reasonCopy";
import type { RegionalPlanCopy } from "@/lib/i18n/messages/en-US";
import PlanIllustration, { planArtKindFor } from "@/components/payment/PlanIllustration";
import { isGuestTossPlan, isTossPlan } from "@/lib/payment/tossCatalog";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useTossCheckout } from "@/lib/payment/useTossCheckout";
import { ROUTES } from "@/constants/routes";

export type PurchaseContext = "personal" | "relationship" | "account";

type RegionalPlanId = UsPlanId | KrPlanId;

const PASS_PLAN_IDS: readonly RegionalPlanId[] = ["us_insight_pass_30d", "kr_insight_pass_30d"];

type EntitlementsSummary = {
  personal: { remaining: number };
  relationship: { remaining: number };
};

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
  successRedirectPath,
}: {
  context: PurchaseContext;
  /** Called once per successful purchase (success or already_processed), before any close/navigate the caller wants to do. */
  onSuccess?: (planId: string) => void;
  /**
   * Optional explicit post-purchase destination, forwarded as-is to
   * useRegionalCheckout's opts.successRedirectPath (see its doc comment).
   * Fallback/parallel path only -- the onSuccess callback above is still
   * the primary way a caller reacts to a successful purchase. Leave unset
   * for contexts (relationship, account, generic /pricing) with no single
   * specific "come back here" page.
   */
  successRedirectPath?: string;
}) {
  const { locale, messages } = useLocale();
  const { isSignedIn } = useUser();
  const copy = messages.pricing.regionalPlans;
  const { busy: regionalBusy, openCheckout, isLoaded: authLoaded } = useRegionalCheckout();
  // The 12-Month Membership is a one-time Toss purchase (see
  // lib/payment/tossCatalog.ts); every other plan keeps the existing checkout.
  const { busy: tossBusy, startTossCheckout } = useTossCheckout();
  const busy = regionalBusy || tossBusy;
  const [planNotice, setPlanNotice] = useState<Record<string, string>>({});
  // Signed-out Toss purchase (KR plans): email + consent, then pay; the
  // purchase is claimed into an account after the email is verified.
  const [guestFormPlan, setGuestFormPlan] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestAgreed, setGuestAgreed] = useState(false);
  const [result, setResult] = useState<Record<string, "success" | "error" | "review">>({});
  const [additionalEligible, setAdditionalEligible] = useState(false);
  const [entitlements, setEntitlements] = useState<EntitlementsSummary | null>(null);

  // "Have a gift or promo code?" -- Personal only (current gift/tester codes
  // grant Personal x1 only; see /api/redeem). A compact, secondary entry
  // point into the SAME /api/redeem backend the standalone /redeem page
  // already uses -- never a second coupon system.
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemState, setRedeemState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [redeemErrorReason, setRedeemErrorReason] = useState<string | null>(null);
  const [redeemKind, setRedeemKind] = useState<"gift" | "tester" | null>(null);

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

  useEffect(() => {
    // Informational only, non-blocking (see product rule: an overlapping
    // stronger entitlement must never hard-block a purchase). Not fetched
    // for "account" -- that context has no single matching analysis type to
    // warn about.
    if (context === "account" || !isSignedIn) {
      setEntitlements(null);
      return;
    }
    let cancelled = false;
    fetch("/api/account/entitlements")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: EntitlementsSummary | null) => {
        if (!cancelled) setEntitlements(body);
      })
      .catch(() => {
        if (!cancelled) setEntitlements(null);
      });
    return () => {
      cancelled = true;
    };
  }, [context, isSignedIn]);

  const alreadyHasAccessNotice =
    context === "personal" && (entitlements?.personal.remaining ?? 0) > 0
      ? messages.pricing.selectorAlreadyHaveAccessPersonal
      : context === "relationship" && (entitlements?.relationship.remaining ?? 0) > 0
        ? messages.pricing.selectorAlreadyHaveAccessRelationship
        : null;

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
    setPlanNotice((prev) => ({ ...prev, [planId]: "" }));
    if (isTossPlan(planId)) {
      if (!isSignedIn) {
        if (isGuestTossPlan(planId)) {
          setGuestFormPlan(planId);
        } else {
          setPlanNotice((prev) => ({ ...prev, [planId]: messages.payments.signInRequired }));
        }
        return;
      }
      // Leaves the page on success (Toss redirects to /checkout/toss/success,
      // which confirms server-side and then returns the buyer here).
      const tossOutcome = await startTossCheckout(planId, locale, {
        returnPath: successRedirectPath ?? ROUTES.accountBilling,
      });
      const notice =
        tossOutcome === "already_member"
          ? messages.payments.tossAlreadyMember
          : tossOutcome === "not_configured"
            ? messages.payments.tossNotConfigured
            : tossOutcome === "error"
              ? messages.payments.tossStartError
              : "";
      if (notice) setPlanNotice((prev) => ({ ...prev, [planId]: notice }));
      return;
    }
    const outcome = await openCheckout(planId, locale, { successRedirectPath });
    if (outcome === "success" || outcome === "already_processed") {
      setResult((prev) => ({ ...prev, [planId]: "success" }));
      onSuccess?.(planId);
    } else if (outcome === "needs_review") {
      setResult((prev) => ({ ...prev, [planId]: "review" }));
    } else if (outcome === "error" || outcome === "ineligible") {
      setResult((prev) => ({ ...prev, [planId]: "error" }));
    }
  }

  async function handleGuestCheckout(planId: string) {
    if (!guestAgreed || !guestEmail.trim()) {
      setPlanNotice((prev) => ({ ...prev, [planId]: messages.payments.guestConsentRequired }));
      return;
    }
    setPlanNotice((prev) => ({ ...prev, [planId]: "" }));
    const outcome = await startTossCheckout(planId, locale, {
      guestEmail: guestEmail.trim(),
      agreedToTerms: true,
    });
    const notice =
      outcome === "invalid_email"
        ? messages.payments.guestEmailInvalid
        : outcome === "not_configured"
          ? messages.payments.tossNotConfigured
          : outcome === "sign_in_required"
            ? messages.payments.signInRequired
            : outcome === "error"
              ? messages.payments.tossStartError
              : "";
    if (notice) setPlanNotice((prev) => ({ ...prev, [planId]: notice }));
  }

  /**
   * Same "unlock -> resume" contract as a successful purchase: whatever
   * onSuccess already does for this context (essence/deep's handlePurchaseSuccess
   * closes the modal and calls retry(), which re-fetches the SAME Deep
   * report now that a Personal credit exists -- see useSlimV1Integrated.ts;
   * StitchPremiumCard's handlePurchaseSuccess closes and navigates to the
   * report, whose own mount-time fetch then picks up the new credit) fires
   * unchanged here. This is deliberately the ONLY place a redeemed code
   * hooks into the rest of the app -- no second "resume analysis" path.
   */
  async function submitRedeemCode(e: FormEvent) {
    e.preventDefault();
    if (redeemState === "submitting") return;
    const trimmed = redeemCode.trim();
    if (!trimmed) {
      setRedeemState("error");
      setRedeemErrorReason("missing_code");
      return;
    }
    setRedeemState("submitting");
    setRedeemErrorReason(null);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        reason?: string;
        kind?: "gift" | "tester";
      };
      if (!res.ok || !body.ok) {
        setRedeemState("error");
        setRedeemErrorReason(body.reason ?? "error");
        return;
      }
      setRedeemState("success");
      setRedeemKind(body.kind ?? null);
    } catch {
      setRedeemState("error");
      setRedeemErrorReason("error");
    }
  }

  // Brief, un-clickable success flash ("short success state", per spec)
  // before handing off to the caller's own onSuccess -- exactly the same
  // hook a real purchase already uses. The delay is what makes the flash
  // visible at all: onSuccess closes the modal (essence/deep,
  // StitchPremiumCard) synchronously, so calling it immediately would
  // never let the user see the confirmation. Cleared on unmount (modal
  // closed manually mid-flash) so a redeem never fires onSuccess after the
  // selector is already gone.
  useEffect(() => {
    if (redeemState !== "success") return;
    const timer = setTimeout(() => {
      onSuccess?.(redeemKind ? `redeem:${redeemKind}` : "redeem");
    }, 1100);
    return () => clearTimeout(timer);
  }, [redeemState, redeemKind, onSuccess]);

  const title =
    context === "relationship"
      ? messages.pricing.selectorTitleRelationship
      : context === "account"
        ? messages.pricing.selectorTitleAccount
        : messages.pricing.selectorTitlePersonal;

  function renderCard(planId: RegionalPlanId, primary: boolean) {
    const plan: RegionalPlanCopy | undefined = copy[planId as keyof typeof copy];
    if (!plan) return null;
    const artKind = planArtKindFor(planId);
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
            {context === "personal" || context === "relationship"
              ? messages.pricing.selectorSelectedBadge
              : messages.pricing.selectorPrimaryBadge}
          </span>
        ) : PASS_PLAN_IDS.includes(planId) ? (
          <span className="mb-2 inline-block w-fit rounded-full bg-[#C98A2C] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
            {messages.pricing.selectorBestValueBadge}
          </span>
        ) : null}
        {artKind ? <PlanIllustration kind={artKind} className="mb-4" /> : null}
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3A8F6E]">{plan.name}</p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight text-[#1A3328]">{plan.price}</span>
          {plan.period ? <span className="text-sm font-medium text-[#4A5C52]">{plan.period}</span> : null}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[#4A5C52]">{plan.tagline}</p>
        {plan.savingsNote ? (
          <p className="mt-1 text-xs font-semibold text-[#3A8F6E]">{plan.savingsNote}</p>
        ) : null}
        <ul className="mt-6 flex-1 space-y-3">
          {plan.features.map((feature: string) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#1A3328]">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3A8F6E]" />
              {feature}
            </li>
          ))}
        </ul>
        {plan.validityNotes?.length ? (
          <div className="mt-5 space-y-1 rounded-xl bg-[#F5F0E8] px-3.5 py-2.5">
            {plan.validityNotes.map((note) => (
              <p key={note} className="text-xs leading-relaxed text-[#4A5C52]">
                {note}
              </p>
            ))}
          </div>
        ) : null}
        {planNotice[planId] ? (
          <p role="status" className="mt-4 text-[12px] font-medium text-amber-700">
            {planNotice[planId]}
          </p>
        ) : null}
        {result[planId] === "success" ? (
          <p className="mt-4 text-[12px] font-medium text-emerald-700">
            {messages.paymentRefund.betaSandboxSuccess}
          </p>
        ) : result[planId] === "review" ? (
          <p className="mt-4 text-[12px] font-medium text-amber-700">
            {messages.paymentRefund.checkoutNeedsReview}
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
        {guestFormPlan === planId && !isSignedIn ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-[#D4CFC4] bg-[#F5F0E8]/60 p-4 text-left">
            <p className="text-sm font-semibold text-[#1A3328]">{messages.payments.guestCheckoutTitle}</p>
            <label className="block text-xs font-medium text-[#4A5C52]">
              {messages.payments.guestEmailLabel}
              <input
                type="email"
                autoComplete="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#D4CFC4] bg-[#FFFDF8] px-3 py-2 text-sm text-[#1A3328]"
              />
            </label>
            <p className="text-[11px] leading-relaxed text-[#4A5C52]">{messages.payments.guestEmailHint}</p>
            <label className="flex items-start gap-2 text-[11px] leading-relaxed text-[#1A3328]">
              <input
                type="checkbox"
                checked={guestAgreed}
                onChange={(e) => setGuestAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#3A8F6E]"
              />
              <span>{messages.payments.guestConsentLabel}</span>
            </label>
            <p className="flex flex-wrap gap-x-3 text-[11px] text-[#3A8F6E]">
              <LocaleLink href={ROUTES.terms} className="underline underline-offset-2">{messages.footer.terms}</LocaleLink>
              <LocaleLink href={ROUTES.privacy} className="underline underline-offset-2">{messages.footer.privacy}</LocaleLink>
              <LocaleLink href={ROUTES.refund} className="underline underline-offset-2">{messages.footer.refund}</LocaleLink>
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleGuestCheckout(planId)}
              className="w-full rounded-full bg-[#3A8F6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#33805f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {messages.payments.guestPayCta}
            </button>
            <p className="text-[11px] text-[#4A5C52]">
              {messages.payments.guestOrSignIn}{" "}
              <LocaleLink href={ROUTES.signIn} className="font-semibold text-[#3A8F6E] underline underline-offset-2">
                {messages.nav.signIn}
              </LocaleLink>
            </p>
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="stitch-headline text-2xl font-bold text-[#1A3328]">{title}</h2>

      {alreadyHasAccessNotice ? (
        <p className="rounded-xl border border-[#D4CFC4] bg-[#F5F0E8] px-4 py-2.5 text-xs leading-relaxed text-[#4A5C52]">
          {alreadyHasAccessNotice}
        </p>
      ) : null}

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
            {copy.us_additional_relationship.validityNotes?.map((note) => (
              <p key={note} className="mt-1 text-xs text-[#4A5C52]/80">
                {note}
              </p>
            ))}
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

      {context === "personal" && isSignedIn ? (
        <div className="rounded-2xl border border-[#D4CFC4] bg-[#F5F0E8]/60 p-4">
          {redeemState === "success" ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-emerald-700">{messages.redeem.successTitle}</p>
              <p className="mt-1 text-xs text-[#4A5C52]">{messages.redeem.appliedSuccessfully}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[#4A5C52]">{messages.redeem.haveCodeToggle}</p>
                <button
                  type="button"
                  onClick={() => setRedeemOpen((v) => !v)}
                  className="shrink-0 text-sm font-semibold text-[#3A8F6E] underline-offset-2 hover:underline"
                >
                  {messages.redeem.enterCodeCta}
                </button>
              </div>
              {redeemOpen ? (
                <form onSubmit={submitRedeemCode} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    placeholder={messages.redeem.codeInputPlaceholder}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={redeemState === "submitting"}
                    className="flex-1 rounded-xl border border-[#D4CFC4] bg-[#FFFDF8] px-3 py-2 text-sm text-[#1A3328] disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={redeemState === "submitting"}
                    className="shrink-0 rounded-xl bg-[#3A8F6E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#33805f] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {redeemState === "submitting" ? messages.redeem.submitting : messages.redeem.applyCta}
                  </button>
                </form>
              ) : null}
              {redeemState === "error" ? (
                <p role="alert" className="mt-2 text-xs text-rose-700">
                  {redeemReasonCopy(redeemErrorReason, messages.redeem)}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
