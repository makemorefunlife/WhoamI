"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountBirthEditForm, {
  type AccountBirthEditPayload,
} from "@/components/account/AccountBirthEditForm";
import {
  formatBirthDate,
  formatBirthPlace,
  formatBirthTime,
} from "@/lib/account/formatBirthDisplay";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useClientReportId } from "@/lib/hooks/useClientReportId";
import {
  writeBirthV2Session,
  type BirthV2Session,
} from "@/lib/v2/onboarding/birthSession";
import { fetchReportBirthFromApi } from "@/lib/v2/onboarding/fetchReportBirthClient";
import { syncBirthSessionFromDb } from "@/lib/v2/onboarding/hydrateBirthSession";
import { clearLiteReports } from "@/lib/v2/lite/session";
import { clearSlimIntegratedCache } from "@/lib/v1/slim/slimIntegratedCache";
import { invalidateReportSession } from "@/lib/home/reportSession";
import { blueprintRoute, ROUTES, withReportId } from "@/constants/routes";
import {
  readLocalBirthDateCorrectionUsed,
  writeLocalBirthDateCorrectionUsed,
} from "@/lib/account/birthDateCorrectionLocal";
import { isBirthDateCorrectionUsed } from "@/lib/report/birthDateCorrection";

function BirthSummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-outline-variant/20 py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        {label}
      </dt>
      <dd className="text-sm font-medium text-on-surface">{value}</dd>
    </div>
  );
}

export default function AccountBirthEditor() {
  const router = useRouter();
  const { locale, messages } = useLocale();
  const { reportId, ready, recovering } = useClientReportId({
    logContext: "account-profile",
  });
  const [birth, setBirth] = useState<BirthV2Session | null>(null);
  const [correctionUsed, setCorrectionUsed] = useState(false);
  const [dateEditMode, setDateEditMode] = useState(false);
  const [loadingBirth, setLoadingBirth] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeKind, setNoticeKind] = useState<"error" | "success" | null>(null);

  const loadBirth = useCallback(async (id: string) => {
    const [synced, dbRow] = await Promise.all([
      syncBirthSessionFromDb(id),
      fetchReportBirthFromApi(id),
    ]);
    setBirth(synced.birth);
    setCorrectionUsed(
      isBirthDateCorrectionUsed(dbRow?.birth_date_correction_used_at) ||
        readLocalBirthDateCorrectionUsed(id),
    );
    if (synced.sessionCorrected) {
      setNotice(messages.account.birthSessionCorrectedNotice);
      setNoticeKind("success");
    }
    setLoadingBirth(false);
  }, [messages]);

  useEffect(() => {
    if (!ready) return;
    if (!reportId) {
      setBirth(null);
      setCorrectionUsed(false);
      setLoadingBirth(false);
      return;
    }

    setLoadingBirth(true);
    void loadBirth(reportId);
  }, [ready, reportId, loadBirth]);

  const handleSubmit = useCallback(
    async (payload: AccountBirthEditPayload) => {
      if (!reportId || !birth?.birthDate || busy) return;
      setBusy(true);
      setNotice(null);
      setNoticeKind(null);

      const nextBirthDate = payload.birthDate?.trim() || birth.birthDate;
      const dateChanging = nextBirthDate !== birth.birthDate.trim();

      if (dateChanging && correctionUsed) {
        setNotice(messages.account.birthDateCorrectionUsedNotice);
        setNoticeKind("error");
        setBusy(false);
        return;
      }

      try {
        const res = await fetch("/api/report/birth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId,
            birthDate: nextBirthDate,
            birthTime: payload.birthTimeUnknown ? null : payload.birthTime,
            birthTimeUnknown: payload.birthTimeUnknown,
            birthPlace: payload.birthPlace,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          birth_date_correction_used?: boolean;
        };
        if (!res.ok) {
          setNotice(data.error ?? messages.account.birthSaveFailed);
          setNoticeKind("error");
          setBusy(false);
          return;
        }

        const nextBirth: BirthV2Session = {
          birthDate: nextBirthDate,
          birthTime: payload.birthTime,
          birthTimeUnknown: payload.birthTimeUnknown,
          birthPlace: payload.birthPlace,
          birthPlaceUnknown: false,
          savedAt: new Date().toISOString(),
        };
        writeBirthV2Session(reportId, nextBirth);
        setBirth(nextBirth);
        if (dateChanging || data.birth_date_correction_used) {
          setCorrectionUsed(true);
          writeLocalBirthDateCorrectionUsed(reportId);
          setDateEditMode(false);
        }
        setNotice(
          dateChanging
            ? messages.account.birthDateSavedNotice
            : messages.account.birthTimePlaceSavedNotice,
        );
        setNoticeKind("success");
        clearLiteReports(reportId);
        clearSlimIntegratedCache(reportId);
        invalidateReportSession(reportId);
        void loadBirth(reportId);
      } catch {
        setNotice(messages.account.birthSaveFailed);
        setNoticeKind("error");
      }
      setBusy(false);
    },
    [birth?.birthDate, busy, correctionUsed, loadBirth, messages, reportId],
  );

  if (!ready || recovering || loadingBirth) {
    return (
      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <p className="text-sm text-on-surface-variant">
          {recovering
            ? messages.account.birthLoadingAccount
            : messages.account.birthLoadingInfo}
        </p>
      </section>
    );
  }

  if (!reportId) {
    return (
      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <h2 className="stitch-headline text-xl text-primary">
          {messages.account.birthTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {messages.account.birthNoReportSubtitle}
        </p>
        <Link href={ROUTES.home} className="stitch-cta-primary mt-5 inline-flex">
          {messages.account.birthGoHome}
        </Link>
      </section>
    );
  }

  if (!birth?.birthDate) {
    return (
      <section className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <h2 className="stitch-headline text-xl text-primary">
          {messages.account.birthTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {messages.account.birthNoDateSubtitle}
        </p>
        <Link
          href={withReportId(ROUTES.onboardingBirth, reportId)}
          className="stitch-cta-primary mt-5 inline-flex"
        >
          {messages.account.birthEnterInfo}
        </Link>
      </section>
    );
  }

  return (
    <section id="birth" className="scroll-mt-24 space-y-5">
      <div>
        <h2 className="stitch-headline text-xl text-primary">
          {messages.account.birthTitle}
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {messages.account.birthEditableHintLead}
          <strong>{messages.account.birthEditableHintBold}</strong>
          {messages.account.birthEditableHintTrail}
        </p>
      </div>

      <div className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <h3 className="text-sm font-semibold text-primary">
          {messages.account.birthRegisteredInfo}
        </h3>
        <dl className="mt-3">
          <BirthSummaryRow
            label={messages.account.birthDateLabel}
            value={formatBirthDate(birth.birthDate, locale, messages)}
          />
          <BirthSummaryRow
            label={messages.account.birthTimeLabel}
            value={formatBirthTime(birth, locale, messages)}
          />
          <BirthSummaryRow
            label={messages.account.birthPlaceLabel}
            value={formatBirthPlace(
              birth.birthPlace,
              birth.birthPlaceUnknown,
              messages,
            )}
          />
        </dl>
        {correctionUsed ? (
          <p className="mt-4 text-[11px] leading-relaxed text-on-surface-variant/80">
            {messages.account.birthCorrectionUsedHint}
          </p>
        ) : dateEditMode ? (
          <p className="mt-4 text-[11px] leading-relaxed text-on-surface-variant/80">
            {messages.account.birthDateEditModeHint}
          </p>
        ) : (
          <button
            type="button"
            className="stitch-cta-secondary mt-4 w-full sm:w-auto"
            onClick={() => {
              setDateEditMode(true);
              setNotice(null);
              setNoticeKind(null);
            }}
          >
            {messages.account.birthEditDateCta}
          </button>
        )}
      </div>

      {notice ? (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${
            noticeKind === "error"
              ? "border-accent-rose/40 bg-accent-rose-soft text-primary"
              : "border-secondary/30 bg-secondary/8 text-primary"
          }`}
        >
          {notice}
        </p>
      ) : null}

      <div className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-primary">
              {dateEditMode
                ? messages.account.birthEditAllTitle
                : messages.account.birthEditTimePlaceTitle}
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              {messages.account.birthEditHint}
            </p>
          </div>
          {dateEditMode ? (
            <button
              type="button"
              className="shrink-0 text-xs text-on-surface-variant underline"
              onClick={() => setDateEditMode(false)}
            >
              {messages.account.birthCancel}
            </button>
          ) : null}
        </div>
        <div className="mt-5">
          <AccountBirthEditForm
            initialBirthDate={birth.birthDate}
            initialBirthTime={birth.birthTime}
            initialBirthTimeUnknown={birth.birthTimeUnknown}
            initialBirthPlace={birth.birthPlace}
            allowBirthDateEdit={dateEditMode}
            busy={busy}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      <button
        type="button"
        className="stitch-cta-secondary w-full"
        onClick={() => router.push(blueprintRoute(reportId))}
      >
        {messages.account.birthGoToBlueprintPreview}
      </button>
    </section>
  );
}
