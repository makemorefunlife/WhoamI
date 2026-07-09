export const DECISION_CATEGORIES = [
  {
    id: "relationship",
    emoji: "👥",
    label: "관계",
    labelEn: "Relationships",
  },
  {
    id: "career",
    emoji: "💼",
    label: "커리어",
    labelEn: "Career",
  },
  {
    id: "finance",
    emoji: "💰",
    label: "재테크",
    labelEn: "Finance",
  },
  {
    id: "life",
    emoji: "🏠",
    label: "일상",
    labelEn: "Life",
  },
  {
    id: "others",
    emoji: "📦",
    label: "기타",
    labelEn: "Others",
  },
] as const;

export type DecisionCategory = (typeof DECISION_CATEGORIES)[number]["id"];

const REVIEW_TAB_LABELS: Record<DecisionCategory, string> = {
  relationship: "👥 관계",
  career: "💼 커리어",
  finance: "💰 Finance",
  life: "🏠 일상",
  others: "📦 기타",
};

const LEGACY_CATEGORY_MAP: Record<string, DecisionCategory> = {
  investment: "finance",
  hobby: "life",
  other: "others",
};

export function normalizeDecisionCategory(raw: string): DecisionCategory {
  if (raw in LEGACY_CATEGORY_MAP) {
    return LEGACY_CATEGORY_MAP[raw];
  }
  const found = DECISION_CATEGORIES.find((c) => c.id === raw);
  return found?.id ?? "others";
}

export function decisionCategoryLabel(id: DecisionCategory): string {
  return REVIEW_TAB_LABELS[id] ?? id;
}

/** STEP 1 dropdown — emoji + English */
export function decisionCategorySelectLabel(
  cat: (typeof DECISION_CATEGORIES)[number],
): string {
  return `${cat.emoji} ${cat.labelEn}`;
}

/** STEP 2 filter tabs & review cards */
export function decisionCategoryReviewTabLabel(id: DecisionCategory): string {
  return REVIEW_TAB_LABELS[id];
}

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

export function isDecisionReviewed(entry: DecisionEntry): boolean {
  return entry.status === "reviewed";
}

export function needsDecisionReview(entry: DecisionEntry): boolean {
  return entry.status === "pending";
}
