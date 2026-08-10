/**
 * Shared Overview card contract — one card per core signal (3 per domain
 * today: 🔥/🧩/⚡). Presentation-only: every field here is already computed
 * by the calling domain (its own scoring + threshold + evidence logic).
 * `components/relationship/shared/overview/OverviewSection.tsx` only renders
 * these fields — it owns no domain vocabulary, thresholds, or band logic.
 */
export type OverviewCardData = {
  key: string;
  icon: string;
  label: string;
  score: number;
  /** true when a lower score is the better outcome (e.g. a risk/friction signal). */
  inverted: boolean;
  tone: "good" | "neutral" | "warn";
  /** Short natural-language grade for this score's band, e.g. "잘 통하는 편". */
  gradeLabel: string;
  /** One-line, jargon-free description of what this signal measures. */
  oneLiner: string;
  /** Progressive disclosure — "이 점수는 무엇인가요?" (full definition, may include calculation basis). */
  measures?: string | null;
  /** Progressive disclosure — "왜 이렇게 나왔나요?" (this pair's specific evidence). */
  why?: string | null;
  /** Progressive disclosure (nested) — "점수는 이렇게 읽어요" (threshold band breakdown). */
  thresholdText?: string | null;
};

export type OverviewSectionData = {
  heroSummary: string | null;
  cards: OverviewCardData[];
};
