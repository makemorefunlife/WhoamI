import { REF_EARTHLY_BRANCHES, REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import type { ChartContext } from "@/lib/saju/chartContext";

/**
 * 십간·십이지 → 오행 매핑의 단일 소스.
 * (이전에 pairChartAnalysis.ts / workPairAnalysis.ts / romanticSajuDerivations.ts
 * 3곳에 각자 복제되어 있던 Map을 여기로 통합)
 */
export const ELEMENT_KO: Record<string, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};

export const stemElement = new Map<string, string>(
  REF_HEAVENLY_STEMS.map((r) => [r.code, r.element as string]),
);
export const branchElement = new Map<string, string>(
  REF_EARTHLY_BRANCHES.map((r) => [r.code, r.element as string]),
);

/** 오행 상생(生) 순환 — key가 value를 낳음 */
export const ELEMENT_GENERATES: Record<string, string> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

/** 오행 상극(剋) 순환 — key가 value를 누름 */
export const ELEMENT_OVERCOMES: Record<string, string> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};

/** 오행 상생·상극 (천간·지지 오행 간) */
export function elementInteraction(a: string, b: string): string {
  if (ELEMENT_GENERATES[a] === b) return `${ELEMENT_KO[a]}이(가) ${ELEMENT_KO[b]}을(를) 살림(상생)`;
  if (ELEMENT_GENERATES[b] === a) return `${ELEMENT_KO[b]}이(가) ${ELEMENT_KO[a]}을(를) 살림(상생)`;
  if (ELEMENT_OVERCOMES[a] === b) return `${ELEMENT_KO[a]}이(가) ${ELEMENT_KO[b]}을(를) 누름(상극·긴장)`;
  if (ELEMENT_OVERCOMES[b] === a) return `${ELEMENT_KO[b]}이(가) ${ELEMENT_KO[a]}을(를) 누름(상극·긴장)`;
  if (a === b) return `같은 ${ELEMENT_KO[a]} 기운 — 공감·동질감과 경쟁·고집이 함께 올 수 있음`;
  return "직접 상생·상극은 약함 — 다른 기둥·지지 관계로 보완";
}

/** 4주(8글자) 전체의 오행 개수 — 지장간 미포함, 계절(월지) 가중치 없음 */
export function countElements(chart: ChartContext): Record<string, number> {
  const counts: Record<string, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };
  for (const p of chart.pillars) {
    const se = stemElement.get(p.stemCode);
    const be = branchElement.get(p.branchCode);
    if (se) counts[se] = (counts[se] ?? 0) + 1;
    if (be) counts[be] = (counts[be] ?? 0) + 1;
  }
  return counts;
}
