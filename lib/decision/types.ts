import type { DecisionCategory } from "@/lib/decision/categories";
import type { MessageCatalog } from "@/lib/i18n/messages";

export type { DecisionCategory, DecisionCategoryFilter } from "@/lib/decision/categories";
export {
  DECISION_CATEGORIES,
  decisionCategoryLabel,
  decisionCategoryReviewTabLabel,
  decisionCategorySelectLabel,
  normalizeDecisionCategory,
} from "@/lib/decision/categories";

/** pending = 리뷰 필요(노란불), reviewed = 리뷰 완료(초록불) */
export type DecisionStatus = "pending" | "reviewed";

export type DecisionEntry = {
  id: string;
  /** Legacy single-line summary — kept for backward compat with pre-LOG-redesign
   * entries and as the display headline everywhere (cards, review sheet title).
   * For new entries this mirrors `decision`. */
  context: string;
  category: DecisionCategory;
  status: DecisionStatus;
  note: string;
  /** 1–5 when reviewed; null while pending */
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  /** What was going on — the background/circumstances behind the decision. */
  situation?: string;
  /** What was actually decided. */
  decision?: string;
  /** How it felt at the time of deciding — optional, free text. */
  feeling?: string;
  /** ISO date (YYYY-MM-DD) the user wants to revisit this decision — optional. */
  reviewDate?: string | null;
};

export const DECISION_DATE_RANGES = [
  { id: "7d", days: 7 },
  { id: "30d", days: 30 },
  { id: "90d", days: 90 },
  { id: "all", days: null },
] as const;

export type DecisionDateRangeId = (typeof DECISION_DATE_RANGES)[number]["id"];

const DATE_RANGE_MESSAGE_KEY: Record<
  DecisionDateRangeId,
  "last7d" | "last30d" | "last90d" | "all"
> = {
  "7d": "last7d",
  "30d": "last30d",
  "90d": "last90d",
  all: "all",
};

export function decisionDateRangeLabel(
  id: DecisionDateRangeId,
  messages: MessageCatalog,
): string {
  return messages.decision.dateRanges[DATE_RANGE_MESSAGE_KEY[id]];
}

export type HistoryStatusFilter = "all" | "needs_review" | "completed";

export type HistoryRatingFilter = "all" | "high" | "low";

export function isDecisionReviewed(entry: DecisionEntry): boolean {
  return entry.status === "reviewed";
}

export function needsDecisionReview(entry: DecisionEntry): boolean {
  return entry.status === "pending";
}
