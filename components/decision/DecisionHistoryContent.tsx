"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { Filter, Plus } from "lucide-react";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import GuestDashboardAuthNotice from "@/components/results/GuestDashboardAuthNotice";
import DecisionStatusDot from "@/components/decision/DecisionStatusDot";
import DecisionReviewSheet from "@/components/decision/DecisionReviewSheet";
import { StarRatingDisplay } from "@/components/decision/StarRating";
import {
  completeDecisionReview,
  readDecisionJournal,
} from "@/lib/decision/session";
import { formatDecisionDate } from "@/lib/decision/format";
import { sortDecisionsForReview } from "@/lib/decision/sort";
import {
  DECISION_CATEGORIES,
  decisionCategoryLabel,
  isDecisionReviewed,
  needsDecisionReview,
  type DecisionEntry,
  type HistoryRatingFilter,
  type HistoryStatusFilter,
} from "@/lib/decision/types";

function panelClass() {
  return "stitch-hero-panel rounded-extra-large border border-outline-variant/30 shadow-[0_4px_20px_rgba(26,51,40,0.05)]";
}

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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reviewEntry, setReviewEntry] = useState<DecisionEntry | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const id =
      typeof window !== "undefined"
        ? localStorage.getItem("reportId")?.trim() || "local"
        : "local";
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

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="mx-auto w-full max-w-2xl px-5 py-6 sm:px-6 sm:py-8">
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
          <div className={`${panelClass()} mb-6 space-y-5 p-5`}>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                상태
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "전체"],
                    ["needs_review", "리뷰 필요"],
                    ["completed", "리뷰 완료"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStatusFilter(id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      statusFilter === id
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                별점
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "전체"],
                    ["high", "높은 별점 (4–5)"],
                    ["low", "낮은 별점 (1–2)"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRatingFilter(id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      ratingFilter === id
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                분류
              </p>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border-0 bg-surface-container-low/80 px-4 py-2.5 text-sm outline-none ring-1 ring-outline-variant/35"
              >
                <option value="all">전체</option>
                {DECISION_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-secondary underline-offset-2 hover:underline"
              >
                필터 초기화
              </button>
            ) : null}
          </div>
        ) : null}

        {!journalReady ? (
          <div className={`${panelClass()} p-8 text-center`}>
            <p className="text-sm text-on-surface-variant">
              목록 불러오는 중…
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className={`${panelClass()} p-8 text-center`}>
            <p className="text-sm text-on-surface-variant">
              아직 저장된 결정이 없어요.
            </p>
            <Link
              href="/decision"
              className="mt-4 inline-block text-sm font-semibold text-secondary underline-offset-2 hover:underline"
            >
              첫 결정 기록하기
            </Link>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className={`${panelClass()} p-8 text-center`}>
            <p className="text-sm text-on-surface-variant">
              선택한 필터에 맞는 결정이 없어요.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {visibleEntries.map((entry) => {
              const reviewed = isDecisionReviewed(entry);
              const displayDate = reviewed
                ? entry.reviewedAt
                : entry.createdAt;

              return (
                <li key={entry.id} className={panelClass()}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <DecisionStatusDot
                          entry={entry}
                          className="mt-1.5"
                        />
                        <div className="min-w-0">
                          <h2 className="text-base font-semibold text-on-surface">
                            {entry.context}
                          </h2>
                          <p className="mt-0.5 text-sm text-on-surface-variant">
                            {decisionCategoryLabel(entry.category)}
                          </p>
                        </div>
                      </div>
                      {displayDate ? (
                        <time
                          dateTime={displayDate}
                          className="shrink-0 text-xs text-on-surface-variant"
                        >
                          {formatDecisionDate(displayDate)}
                        </time>
                      ) : null}
                    </div>

                    {reviewed ? (
                      <div className="mt-4 border-t border-outline-variant/15 pt-4">
                        {entry.rating != null ? (
                          <StarRatingDisplay
                            rating={entry.rating}
                            className="mb-2"
                          />
                        ) : null}
                        {entry.note ? (
                          <p className="text-sm italic leading-relaxed text-on-surface-variant">
                            &ldquo;{entry.note}&rdquo;
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openReview(entry)}
                            className="text-xs font-semibold text-secondary underline-offset-2 hover:underline"
                          >
                            리뷰 메모 추가하기
                          </button>
                        )}
                        {entry.note ? (
                          <button
                            type="button"
                            onClick={() => openReview(entry)}
                            className="mt-3 text-xs font-semibold text-on-surface-variant underline-offset-2 hover:underline"
                          >
                            리뷰 수정
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-4 flex justify-end border-t border-outline-variant/15 pt-4">
                        <button
                          type="button"
                          onClick={() => openReview(entry)}
                          className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-on-primary transition hover:opacity-90 active:scale-[0.98]"
                        >
                          Complete
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            {hasMoreEntries ? (
              <li className="pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + 10)}
                  className="w-full rounded-xl border border-outline-variant/40 py-3 text-sm font-semibold text-on-surface-variant transition hover:border-secondary/40 hover:text-secondary"
                >
                  더 보기 (+10)
                </button>
              </li>
            ) : null}
          </ul>
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
