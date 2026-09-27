"use client";

import { useEffect, useState } from "react";
import { User, Users, ArrowRight } from "lucide-react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type CreditSummary = { remaining: number; soonestExpiresAt: string | null };
type JournalSummary = { unlimited: boolean; unlimitedUntil: string | null; unlimitedSource: string | null };
type EntitlementsInfo = {
  personal: CreditSummary;
  relationship: CreditSummary;
  journal: JournalSummary;
};

export default function AccountCreditsSection() {
  const { messages, locale } = useLocale();
  const copy = messages.account;
  const isEn = locale === "en-US";

  const [loading, setLoading] = useState(true);
  const [entitlements, setEntitlements] = useState<EntitlementsInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/account/entitlements");
        const body = (await res.json().catch(() => null)) as EntitlementsInfo | null;
        if (cancelled) return;
        if (res.ok && body) {
          setEntitlements(body);
        }
      } catch {
        // best effort
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/30 pb-4">
        <div>
          <h2 className="stitch-headline text-xl text-primary flex items-center gap-2">
            <span>💳</span>
            <span>{isEn ? "My Credits" : "내 크레딧 현황"}</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">
            {isEn
              ? "Available analysis credits on your account"
              : "현재 계정에 보유 중인 분석 이용권 수량입니다."}
          </p>
        </div>
        <LocaleLink
          href={ROUTES.accountBilling}
          className="shrink-0 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <span>{isEn ? "Billing & details" : "상세 내역"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </LocaleLink>
      </div>

      {loading ? (
        <p className="mt-4 text-xs text-on-surface-variant">{copy.loading}</p>
      ) : !entitlements ? (
        <p className="mt-4 text-xs text-on-surface-variant">{copy.myAccessLoadError}</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-4 transition hover:border-emerald-500/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
              <User className="h-4 w-4 text-emerald-600" />
              <span>{copy.myAccessPersonalLabel}</span>
            </div>
            <p className="mt-2 text-xl font-bold text-emerald-950 dark:text-emerald-100">
              {entitlements.personal.remaining > 0
                ? copy.myAccessRemainingCount(entitlements.personal.remaining)
                : copy.myAccessNoneRemaining}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/8 p-4 transition hover:border-sky-500/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-900 dark:text-sky-300">
              <Users className="h-4 w-4 text-sky-600" />
              <span>{copy.myAccessRelationshipLabel}</span>
            </div>
            <p className="mt-2 text-xl font-bold text-sky-950 dark:text-sky-100">
              {entitlements.relationship.remaining > 0
                ? copy.myAccessRemainingCount(entitlements.relationship.remaining)
                : copy.myAccessNoneRemaining}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
