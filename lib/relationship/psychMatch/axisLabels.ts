import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import type { Locale } from "@/lib/i18n/locale";

export const PSYCH_MATCH_AXIS_KO_LABELS: Record<SecondaryAxisKey, string> = {
  stimulation: "자극추구",
  self_control: "자기통제",
  practicality: "실용성",
  structure: "계획성",
  empathy: "관계공감",
  conflict_style: "갈등대처",
  resilience: "관계 회복력",
  recognition: "인정욕구",
  energy_style: "외향성",
  thinking_style: "사고분석",
  decision_style: "신중함",
};

/** English variant, opt-in via psychMatchAxisLabel(key, "en-US"). */
export const PSYCH_MATCH_AXIS_EN_LABELS: Record<SecondaryAxisKey, string> = {
  stimulation: "Stimulation-Seeking",
  self_control: "Self-Control",
  practicality: "Practicality",
  structure: "Planning",
  empathy: "Empathy",
  conflict_style: "Conflict Coping",
  resilience: "Relationship Resilience",
  recognition: "Need for Recognition",
  energy_style: "Extraversion",
  thinking_style: "Analytical Thinking",
  decision_style: "Prudence",
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
