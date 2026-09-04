"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { Calendar, Sparkles } from "lucide-react";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import GuestDashboardAuthNotice from "@/components/results/GuestDashboardAuthNotice";
import DecideWithAiComingSoon from "@/components/decision/DecideWithAiComingSoon";
import DecisionCategoryTabs from "@/components/decision/DecisionCategoryTabs";
import DecisionReviewCard from "@/components/decision/DecisionReviewCard";
import DecisionReviewSheet from "@/components/decision/DecisionReviewSheet";
import { decisionPanelClass } from "@/components/decision/decisionPanelClass";
import FadeInContent from "@/components/ui/stitch/FadeInContent";
import { StitchSkeleton } from "@/components/ui/stitch/StitchSkeleton";
import {
  addDecisionEntry,
  completeDecisionReview,
  readDecisionJournal,
  readDecisionReportId,
} from "@/lib/decision/session";
import { sortDecisionsForReview } from "@/lib/decision/sort";
import { DECISION_CATEGORIES, decisionCategorySelectLabel } from "@/lib/decision/categories";
import { useMessages } from "@/lib/i18n/LocaleProvider";
import type { MessageCatalog } from "@/lib/i18n/messages";
import {
  type DecisionCategory,
  type DecisionCategoryFilter,
  type DecisionEntry,
} from "@/lib/decision/types";

const REVIEW_PREVIEW_LIMIT = 3;

function onboardingSteps(messages: MessageCatalog) {
  return [
    { num: "01", label: messages.decision.onboardingLogLabel, desc: messages.decision.onboardingLogDesc },
    { num: "02", label: messages.decision.onboardingReviewLabel, desc: messages.decision.onboardingReviewDesc },
    { num: "03", label: messages.decision.onboardingAnalyzeLabel, desc: messages.decision.onboardingAnalyzeDesc },
  ] as const;
}

function fieldClass() {
  return "w-full rounded-xl border-0 bg-surface-container-lowest/90 px-4 py-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/40 transition focus:ring-2 focus:ring-secondary/25";
}

function textareaClass() {
  return `${fieldClass()} resize-none leading-relaxed`;
}

function optionalTagClass() {
  return "ml-1.5 normal-case tracking-normal text-on-surface-variant/50";
}

function OnboardingBanner() {
  const messages = useMessages();
  const steps = onboardingSteps(messages);
  return (
    <div
      className="mb-10 rounded-2xl border border-outline-variant/25 bg-gradient-to-r from-surface-container-low/80 via-surface-container-lowest to-surface-container-low/60 px-4 py-5 sm:px-6"
      aria-label={messages.decision.journalWorkflowAria}
    >
      <div className="flex items-start justify-between gap-1 sm:gap-3">
        {steps.map((step, index) => (
          <div key={step.num} className="contents">
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[10px] font-bold tracking-[0.22em] text-primary sm:text-[11px]">
                <span className="text-secondary">{step.num}</span>{" "}
                <span>{step.label}</span>
              </p>
              <p className="mt-1.5 text-[9px] leading-snug text-on-surface-variant/50 sm:text-[10px]">
                {step.desc}
              </p>
            </div>
            {index < steps.length - 1 ? (
              <span
                className="mt-0.5 shrink-0 px-0.5 text-[10px] font-light text-outline-variant sm:mt-1 sm:px-1 sm:text-xs"
                aria-hidden
              >
                ➔
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Today in local time, YYYY-MM-DD — min bound for the review-date picker. */
function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DecisionJournalContent() {
  const messages = useMessages();
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const isGuest = isLoaded && !user;

  const [reportId, setReportId] = useState("");
  const [entries, setEntries] = useState<DecisionEntry[]>([]);
  const [journalReady, setJournalReady] = useState(false);
  const [category, setCategory] = useState<DecisionCategory>("relationship");
  const [situation, setSituation] = useState("");
  const [decisionText, setDecisionText] = useState("");
  const [feeling, setFeeling] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [reviewCategoryFilter, setReviewCategoryFilter] =
    useState<DecisionCategoryFilter>("all");
  const [reviewEntry, setReviewEntry] = useState<DecisionEntry | null>(null);

  const persist = useCallback((next: DecisionEntry[]) => {
    setEntries(next);
  }, []);

  useEffect(() => {
    const id = readDecisionReportId();
    setReportId(id);
    setEntries(readDecisionJournal(id));
    setJournalReady(true);
  }, []);

  const requireAuth = useCallback(() => {
    openSignIn?.({
      forceRedirectUrl:
        typeof window !== "undefined" ? window.location.pathname : "/decision",
    });
  }, [openSignIn]);

  const canSave = situation.trim().length > 0 && decisionText.trim().length > 0;

  const handleSave = () => {
    if (isGuest) {
      requireAuth();
      return;
    }
    if (!canSave || !reportId) return;
    const next = addDecisionEntry(reportId, {
      category,
      situation,
      decision: decisionText,
      feeling: feeling.trim() || undefined,
      reviewDate: reviewDate || null,
    });
    persist(next);
    setSituation("");
    setDecisionText("");
    setFeeling("");
    setReviewDate("");
  };

  const openReview = (entry: DecisionEntry) => {
    if (isGuest) {
      requireAuth();
      return;
    }
    setReviewEntry(entry);
  };

  const handleSaveReview = (id: string, rating: number, note: string) => {
    if (!reportId) return;
    const next = completeDecisionReview(reportId, id, rating, note);
    persist(next);
  };

  const sortedEntries = useMemo(
    () => sortDecisionsForReview(entries),
    [entries],
  );
  const filteredReviewEntries = useMemo(() => {
    if (reviewCategoryFilter === "all") return sortedEntries;
    return sortedEntries.filter((e) => e.category === reviewCategoryFilter);
  }, [reviewCategoryFilter, sortedEntries]);
  const previewEntries = filteredReviewEntries.slice(0, REVIEW_PREVIEW_LIMIT);
  const hasMoreReviewEntries =
    filteredReviewEntries.length > REVIEW_PREVIEW_LIMIT;

  const panelClass = decisionPanelClass();

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-6 sm:py-8">
        <header className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
            {messages.dock.choice}
          </p>
          <h1 className="stitch-headline mt-2 text-3xl leading-tight sm:text-4xl">
            {messages.decision.journalTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
            {messages.decision.journalSubtitle}
          </p>
        </header>

        <OnboardingBanner />

        {isGuest ? (
          <div className="mb-10">
            <GuestDashboardAuthNotice />
          </div>
        ) : null}

        <section className="mb-12 sm:mb-16" id="decide">
          <div className="mb-5">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              {messages.decision.stepLabel(1)}
            </span>
            <h2 className="stitch-headline text-2xl text-primary sm:text-[1.75rem]">
              {messages.decision.archiveTitle}
            </h2>
            <p className="mt-1.5 text-sm text-on-surface-variant/80">
              {messages.decision.archiveSubtitle}
            </p>
          </div>
          <div className={`${panelClass} space-y-5 p-5 sm:p-6`}>
            <div className="sm:max-w-xs">
              <label
                htmlFor="decision-category"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant"
              >
                {messages.decision.categoryLabel}
              </label>
              <select
                id="decision-category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as DecisionCategory)
                }
                className={fieldClass()}
              >
                {DECISION_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {decisionCategorySelectLabel(c, messages)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="decision-situation"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant"
              >
                {messages.decision.situationLabel}
              </label>
              <textarea
                id="decision-situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder={messages.decision.situationPlaceholder}
                rows={3}
                className={textareaClass()}
              />
            </div>

            <div>
              <label
                htmlFor="decision-field"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant"
              >
                {messages.decision.decisionFieldLabel}
              </label>
              <textarea
                id="decision-field"
                value={decisionText}
                onChange={(e) => setDecisionText(e.target.value)}
                placeholder={messages.decision.decisionFieldPlaceholder}
                rows={3}
                className={textareaClass()}
              />
            </div>

            <div>
              <label
                htmlFor="decision-feeling"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant"
              >
                {messages.decision.feelingLabel}
                <span className={optionalTagClass()}>({messages.decision.optionalTag})</span>
              </label>
              <textarea
                id="decision-feeling"
                value={feeling}
                onChange={(e) => setFeeling(e.target.value)}
                placeholder={messages.decision.feelingPlaceholder}
                rows={2}
                className={textareaClass()}
              />
              <p className="mt-1.5 text-xs text-on-surface-variant/70">
                {messages.decision.feelingHelper}
              </p>
            </div>

            <div>
              <label
                htmlFor="decision-review-date"
                className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant"
              >
                <Calendar className="h-3 w-3" aria-hidden />
                {messages.decision.reviewDateLabel}
                <span className={optionalTagClass()}>({messages.decision.optionalTag})</span>
              </label>
              <input
                id="decision-review-date"
                type="date"
                value={reviewDate}
                min={todayIsoDate()}
                onChange={(e) => setReviewDate(e.target.value)}
                className={`${fieldClass()} sm:max-w-xs`}
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="stitch-cta-primary !min-w-[10rem] !rounded-xl !py-3.5 !text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {messages.cta.save}
              </button>
            </div>
          </div>
        </section>

        <section className="mb-12 sm:mb-16">
          <div className="mb-5">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              {messages.decision.stepLabel(2)}
            </span>
            <h2 className="stitch-headline text-2xl text-primary sm:text-[1.75rem]">
              {messages.decision.reviewOutcomesTitle}
            </h2>
            <p className="mt-1.5 text-sm text-on-surface-variant/80">
              {messages.decision.reviewOutcomesSubtitle}
            </p>
          </div>
          <div className={`${panelClass} p-2 sm:p-3`}>
            {!journalReady ? (
              <div className="space-y-3 px-4 py-6" aria-busy="true">
                <StitchSkeleton className="h-14 w-full" />
                <StitchSkeleton className="h-14 w-full" />
                <StitchSkeleton className="h-14 w-full" />
              </div>
            ) : entries.length === 0 ? (
              <div className="mx-2 my-3 rounded-2xl border border-dashed border-outline-variant/45 bg-surface-container-lowest/60 px-6 py-10 text-center sm:mx-3 sm:py-12">
                <p className="text-base font-medium text-on-surface">
                  {messages.decision.noReviewsYet}
                </p>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-on-surface-variant/75">
                  {messages.decision.noReviewsYetHint}
                </p>
              </div>
            ) : (
              <FadeInContent>
                <>
                  <DecisionCategoryTabs
                    value={reviewCategoryFilter}
                    onChange={setReviewCategoryFilter}
                    className="px-2 pb-3 pt-2 sm:px-3"
                  />
                  {filteredReviewEntries.length === 0 ? (
                    <div className="mx-2 mb-3 rounded-2xl border border-dashed border-outline-variant/45 bg-surface-container-lowest/60 px-6 py-8 text-center sm:mx-3">
                      <p className="text-sm text-on-surface-variant/75">
                        {messages.decision.noReviewsInCategory}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-outline-variant/15">
                        {previewEntries.map((entry) => (
                          <DecisionReviewCard
                            key={entry.id}
                            entry={entry}
                            onReview={openReview}
                          />
                        ))}
                      </div>
                      {hasMoreReviewEntries ? (
                        <div className="border-t border-outline-variant/15 px-3 py-3 text-center">
                          <Link
                            href="/decision/history"
                            className="text-xs font-semibold text-on-surface-variant transition hover:text-primary"
                          >
                            {messages.decision.viewAllCount(filteredReviewEntries.length)}
                          </Link>
                        </div>
                      ) : null}
                    </>
                  )}
                </>
              </FadeInContent>
            )}
          </div>
        </section>

        <section className="mb-12 sm:mb-16">
          <div className="mb-5">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              {messages.decision.stepLabel(3)}
            </span>
            <h2 className="stitch-headline text-2xl text-primary sm:text-[1.75rem]">
              {messages.decision.smartInsightsTitle}
            </h2>
            <p className="mt-1.5 text-sm text-on-surface-variant/80">
              {messages.decision.smartInsightsSubtitle}
            </p>
          </div>
          <div className={`${panelClass} p-6 text-center sm:p-8`}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container/60">
              <Sparkles className="h-6 w-6 text-secondary" aria-hidden />
            </div>
            <h3 className="stitch-headline mt-4 text-lg text-primary">
              {messages.decision.aiAnalysisTitle}
            </h3>
            <p className="mt-1 text-sm font-semibold text-secondary">
              {messages.decision.aiAnalysisComingSoon}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-on-surface-variant/80">
              {messages.decision.aiAnalysisComingSoonBody}
            </p>
          </div>
        </section>

        <DecideWithAiComingSoon />
      </div>

      <DecisionReviewSheet
        entry={reviewEntry}
        open={reviewEntry != null}
        onClose={() => setReviewEntry(null)}
        onSave={handleSaveReview}
      />
    </StitchSurveyShell>
  );
}
