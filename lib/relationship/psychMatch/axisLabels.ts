import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import type { Locale } from "@/lib/i18n/locale";

export const PSYCH_MATCH_AXIS_KO_LABELS: Record<SecondaryAxisKey, string> = {
  stimulation: "자극추구",
  self_control: "자기통제",
  practicality: "현실실리",
  structure: "계획구조화",
  empathy: "관계공감",
  conflict_style: "갈등직면성",
  resilience: "회복탄력성",
  recognition: "인정욕구",
  energy_style: "외향에너지",
  thinking_style: "분석사고",
  decision_style: "신중결정",
};

/** English variant, opt-in via psychMatchAxisLabel(key, "en-US"). */
export const PSYCH_MATCH_AXIS_EN_LABELS: Record<SecondaryAxisKey, string> = {
  stimulation: "Stimulation-Seeking",
  self_control: "Self-Control",
  practicality: "Practicality",
  structure: "Structure & Planning",
  empathy: "Empathy",
  conflict_style: "Conflict Directness",
  resilience: "Resilience",
  recognition: "Need for Recognition",
  energy_style: "Outward Energy",
  thinking_style: "Analytical Thinking",
  decision_style: "Careful Decision-Making",
};

export function psychMatchAxisKoLabel(axisKey: string): string {
  return (
    PSYCH_MATCH_AXIS_KO_LABELS[axisKey as SecondaryAxisKey] ??
    axisKey
  );
}

/**
 * `locale` defaults to Korean so every pre-existing caller that doesn't pass
 * it keeps rendering exactly as before.
 */
export function psychMatchAxisLabel(
  axisKey: string,
  locale: Locale = "ko-KR",
): string {
  const table =
    locale === "en-US" ? PSYCH_MATCH_AXIS_EN_LABELS : PSYCH_MATCH_AXIS_KO_LABELS;
  return table[axisKey as SecondaryAxisKey] ?? axisKey;
}
