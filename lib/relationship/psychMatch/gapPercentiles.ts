/**
 * 축별 gap 분포 퍼센타일 (q1~q9 전체 262,144 프로필 풀 · 무작위 쌍 10,000 샘플, seed=42).
 * 축별 scoreMin/scoreMax: SCORE_BASELINE(50) + scoringMap net delta min/max (q1~q9 전 조합).
 * 출처: tests/scripts/psych-gap-distribution-sim.ts, tests/scripts/scoring-map-axis-linkage.ts
 *
 * - p60: 유사 / 보완 경계 (gap < p60 → similarity)
 * - p90: 보완 / 긴장 경계 (gap > p90 → tension)
 * - p10: chemistryApprox 상대 점수 환산용
 * - maxGap: 이론상 축별 최대 gap (= scoreMax - scoreMin)
 * - scoreMin/scoreMax: 설문 v2에서 해당 축이 나올 수 있는 실제 점수 범위
 */
import type { SecondaryAxisKey } from "@/lib/v2/survey/types";

export type AxisGapPercentiles = {
  p10: number;
  p60: number;
  p90: number;
  maxGap: number;
  scoreMin: number;
  scoreMax: number;
};

export const AXIS_GAP_PERCENTILES: Record<SecondaryAxisKey, AxisGapPercentiles> = {
  stimulation: { p10: 0, p60: 3, p90: 6, maxGap: 14, scoreMin: 49, scoreMax: 63 },
  self_control: { p10: 0, p60: 2, p90: 5, maxGap: 11, scoreMin: 49, scoreMax: 60 },
  practicality: { p10: 0, p60: 4, p90: 8, maxGap: 14, scoreMin: 50, scoreMax: 64 },
  structure: { p10: 0, p60: 3, p90: 7, maxGap: 16, scoreMin: 50, scoreMax: 66 },
  empathy: { p10: 0, p60: 4, p90: 8, maxGap: 15, scoreMin: 49, scoreMax: 64 },
  conflict_style: { p10: 0, p60: 3, p90: 5, maxGap: 7, scoreMin: 48, scoreMax: 55 },
  resilience: { p10: 1, p60: 4, p90: 8, maxGap: 15, scoreMin: 41, scoreMax: 56 },
  recognition: { p10: 0, p60: 2, p90: 4, maxGap: 8, scoreMin: 49, scoreMax: 57 },
  energy_style: { p10: 1, p60: 4, p90: 8, maxGap: 15, scoreMin: 44, scoreMax: 59 },
  thinking_style: { p10: 0, p60: 3, p90: 6, maxGap: 17, scoreMin: 50, scoreMax: 67 },
  decision_style: { p10: 1, p60: 4, p90: 8, maxGap: 19, scoreMin: 50, scoreMax: 69 },
};

export function getAxisGapPercentiles(axisKey: SecondaryAxisKey): AxisGapPercentiles {
  return AXIS_GAP_PERCENTILES[axisKey];
}

/** 레이더 차트 — 축별 현실 점수 범위 */
export function getAxisScoreRange(axisKey: SecondaryAxisKey): {
  min: number;
  max: number;
} {
  const { scoreMin, scoreMax } = AXIS_GAP_PERCENTILES[axisKey];
  return { min: scoreMin, max: scoreMax };
}

/** 점수를 축별 [scoreMin, scoreMax] → [0, 1] 비율로 환산 (레이더 반지름용) */
export function scoreToAxisRatio(axisKey: SecondaryAxisKey, score: number): number {
  const { scoreMin, scoreMax } = AXIS_GAP_PERCENTILES[axisKey];
  const span = Math.max(scoreMax - scoreMin, 1);
  const clamped = Math.max(scoreMin, Math.min(scoreMax, score));
  return (clamped - scoreMin) / span;
}

/** 0=0~100 고정, 1=축별 전체 범위 확대. 레이더는 둘의 중간(0.5)을 씁니다. */
export const RADAR_AXIS_SCALE_BLEND = 0.5;

/** 0~100 선형 비율과 축별 확대 비율을 blend로 섞어 레이더 반지름용 [0,1] 반환 */
export function scoreToBlendedAxisRatio(
  axisKey: SecondaryAxisKey,
  score: number,
  blend: number = RADAR_AXIS_SCALE_BLEND,
): number {
  const linear = Math.max(0, Math.min(100, score)) / 100;
  const expanded = scoreToAxisRatio(axisKey, score);
  const t = Math.max(0, Math.min(1, blend));
  return linear * (1 - t) + expanded * t;
}
