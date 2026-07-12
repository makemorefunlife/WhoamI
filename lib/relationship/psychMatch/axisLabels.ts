import type { SecondaryAxisKey } from "@/lib/v2/survey/types";

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

export function psychMatchAxisKoLabel(axisKey: string): string {
  return (
    PSYCH_MATCH_AXIS_KO_LABELS[axisKey as SecondaryAxisKey] ??
    axisKey
  );
}
