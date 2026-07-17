import {
  SECONDARY_AXIS_KEYS,
  type CurrentSelfProfile,
  type SecondaryAxisKey,
} from "@/lib/v2/survey/types";
import { getAxisGapPercentiles } from "./gapPercentiles";

export type PsychMatchType = "similarity" | "complementary" | "tension";

export type PsychMatchAxisResult = {
  axis_key: SecondaryAxisKey;
  score_a: number;
  score_b: number;
  gap: number;
  match_type: PsychMatchType;
};

export type PsychConflictTrigger = {
  axis_key: SecondaryAxisKey;
  gap: number;
  match_type: PsychMatchType;
};

export type PsychMatchResult = {
  axis_results: PsychMatchAxisResult[];
  conflict_triggers: PsychConflictTrigger[];
};

export function classifyPsychMatchType(
  axisKey: SecondaryAxisKey,
  gap: number,
): PsychMatchType {
  const { p60, p90 } = getAxisGapPercentiles(axisKey);
  if (gap < p60) return "similarity";
  if (gap <= p90) return "complementary";
  return "tension";
}

/** conflict_triggers·확언 카피에서 제외 — scoringMap 연결 문항 2개뿐(q2·q6) */
const SHALLOW_SIGNAL_AXIS_KEYS = new Set<SecondaryAxisKey>(["conflict_style"]);

export function buildPsychMatchResult(params: {
  profileA: CurrentSelfProfile;
  profileB: CurrentSelfProfile;
}): PsychMatchResult {
  const axisResults: PsychMatchAxisResult[] = SECONDARY_AXIS_KEYS.map((axisKey) => {
    const scoreA = params.profileA.secondary_axes[axisKey];
    const scoreB = params.profileB.secondary_axes[axisKey];
    const gap = Math.abs(scoreA - scoreB);
    return {
      axis_key: axisKey,
      score_a: scoreA,
      score_b: scoreB,
      gap,
      match_type: classifyPsychMatchType(axisKey, gap),
    };
  });

  const conflictTriggers = axisResults
    .filter((row) => row.match_type === "tension")
    .filter((row) => !SHALLOW_SIGNAL_AXIS_KEYS.has(row.axis_key))
    .sort((a, b) => b.gap - a.gap)
    .map((row) => ({
      axis_key: row.axis_key,
      gap: row.gap,
      match_type: row.match_type,
    }));

  return {
    axis_results: axisResults,
    conflict_triggers: conflictTriggers,
  };
}

export {
  AXIS_GAP_PERCENTILES,
  getAxisGapPercentiles,
  getAxisScoreRange,
  scoreToAxisRatio,
  scoreToBlendedAxisRatio,
  RADAR_AXIS_SCALE_BLEND,
  type AxisGapPercentiles,
} from "./gapPercentiles";
export {
  PSYCH_MATCH_AXIS_KO_LABELS,
  PSYCH_MATCH_AXIS_EN_LABELS,
  psychMatchAxisKoLabel,
  psychMatchAxisLabel,
} from "./axisLabels";
export {
  STRENGTH_WEAKNESS_TEMPLATES,
  buildStrengthWeaknessLists,
  strengthWeaknessTextForAxis,
  type StrengthWeaknessAxisInput,
  type StrengthWeaknessItem,
  type StrengthWeaknessLists,
} from "./strengthWeaknessTemplates";
export {
  EMOTIONAL_CHEMISTRY_AXIS_KEYS,
  COMMUNICATION_CHEMISTRY_AXIS_KEYS,
  buildChemistryApproxScores,
  compatibilityScoreFromGap,
  type ChemistryAxisInput,
  type ChemistryApproxScores,
} from "./chemistryApprox";
