/**
 * Family Part2 C — guidance_balance person/pair SSOT.
 *
 * Marriage `parenting_style_lean`(food vs seal+officer 2분류)과 **다른** 신호다.
 * Family는 지도·돌봄 순간의 자연스러운 채널을 seal / food / officer 상대 우세로 본다.
 * parentRole·wealth 가중 없음. 신규 수치 threshold 없음(동점 → mixed만).
 */

import {
  profileTenGods,
  type TenGodCounts,
} from "@/lib/relationship/marriage/marriageTenGodAnalysis";

/** 감정 수용(印) · 설명·대화(식상) · 기준 제시(관) · 동점 혼합 */
export type GuidanceMode = "receptive" | "explanatory" | "standards" | "mixed";

export type GuidanceProfile = {
  scores: {
    receptive: number;
    explanatory: number;
    standards: number;
  };
  mode: GuidanceMode;
};

export type GuidanceFit = "aligned" | "partial" | "mismatch";

/**
 * Person guidance profile.
 *
 * Raw: profileTenGods.seal / .food / .officer (기존 primitive 재사용)
 * → scores
 * → mode = 단일 최댓값; 최댓값이 둘 이상이면 mixed
 *
 * wealth·self는 지도 채널이 아니라 제외. mother/father 가중 없음.
 */
export function resolveGuidanceProfile(counts: TenGodCounts): GuidanceProfile {
  const p = profileTenGods(counts);
  const scores = {
    receptive: p.seal,
    explanatory: p.food,
    standards: p.officer,
  };
  const entries: Array<[Exclude<GuidanceMode, "mixed">, number]> = [
    ["receptive", scores.receptive],
    ["explanatory", scores.explanatory],
    ["standards", scores.standards],
  ];
  const max = Math.max(...entries.map(([, n]) => n));
  const leaders = entries.filter(([, n]) => n === max).map(([m]) => m);
  return {
    scores,
    mode: leaders.length === 1 ? leaders[0]! : "mixed",
  };
}

/**
 * Pair guidance fit — 두 person mode만 비교. 원국 재가중 없음.
 * - same → aligned
 * - 한쪽이라도 mixed → partial
 * - 서로 다른 순수 mode → mismatch
 */
export function resolveGuidanceFit(
  modeA: GuidanceMode,
  modeB: GuidanceMode,
): GuidanceFit {
  if (modeA === modeB) return "aligned";
  if (modeA === "mixed" || modeB === "mixed") return "partial";
  return "mismatch";
}
