import { REF_RELATION_RULES } from "@/lib/hardcoded/sajuReferenceData";
import {
  crossHitPalaceWeight,
  weightedCrossPriority,
} from "@/lib/saju/palaceWeight";
import {
  type ChartContext,
  type PillarSlot,
  buildChartContext,
  chartHasAllBranches,
  TRIO_BRANCH_GROUPS,
  type SajuPillars,
} from "@/lib/saju/chartContext";
import {
  ELEMENT_KO,
  stemElement,
  countElements,
  elementInteraction,
} from "@/lib/saju/elements";

export { elementInteraction, countElements } from "@/lib/saju/elements";

type RelationRuleRow = {
  relation_type: string;
  code_a: string;
  code_b: string;
  result_code: string | null;
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

/** 오행 우세 원소 — countElements 후 고정 키 순서·내림차순. 신규 tie-break 없음. */
export type DominantElementKey = "wood" | "fire" | "earth" | "metal" | "water";

const DOMINANT_ELEMENT_ORDER: DominantElementKey[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
];

export function resolveDominantElement(
  chart: ChartContext,
): {
  counts: Record<string, number>;
  dominant: DominantElementKey;
} {
  const counts = countElements(chart);
  const entries: Array<[DominantElementKey, number]> = DOMINANT_ELEMENT_ORDER.map(
    (k) => [k, counts[k] ?? 0],
  );
  entries.sort((a, b) => b[1] - a[1]);
  return { counts, dominant: entries[0]![0] };
}

function formatElementCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .map(([el, n]) => `${ELEMENT_KO[el] ?? el}: ${n}`)
    .join(", ");
}

/** 육합/충/형/파/해(branch_pair) vs 천간합(stem_combine) vs 원진/귀문 vs 공망 — 출처 구분용. */
export type CrossChartHitCategory =
  | "branch_pair"
  | "stem_combine"
  | "stem_clash"
  | "wonjin_guimun"
  | "gongmang";

export type CrossChartHit = {
  personA_pillar: string;
  personB_pillar: string;
  type: string;
  interpretation: string;
  priority: number;
  /** 궁위 가중치 (일주 1.0 · 월주 0.75 · 시주 0.45 · 년주 0.4) */
  palaceWeight: number;
  weightedPriority: number;
  /** 출처 구분 — 미지정 시 기존 소비처(marriage/work/family) 동작 불변 */
  category?: CrossChartHitCategory;
  personA_pillarSlot?: PillarSlot;
  /** 천간합이면 stem code, 그 외는 branch code */
  personA_code?: string;
  personB_pillarSlot?: PillarSlot;
  personB_code?: string;
  /** 예: "정임합목" (rule.description) */
  detail?: string;
};

export function analyzeCrossChartRelations(
  chartA: ChartContext,
  chartB: ChartContext,
): CrossChartHit[] {
  const rules = REF_RELATION_RULES as unknown as RelationRuleRow[];
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
          category: "branch_pair",
          personA_pillarSlot: pa.name as PillarSlot,
          personA_code: pa.branchCode,
          personB_pillarSlot: pb.name as PillarSlot,
          personB_code: pb.branchCode,
          detail: rule.description ?? undefined,
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

/**
 * 천간합(A×B) — 갑기/을경/병신/정임/무계, 4×4=16 궁위 전체 비교. 지지 관계와
 * 독립된 축이라 같은 궁위 쌍이 branch_pair 히트와 동시에 존재할 수 있다(여기서
 * break하지 않음 — analyzeCrossChartRelations의 break는 지지 5종류 사이에서만
 * 유효, 천간축과는 무관).
 */
export function analyzeCrossChartStemCombines(
  chartA: ChartContext,
  chartB: ChartContext,
): CrossChartHit[] {
  const rules = REF_RELATION_RULES as unknown as RelationRuleRow[];
  const hits: CrossChartHit[] = [];
  const seen = new Set<string>();

  for (const pa of chartA.pillars) {
    for (const pb of chartB.pillars) {
      const dedupe = `${pa.name}:${pa.stemCode}-${pb.name}:${pb.stemCode}`;
      if (seen.has(dedupe)) continue;
      const rule = findPairRule(rules, "stem_combine", pa.stemCode, pb.stemCode);
      if (!rule?.meaning_ko) continue;
      seen.add(dedupe);
      const basePriority = rule.priority_score ?? 90;
      const hit: CrossChartHit = {
        personA_pillar: `${pa.name}(${pa.pillar})`,
        personB_pillar: `${pb.name}(${pb.pillar})`,
        type: "천간합",
        interpretation: rule.meaning_ko,
        priority: basePriority,
        palaceWeight: 0,
        weightedPriority: basePriority,
        category: "stem_combine",
        personA_pillarSlot: pa.name as PillarSlot,
        personA_code: pa.stemCode,
        personB_pillarSlot: pb.name as PillarSlot,
        personB_code: pb.stemCode,
        detail: rule.description ?? undefined,
      };
      hit.palaceWeight = crossHitPalaceWeight(hit);
      hit.weightedPriority = weightedCrossPriority(hit);
      hits.push(hit);
    }
  }

  return hits.sort((a, b) => b.weightedPriority - a.weightedPriority);
}

/** 삼합/방합 교차 히트 — 3개 지지 중 하나 이상을 A/B 양쪽에서 나눠 채운 경우만 인정. */
export type CrossChartTrioContribution = {
  owner: "A" | "B";
  pillarSlot: PillarSlot;
  branchCode: string;
};

export type CrossChartTrioHit = {
  /** TRIO_BRANCH_GROUPS key, 예: "in_o_sul" */
  resultCode: string;
  label: "삼합" | "방합";
  name: string;
  interpretation: string;
  priority: number;
  contributedBranches: CrossChartTrioContribution[];
};

function collectBranchContributors(
  chartA: ChartContext,
  chartB: ChartContext,
  branchCode: string,
): CrossChartTrioContribution[] {
  const contributions: CrossChartTrioContribution[] = [];
  for (const p of chartA.pillars) {
    if (p.branchCode === branchCode) {
      contributions.push({ owner: "A", pillarSlot: p.name as PillarSlot, branchCode });
    }
  }
  for (const p of chartB.pillars) {
    if (p.branchCode === branchCode) {
      contributions.push({ owner: "B", pillarSlot: p.name as PillarSlot, branchCode });
    }
  }
  return contributions;
}

/**
 * 삼합(branch_three_combine)/방합(branch_direction_combine) — A+B 합산 지지
 * 풀에서만 성립 여부를 본다. 한쪽 원국 혼자 이미 3개를 다 갖고 있으면(기존
 * intra-chart analyzeRelations의 영역) 제외 — 진짜 "교차" 조합만 인정.
 */
export function analyzeCrossChartTrioCombines(
  chartA: ChartContext,
  chartB: ChartContext,
): CrossChartTrioHit[] {
  const rules = REF_RELATION_RULES as unknown as RelationRuleRow[];
  const hits: CrossChartTrioHit[] = [];
  const unionBranches = new Set<string>([
    ...chartA.branchCodes,
    ...chartB.branchCodes,
  ]);

  const TRIO_RELATION_TYPES: Array<{
    relationType: "branch_three_combine" | "branch_direction_combine";
    label: "삼합" | "방합";
  }> = [
    { relationType: "branch_three_combine", label: "삼합" },
    { relationType: "branch_direction_combine", label: "방합" },
  ];

  for (const { relationType, label } of TRIO_RELATION_TYPES) {
    const trioRules = rules.filter((r) => r.relation_type === relationType);
    const byResult = new Map<string, RelationRuleRow>();
    for (const r of trioRules) {
      if (r.result_code && !byResult.has(r.result_code)) {
        byResult.set(r.result_code, r);
      }
    }

    for (const [resultCode, rule] of byResult) {
      const group = TRIO_BRANCH_GROUPS[resultCode];
      if (!group) continue;
      const unionHasAll = group.every((c) => unionBranches.has(c));
      if (!unionHasAll) continue;
      if (chartHasAllBranches(chartA, group) || chartHasAllBranches(chartB, group)) {
        continue;
      }
      if (!rule.meaning_ko) continue;

      const contributedBranches = group.flatMap((code) =>
        collectBranchContributors(chartA, chartB, code),
      );

      hits.push({
        resultCode,
        label,
        name: rule.description ?? resultCode,
        interpretation: rule.meaning_ko,
        priority: rule.priority_score ?? 70,
        contributedBranches,
      });
    }
  }

  return hits.sort((a, b) => b.priority - a.priority);
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
  prebuilt?: { chartA: ChartContext; chartB: ChartContext },
): PairSajuAnalysis {
  const chartA = prebuilt?.chartA ?? buildChartContext(sajuA);
  const chartB = prebuilt?.chartB ?? buildChartContext(sajuB);

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

export type CanonicalPersonalSajuFacts = {
  dominantElement: DominantElementKey;
  weakestElement: DominantElementKey;
};

export function extractCanonicalPersonalFacts(chart: ChartContext): CanonicalPersonalSajuFacts {
  const counts = countElements(chart);
  const entries: Array<[DominantElementKey, number]> = DOMINANT_ELEMENT_ORDER.map(
    (k) => [k, counts[k] ?? 0],
  );
  entries.sort((a, b) => b[1] - a[1]);
  const dominant = entries[0]![0];
  
  const weakEntries = [...entries].sort((a, b) => a[1] - b[1]);
  const weakest = weakEntries[0]![0];

  return { dominantElement: dominant, weakestElement: weakest };
}

export type CanonicalPairSajuFacts = {
  hasWonjin: boolean;
  hasGuimun: boolean;
  hasWonjinOrGuimun: boolean;
  hasChung: boolean;
  hasHyung: boolean;
  hasPa: boolean;
  hasHae: boolean;
  hasClash: boolean; // 충 또는 형
  hasDayBranchCombine: boolean;
  hasDayBranchChungHyung: boolean;
  elementSupport: {
    aToB: boolean;
    bToA: boolean;
  };
};

export function extractCanonicalPairFacts(
  chartA: ChartContext,
  chartB: ChartContext,
): CanonicalPairSajuFacts {
  const cross = analyzeCrossChartRelations(chartA, chartB);
  
  const wonjinHits = cross.filter((h) => h.type === "원진");
  const guimunHits = cross.filter((h) => h.type === "귀문");
  
  const hasWonjin = wonjinHits.length > 0;
  const hasGuimun = guimunHits.length > 0;
  const hasWonjinOrGuimun = hasWonjin || hasGuimun;

  const hasChung = cross.some((h) => h.type === "충");
  const hasHyung = cross.some((h) => h.type === "형");
  const hasPa = cross.some((h) => h.type === "파");
  const hasHae = cross.some((h) => h.type === "해");
  
  const hasClash = hasChung || hasHyung;

  const dayBranchCross = cross.filter(
    (h) => h.personA_pillar.startsWith("일주") || h.personB_pillar.startsWith("일주"),
  );
  
  const hasDayBranchCombine = dayBranchCross.some((h) => h.type === "육합");
  const hasDayBranchChungHyung = dayBranchCross.some((h) => h.type === "충" || h.type === "형");

  const pA = extractCanonicalPersonalFacts(chartA);
  const pB = extractCanonicalPersonalFacts(chartB);
  const ELEMENT_GENERATES: Record<string, string> = {
    wood: "fire",
    fire: "earth",
    earth: "metal",
    metal: "water",
    water: "wood",
  };
  const aToB = ELEMENT_GENERATES[pA.dominantElement] === pB.weakestElement;
  const bToA = ELEMENT_GENERATES[pB.dominantElement] === pA.weakestElement;

  return {
    hasWonjin,
    hasGuimun,
    hasWonjinOrGuimun,
    hasChung,
    hasHyung,
    hasPa,
    hasHae,
    hasClash,
    hasDayBranchCombine,
    hasDayBranchChungHyung,
    elementSupport: { aToB, bToA },
  };
}
