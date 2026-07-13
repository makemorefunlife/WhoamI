import {
  REF_EARTHLY_BRANCHES,
  REF_HEAVENLY_STEMS,
  REF_RELATION_RULES,
} from "@/lib/hardcoded/sajuReferenceData";
import {
  type ChartContext,
  buildChartContext,
  type SajuPillars,
} from "@/lib/saju/chartContext";
import {
  analyzePairSaju,
  countElements,
  elementInteraction,
  type CrossChartHit,
  type PairSajuAnalysis,
} from "@/lib/saju/pairChartAnalysis";
import {
  detectGongmangCrossHit,
  detectMarriageWonjinGuimun,
} from "@/lib/saju/workPairRiskSignals";

const stemElement = new Map<string, string>(
  REF_HEAVENLY_STEMS.map((r) => [r.code, r.element as string]),
);
const branchElement = new Map<string, string>(
  REF_EARTHLY_BRANCHES.map((r) => [r.code, r.element as string]),
);

const YEOMA_BRANCHES = new Set(["in", "sin", "ja", "hae"]);
const COMBINE_TYPES = new Set(["육합", "삼합", "방합"]);
const TENSION_TYPES = new Set(["충", "형", "해", "파"]);

/** 동거/결혼 — 궁위 가중 (일주 1.0 · 시주 0.9 · 월주 0.7 · 년주 0.5) */
export const MARRIAGE_STEM_PALACE_WEIGHT: Record<string, number> = {
  일주: 1.0,
  시주: 0.9,
  월주: 0.7,
  년주: 0.5,
};

export const MARRIAGE_DAY_BRANCH_WEIGHT = 1.0;
export const MARRIAGE_HOUR_BRANCH_WEIGHT = 0.85;
export const MARRIAGE_OTHER_PALACE_BRANCH_WEIGHT = 0.35;

export type MarriageDayBranchAnalysis = {
  directDayCross: CrossChartHit | null;
  dayBranchElementInteraction: string;
  dayCrossHits: CrossChartHit[];
  hasDayBranchCombine: boolean;
  hasDayBranchChungHyung: boolean;
  hasJohuComplement: boolean;
  bedFitLevel: "excellent" | "good" | "needs_tune";
  synergyWeight: number;
  tensionWeight: number;
};

export type MarriageHourBranchAnalysis = {
  directHourCross: CrossChartHit | null;
  hourCrossHits: CrossChartHit[];
  homePalaceTension: boolean;
  synergyWeight: number;
  tensionWeight: number;
};

export type MarriageStemIntimacyAnalysis = {
  dayStemSupport: boolean;
  dayStemClash: boolean;
  attachmentLeanA: "secure" | "anxious" | "avoidant";
  attachmentLeanB: "secure" | "anxious" | "avoidant";
};

export type MarriageScoringSignals = {
  hasDayBranchCombine: boolean;
  hasDayBranchJohuComplement: boolean;
  hasDayStemMutualSupport: boolean;
  hasDayBranchChungHyung: boolean;
  hasWealthOfficerComplement: boolean;
  hasFoodSealHarmony: boolean;
  hasWealthOfficerPowerStruggle: boolean;
  hasDayHourHomeTension: boolean;
  hasWonjinOrGuimun: boolean;
  hasGongmangOverlap: boolean;
};

export type MarriagePairSajuAnalysis = {
  base: PairSajuAnalysis;
  chartA: ChartContext;
  chartB: ChartContext;
  dayBranch: MarriageDayBranchAnalysis;
  hourBranch: MarriageHourBranchAnalysis;
  stemIntimacy: MarriageStemIntimacyAnalysis;
  scoringSignals: MarriageScoringSignals;
  intraChartHitsA: CrossChartHit[];
  intraChartHitsB: CrossChartHit[];
};

function palaceFromLabel(label: string): string {
  const m = label.match(/^(년주|월주|일주|시주)/);
  return m?.[1] ?? "";
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

function dayBranchJohuComplement(
  chartA: ChartContext,
  chartB: ChartContext,
): boolean {
  const elA = branchElement.get(chartA.dayBranchCode) ?? "";
  const elB = branchElement.get(chartB.dayBranchCode) ?? "";
  const interaction = elementInteraction(elA, elB);
  const tempA = chartTemperature(chartA);
  const tempB = chartTemperature(chartB);
  const tempContrast =
    (tempA === "cold" && tempB === "hot") ||
    (tempA === "hot" && tempB === "cold");
  return interaction.includes("상생") && tempContrast;
}

function findDirectDayDayHit(
  hits: CrossChartHit[],
): CrossChartHit | null {
  return (
    hits.find(
      (h) =>
        h.personA_pillar.startsWith("일주") &&
        h.personB_pillar.startsWith("일주"),
    ) ?? null
  );
}

function filterPalaceHits(hits: CrossChartHit[], palace: string): CrossChartHit[] {
  return hits.filter(
    (h) =>
      h.personA_pillar.startsWith(palace) ||
      h.personB_pillar.startsWith(palace),
  );
}

function countYeoma(chart: ChartContext): number {
  let n = 0;
  for (const br of chart.branchCodes) {
    if (YEOMA_BRANCHES.has(br)) n++;
  }
  return n;
}

function attachmentLean(
  chart: ChartContext,
  sealCount: number,
  selfCount: number,
): "secure" | "anxious" | "avoidant" {
  if (selfCount >= 3 && sealCount <= 1) return "anxious";
  if (sealCount >= 3) return "avoidant";
  if (countYeoma(chart) >= 2) return "avoidant";
  return "secure";
}

type RelationRuleRow = {
  relation_type: string;
  code_a: string;
  code_b: string;
  meaning_ko: string | null;
};

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function findBranchRule(
  type: string,
  a: string,
  b: string,
): RelationRuleRow | null {
  const key = pairKey(a, b);
  return (
    (REF_RELATION_RULES as unknown as RelationRuleRow[]).find(
      (r) =>
        r.relation_type === type && pairKey(r.code_a, r.code_b) === key,
    ) ?? null
  );
}

/** 단일 원국 내 년·월·일 지지 충·형 */
export function analyzeIntraChartPalaceHits(
  chart: ChartContext,
): CrossChartHit[] {
  const hits: CrossChartHit[] = [];
  const palaces = chart.pillars.filter((p) =>
    ["년주", "월주", "일주"].includes(p.name),
  );
  for (let i = 0; i < palaces.length; i++) {
    for (let j = i + 1; j < palaces.length; j++) {
      const pa = palaces[i]!;
      const pb = palaces[j]!;
      for (const rel of ["branch_clash", "branch_punishment"] as const) {
        const rule = findBranchRule(rel, pa.branchCode, pb.branchCode);
        if (!rule) continue;
        hits.push({
          personA_pillar: `${pa.name}(${pa.pillar})`,
          personB_pillar: `${pb.name}(${pb.pillar})`,
          type: rel === "branch_clash" ? "충" : "형",
          interpretation: rule.meaning_ko ?? "",
          priority: 50,
          palaceWeight: 0.5,
          weightedPriority: 25,
        });
        break;
      }
    }
  }
  return hits;
}

function detectDayHourHomeTension(
  dayHits: CrossChartHit[],
  hourHits: CrossChartHit[],
): boolean {
  const all = [...dayHits, ...hourHits];
  return all.some(
    (h) =>
      (h.personA_pillar.startsWith("일주") ||
        h.personA_pillar.startsWith("시주") ||
        h.personB_pillar.startsWith("일주") ||
        h.personB_pillar.startsWith("시주")) &&
      TENSION_TYPES.has(h.type),
  );
}

function detectWonjinGuimunPair(
  chartA: ChartContext,
  chartB: ChartContext,
): boolean {
  return detectMarriageWonjinGuimun(chartA, chartB);
}

function analyzeDayBranch(
  chartA: ChartContext,
  chartB: ChartContext,
  cross: CrossChartHit[],
  base: PairSajuAnalysis,
): MarriageDayBranchAnalysis {
  const dayCrossHits = filterPalaceHits(cross, "일주");
  const direct = findDirectDayDayHit(dayCrossHits);
  const hasCombine =
    dayCrossHits.some((h) => COMBINE_TYPES.has(h.type)) ||
    (direct !== null && COMBINE_TYPES.has(direct.type));
  const hasChungHyung = dayCrossHits.some((h) =>
    ["충", "형"].includes(h.type),
  );
  const johu = dayBranchJohuComplement(chartA, chartB);
  const elA = branchElement.get(chartA.dayBranchCode) ?? "";
  const elB = branchElement.get(chartB.dayBranchCode) ?? "";

  let bedFitLevel: MarriageDayBranchAnalysis["bedFitLevel"] = "good";
  if (hasCombine && johu) bedFitLevel = "excellent";
  else if (hasChungHyung) bedFitLevel = "needs_tune";

  let synergyWeight = 0;
  let tensionWeight = 0;
  for (const h of dayCrossHits) {
    const w = MARRIAGE_DAY_BRANCH_WEIGHT;
    if (COMBINE_TYPES.has(h.type)) synergyWeight += w * 2;
    if (TENSION_TYPES.has(h.type)) tensionWeight += w * 2;
  }

  return {
    directDayCross: direct,
    dayBranchElementInteraction: elementInteraction(elA, elB),
    dayCrossHits,
    hasDayBranchCombine: hasCombine,
    hasDayBranchChungHyung: hasChungHyung,
    hasJohuComplement: johu,
    bedFitLevel,
    synergyWeight,
    tensionWeight,
  };
}

function analyzeHourBranch(cross: CrossChartHit[]): MarriageHourBranchAnalysis {
  const hourCrossHits = filterPalaceHits(cross, "시주");
  const direct =
    hourCrossHits.find(
      (h) =>
        h.personA_pillar.startsWith("시주") &&
        h.personB_pillar.startsWith("시주"),
    ) ?? null;
  const homePalaceTension = hourCrossHits.some((h) =>
    TENSION_TYPES.has(h.type),
  );
  let synergyWeight = 0;
  let tensionWeight = 0;
  for (const h of hourCrossHits) {
    const w = MARRIAGE_HOUR_BRANCH_WEIGHT;
    if (COMBINE_TYPES.has(h.type)) synergyWeight += w;
    if (TENSION_TYPES.has(h.type)) tensionWeight += w;
  }
  return {
    directHourCross: direct,
    hourCrossHits,
    homePalaceTension,
    synergyWeight,
    tensionWeight,
  };
}

export function analyzeMarriagePairSaju(
  sajuA: SajuPillars,
  sajuB: SajuPillars,
  tenGodSignals?: Pick<
    MarriageScoringSignals,
    | "hasWealthOfficerComplement"
    | "hasFoodSealHarmony"
    | "hasWealthOfficerPowerStruggle"
  >,
  prebuilt?: {
    chartA: ChartContext;
    chartB: ChartContext;
    pairAnalysis: PairSajuAnalysis;
  },
): MarriagePairSajuAnalysis {
  const chartA = prebuilt?.chartA ?? buildChartContext(sajuA);
  const chartB = prebuilt?.chartB ?? buildChartContext(sajuB);
  const base =
    prebuilt?.pairAnalysis ??
    analyzePairSaju(sajuA, sajuB, { chartA, chartB });
  const cross = base.allCrossHits;

  const dayBranch = analyzeDayBranch(chartA, chartB, cross, base);
  const hourBranch = analyzeHourBranch(cross);

  const dayStemSupport = base.dayStemInteraction.includes("상생");
  const dayStemClash =
    base.dayStemInteraction.includes("상극") ||
    base.dayStemInteraction.includes("누름");

  const stemIntimacy: MarriageStemIntimacyAnalysis = {
    dayStemSupport,
    dayStemClash,
    attachmentLeanA: "secure",
    attachmentLeanB: "secure",
  };

  const intraChartHitsA = analyzeIntraChartPalaceHits(chartA);
  const intraChartHitsB = analyzeIntraChartPalaceHits(chartB);

  const gongmang =
    detectGongmangCrossHit(chartA, chartB) ||
    detectGongmangCrossHit(chartB, chartA);

  const scoringSignals: MarriageScoringSignals = {
    hasDayBranchCombine: dayBranch.hasDayBranchCombine,
    hasDayBranchJohuComplement: dayBranch.hasJohuComplement,
    hasDayStemMutualSupport: dayStemSupport,
    hasDayBranchChungHyung: dayBranch.hasDayBranchChungHyung,
    hasWealthOfficerComplement:
      tenGodSignals?.hasWealthOfficerComplement ?? false,
    hasFoodSealHarmony: tenGodSignals?.hasFoodSealHarmony ?? false,
    hasWealthOfficerPowerStruggle:
      tenGodSignals?.hasWealthOfficerPowerStruggle ?? false,
    hasDayHourHomeTension: detectDayHourHomeTension(
      dayBranch.dayCrossHits,
      hourBranch.hourCrossHits,
    ),
    hasWonjinOrGuimun: detectWonjinGuimunPair(chartA, chartB),
    hasGongmangOverlap: gongmang,
  };

  return {
    base,
    chartA,
    chartB,
    dayBranch,
    hourBranch,
    stemIntimacy,
    scoringSignals,
    intraChartHitsA,
    intraChartHitsB,
  };
}

export function marriagePalaceWeight(pillarLabel: string): number {
  const palace = palaceFromLabel(pillarLabel);
  return (
    MARRIAGE_STEM_PALACE_WEIGHT[palace] ?? MARRIAGE_OTHER_PALACE_BRANCH_WEIGHT
  );
}

export function chartEnergyProfile(chart: ChartContext): {
  temperature: "cold" | "hot" | "neutral";
  yeomaCount: number;
  isHomebody: boolean;
  isOutdoorsy: boolean;
} {
  const temp = chartTemperature(chart);
  const yeoma = countYeoma(chart);
  const el = countElements(chart);
  const coldHeavy = (el.water ?? 0) + (el.metal ?? 0) >= 4;
  const hotHeavy = (el.fire ?? 0) + (el.wood ?? 0) >= 4;
  const isHomebody = temp === "cold" || coldHeavy;
  const isOutdoorsy = yeoma >= 2 || temp === "hot" || hotHeavy;
  return {
    temperature: temp,
    yeomaCount: yeoma,
    isHomebody,
    isOutdoorsy,
  };
}

export function resolveAttachmentLean(
  chart: ChartContext,
  sealCount: number,
  selfCount: number,
): "secure" | "anxious" | "avoidant" {
  return attachmentLean(chart, sealCount, selfCount);
}
