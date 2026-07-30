import {
  REF_EARTHLY_BRANCHES,
  REF_HEAVENLY_STEMS,
  REF_RELATION_RULES,
} from "@/lib/hardcoded/sajuReferenceData";
import {
  type ChartContext,
  TRIO_BRANCH_GROUPS,
  buildChartContext,
  type SajuPillars,
} from "@/lib/saju/chartContext";
import {
  analyzePairSaju,
  countElements,
  resolveDominantElement,
  elementInteraction,
  type CrossChartHit,
  type PairSajuAnalysis,
} from "@/lib/saju/pairChartAnalysis";
import { analyzeIntraChartPalaceHits } from "@/lib/saju/marriageAnalysis";
import {
  detectFamilyWonjinGuimunBranches,
  isGuimun,
  isWonjin,
} from "@/lib/saju/workPairRiskSignals";
import type { FamilyParentRole } from "@/lib/relationship/familyParent/types";
import type { TenGodCounts } from "@/lib/relationship/familyParent/familyParentTenGodAnalysis";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";

const stemElement = new Map(
  REF_HEAVENLY_STEMS.map((r) => [r.code, r.element as string]),
);
const branchElement = new Map(
  REF_EARTHLY_BRANCHES.map((r) => [r.code, r.element as string]),
);

function getStemEl(code: string): string {
  return stemElement.get(code as never) ?? "earth";
}

function getBranchEl(code: string): string {
  return branchElement.get(code as never) ?? "earth";
}

const COMBINE_TYPES = new Set(["육합", "삼합", "방합"]);
const TENSION_TYPES = new Set(["충", "형", "해", "파"]);

export type FamilyScoringSignals = {
  hasDayBranchCombine: boolean;
  hasJohuElementSupport: boolean;
  hasDayMonthTensionBond: boolean;
  hasParentBoostsChildTalent: boolean;
  hasTemperamentComplement: boolean;
  hasParentOvercontrol: boolean;
  hasDayMonthPalaceChungHyung: boolean;
  hasWonjinOrGuimun: boolean;
  hasParentTemperatureExtreme: boolean;
  hasStrongParentChildCombine: boolean;
  hasStrongParentChildClash: boolean;
  /** 엄마 렌즈 — 자녀 인성(印) 동태 */
  childSealStrong: boolean;
  parentSupportsChildSeal: boolean;
  /** 아빠 렌즈 — 자녀 재성(財) 동태 */
  childWealthStrong: boolean;
  parentSupportsChildWealth: boolean;
};

export type ChildInnerSignals = {
  hasWonjinGuimunIntra: boolean;
  hasExcessSeal: boolean;
  hasExcessFoodOrOfficer: boolean;
  hasStrongFocusStyle: boolean;
  hasLateBloomerPotential: boolean;
  dominantArchetype: "wood" | "fire" | "earth" | "metal" | "water";
  communicationStyle: "expressive" | "analytical" | "sensitive" | "steady" | "playful";
};

export type FamilyPairSajuAnalysis = {
  base: PairSajuAnalysis;
  chartParent: ChartContext;
  chartChild: ChartContext;
  parentRole: FamilyParentRole;
  crossHits: CrossChartHit[];
  scoringSignals: FamilyScoringSignals;
  childSignals: ChildInnerSignals;
  intraChildHits: CrossChartHit[];
};

type RelationRuleRow = {
  relation_type: string;
  code_a: string;
  code_b: string;
  meaning_ko: string | null;
};

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function findBranchRule(type: string, a: string, b: string): RelationRuleRow | null {
  const key = pairKey(a, b);
  return (
    (REF_RELATION_RULES as unknown as RelationRuleRow[]).find(
      (r) =>
        r.relation_type === type && pairKey(r.code_a, r.code_b) === key,
    ) ?? null
  );
}

function chartTemperature(
  chart: ChartContext,
): "cold" | "hot" | "neutral" {
  const el = countElements(chart);
  const cold = (el.water ?? 0) + (el.metal ?? 0);
  const hot = (el.fire ?? 0) + (el.wood ?? 0);
  if (cold >= hot + 2) return "cold";
  if (hot >= cold + 2) return "hot";
  return "neutral";
}

function branchesInSameTrio(a: string, b: string): boolean {
  for (const group of Object.values(TRIO_BRANCH_GROUPS)) {
    const codes = group as readonly string[];
    if (codes.includes(a) && codes.includes(b) && a !== b) return true;
  }
  return false;
}

function crossDayBranchCombine(parent: ChartContext, child: ChartContext): boolean {
  const a = parent.dayBranchCode;
  const b = child.dayBranchCode;
  if (findBranchRule("branch_six_combine", a, b)) return true;
  if (findBranchRule("branch_direction_combine", a, b)) return true;
  if (branchesInSameTrio(a, b)) return true;
  return false;
}

function johuSupport(parent: ChartContext, child: ChartContext): boolean {
  const elA = getBranchEl(parent.dayBranchCode);
  const elB = getBranchEl(child.dayBranchCode);
  const interaction = elementInteraction(elA, elB);
  if (!interaction.includes("상생")) return false;
  const tempA = chartTemperature(parent);
  const tempB = chartTemperature(child);
  return (
    (tempA === "cold" && tempB === "hot") ||
    (tempA === "hot" && tempB === "cold") ||
    tempA === "neutral" ||
    tempB === "neutral"
  );
}

function filterPalaceCross(
  hits: CrossChartHit[],
  palaces: string[],
): CrossChartHit[] {
  return hits.filter(
    (h) =>
      palaces.some(
        (p) =>
          h.personA_pillar.startsWith(p) || h.personB_pillar.startsWith(p),
      ),
  );
}

function hasPalaceTension(
  hits: CrossChartHit[],
  types: string[],
  includeWonjinPair?: [string, string],
): boolean {
  if (
    includeWonjinPair &&
    isWonjin(includeWonjinPair[0], includeWonjinPair[1])
  ) {
    return true;
  }
  return hits.some((h) => types.includes(h.type));
}

function detectWonjinGuimunCross(
  parent: ChartContext,
  child: ChartContext,
  cross: CrossChartHit[],
): boolean {
  if (detectFamilyWonjinGuimunBranches(parent, child)) return true;
  return cross.some(
    (h) =>
      (h.type === "충" || h.type === "형") &&
      (h.personA_pillar.startsWith("일주") ||
        h.personB_pillar.startsWith("일주") ||
        h.personA_pillar.startsWith("월주") ||
        h.personB_pillar.startsWith("월주")),
  );
}

function elementGenerates(source: string, target: string): boolean {
  const generates: Record<string, string> = {
    wood: "fire",
    fire: "earth",
    earth: "metal",
    metal: "water",
    water: "wood",
  };
  return generates[source] === target;
}

function parentBoostsChildTalent(
  parent: ChartContext,
  child: ChartContext,
  childCounts: TenGodCounts,
): boolean {
  const childProfile = profileTenGods(childCounts);
  const parentEl = getStemEl(parent.dayStemCode);
  const childEl = getStemEl(child.dayStemCode);
  if (elementGenerates(parentEl, childEl)) return true;

  const talentEl = dominantChildTalentElement(childCounts, child);
  if (talentEl && elementGenerates(parentEl, talentEl)) return true;

  if (childProfile.food >= 2 && parentEl === childEl) return true;
  if (childProfile.seal >= 2 && elementGenerates(parentEl, childEl)) return true;
  return false;
}

function dominantChildTalentElement(
  counts: TenGodCounts,
  child: ChartContext,
): string | null {
  const p = profileTenGods(counts);
  const scores: [string, number][] = [
    ["wood", p.self + (counts["식신"] ?? 0) + (counts["상관"] ?? 0)],
    ["fire", p.food],
    ["earth", p.seal],
    ["metal", p.officer],
    ["water", p.wealth],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  if ((scores[0]?.[1] ?? 0) <= 0) {
    const el = countElements(child);
    const top = Object.entries(el).sort((a, b) => b[1] - a[1])[0];
    return top?.[0] ?? null;
  }
  return scores[0]![0];
}

function temperamentComplement(
  parent: ChartContext,
  child: ChartContext,
): boolean {
  const elP = countElements(parent);
  const elC = countElements(child);
  for (const k of ["wood", "fire", "earth", "metal", "water"] as const) {
    if ((elP[k] ?? 0) <= 1 && (elC[k] ?? 0) >= 2) return true;
    if ((elC[k] ?? 0) <= 1 && (elP[k] ?? 0) >= 2) return true;
  }
  return false;
}

function parentOvercontrol(
  parentCounts: TenGodCounts,
  childCounts: TenGodCounts,
): boolean {
  const p = profileTenGods(parentCounts);
  const c = profileTenGods(childCounts);
  return p.officer >= 3 && c.food >= 2;
}

/**
 * 부모 일간이 자녀 일간의 인성(印) 오행을 생·동하는지.
 * childEl은 반드시 자녀 day stem — parent day stem을 쓰면 지원 판정이 왜곡된다.
 */
export function parentSupportsSeal(
  parent: ChartContext,
  child: ChartContext,
  childSealStrong: boolean,
): boolean {
  if (!childSealStrong) return false;
  const parentEl = getStemEl(parent.dayStemCode);
  const childEl = getStemEl(child.dayStemCode);
  const sealEl = generatingElement(childEl);
  return elementGenerates(parentEl, sealEl) || parentEl === sealEl;
}

/**
 * 부모 일간이 자녀 일간의 재성(財) 오행을 생·동하는지.
 * childEl은 반드시 자녀 day stem.
 */
export function parentSupportsWealth(
  parent: ChartContext,
  child: ChartContext,
  childWealthStrong: boolean,
): boolean {
  if (!childWealthStrong) return false;
  const parentEl = getStemEl(parent.dayStemCode);
  const childEl = getStemEl(child.dayStemCode);
  const wealthEl = overcomeElement(childEl);
  return elementGenerates(parentEl, wealthEl) || parentEl === wealthEl;
}

function generatingElement(el: string): string {
  const map: Record<string, string> = {
    wood: "water",
    fire: "wood",
    earth: "fire",
    metal: "earth",
    water: "metal",
  };
  return map[el] ?? el;
}

function overcomeElement(el: string): string {
  const map: Record<string, string> = {
    wood: "earth",
    fire: "metal",
    earth: "water",
    metal: "wood",
    water: "fire",
  };
  return map[el] ?? el;
}

function detectStrongCombine(cross: CrossChartHit[]): boolean {
  return cross.some(
    (h) =>
      COMBINE_TYPES.has(h.type) &&
      (h.personA_pillar.startsWith("일주") ||
        h.personB_pillar.startsWith("일주") ||
        h.personA_pillar.startsWith("월주") ||
        h.personB_pillar.startsWith("월주")),
  );
}

function detectStrongClash(cross: CrossChartHit[]): boolean {
  return cross.some(
    (h) =>
      (h.type === "충" || h.type === "형") &&
      (h.personA_pillar.startsWith("일주") ||
        h.personB_pillar.startsWith("월주")),
  );
}

function buildChildInnerSignals(
  child: ChartContext,
  childCounts: TenGodCounts,
  intraHits: CrossChartHit[],
): ChildInnerSignals {
  const p = profileTenGods(childCounts);
  const { dominant } = resolveDominantElement(child);

  const branches = Array.from(child.branchCodes);
  let wonjinGuimun = false;
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      if (isWonjin(branches[i]!, branches[j]!) || isGuimun(branches[i]!, branches[j]!)) {
        wonjinGuimun = true;
        break;
      }
    }
  }

  const stemComm: ChildInnerSignals["communicationStyle"] =
    dominant === "fire" || dominant === "wood"
      ? "expressive"
      : dominant === "metal"
        ? "analytical"
        : dominant === "water"
          ? "sensitive"
          : dominant === "earth"
            ? "steady"
            : "playful";

  return {
    hasWonjinGuimunIntra: wonjinGuimun,
    hasExcessSeal: p.seal >= 3 || (childCounts["편인"] ?? 0) >= 2,
    hasExcessFoodOrOfficer: p.food >= 3 || p.officer >= 3,
    hasStrongFocusStyle: p.seal >= 2 && p.officer >= 1 && p.food < 2,
    hasLateBloomerPotential:
      (childCounts["편관"] ?? 0) >= 1 ||
      p.self >= 2 ||
      chartTemperature(child) === "cold",
    dominantArchetype: dominant,
    communicationStyle: stemComm,
  };
}

/**
 * 부모-자녀 사주 페어 분석 — parentRole(엄마/아빠) 렌즈 가중
 */
export function analyzeFamilyPairSaju(
  parentPillars: SajuPillars,
  childPillars: SajuPillars,
  parentRole: FamilyParentRole,
  childCounts: TenGodCounts = {},
  parentCounts: TenGodCounts = {},
  prebuilt?: {
    chartA: ChartContext;
    chartB: ChartContext;
    pairAnalysis: PairSajuAnalysis;
  },
): FamilyPairSajuAnalysis {
  const chartParent = prebuilt?.chartA ?? buildChartContext(parentPillars);
  const chartChild = prebuilt?.chartB ?? buildChartContext(childPillars);
  const base =
    prebuilt?.pairAnalysis ??
    analyzePairSaju(parentPillars, childPillars, {
      chartA: chartParent,
      chartB: chartChild,
    });
  const cross = base.allCrossHits;

  const dayMonthHits = filterPalaceCross(cross, ["일주", "월주"]);
  const hasDayCombine = crossDayBranchCombine(chartParent, chartChild);
  const hasJohu = johuSupport(chartParent, chartChild);
  const dayMonthTension = hasPalaceTension(dayMonthHits, ["충", "형"], [
    chartParent.dayBranchCode,
    chartChild.dayBranchCode,
  ]) || isWonjin(chartParent.monthBranchCode, chartChild.monthBranchCode);

  const childProfile = profileTenGods(childCounts);
  const childSealStrong = childProfile.seal >= 2;
  const childWealthStrong = childProfile.wealth >= 2;

  const scoringSignals: FamilyScoringSignals = {
    hasDayBranchCombine: hasDayCombine,
    hasJohuElementSupport: hasJohu,
    hasDayMonthTensionBond: dayMonthTension,
    hasParentBoostsChildTalent: parentBoostsChildTalent(
      chartParent,
      chartChild,
      childCounts,
    ),
    hasTemperamentComplement: temperamentComplement(chartParent, chartChild),
    hasParentOvercontrol: parentOvercontrol(parentCounts, childCounts),
    hasDayMonthPalaceChungHyung: hasPalaceTension(dayMonthHits, ["충", "형"]),
    hasWonjinOrGuimun: detectWonjinGuimunCross(chartParent, chartChild, cross),
    hasParentTemperatureExtreme:
      chartTemperature(chartParent) !== "neutral",
    hasStrongParentChildCombine: detectStrongCombine(cross),
    hasStrongParentChildClash: detectStrongClash(cross),
    childSealStrong,
    parentSupportsChildSeal: parentSupportsSeal(
      chartParent,
      chartChild,
      childSealStrong,
    ),
    childWealthStrong,
    parentSupportsChildWealth: parentSupportsWealth(
      chartParent,
      chartChild,
      childWealthStrong,
    ),
  };

  const intraChildHits = analyzeIntraChartPalaceHits(chartChild);
  const childSignals = buildChildInnerSignals(
    chartChild,
    childCounts,
    intraChildHits,
  );

  if (parentRole === "mother") {
    if (childSealStrong && !scoringSignals.hasParentBoostsChildTalent) {
      scoringSignals.hasParentBoostsChildTalent =
        scoringSignals.parentSupportsChildSeal;
    }
  } else if (childWealthStrong && !scoringSignals.hasParentBoostsChildTalent) {
    scoringSignals.hasParentBoostsChildTalent =
      scoringSignals.parentSupportsChildWealth;
  }

  return {
    base,
    chartParent,
    chartChild,
    parentRole,
    crossHits: cross,
    scoringSignals,
    childSignals,
    intraChildHits,
  };
}

/** 하위 호환 — parentRole 기본 mother */
export function analyzeFamilyParentPairSaju(
  parentPillars: SajuPillars,
  childPillars: SajuPillars,
  parentRole: FamilyParentRole = "mother",
  childCounts: TenGodCounts = {},
  parentCounts: TenGodCounts = {},
): FamilyPairSajuAnalysis {
  return analyzeFamilyPairSaju(
    parentPillars,
    childPillars,
    parentRole,
    childCounts,
    parentCounts,
  );
}
