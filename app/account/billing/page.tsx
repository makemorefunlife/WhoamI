"use client";

import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import AccountPageShell from "@/components/account/AccountPageShell";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatDecisionDate } from "@/lib/decision/format";
import PurchaseSelectorModal from "@/components/payment/PurchaseSelectorModal";

type MembershipInfo = {
  planId: string;
  planPriceUsd: number | null;
  /** "one_time_12m" = $280 once, 12 months, no renewal. "legacy_recurring" = legacy auto-renewing purchase (original terms kept). */
  billingModel: "one_time_12m" | "legacy_recurring";
  status: string;
  currentTermStart: string;
  currentTermEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelRequestedAt: string | null;
};

type LoadState = "loading" | "loaded" | "error";

type CreditSummary = { remaining: number; soonestExpiresAt: string | null };
type JournalSummary = { unlimited: boolean; unlimitedUntil: string | null; unlimitedSource: string | null };
type PersonalGiftEntry = { code: string; status: "available" | "claimed" | "expired" };
type EntitlementsInfo = {
  personal: CreditSummary;
  relationship: CreditSummary;
  journal: JournalSummary;
  personalGifts: PersonalGiftEntry[];
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
function isExpiringSoon(iso: string | null): boolean {
  if (!iso) return false;
  const diffMs = new Date(iso).getTime() - Date.now();
  return diffMs > 0 && diffMs <= SEVEN_DAYS_MS;
}

export default function AccountBillingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { messages, href, locale } = useLocale();
  const copy = messages.account;

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [membership, setMembership] = useState<MembershipInfo | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [entitlementsState, setEntitlementsState] = useState<LoadState>("loading");
  const [entitlements, setEntitlements] = useState<EntitlementsInfo | null>(null);
  // Transient "Copied!" feedback for a gift's code/link button -- cleared by
  // its own timeout, never persisted; unrelated to entitlementsState.
  const [copiedGift, setCopiedGift] = useState<{ code: string; kind: "code" | "link" } | null>(
    null,
  );

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/account/membership");
        const body = (await res.json().catch(() => ({}))) as {
          membership?: MembershipInfo | null;
        };
        if (cancelled) return;
        if (!res.ok) {
          setLoadState("error");
          return;
        }
        setMembership(body.membership ?? null);
        setLoadState("loaded");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    void (async () => {
      try {
        // Attach any paid guest (signed-out) purchases made with one of this
        // account's verified emails before reading entitlements. Best-effort.
        await fetch("/api/payments/toss/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        }).catch(() => null);
        const res = await fetch("/api/account/entitlements");
        const body = (await res.json().catch(() => null)) as EntitlementsInfo | null;
        if (cancelled) return;
        if (!res.ok || !body) {
          setEntitlementsState("error");
          return;
        }
        setEntitlements(body);
        setEntitlementsState("loaded");
      } catch {
        if (!cancelled) setEntitlementsState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  async function handleConfirmCancel() {
    if (cancelling) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/account/membership/cancel", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        accessUntil?: string;
      };
      if (!res.ok) {
        throw new Error(body.error || copy.billingCancelError);
      }
      setMembership((prev) =>
        prev
          ? {
              ...prev,
              cancelAtPeriodEnd: true,
              currentTermEnd: body.accessUntil ?? prev.currentTermEnd,
            }
          : prev,
      );
      setShowCancelConfirm(false);
    } catch {
      setCancelError(copy.billingCancelError);
    } finally {
      setCancelling(false);
    }
  }

  function flashCopiedGift(code: string, kind: "code" | "link") {
    setCopiedGift({ code, kind });
    setTimeout(() => {
      setCopiedGift((prev) => (prev?.code === code && prev.kind === kind ? null : prev));
    }, 2000);
  }

  async function handleCopyGiftCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      flashCopiedGift(code, "code");
    } catch {
      // Clipboard permission can be denied silently -- no feedback beyond
      // simply not flashing "Copied", matching other best-effort copy UX
      // in this codebase (nothing to recover into here).
    }
  }

  async function handleCopyGiftLink(code: string) {
    try {
      const path = href(`${ROUTES.redeem}?code=${encodeURIComponent(code)}`);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      await navigator.clipboard.writeText(`${origin}${path}`);
      flashCopiedGift(code, "link");
    } catch {
      // Same best-effort reasoning as handleCopyGiftCode.
    }
  }

  if (!isLoaded) {
    return (
      <AccountPageShell activeTab="billing" title={copy.billingLabel}>
        <p className="text-sm text-on-surface-variant">{copy.loading}</p>
      </AccountPageShell>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl={href(ROUTES.accountBilling)} />;
  }

  async function handlePurchaseSuccess() {
    setPurchaseOpen(false);
    try {
      const res = await fetch("/api/account/membership");
      const body = (await res.json().catch(() => ({}))) as {
        membership?: MembershipInfo | null;
      };
      if (res.ok) setMembership(body.membership ?? null);
    } catch {
      // Best-effort refresh -- the purchase itself already succeeded;
      // worst case the user sees the old "no active membership" state
      // until their next visit or manual reload.
    }
    try {
      const res = await fetch("/api/account/entitlements");
      const body = (await res.json().catch(() => null)) as EntitlementsInfo | null;
      if (res.ok && body) {
        setEntitlements(body);
        setEntitlementsState("loaded");
      }
    } catch {
      // Best-effort refresh, same reasoning as above.
    }
  }

  return (
    <AccountPageShell
      activeTab="billing"
      title={copy.billingLabel}
      subtitle={copy.billingSubtitle}
    >
      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
          {copy.myAccessTitle}
        </p>
        <p className="mt-1 text-sm text-on-surface-variant">{copy.myAccessSubtitle}</p>

        {entitlementsState === "loading" ? (
          <p className="mt-4 text-sm text-on-surface-variant">{copy.loading}</p>
        ) : entitlementsState === "error" || !entitlements ? (
          <p className="mt-4 text-sm text-on-surface-variant">{copy.myAccessLoadError}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {(
              [
                { label: copy.myAccessPersonalLabel, credit: entitlements.personal },
                { label: copy.myAccessRelationshipLabel, credit: entitlements.relationship },
              ] as const
            ).map(({ label, credit }) => (
              <div
                key={label}
                className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/70 p-4"
              >
                <p className="text-sm font-medium text-on-surface">{label}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {credit.remaining > 0
                    ? copy.myAccessRemainingCount(credit.remaining)
                    : copy.myAccessNoneRemaining}
                </p>
                {credit.remaining > 0 ? (
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {credit.soonestExpiresAt ? (
                      <>
                        {copy.myAccessExpiresOn(formatDecisionDate(credit.soonestExpiresAt, locale))}
                        {isExpiringSoon(credit.soonestExpiresAt) ? (
                          <span className="ml-1 font-semibold text-amber-700">
                            · {copy.myAccessExpiringSoon}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      copy.myAccessNoExpiry
                    )}
                  </p>
                ) : null}
              </div>
            ))}

            <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/70 p-4">
              <p className="text-sm font-medium text-on-surface">{copy.myAccessJournalLabel}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {entitlements.journal.unlimited && entitlements.journal.unlimitedUntil
                  ? copy.myAccessJournalUnlimitedUntil(
                      formatDecisionDate(entitlements.journal.unlimitedUntil, locale),
                    )
                  : copy.myAccessJournalNormalAllowance}
              </p>
            </div>

            {membership && entitlements.personalGifts.length > 0 ? (
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/70 p-4">
                <p className="text-sm font-medium text-on-surface">{copy.myAccessGiftsTitle}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{copy.myAccessGiftsSubtitle}</p>
                <p className="mt-2 text-xs font-semibold text-secondary">
                  {copy.myAccessGiftsCountAvailable(
                    entitlements.personalGifts.filter((g) => g.status === "available").length,
                  )}
                </p>
                <ul className="mt-3 space-y-2">
                  {entitlements.personalGifts.map((gift) => (
                    <li
                      key={gift.code}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-on-surface">{gift.code}</span>
                        <span
                          className={
                            gift.status === "available"
                              ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                              : gift.status === "claimed"
                                ? "rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                                : "rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600"
                          }
                        >
                          {gift.status === "available"
                            ? copy.myAccessGiftStatusAvailable
                            : gift.status === "claimed"
                              ? copy.myAccessGiftStatusClaimed
                              : copy.myAccessGiftStatusExpired}
                        </span>
                      </div>
                      {gift.status === "available" ? (
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => void handleCopyGiftCode(gift.code)}
                            className="font-semibold text-primary underline-offset-2 hover:underline"
                          >
                            {copiedGift?.code === gift.code && copiedGift.kind === "code"
                              ? copy.myAccessGiftCopiedCode
                              : copy.myAccessGiftCopyCode}
                          </button>
                          <span className="text-on-surface-variant">&middot;</span>
                          <button
                            type="button"
                            onClick={() => void handleCopyGiftLink(gift.code)}
                            className="font-semibold text-primary underline-offset-2 hover:underline"
                          >
                            {copiedGift?.code === gift.code && copiedGift.kind === "link"
                              ? copy.myAccessGiftCopiedLink
                              : copy.myAccessGiftCopyLink}
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        {loadState === "loading" ? (
          <p className="text-sm text-on-surface-variant">{copy.loading}</p>
        ) : loadState === "error" ? (
          <p className="text-sm text-on-surface-variant">{copy.billingLoadError}</p>
        ) : !membership ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {copy.billingNoActiveMembership}
            </p>
            <button
              type="button"
              onClick={() => setPurchaseOpen(true)}
              className="stitch-cta-primary w-full sm:w-auto"
            >
              {copy.billingStartCta}
            </button>
          </div>
        ) : (
          membership.billingModel === "one_time_12m" ? (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                {copy.billingPlanLabel}
              </p>
              <p className="mt-1 text-lg font-semibold text-primary">{copy.billingPlanNameOneTime}</p>
              <p className="mt-0.5 text-sm text-on-surface-variant">{copy.billingPriceOneTime}</p>
            </div>

            <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/70 p-4">
              <p className="text-sm font-medium text-on-surface">{copy.billingStatusActive}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {copy.billingOneTimeValidUntil(formatDecisionDate(membership.currentTermEnd, locale))}
              </p>
            </div>

            <p className="text-xs leading-relaxed text-on-surface-variant">
              {copy.billingOneTimeCancelHelp}{" "}
              <LocaleLink href={ROUTES.refund} className="font-semibold text-primary underline-offset-2 hover:underline">
                {copy.billingRefundPolicyLink}
              </LocaleLink>
            </p>
          </div>
          ) : (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                {copy.billingPlanLabel}
              </p>
              <p className="mt-1 text-lg font-semibold text-primary">
                {copy.billingPlanNameAnnual}
              </p>
              <p className="mt-0.5 text-sm text-on-surface-variant">{copy.billingPriceAnnual}</p>
            </div>

            <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest/70 p-4">
              <p className="text-sm font-medium text-on-surface">
                {membership.cancelAtPeriodEnd
                  ? copy.billingStatusCancelScheduled
                  : copy.billingStatusActive}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {membership.cancelAtPeriodEnd
                  ? copy.billingCancelScheduledNotice(
                      formatDecisionDate(membership.currentTermEnd, locale),
                    )
                  : copy.billingRenewsOnNotice(
                      formatDecisionDate(membership.currentTermEnd, locale),
                    )}
              </p>
            </div>

            {!membership.cancelAtPeriodEnd ? (
              <div>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full rounded-xl border border-rose-500/70 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copy.billingCancelButton}
                </button>
                {cancelError ? (
                  <p className="mt-2 text-xs text-rose-700">{cancelError}</p>
                ) : null}
              </div>
            ) : null}
            <p className="text-xs leading-relaxed text-on-surface-variant">
              {copy.billingLegacyRecurringNote}
            </p>
          </div>
          )
        )}

        <LocaleLink
          href={ROUTES.accountProfile}
          className="stitch-cta-secondary mt-5 inline-flex"
        >
          {copy.backToProfile}
        </LocaleLink>
      </section>

      {showCancelConfirm ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-900">
              {copy.billingCancelConfirmTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {copy.billingCancelConfirmBody}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                {copy.billingCancelConfirmDismiss}
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={() => void handleConfirmCancel()}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 active:scale-[0.99] disabled:opacity-50"
              >
                {cancelling ? copy.billingCancelling : copy.billingCancelConfirmAction}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <PurchaseSelectorModal
        open={purchaseOpen}
        context="account"
        onClose={() => setPurchaseOpen(false)}
        onSuccess={handlePurchaseSuccess}
      />
    </AccountPageShell>
  );
}
