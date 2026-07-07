export const DECISION_CATEGORIES = [
  { id: "relationship", label: "관계" },
  { id: "career", label: "커리어" },
  { id: "investment", label: "투자" },
  { id: "hobby", label: "취미" },
  { id: "other", label: "기타" },
] as const;

export type DecisionCategory = (typeof DECISION_CATEGORIES)[number]["id"];

/** pending = 리뷰 필요(노란불), reviewed = 리뷰 완료(초록불) */
export type DecisionStatus = "pending" | "reviewed";

export type DecisionEntry = {
  id: string;
  context: string;
  category: DecisionCategory;
  status: DecisionStatus;
  note: string;
  /** 1–5 when reviewed; null while pending */
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
};

export const DECISION_DATE_RANGES = [
  { id: "7d", label: "최근 7일", days: 7 },
  { id: "30d", label: "최근 30일", days: 30 },
  { id: "90d", label: "최근 90일", days: 90 },
  { id: "all", label: "전체", days: null },
] as const;

export type DecisionDateRangeId = (typeof DECISION_DATE_RANGES)[number]["id"];

export type HistoryStatusFilter = "all" | "needs_review" | "completed";

export type HistoryRatingFilter = "all" | "high" | "low";

export function decisionCategoryLabel(id: DecisionCategory): string {
  return DECISION_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function isDecisionReviewed(entry: DecisionEntry): boolean {
  return entry.status === "reviewed";
}

export function needsDecisionReview(entry: DecisionEntry): boolean {
  return entry.status === "pending";
}
