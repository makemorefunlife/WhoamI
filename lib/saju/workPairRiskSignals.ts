import type { ChartContext, PillarSlot } from "@/lib/saju/chartContext";
import type { CrossChartHit } from "@/lib/saju/pairChartAnalysis";
import { crossHitPalaceWeight, weightedCrossPriority } from "@/lib/saju/palaceWeight";
import { voidBranchesForDayPillar } from "@/lib/personCore/individualSaju/gongmang";

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

/**
 * Gongmang voids — Individual SSOT method `xunkong_by_day_pillar_v1`
 * (day stem + day branch). Legacy day-branch-only table removed (Pair N1).
 */
function voidBranchesForChart(chart: ChartContext): string[] {
  return voidBranchesForDayPillar(chart.dayStemCode, chart.dayBranchCode);
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

const WONJIN_INTERPRETATION_KO =
  "무의식적으로 서로를 답답하게 느끼거나 사소한 일에 예민해지기 쉬운 조합입니다.";
const GUIMUN_INTERPRETATION_KO =
  "설명하기 어려운 강한 이끌림과 신경이 곤두서는 듯한 예민함이 함께 나타날 수 있는 조합입니다.";
const WONJIN_PRIORITY = 60;
const GUIMUN_PRIORITY = 65;

/**
 * 원진/귀문 교차(A×B) — 4×4=16 궁위 전체. isWonjin/isGuimun은 순수 지지쌍
 * 판정이라 어느 궁위 조합에도 그대로 적용 가능 — 결혼/친구 탭 전용 wrapper
 * (day/hour+month만 보는 좁은 궁위 제한)를 따르지 않고 전체 궁위를 본다.
 */
export function analyzeCrossChartWonjinGuimun(
  chartA: ChartContext,
  chartB: ChartContext,
): CrossChartHit[] {
  const hits: CrossChartHit[] = [];

  for (const pa of chartA.pillars) {
    for (const pb of chartB.pillars) {
      const isW = isWonjin(pa.branchCode, pb.branchCode);
      const isG = !isW && isGuimun(pa.branchCode, pb.branchCode);
      if (!isW && !isG) continue;
      const type = isW ? "원진" : "귀문";
      const basePriority = isW ? WONJIN_PRIORITY : GUIMUN_PRIORITY;
      const hit: CrossChartHit = {
        personA_pillar: `${pa.name}(${pa.pillar})`,
        personB_pillar: `${pb.name}(${pb.pillar})`,
        type,
        interpretation: isW ? WONJIN_INTERPRETATION_KO : GUIMUN_INTERPRETATION_KO,
        priority: basePriority,
        palaceWeight: 0,
        weightedPriority: basePriority,
        category: "wonjin_guimun",
        personA_pillarSlot: pa.name as PillarSlot,
        personA_code: pa.branchCode,
        personB_pillarSlot: pb.name as PillarSlot,
        personB_code: pb.branchCode,
      };
      hit.palaceWeight = crossHitPalaceWeight(hit);
      hit.weightedPriority = weightedCrossPriority(hit);
      hits.push(hit);
    }
  }

  return hits.sort((a, b) => b.weightedPriority - a.weightedPriority);
}

const GONGMANG_INTERPRETATION_KO =
  "한쪽의 공망(비어 있는) 지지가 상대 쪽 원국에서 다시 나타나는 자리라, 그 영역이 상대로 인해 채워지거나 흔들리는 감각으로 경험될 수 있습니다.";
const GONGMANG_PRIORITY = 55;

function gongmangHitsOneDirection(
  chartSelf: ChartContext,
  chartOther: ChartContext,
  selfLabel: "A" | "B",
): CrossChartHit[] {
  const voidBranches = voidBranchesForChart(chartSelf);
  if (!voidBranches.length) return [];

  const selfKeyPillars = chartSelf.pillars.filter(
    (p) =>
      (p.name === "월주" && p.branchCode === chartSelf.monthBranchCode) ||
      (p.name === "일주" && p.branchCode === chartSelf.dayBranchCode),
  );
  if (selfKeyPillars.length === 0) return [];

  const hits: CrossChartHit[] = [];
  for (const selfPillar of selfKeyPillars) {
    if (!voidBranches.includes(selfPillar.branchCode)) continue;
    for (const otherPillar of chartOther.pillars) {
      if (otherPillar.branchCode !== selfPillar.branchCode) continue;
      const [pa, pb] =
        selfLabel === "A" ? [selfPillar, otherPillar] : [otherPillar, selfPillar];
      const hit: CrossChartHit = {
        personA_pillar: `${pa.name}(${pa.pillar})`,
        personB_pillar: `${pb.name}(${pb.pillar})`,
        type: "공망",
        interpretation: GONGMANG_INTERPRETATION_KO,
        priority: GONGMANG_PRIORITY,
        palaceWeight: 0,
        weightedPriority: GONGMANG_PRIORITY,
        category: "gongmang",
        personA_pillarSlot: pa.name as PillarSlot,
        personA_code: pa.branchCode,
        personB_pillarSlot: pb.name as PillarSlot,
        personB_code: pb.branchCode,
        detail: selfLabel === "A" ? "A 공망 → B 재적중" : "B 공망 → A 재적중",
      };
      hit.palaceWeight = crossHitPalaceWeight(hit);
      hit.weightedPriority = weightedCrossPriority(hit);
      hits.push(hit);
    }
  }
  return hits;
}

/**
 * 공망(空亡) 교차 상세 — detectGongmangCrossHit과 같은 판정(자신의 월/일지가
 * 스스로의 공망이면서 상대 원국에 같은 지지가 다시 나타나는지)이지만 궁위·
 * confidence(궁위 가중치)까지 보존한다. 양방향(A공망→B, B공망→A) 모두 포함.
 */
export function analyzeCrossChartGongmang(
  chartA: ChartContext,
  chartB: ChartContext,
): CrossChartHit[] {
  return [
    ...gongmangHitsOneDirection(chartA, chartB, "A"),
    ...gongmangHitsOneDirection(chartB, chartA, "B"),
  ].sort((a, b) => b.weightedPriority - a.weightedPriority);
}
