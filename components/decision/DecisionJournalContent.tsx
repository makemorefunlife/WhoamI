"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { Calendar, ChevronRight, Sparkles } from "lucide-react";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import GuestDashboardAuthNotice from "@/components/results/GuestDashboardAuthNotice";
import DecideWithAiComingSoon from "@/components/decision/DecideWithAiComingSoon";
import DecisionStatusDot from "@/components/decision/DecisionStatusDot";
import DecisionReviewSheet from "@/components/decision/DecisionReviewSheet";
import {
  addDecisionEntry,
  completeDecisionReview,
  readDecisionJournal,
} from "@/lib/decision/session";
import { sortDecisionsForReview } from "@/lib/decision/sort";
import { DECISION_HUB_LABEL } from "@/lib/stitch/hubPaths";
import {
  DECISION_CATEGORIES,
  DECISION_DATE_RANGES,
  decisionCategoryLabel,
  isDecisionReviewed,
  type DecisionCategory,
  type DecisionDateRangeId,
  type DecisionEntry,
} from "@/lib/decision/types";

const REVIEW_PREVIEW_LIMIT = 3;

function panelClass() {
  return "stitch-hero-panel rounded-extra-large border border-outline-variant/30 shadow-[0_4px_20px_rgba(26,51,40,0.05)]";
}

function fieldClass() {
  return "w-full rounded-xl border-0 bg-surface-container-low/80 px-4 py-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/35 focus:ring-2 focus:ring-primary/15";
}

function filterByRange(
  entries: DecisionEntry[],
  rangeId: DecisionDateRangeId,
): DecisionEntry[] {
  const range = DECISION_DATE_RANGES.find((r) => r.id === rangeId);
  if (!range || range.days == null) return entries;
  const cutoff = Date.now() - range.days * 24 * 60 * 60 * 1000;
  return entries.filter((e) => new Date(e.createdAt).getTime() >= cutoff);
}

export default function DecisionJournalContent() {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const isGuest = isLoaded && !user;

  const [reportId, setReportId] = useState("");
  const [entries, setEntries] = useState<DecisionEntry[]>([]);
  const [context, setContext] = useState("");
  const [category, setCategory] = useState<DecisionCategory>("career");
  const [analyzeRange, setAnalyzeRange] =
    useState<DecisionDateRangeId>("30d");
  const [analyzeCategory, setAnalyzeCategory] = useState<
    DecisionCategory | "all"
  >("all");
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);
  const [reviewEntry, setReviewEntry] = useState<DecisionEntry | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("reportId")?.trim() ?? "local";
    setReportId(id);
    setEntries(readDecisionJournal(id));
  }, []);

  const persist = useCallback((next: DecisionEntry[]) => {
    setEntries(next);
  }, []);

  const requireAuth = useCallback(() => {
    openSignIn?.({
      forceRedirectUrl:
        typeof window !== "undefined" ? window.location.pathname : "/decision",
    });
  }, [openSignIn]);

  const handleSave = () => {
    if (isGuest) {
      requireAuth();
      return;
    }
    const text = context.trim();
    if (!text || !reportId) return;
    const next = addDecisionEntry(reportId, { context: text, category });
    persist(next);
    setContext("");
    setAnalyzeMessage(null);
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
  const previewEntries = sortedEntries.slice(0, REVIEW_PREVIEW_LIMIT);

  const filteredForAnalyze = useMemo(() => {
    let list = filterByRange(entries, analyzeRange);
    if (analyzeCategory !== "all") {
      list = list.filter((e) => e.category === analyzeCategory);
    }
    return list;
  }, [analyzeCategory, analyzeRange, entries]);

  const handleAnalyze = () => {
    if (isGuest) {
      requireAuth();
      return;
    }
    if (filteredForAnalyze.length === 0) {
      setAnalyzeMessage(
        "선택한 기간·카테고리에 해당하는 결정 기록이 없어요. 먼저 결정을 저장해 보세요.",
      );
      return;
    }
    setAnalyzeMessage(
      `AI 분석은 준비 중이에요. 현재 ${filteredForAnalyze.length}건의 기록이 선택됐어요. 곧 패턴 인사이트가 여기에 표시됩니다.`,
    );
  };

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-6 sm:py-8">
        <header className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
            {DECISION_HUB_LABEL}
          </p>
          <h1 className="stitch-headline mt-2 text-3xl leading-tight sm:text-4xl">
            Decision Journal
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
            결정을 기록하고, 리뷰하고, 나중에 패턴을 분석해요. 지금은 로컬
            노트로 저장되며, 이후 계정 DB와 연동될 예정이에요.
          </p>
        </header>

        {isGuest ? (
          <div className="mb-10">
            <GuestDashboardAuthNotice />
          </div>
        ) : null}

        {/* Step 1 — Decide */}
        <section className="mb-12 sm:mb-16" id="decide">
          <div className="mb-6">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
              Step 1
            </span>
            <h2 className="stitch-headline text-2xl text-primary sm:text-3xl">
              Decide
            </h2>
          </div>
          <div
            className={`${panelClass()} flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:p-6`}
          >
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Decision context
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="What are you deciding?"
                className={fieldClass()}
              />
            </div>
            <div className="w-full sm:w-44">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Category
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as DecisionCategory)
                }
                className={fieldClass()}
              >
                {DECISION_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="stitch-cta-primary h-[52px] shrink-0 px-8 sm:min-w-[9.5rem]"
            >
              Save
            </button>
          </div>
        </section>

        {/* Step 2 — Review */}
        <section className="mb-12 sm:mb-16">
          <div className="mb-6">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
              Step 2
            </span>
            <h2 className="stitch-headline text-2xl text-primary sm:text-3xl">
              Review
            </h2>
          </div>
          <div className={`${panelClass()} p-2 sm:p-3`}>
            {entries.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-on-surface-variant">
                아직 리뷰할 결정이 없습니다.
                <br />
                <span className="text-xs">
                  위에서 결정을 저장하면 여기에 표시돼요.
                </span>
              </p>
            ) : (
              <>
                <div className="divide-y divide-outline-variant/15">
                  {previewEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 rounded-xl p-4 transition hover:bg-surface-container-low/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3 sm:items-center">
                        <DecisionStatusDot entry={entry} className="mt-1.5 sm:mt-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-on-surface">
                            {entry.context}
                          </p>
                          <p className="mt-0.5 text-xs text-on-surface-variant">
                            {decisionCategoryLabel(entry.category)}
                          </p>
                        </div>
                      </div>
                      {isDecisionReviewed(entry) ? (
                        <button
                          type="button"
                          onClick={() => openReview(entry)}
                          className="shrink-0 self-start rounded-full bg-surface-container-low px-4 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container-high sm:self-center"
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openReview(entry)}
                          className="shrink-0 self-start rounded-full border border-secondary px-4 py-1.5 text-xs font-semibold text-secondary transition hover:bg-secondary hover:text-on-primary sm:self-center"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {entries.length > REVIEW_PREVIEW_LIMIT ? (
                  <div className="mt-2 flex justify-center border-t border-outline-variant/15 pt-3">
                    <Link
                      href="/decision/history"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant transition hover:text-primary"
                    >
                      See more
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : entries.length > 0 ? (
                  <div className="mt-2 flex justify-center border-t border-outline-variant/15 pt-3">
                    <Link
                      href="/decision/history"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant transition hover:text-primary"
                    >
                      Decision History
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>

        {/* Step 3 — Analyze */}
        <section className="mb-12 sm:mb-16">
          <div className="mb-6">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
              Step 3
            </span>
            <h2 className="stitch-headline text-2xl text-primary sm:text-3xl">
              Analyze
            </h2>
          </div>
          <div className={`${panelClass()} p-5 sm:p-6`}>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <div className="min-w-[200px] flex-1">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Date range
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-surface-container-low/80 px-4 py-3 ring-1 ring-outline-variant/35">
                  <Calendar
                    className="h-4 w-4 text-on-surface-variant"
                    aria-hidden
                  />
                  <select
                    value={analyzeRange}
                    onChange={(e) =>
                      setAnalyzeRange(e.target.value as DecisionDateRangeId)
                    }
                    className="w-full border-0 bg-transparent text-sm text-on-surface outline-none"
                  >
                    {DECISION_DATE_RANGES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="min-w-[200px] flex-1">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Filter category
                </label>
                <select
                  value={analyzeCategory}
                  onChange={(e) =>
                    setAnalyzeCategory(
                      e.target.value as DecisionCategory | "all",
                    )
                  }
                  className={fieldClass()}
                >
                  <option value="all">전체 카테고리</option>
                  {DECISION_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-4 text-sm font-semibold text-on-primary transition hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Analyze with AI
            </button>

            {analyzeMessage ? (
              <div className="mt-6 rounded-xl border border-outline-variant/20 bg-surface-container-low/60 p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-2 text-secondary">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    AI insights
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {analyzeMessage}
                </p>
              </div>
            ) : null}
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

