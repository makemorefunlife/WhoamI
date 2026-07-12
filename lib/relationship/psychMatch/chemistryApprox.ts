/**
 * psych_match.axis_results 기반 **근사 케미 점수** 계산.
 *
 * 축별 gap을 해당 축 분포 퍼센타일로 환산해 0~100 점수로 만듭니다.
 * (고정 100-gap 은 전 구간 95~99에 몰리는 문제가 있어 폐기)
 */

import {
  SECONDARY_AXIS_KEYS,
  type SecondaryAxisKey,
} from "@/lib/v2/survey/types";
import { getAxisGapPercentiles } from "./gapPercentiles";

export const EMOTIONAL_CHEMISTRY_AXIS_KEYS = [
  "empathy",
  "recognition",
  "resilience",
  "self_control",
] as const satisfies readonly SecondaryAxisKey[];

export const COMMUNICATION_CHEMISTRY_AXIS_KEYS = [
  "thinking_style",
  "decision_style",
  "structure",
] as const satisfies readonly SecondaryAxisKey[];

export type ChemistryAxisInput = {
  axis_key: string;
  gap: number;
};

export type ChemistryApproxScores = {
  emotional: number | null;
  communication: number | null;
  emotional_axis_count: number;
  communication_axis_count: number;
};

const SECONDARY_AXIS_KEY_SET = new Set<string>(SECONDARY_AXIS_KEYS);

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function isSecondaryAxisKey(key: string): key is SecondaryAxisKey {
  return SECONDARY_AXIS_KEY_SET.has(key);
}

/**
 * 축 분포에서 gap의 상대적 위치를 뒤집어 0~100 호환 점수로 환산.
 * gap ≈ p10 → ~95, gap ≈ p90 → ~15, gap ≥ maxGap → ~5
 */
export function compatibilityScoreFromGap(
  axisKey: SecondaryAxisKey,
  gap: number,
): number {
  if (Number.isNaN(gap)) return 0;
  const { p10, p90, maxGap } = getAxisGapPercentiles(axisKey);
  const g = Math.max(0, gap);

  if (g <= p10) return 95;
  if (g >= maxGap) return 5;
  if (g >= p90) {
    const span = Math.max(maxGap - p90, 1);
    const t = (g - p90) / span;
    return Math.round(clamp(15 - t * 10, 5, 15));
  }

  const span = Math.max(p90 - p10, 1);
  const t = (g - p10) / span;
  return Math.round(clamp(95 - t * 80, 15, 95));
}

function meanCompatibilityForAxes(
  axisKeys: readonly SecondaryAxisKey[],
  resultsByKey: Map<string, ChemistryAxisInput>,
): { score: number | null; count: number } {
  const scores: number[] = [];

  for (const axisKey of axisKeys) {
    const row = resultsByKey.get(axisKey);
    if (!row) continue;
    if (!isSecondaryAxisKey(row.axis_key)) continue;
    scores.push(compatibilityScoreFromGap(row.axis_key, row.gap));
  }

  if (scores.length === 0) {
    return { score: null, count: 0 };
  }

  const mean = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  return { score: Math.round(mean), count: scores.length };
}

export function buildChemistryApproxScores(
  axisResults: ChemistryAxisInput[],
): ChemistryApproxScores {
  const resultsByKey = new Map<string, ChemistryAxisInput>();
  for (const row of axisResults) {
    if (!row?.axis_key) continue;
    resultsByKey.set(row.axis_key, row);
  }

  const emotional = meanCompatibilityForAxes(
    EMOTIONAL_CHEMISTRY_AXIS_KEYS,
    resultsByKey,
  );
  const communication = meanCompatibilityForAxes(
    COMMUNICATION_CHEMISTRY_AXIS_KEYS,
    resultsByKey,
  );

  return {
    emotional: emotional.score,
    communication: communication.score,
    emotional_axis_count: emotional.count,
    communication_axis_count: communication.count,
  };
}
