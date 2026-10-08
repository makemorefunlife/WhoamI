"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useUser } from "@clerk/nextjs";
import { createPortal } from "react-dom";
import { Check, Info, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { UsPlanId } from "@/lib/payment/usPricing";
import type { KrPlanId } from "@/lib/payment/krPricing";
import { redeemReasonCopy } from "@/lib/redeem/reasonCopy";
import type { RegionalPlanCopy } from "@/lib/i18n/messages/en-US";
import PlanIllustration, { planArtKindFor } from "@/components/payment/PlanIllustration";
import { isCheckoutEnabled, isGuestTossPlan, isGuestUsePlan } from "@/lib/payment/tossCatalog";
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
 * the existing /pricing page.
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
 * The reusable purchase UI: same regional catalog, same Toss checkout
 * (useTossCheckout -> /api/payments/toss/*) and entitlement logic as the
 * standalone /pricing page -- only the plan
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
  /** Called after a successful in-place unlock (redeem code). Toss purchases return via successRedirectPath instead. */
  onSuccess?: (planId: string) => void;
  /**
   * Optional explicit post-purchase destination: the Toss success page
   * returns the buyer here after the server confirms the payment. Leave unset
   * for contexts (relationship, account, generic /pricing) with no single
   * specific "come back here" page.
   */
  successRedirectPath?: string;
}) {
  const { locale, messages, href: localizeHref } = useLocale();
  const { isSignedIn, isLoaded: authLoaded } = useUser();
  const copy = messages.pricing.regionalPlans;
  // 2026-10-07: every purchase goes through the Toss payment window (test
  // keys until launch). The previous checkout provider is no longer wired into
  // this UI. KR plans are on sale (KRW); US plans stay disabled until US
  // payments are ready (NEXT_PUBLIC_US_CHECKOUT_ENABLED + a contract-confirmed
  // TOSS_USD_PAYMENT_METHOD) -- see lib/payment/tossCatalog.ts.
  const { busy, startTossCheckout } = useTossCheckout();
  const usCheckoutEnabled = process.env.NEXT_PUBLIC_US_CHECKOUT_ENABLED === "true";
  const canBuy = (planId: string) => isCheckoutEnabled(planId, usCheckoutEnabled);
  const [planNotice, setPlanNotice] = useState<Record<string, string>>({});
  // Signed-out Toss purchase (KR plans): email + consent, then pay; the
  // purchase is claimed into an account after the email is verified.
  const [guestFormPlan, setGuestFormPlan] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestAgreed, setGuestAgreed] = useState(false);
  // Account products (Relationship / Triple / 30-day pass): the guest form
  // opens after "buy as a guest" is chosen next to "log in and buy".
  const [guestChosen, setGuestChosen] = useState(false);
  // Came back from "quick sign-in" with ?checkout=<planId>: offer to continue
  // the same plan's payment (same page, same locale).
  const [resumePlan, setResumePlan] = useState<string | null>(null);
  useEffect(() => {
    if (!authLoaded || !isSignedIn) return;
    const url = new URL(window.location.href);
    const planId = url.searchParams.get("checkout");
    if (!planId) return;
    url.searchParams.delete("checkout");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
    // Deferred like the other effects here (no synchronous setState in an effect).
    const timer = setTimeout(() => {
      if (isCheckoutEnabled(planId, process.env.NEXT_PUBLIC_US_CHECKOUT_ENABLED === "true")) setResumePlan(planId);
    }, 0);
    return () => clearTimeout(timer);
  }, [authLoaded, isSignedIn]);

  // "Quick sign-in": Clerk sign-in, then back to this page with the plan kept.
  function signInHrefFor(planId: string): string {
    const back = new URL(window.location.href);
    back.searchParams.set("checkout", planId);
    return `${localizeHref(ROUTES.signIn)}?${new URLSearchParams({
      redirect_url: `${back.pathname}${back.search}`,
    }).toString()}`;
  }

  // Esc closes the guest-checkout popup only (capture phase + stop, so an
  // enclosing PurchaseSelectorModal does not close at the same time).
  useEffect(() => {
    if (!guestFormPlan && !resumePlan) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      if (busy) return;
      setGuestFormPlan(null);
      setResumePlan(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [guestFormPlan, resumePlan, busy]);
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
    region === "us" &&
    additionalEligible &&
    primaryPlanId !== "us_additional_relationship" &&
    canBuy("us_additional_relationship");

  async function handleCheckout(planId: string) {
    if (!authLoaded) return;
    setPlanNotice((prev) => ({ ...prev, [planId]: "" }));
    if (!canBuy(planId)) {
      setPlanNotice((prev) => ({ ...prev, [planId]: messages.payments.usCheckoutComingSoon }));
      return;
    }
    {
      if (!isSignedIn) {
        // Checkout modal: sign in, or (guest-eligible plans) pay as a guest.
        setPlanNotice((prev) => ({ ...prev, [planId]: "" }));
        setGuestAgreed(false);
        setGuestChosen(false);
        setGuestFormPlan(planId);
        return;
      }
      setResumePlan(null);
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
    }
  }

  async function handleGuestCheckout(planId: string) {
    if (isSignedIn) {
      setGuestFormPlan(null);
      await handleCheckout(planId);
      return;
    }
    if (!guestAgreed || !guestEmail.trim()) {
      setPlanNotice((prev) => ({ ...prev, [planId]: messages.payments.guestRequiredConsentMissing }));
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

  function closeGuestCheckout() {
    if (busy) return;
    setGuestFormPlan(null);
    setResumePlan(null);
  }

  /**
   * Checkout modal.
   *  - signed out: "quick sign-in" (back to this page with the plan kept) and,
   *    for guest-eligible plans, "or pay as a guest" (email + required
   *    agreement + refund notice + terms / refund / privacy links);
   *  - signed in after quick sign-in: "continue to payment" for the same plan.
   */
  function renderCheckoutModal() {
    const planId = isSignedIn ? resumePlan : guestFormPlan;
    if (!planId || typeof document === "undefined") return null;
    const plan: RegionalPlanCopy | undefined = copy[planId as keyof typeof copy];
    if (!plan) return null;
    const t = messages.payments;
    const guestAllowed = !isSignedIn && isGuestTossPlan(planId);
    const linkCls = "underline underline-offset-2";
    return createPortal(
      <div
        className="fixed inset-0 z-[300] flex items-end justify-center bg-[#1A3328]/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        onClick={closeGuestCheckout}
      >
        <div
          className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-[#D4CFC4] bg-[#FFFDF8] p-5 text-left shadow-[0_24px_48px_rgba(26,51,40,0.22)] sm:rounded-3xl sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p id="checkout-modal-title" className="text-base font-bold text-[#1A3328]">
                {plan.name}
              </p>
              <p className="mt-1 text-sm text-[#4A5C52]">
                <span className="font-semibold text-[#1A3328]">{plan.price}</span>
                {plan.period ? ` ${plan.period}` : ""}
              </p>
              {plan.validityNotes?.length ? (
                <p className="mt-1 text-xs text-[#4A5C52]">{plan.validityNotes.join(" · ")}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={closeGuestCheckout}
              className="-mr-1 rounded-full p-2 text-[#4A5C52] hover:bg-[#F5F0E8]"
              aria-label={messages.common.close}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isSignedIn ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold text-[#1A3328]">{t.resumeTitle}</p>
              {planNotice[planId] ? (
                <p role="status" className="text-[12px] font-medium text-amber-700">{planNotice[planId]}</p>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleCheckout(planId)}
                className="w-full rounded-full bg-[#3A8F6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#33805f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t.continueToPayment}
              </button>
            </div>
          ) : guestAllowed && !isGuestUsePlan(planId) && !guestChosen ? (
            // Relationship / Triple / 30-day pass: buyable without an account;
            // an account is needed when it's used. Log-in keeps plan + language
            // (?checkout=<planId> on the same localized page).
            <div className="mt-5 space-y-3">
              <p className="rounded-2xl border border-[#3A8F6E]/30 bg-[#EAF4EF] p-4 text-sm leading-relaxed text-[#1A3328]">
                {t.prePurchase.accountProductNotice}
              </p>
              <a
                href={signInHrefFor(planId)}
                className="flex w-full items-center justify-center rounded-full bg-[#3A8F6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#33805f]"
              >
                {t.prePurchase.signInAndBuyCta}
              </a>
              <button
                type="button"
                onClick={() => setGuestChosen(true)}
                className="w-full rounded-full border border-[#1A3328]/30 bg-[#FFFDF8] px-5 py-3 text-sm font-semibold text-[#1A3328] transition hover:bg-[#F5F0E8]"
              >
                {t.prePurchase.guestBuyCta}
              </button>
            </div>
          ) : (
            <>
              {isGuestUsePlan(planId) || !guestAllowed ? (
                <div className="mt-5 rounded-2xl border border-[#3A8F6E]/30 bg-[#EAF4EF] p-4">
                  <p className="text-sm font-semibold leading-relaxed text-[#1A3328]">{t.loginPrompt}</p>
                  <a
                    href={signInHrefFor(planId)}
                    className="mt-3 flex w-full items-center justify-center rounded-full bg-[#3A8F6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#33805f]"
                  >
                    {t.quickSignIn}
                  </a>
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-[#3A8F6E]/30 bg-[#EAF4EF] p-4 text-sm leading-relaxed text-[#1A3328]">
                  {t.prePurchase.accountProductNotice}
                </p>
              )}

              {guestAllowed ? (
                <div className="mt-5 space-y-3">
                  <p className="text-sm font-bold text-[#1A3328]">{t.guestSectionTitle}</p>
                  <AccountNeedLine planId={planId} />
                  <label className="block text-xs font-medium text-[#4A5C52]">
                    {t.guestEmailLabelGuide}
                    <input
                      type="email"
                      autoComplete="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#D4CFC4] bg-white px-3 py-2.5 text-sm text-[#1A3328]"
                    />
                  </label>
                  <GuestSignupNotice text={isGuestUsePlan(planId) ? t.guestUse.modalDescription : t.guestDescription} />
                  <label className="flex items-start gap-2 text-sm leading-relaxed text-[#1A3328]">
                    <input
                      type="checkbox"
                      checked={guestAgreed}
                      onChange={(e) => setGuestAgreed(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#3A8F6E]"
                    />
                    <span>{t.guestRequiredConsent}</span>
                  </label>
                  <p className="rounded-xl bg-[#F5F0E8] px-3.5 py-2.5 text-xs leading-relaxed text-[#4A5C52]">{t.refundNotice}</p>
                  <p className="flex flex-wrap gap-x-3 text-xs text-[#3A8F6E]">
                    <LocaleLink href={ROUTES.terms} target="_blank" rel="noopener" className={linkCls}>{messages.footer.terms}</LocaleLink>
                    <LocaleLink href={ROUTES.refund} target="_blank" rel="noopener" className={linkCls}>{messages.footer.refund}</LocaleLink>
                    <LocaleLink href={ROUTES.privacy} target="_blank" rel="noopener" className={linkCls}>{messages.footer.privacy}</LocaleLink>
                  </p>
                  {planNotice[planId] ? (
                    <p role="status" className="text-[12px] font-medium text-amber-700">{planNotice[planId]}</p>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleGuestCheckout(planId)}
                    className="w-full rounded-full border border-[#1A3328]/30 bg-[#FFFDF8] px-5 py-3 text-sm font-semibold text-[#1A3328] transition hover:bg-[#F5F0E8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t.guestPayCta}
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-xs leading-relaxed text-[#4A5C52]">{t.signInRequired}</p>
              )}
            </>
          )}
        </div>
      </div>,
      document.body,
    );
  }

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
        {!isSignedIn && isGuestTossPlan(planId) && canBuy(planId) ? (
          <AccountNeedLine planId={planId} className="mt-4" />
        ) : null}
        {planNotice[planId] && guestFormPlan !== planId ? (
          <p role="status" className="mt-4 text-[12px] font-medium text-amber-700">
            {planNotice[planId]}
          </p>
        ) : null}
        <button
            type="button"
            disabled={busy || !authLoaded || !canBuy(planId)}
            onClick={() => void handleCheckout(planId)}
            className={[
              "mt-6 w-full cursor-pointer rounded-full px-5 py-3 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98]",
              primary
                ? "bg-[#3A8F6E] text-white hover:bg-[#33805f]"
                : "border border-[#1A3328]/30 bg-[#FFFDF8] text-[#1A3328] hover:bg-[#F5F0E8]",
              busy || !authLoaded || !canBuy(planId) ? "cursor-not-allowed opacity-60" : "",
            ].join(" ")}
          >
            {canBuy(planId) ? plan.cta : messages.payments.usCheckoutComingSoon}
          </button>
      </article>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="stitch-headline text-2xl font-bold text-[#1A3328]">{title}</h2>
      {renderCheckoutModal()}

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

/**
 * Shown to signed-out buyers right above a guest-eligible pay button, so the
 * "sign up / sign in with the same email and verify it" step is clear BEFORE
 * paying. Display only -- no effect on checkout or entitlement logic.
 */
/** Before payment: states whether the product needs an account (per product). */
function AccountNeedLine({ planId, className = "" }: { planId: string; className?: string }) {
  const { messages } = useLocale();
  const none = isGuestUsePlan(planId);
  return (
    <p
      className={[
        "rounded-xl border px-3 py-2 text-xs font-semibold leading-relaxed",
        none ? "border-[#3A8F6E]/30 bg-[#EAF4EF] text-[#1A3328]" : "border-[#C98A2C]/40 bg-[#FBF3E6] text-[#7A4E12]",
        className,
      ].join(" ")}
    >
      {none ? messages.payments.accountNeedNone : messages.payments.accountNeedRequired}
    </p>
  );
}

function GuestSignupNotice({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div
      role="note"
      className={[
        "flex items-start gap-2.5 rounded-xl border border-[#C2412D]/35 bg-[#FBEDEA] px-3.5 py-3",
        className,
      ].join(" ")}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#C2412D]" aria-hidden="true" />
      <p className="text-sm font-semibold leading-relaxed text-[#A3301F]">{text}</p>
    </div>
  );
}
