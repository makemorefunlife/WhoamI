import type { CrossChartHit } from "@/lib/saju/pairChartAnalysis";

/** 궁위 가중치 — 연인 해석에서 일주·월주 신호 우선 */
export const PALACE_WEIGHT: Record<string, number> = {
  일주: 1.0,
  월주: 0.75,
  시주: 0.45,
  년주: 0.4,
};

export function parsePillarPalaceName(label: string): string {
  const m = label.match(/^(년주|월주|일주|시주)/);
  return m?.[1] ?? "";
}

export function palaceWeightForName(palace: string): number {
  return PALACE_WEIGHT[palace] ?? 0.4;
}

/** cross hit 양쪽 궁위 중 더 가까운(높은) 가중치 */
export function crossHitPalaceWeight(hit: CrossChartHit): number {
  const wa = palaceWeightForName(parsePillarPalaceName(hit.personA_pillar));
  const wb = palaceWeightForName(parsePillarPalaceName(hit.personB_pillar));
  return Math.max(wa, wb);
}

export function isPrimaryPalaceCross(hit: CrossChartHit): boolean {
  return crossHitPalaceWeight(hit) >= 0.75;
}

export function weightedCrossPriority(hit: CrossChartHit): number {
  return Math.round(hit.priority * crossHitPalaceWeight(hit));
}
