import type { ChartContext } from "@/lib/saju/chartContext";
import type { CrossChartHit } from "@/lib/saju/pairChartAnalysis";

/** 원진살 branch pairs (code_a → code_b) — SSOT */
const WONJIN_PAIRS = new Set(
  [
    ["ja", "myo"],
    ["chuk", "in"],
    ["in", "chuk"],
    ["myo", "ja"],
    ["jin", "yu"],
    ["sa", "sin"],
    ["o", "hae"],
    ["mi", "sul"],
    ["sin", "sa"],
    ["yu", "jin"],
    ["sul", "mi"],
    ["hae", "o"],
  ].map(([a, b]) => `${a}-${b}`),
);

/** 귀문관살 branch pairs — SSOT */
const GUIMUN_PAIRS = new Set(
  [
    ["ja", "yu"],
    ["chuk", "o"],
    ["in", "mi"],
    ["myo", "sin"],
    ["jin", "hae"],
    ["sa", "sul"],
  ].map(([a, b]) => [a, b].sort().join("-")),
);

/** 旬空 — 일주 기준 공망 지지 */
const XUNKONG_BY_DAY_BRANCH: Record<string, [string, string]> = {
  ja: ["sul", "hae"],
  chuk: ["sul", "hae"],
  in: ["ja", "chuk"],
  myo: ["ja", "chuk"],
  jin: ["in", "myo"],
  sa: ["in", "myo"],
  o: ["jin", "sa"],
  mi: ["jin", "sa"],
  sin: ["o", "mi"],
  yu: ["o", "mi"],
  sul: ["sin", "yu"],
  hae: ["sin", "yu"],
};

export function branchPairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

/** 원진살 여부 (지지 코드 쌍) */
export function isWonjin(a: string, b: string): boolean {
  return WONJIN_PAIRS.has(`${a}-${b}`) || WONJIN_PAIRS.has(`${b}-${a}`);
}

/** 귀문관살 여부 (지지 코드 쌍) */
export function isGuimun(a: string, b: string): boolean {
  return GUIMUN_PAIRS.has(branchPairKey(a, b));
}

export function hasWonjinOrGuimun(a: string, b: string): boolean {
  return isWonjin(a, b) || isGuimun(a, b);
}

type ChartPairSelector = (
  chartA: ChartContext,
  chartB: ChartContext,
) => [string, string];

function detectAcrossBranchPairs(
  chartA: ChartContext,
  chartB: ChartContext,
  selectors: ChartPairSelector[],
  includeMonthCheck: boolean,
): boolean {
  for (const select of selectors) {
    const [a, b] = select(chartA, chartB);
    if (hasWonjinOrGuimun(a, b)) return true;
  }
  if (includeMonthCheck) {
    const month = detectMonthWonjinGuimun(chartA, chartB);
    if (month.wonjin || month.guimun) return true;
  }
  return false;
}

/** 친구 탭 — 일지·월지 교차 원진/귀문 */
export function detectFriendWonjinGuimun(
  chartA: ChartContext,
  chartB: ChartContext,
): boolean {
  return detectAcrossBranchPairs(chartA, chartB, [
    (a, b) => [a.dayBranchCode, b.dayBranchCode],
    (a, b) => [a.monthBranchCode, b.monthBranchCode],
  ], true);
}

/** 결혼/동거 탭 — 일지·시지 교차 원진/귀문 */
export function detectMarriageWonjinGuimun(
  chartA: ChartContext,
  chartB: ChartContext,
): boolean {
  return detectAcrossBranchPairs(chartA, chartB, [
    (a, b) => [a.dayBranchCode, b.dayBranchCode],
    (a, b) => [a.hourBranchCode, b.hourBranchCode],
    (a, b) => [a.dayBranchCode, b.hourBranchCode],
    (a, b) => [a.hourBranchCode, b.dayBranchCode],
  ], true);
}

/** 가족 탭 — 부모·자녀 일지·월지 교차 원진/귀문 (월지 충/형은 호출측 추가) */
export function detectFamilyWonjinGuimunBranches(
  chartParent: ChartContext,
  chartChild: ChartContext,
): boolean {
  return detectAcrossBranchPairs(chartParent, chartChild, [
    (p, c) => [p.dayBranchCode, c.dayBranchCode],
    (p, c) => [p.monthBranchCode, c.monthBranchCode],
    (p, c) => [p.dayBranchCode, c.monthBranchCode],
    (p, c) => [p.monthBranchCode, c.dayBranchCode],
  ], true);
}

/** 원국 내 anchor 지지와 다른 지지 간 귀문 여부 */
export function hasGuimunOnPalaceAnchors(
  chart: ChartContext,
  anchorBranches: string[],
): boolean {
  for (const anchor of anchorBranches) {
    if (!anchor) continue;
    for (const br of chart.branchCodes) {
      if (br !== anchor && isGuimun(anchor, br)) return true;
    }
  }
  return false;
}

/** 일지·시지 anchor 기준 귀문 (침실 프로필용) */
export function hasGuimunOnDayHourPalaces(chart: ChartContext): boolean {
  return hasGuimunOnPalaceAnchors(chart, [
    chart.dayBranchCode,
    chart.hourBranchCode,
  ]);
}

function voidBranchesForChart(chart: ChartContext): string[] {
  return XUNKONG_BY_DAY_BRANCH[chart.dayBranchCode] ?? [];
}

/** 상대 공망이 나의 유효 지지(월·일)를 건드리는지 */
export function detectGongmangCrossHit(
  chartSelf: ChartContext,
  chartOther: ChartContext,
): boolean {
  const voidBranches = voidBranchesForChart(chartSelf);
  if (!voidBranches.length) return false;
  const selfKeyBranches = new Set([
    chartSelf.monthBranchCode,
    chartSelf.dayBranchCode,
  ]);
  for (const branch of chartOther.branchCodes) {
    if (voidBranches.includes(branch) && selfKeyBranches.has(branch)) {
      return true;
    }
  }
  for (const p of chartOther.pillars) {
    if (voidBranches.includes(p.branchCode)) {
      if (
        chartSelf.monthBranchCode === p.branchCode ||
        chartSelf.dayBranchCode === p.branchCode
      ) {
        return true;
      }
    }
  }
  return false;
}

export function detectMonthWonjinGuimun(
  chartA: ChartContext,
  chartB: ChartContext,
): { wonjin: boolean; guimun: boolean } {
  const a = chartA.monthBranchCode;
  const b = chartB.monthBranchCode;
  return {
    wonjin: isWonjin(a, b),
    guimun: isGuimun(a, b),
  };
}

export function monthCrossIsType(
  hit: CrossChartHit | null,
  types: string[],
): boolean {
  return Boolean(hit && types.includes(hit.type));
}

export function monthCrossHitsOfType(
  hits: CrossChartHit[],
  types: string[],
  requireBothMonth = false,
): CrossChartHit | null {
  for (const h of hits) {
    if (!types.includes(h.type)) continue;
    if (requireBothMonth) {
      if (
        h.personA_pillar.startsWith("월주") &&
        h.personB_pillar.startsWith("월주")
      ) {
        return h;
      }
    } else if (
      h.personA_pillar.startsWith("월주") ||
      h.personB_pillar.startsWith("월주")
    ) {
      return h;
    }
  }
  return null;
}
