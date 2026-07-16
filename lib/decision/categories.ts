import type { MessageCatalog } from "@/lib/i18n/messages";

export const DECISION_CATEGORIES = [
  { id: "relationship", emoji: "👥" },
  { id: "career", emoji: "💼" },
  { id: "finance", emoji: "💰" },
  { id: "life", emoji: "🏠" },
  { id: "others", emoji: "📦" },
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
  messages: MessageCatalog,
): string {
  return `${cat.emoji} ${messages.decision.categories[cat.id]}`;
}

export function decisionCategoryReviewTabLabel(
  id: DecisionCategory,
  messages: MessageCatalog,
): string {
  const cat = DECISION_CATEGORIES.find((c) => c.id === id);
  if (!cat) return id;
  return `${cat.emoji} ${messages.decision.categories[id]}`;
}

export function decisionCategoryLabel(
  id: DecisionCategory,
  messages: MessageCatalog,
): string {
  return decisionCategoryReviewTabLabel(id, messages);
}
