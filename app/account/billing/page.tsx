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
  status: string;
  currentTermStart: string;
  currentTermEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelRequestedAt: string | null;
};

type LoadState = "loading" | "loaded" | "error";

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
  }

  return (
    <AccountPageShell
      activeTab="billing"
      title={copy.billingLabel}
      subtitle={copy.billingSubtitle}
    >
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
          </div>
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
