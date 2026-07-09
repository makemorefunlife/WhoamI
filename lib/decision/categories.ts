export const DECISION_CATEGORIES = [
  {
    id: "relationship",
    emoji: "👥",
    labelKo: "관계",
    labelEn: "Relationships",
    tabLabel: "👥 관계",
  },
  {
    id: "career",
    emoji: "💼",
    labelKo: "커리어",
    labelEn: "Career",
    tabLabel: "💼 커리어",
  },
  {
    id: "finance",
    emoji: "💰",
    labelKo: "재테크",
    labelEn: "Finance",
    tabLabel: "💰 Finance",
  },
  {
    id: "life",
    emoji: "🏠",
    labelKo: "일상",
    labelEn: "Life",
    tabLabel: "🏠 일상",
  },
  {
    id: "others",
    emoji: "📦",
    labelKo: "기타",
    labelEn: "Others",
    tabLabel: "📦 기타",
  },
] as const;

export type DecisionCategory = (typeof DECISION_CATEGORIES)[number]["id"];

export type DecisionCategoryFilter = DecisionCategory | "all";

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

export function decisionCategorySelectLabel(
  cat: (typeof DECISION_CATEGORIES)[number],
): string {
  return `${cat.emoji} ${cat.labelEn}`;
}

export function decisionCategoryReviewTabLabel(id: DecisionCategory): string {
  return DECISION_CATEGORIES.find((c) => c.id === id)?.tabLabel ?? id;
}

export function decisionCategoryLabel(id: DecisionCategory): string {
  return decisionCategoryReviewTabLabel(id);
}
