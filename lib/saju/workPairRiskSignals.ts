import type { ChartContext } from "@/lib/saju/chartContext";
import type { CrossChartHit } from "@/lib/saju/pairChartAnalysis";

/** 원진살 branch pairs (code_a → code_b) */
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

/** 귀문관살 branch pairs */
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

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function isWonjin(a: string, b: string): boolean {
  return WONJIN_PAIRS.has(`${a}-${b}`) || WONJIN_PAIRS.has(`${b}-${a}`);
}

function isGuimun(a: string, b: string): boolean {
  return GUIMUN_PAIRS.has(pairKey(a, b));
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
