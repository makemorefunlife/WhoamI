import { REF_EARTHLY_BRANCHES, REF_HEAVENLY_STEMS, REF_RELATION_RULES } from "@/lib/hardcoded/sajuReferenceData";
import {
  crossHitPalaceWeight,
  weightedCrossPriority,
} from "@/lib/saju/palaceWeight";
import {
  type ChartContext,
  buildChartContext,
  type SajuPillars,
} from "@/lib/saju/chartContext";

const ELEMENT_KO: Record<string, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};

const stemElement = new Map(
  REF_HEAVENLY_STEMS.map((r) => [r.code, r.element as string]),
);
const branchElement = new Map(
  REF_EARTHLY_BRANCHES.map((r) => [r.code, r.element as string]),
);

type RelationRuleRow = {
  relation_type: string;
  code_a: string;
  code_b: string;
  meaning_ko: string | null;
  description: string | null;
  priority_score: number | null;
};

const PAIR_BRANCH_TYPES = [
  { type: "branch_six_combine", label: "육합" },
  { type: "branch_clash", label: "충" },
  { type: "branch_punishment", label: "형" },
  { type: "branch_break", label: "파" },
  { type: "branch_harm", label: "해" },
] as const;

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function findPairRule(
  rules: RelationRuleRow[],
  relationType: string,
  a: string,
  b: string,
): RelationRuleRow | null {
  const key = pairKey(a, b);
  return (
    rules.find(
      (r) =>
        r.relation_type === relationType &&
        pairKey(r.code_a, r.code_b) === key,
    ) ?? null
  );
}

/** 오행 상생·상극 (천간·지지 오행 간) */
export function elementInteraction(a: string, b: string): string {
  const generates: Record<string, string> = {
    wood: "fire",
    fire: "earth",
    earth: "metal",
    metal: "water",
    water: "wood",
  };
  const overcomes: Record<string, string> = {
    wood: "earth",
    earth: "water",
    water: "fire",
    fire: "metal",
    metal: "wood",
  };
  if (generates[a] === b) return `${ELEMENT_KO[a]}이(가) ${ELEMENT_KO[b]}을(를) 살림(상생)`;
  if (generates[b] === a) return `${ELEMENT_KO[b]}이(가) ${ELEMENT_KO[a]}을(를) 살림(상생)`;
  if (overcomes[a] === b) return `${ELEMENT_KO[a]}이(가) ${ELEMENT_KO[b]}을(를) 누름(상극·긴장)`;
  if (overcomes[b] === a) return `${ELEMENT_KO[b]}이(가) ${ELEMENT_KO[a]}을(를) 누름(상극·긴장)`;
  if (a === b) return `같은 ${ELEMENT_KO[a]} 기운 — 공감·동질감과 경쟁·고집이 함께 올 수 있음`;
  return "직접 상생·상극은 약함 — 다른 기둥·지지 관계로 보완";
}

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

function formatElementCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .map(([el, n]) => `${ELEMENT_KO[el] ?? el}: ${n}`)
    .join(", ");
}

export type CrossChartHit = {
  personA_pillar: string;
  personB_pillar: string;
  type: string;
  interpretation: string;
  priority: number;
  /** 궁위 가중치 (일주 1.0 · 월주 0.75 · 시주 0.45 · 년주 0.4) */
  palaceWeight: number;
  weightedPriority: number;
};

export function analyzeCrossChartRelations(
  chartA: ChartContext,
  chartB: ChartContext,
): CrossChartHit[] {
  const rules = REF_RELATION_RULES as RelationRuleRow[];
  const hits: CrossChartHit[] = [];
  const seen = new Set<string>();

  for (const pa of chartA.pillars) {
    for (const pb of chartB.pillars) {
      const dedupe = `${pa.name}:${pa.branchCode}-${pb.name}:${pb.branchCode}`;
      if (seen.has(dedupe)) continue;

      for (const { type, label } of PAIR_BRANCH_TYPES) {
        const rule = findPairRule(rules, type, pa.branchCode, pb.branchCode);
        if (!rule?.meaning_ko) continue;
        seen.add(dedupe);
        const basePriority = rule.priority_score ?? 50;
        const hit: CrossChartHit = {
          personA_pillar: `${pa.name}(${pa.pillar})`,
          personB_pillar: `${pb.name}(${pb.pillar})`,
          type: label,
          interpretation: rule.meaning_ko,
          priority: basePriority,
          palaceWeight: 0,
          weightedPriority: basePriority,
        };
        hit.palaceWeight = crossHitPalaceWeight(hit);
        hit.weightedPriority = weightedCrossPriority(hit);
        hits.push(hit);
        break;
      }
    }
  }

  return hits;
}

export type PairSajuAnalysis = {
  aElementCounts: string;
  bElementCounts: string;
  combinedElementNote: string;
  dayStemInteraction: string;
  dayBranchCrossHits: CrossChartHit[];
  allCrossHits: CrossChartHit[];
  yearStemSameEra: string;
};

export function analyzePairSaju(
  sajuA: SajuPillars,
  sajuB: SajuPillars,
): PairSajuAnalysis {
  const chartA = buildChartContext(sajuA);
  const chartB = buildChartContext(sajuB);

  const elA = countElements(chartA);
  const elB = countElements(chartB);

  const dayStemA = stemElement.get(chartA.dayStemCode) ?? "unknown";
  const dayStemB = stemElement.get(chartB.dayStemCode) ?? "unknown";

  const cross = analyzeCrossChartRelations(chartA, chartB).sort(
    (a, b) => b.weightedPriority - a.weightedPriority,
  );
  const dayBranchCross = cross.filter(
    (h) =>
      h.personA_pillar.startsWith("일주") || h.personB_pillar.startsWith("일주"),
  );

  const combined: Record<string, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const k of Object.keys(combined)) {
    combined[k] = (elA[k] ?? 0) + (elB[k] ?? 0);
  }
  const weak = Object.entries(combined)
    .filter(([, n]) => n <= 1)
    .map(([el]) => ELEMENT_KO[el]);
  const strong = Object.entries(combined)
    .filter(([, n]) => n >= 5)
    .map(([el]) => ELEMENT_KO[el]);

  const yearSame = chartA.yearStemCode === chartB.yearStemCode;
  const yearBranchSame = chartA.yearBranchCode === chartB.yearBranchCode;

  return {
    aElementCounts: formatElementCounts(elA),
    bElementCounts: formatElementCounts(elB),
    combinedElementNote: [
      `합산 오행: ${formatElementCounts(combined)}`,
      strong.length ? `함께 강한 기운: ${strong.join(", ")}` : null,
      weak.length ? `함께 약한 기운(보완 포인트): ${weak.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    dayStemInteraction: elementInteraction(dayStemA, dayStemB),
    dayBranchCrossHits: dayBranchCross,
    allCrossHits: cross,
    yearStemSameEra: yearSame || yearBranchSame
      ? `연주 겹침 — 비슷한 시대·가치관·성장 배경 가능성 (연간 동일: ${yearSame}, 연지 동일: ${yearBranchSame})`
      : "연주 상이 — 다른 세대·환경에서 자란 보완 관계 가능성",
  };
}

export function sajuJsonToPillars(saju: {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
}): SajuPillars {
  return {
    yearPillar: saju.yearPillar,
    monthPillar: saju.monthPillar,
    dayPillar: saju.dayPillar,
    hourPillar: saju.hourPillar,
  };
}
