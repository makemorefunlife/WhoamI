"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { Filter, Plus } from "lucide-react";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import GuestDashboardAuthNotice from "@/components/results/GuestDashboardAuthNotice";
import DecisionCategoryTabs from "@/components/decision/DecisionCategoryTabs";
import DecisionReviewCard from "@/components/decision/DecisionReviewCard";
import DecisionReviewSheet from "@/components/decision/DecisionReviewSheet";
import { decisionPanelClass } from "@/components/decision/decisionPanelClass";
import { stitchPillClass } from "@/components/decision/stitchPillClass";
import {
  completeDecisionReview,
  readDecisionJournal,
  readDecisionReportId,
} from "@/lib/decision/session";
import { sortDecisionsForReview } from "@/lib/decision/sort";
import {
  isDecisionReviewed,
  needsDecisionReview,
  type DecisionCategoryFilter,
  type DecisionEntry,
  type HistoryRatingFilter,
  type HistoryStatusFilter,
} from "@/lib/decision/types";

function matchesStatusFilter(
  entry: DecisionEntry,
  filter: HistoryStatusFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "needs_review") return needsDecisionReview(entry);
  return isDecisionReviewed(entry);
}

function matchesRatingFilter(
  entry: DecisionEntry,
  filter: HistoryRatingFilter,
): boolean {
  if (filter === "all") return true;
  if (!isDecisionReviewed(entry) || entry.rating == null) return false;
  if (filter === "high") return entry.rating >= 4;
  return entry.rating <= 2;
}

export default function DecisionHistoryContent() {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const isGuest = isLoaded && !user;

  const [reportId, setReportId] = useState("");
  const [entries, setEntries] = useState<DecisionEntry[]>([]);
  const [journalReady, setJournalReady] = useState(false);
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>("all");
  const [ratingFilter, setRatingFilter] =
    useState<HistoryRatingFilter>("all");
  const [categoryFilter, setCategoryFilter] =
    useState<DecisionCategoryFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reviewEntry, setReviewEntry] = useState<DecisionEntry | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const id = readDecisionReportId();
    setReportId(id);
    setEntries(readDecisionJournal(id));
    setJournalReady(true);
  }, []);

  useEffect(() => {
    setVisibleCount(10);
  }, [statusFilter, ratingFilter, categoryFilter]);

  const persist = useCallback((next: DecisionEntry[]) => {
    setEntries(next);
  }, []);

  const requireAuth = useCallback(() => {
    openSignIn?.({
      forceRedirectUrl:
        typeof window !== "undefined"
          ? window.location.pathname
          : "/decision/history",
    });
  }, [openSignIn]);

  const filteredEntries = useMemo(() => {
    let list = sortDecisionsForReview(entries);
    list = list.filter((e) => matchesStatusFilter(e, statusFilter));
    list = list.filter((e) => matchesRatingFilter(e, ratingFilter));
    if (categoryFilter !== "all") {
      list = list.filter((e) => e.category === categoryFilter);
    }
    return list;
  }, [categoryFilter, entries, ratingFilter, statusFilter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count += 1;
    if (ratingFilter !== "all") count += 1;
    if (categoryFilter !== "all") count += 1;
    return count;
  }, [categoryFilter, ratingFilter, statusFilter]);

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

  const clearFilters = () => {
    setStatusFilter("all");
    setRatingFilter("all");
    setCategoryFilter("all");
    setVisibleCount(10);
  };

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMoreEntries = filteredEntries.length > visibleCount;
  const panelClass = decisionPanelClass();

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-6 sm:py-8">
        <header className="mb-8">
          <Link
            href="/decision"
            className="text-xs font-semibold text-on-surface-variant transition hover:text-primary"
          >
            ← Decision Journal
          </Link>
          <h1 className="stitch-headline mt-4 text-3xl leading-tight text-primary sm:text-4xl">
            Decision History
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filtersOpen || activeFilterCount > 0
                  ? "border-secondary bg-secondary/10 text-secondary"
                  : "border-outline-variant/50 text-on-surface-variant hover:border-secondary/40"
              }`}
            >
              <Filter className="h-4 w-4" aria-hidden />
              Filter
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-on-primary">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            <Link
              href="/decision"
              className="stitch-cta-primary inline-flex !min-w-0 items-center gap-2 !px-5 !py-2.5 !text-sm"
            >
              <Plus className="h-4 w-4" aria-hidden />
              New
            </Link>
          </div>
        </header>

        {isGuest ? (
          <div className="mb-8">
            <GuestDashboardAuthNotice />
          </div>
        ) : null}

        {filtersOpen ? (
          <div className={`${panelClass} mb-6 space-y-5 p-5`}>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All"],
                    ["needs_review", "Needs review"],
                    ["completed", "Completed"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStatusFilter(id)}
                    className={stitchPillClass(statusFilter === id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Rating
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All"],
                    ["high", "High (4–5)"],
                    ["low", "Low (1–2)"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRatingFilter(id)}
                    className={stitchPillClass(ratingFilter === id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-secondary underline-offset-2 hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}

        {!journalReady ? (
          <div className={`${panelClass} p-8 text-center`}>
            <p className="text-sm text-on-surface-variant">Loading…</p>
          </div>
        ) : entries.length === 0 ? (
          <div className={`${panelClass} p-8 text-center`}>
            <p className="text-sm text-on-surface-variant">
              No decisions saved yet.
            </p>
            <Link
              href="/decision"
              className="mt-4 inline-block text-sm font-semibold text-secondary underline-offset-2 hover:underline"
            >
              Log your first decision
            </Link>
          </div>
        ) : (
          <div className={`${panelClass} p-2 sm:p-3`}>
            <DecisionCategoryTabs
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="px-2 pb-3 pt-2 sm:px-3"
            />
            {filteredEntries.length === 0 ? (
              <div className="mx-2 mb-3 rounded-2xl border border-dashed border-outline-variant/45 bg-surface-container-lowest/60 px-6 py-8 text-center sm:mx-3">
                <p className="text-sm text-on-surface-variant/75">
                  No decisions match these filters.
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-outline-variant/15">
                  {visibleEntries.map((entry) => (
                    <DecisionReviewCard
                      key={entry.id}
                      entry={entry}
                      onReview={openReview}
                    />
                  ))}
                </div>
                {hasMoreEntries ? (
                  <div className="border-t border-outline-variant/15 px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((n) => n + 10)}
                      className="text-xs font-semibold text-on-surface-variant transition hover:text-primary"
                    >
                      Load more (+10)
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}
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
