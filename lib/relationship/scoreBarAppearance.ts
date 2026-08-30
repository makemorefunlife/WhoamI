/** 관계 지수 막대 — 점수 + 높을수록 좋은지/나쁜지에 따라 색 (초록만 선명) */
import type { Locale } from "@/lib/i18n/locale";

export type ScorePolarity = "higher_better" | "higher_worse";

export type ScoreBarAppearance = {
  barGradient: string;
  hint: string;
  hintClass: string;
  ringColor: string;
  ringOpacity: number;
};

/** 초록 — 가장 눈에 띄되, 숲색 톤 (네온 그린 지양) */
const TIER_GOOD: Omit<ScoreBarAppearance, "hint"> & { hint?: string } = {
  barGradient: "from-[#358560]/93 to-[#428f6e]/90",
  hintClass: "text-emerald-900/80",
  ringColor: "#3a8662",
  ringOpacity: 0.9,
};

/** 노랑 — 링·막대 같은 허니 골드, 적당히 보이게 */
const TIER_MID: Omit<ScoreBarAppearance, "hint"> & { hint?: string } = {
  barGradient: "from-[#d4bc62]/92 to-[#dfc97e]/88",
  hintClass: "text-amber-900/65",
  ringColor: "#c9b45a",
  ringOpacity: 0.87,
};

/** 빨강 — 코랄 로즈, 쨍한 레드 지양 */
const TIER_WARN: Omit<ScoreBarAppearance, "hint"> & { hint?: string } = {
  barGradient: "from-[#d99292]/90 to-[#e4adad]/86",
  hintClass: "text-rose-900/58",
  ringColor: "#c97a7a",
  ringOpacity: 0.86,
};

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function withHint(
  tier: typeof TIER_GOOD,
  hint: string,
): ScoreBarAppearance {
  return { ...tier, hint };
}

/**
 * Phase 1 English remediation: hint text used to be hardcoded Korean
 * regardless of locale (confirmed leaking into EN canonical reports via
 * TriScoreSnapshotPanel/RelationshipScoreBoard). Locale now selects the
 * label; tiers/thresholds/scores/colors are unchanged.
 */
const HINT_TEXT: Record<Locale, Record<"good" | "mid" | "low" | "warn" | "stable", string>> = {
  "ko-KR": { good: "좋은 편", mid: "보통", low: "낮은 편", warn: "주의 필요", stable: "안정적" },
  "en-US": { good: "Good", mid: "Average", low: "Low", warn: "Needs attention", stable: "Stable" },
};

/** 호감·케미: 높을수록 좋음 / 예민: 높을수록 주의 */
export function resolveScoreBarAppearance(
  value: number,
  polarity: ScorePolarity,
  locale: Locale,
): ScoreBarAppearance {
  const v = clampScore(value);
  const t = HINT_TEXT[locale] ?? HINT_TEXT["ko-KR"];

  if (polarity === "higher_better") {
    if (v >= 70) return withHint(TIER_GOOD, t.good);
    if (v > 40) return withHint(TIER_MID, t.mid);
    return withHint(TIER_WARN, t.low);
  }

  if (v >= 70) return withHint(TIER_WARN, t.warn);
  if (v > 50) return withHint(TIER_MID, t.mid);
  return withHint(TIER_GOOD, t.stable);
}
