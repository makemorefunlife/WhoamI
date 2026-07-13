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
  detectGongmangCrossHit,
  detectMonthWonjinGuimun,
  monthCrossHitsOfType,
  monthCrossIsType,
} from "@/lib/saju/workPairRiskSignals";
import {
  analyzePairSaju,
  countElements,
  elementInteraction,
  type CrossChartHit,
  type PairSajuAnalysis,
} from "@/lib/saju/pairChartAnalysis";

const stemElement = new Map<string, string>(
  REF_HEAVENLY_STEMS.map((r) => [r.code, r.element as string]),
);
const branchElement = new Map<string, string>(
  REF_EARTHLY_BRANCHES.map((r) => [r.code, r.element as string]),
);

type RelationRuleRow = {
  relation_type: string;
  code_a: string;
  code_b: string;
  meaning_ko: string | null;
  priority_score: number | null;
};

/** 동료 분석 — 천간 궁위 가중 (월간·사회궁 최우선, 일간 친밀도는 낮춤) */
export const WORK_STEM_PALACE_WEIGHT: Record<string, number> = {
  월주: 1.0,
  년주: 0.85,
  일주: 0.55,
  시주: 0.45,
};

/** 동료 분석 — 월지(月支) 관련 신호 최대 가중 */
export const WORK_MONTH_BRANCH_WEIGHT = 1.0;
export const WORK_OTHER_PALACE_BRANCH_WEIGHT = 0.25;

const POSITIVE_BRANCH = new Set(["육합", "삼합", "방합"]);
const TENSION_BRANCH = new Set(["충", "형", "해", "파"]);

const STEM_CLASH_PAIRS = new Set(
  [
    ["gap", "gyeong"],
    ["eul", "sin"],
    ["byeong", "im"],
    ["jeong", "gye"],
  ].map(([a, b]) => [a, b].sort().join("-")),
);

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function findStemCombineRule(
  rules: RelationRuleRow[],
  a: string,
  b: string,
): RelationRuleRow | null {
  const key = pairKey(a, b);
  return (
    rules.find(
      (r) =>
        r.relation_type === "stem_combine" && pairKey(r.code_a, r.code_b) === key,
    ) ?? null
  );
}

function isStemClash(a: string, b: string): boolean {
  return STEM_CLASH_PAIRS.has(pairKey(a, b));
}

function palaceFromLabel(label: string): string {
  const m = label.match(/^(년주|월주|일주|시주)/);
  return m?.[1] ?? "";
}

function monthBranchWeight(hit: CrossChartHit): number {
  const aMonth = hit.personA_pillar.startsWith("월주");
  const bMonth = hit.personB_pillar.startsWith("월주");
  if (aMonth && bMonth) return WORK_MONTH_BRANCH_WEIGHT;
  if (aMonth || bMonth) return WORK_MONTH_BRANCH_WEIGHT * 0.75;
  return WORK_OTHER_PALACE_BRANCH_WEIGHT;
}

export type WorkMonthBranchAnalysis = {
  /** A월지 ↔ B월지 직접 합충형파해 */
  directMonthCross: CrossChartHit | null;
  /** 월지 오행 간 생극·동기 해석 */
  monthElementInteraction: string;
  /** 월지 관련 모든 cross hit */
  monthCrossHits: CrossChartHit[];
  synergyWeight: number;
  tensionWeight: number;
  summary: string;
};

export type WorkStemPairHit = {
  personA_pillar: string;
  personB_pillar: string;
  interaction: string;
  type: "천간합" | "천간충" | "상생" | "상극" | "동기" | "중립";
  weight: number;
  weightedScore: number;
};

export type WorkStemCommunicationAnalysis = {
  stemPairs: WorkStemPairHit[];
  communicationFitScore: number;
  meetingStyleSummary: string;
  communicationSummary: string;
};

export type WorkScoringSignals = {
  hasStemCombine: boolean;
  hasElementMutualComplement: boolean;
  hasStemClashOrOvercome: boolean;
  hasMonthDirectCombine: boolean;
  hasMonthElementFlow: boolean;
  hasMonthClashOrPunish: boolean;
  hasMonthDirectChung: boolean;
  hasWonjinOrGuimun: boolean;
  hasHaPaHae: boolean;
  hasGongmangHit: boolean;
};

export type WorkPairSajuAnalysis = {
  base: PairSajuAnalysis;
  chartA: ChartContext;
  chartB: ChartContext;
  monthBranch: WorkMonthBranchAnalysis;
  stemCommunication: WorkStemCommunicationAnalysis;
  scoringSignals: WorkScoringSignals;
};

function analyzeMonthBranchWork(
  chartA: ChartContext,
  chartB: ChartContext,
  allCross: CrossChartHit[],
): WorkMonthBranchAnalysis {
  const monthElA = branchElement.get(chartA.monthBranchCode) ?? "unknown";
  const monthElB = branchElement.get(chartB.monthBranchCode) ?? "unknown";
  const monthElementInteraction = elementInteraction(monthElA, monthElB);

  const monthCrossHits = allCross.filter(
    (h) =>
      h.personA_pillar.startsWith("월주") || h.personB_pillar.startsWith("월주"),
  );

  const directMonthCross =
    monthCrossHits.find(
      (h) =>
        h.personA_pillar.startsWith("월주") && h.personB_pillar.startsWith("월주"),
    ) ?? null;

  let synergyWeight = 0;
  let tensionWeight = 0;

  for (const hit of monthCrossHits) {
    const w = monthBranchWeight(hit) * (hit.priority / 50);
    if (POSITIVE_BRANCH.has(hit.type)) synergyWeight += w;
    if (TENSION_BRANCH.has(hit.type)) tensionWeight += w;
  }

  if (monthElementInteraction.includes("상생")) synergyWeight += 1.2;
  if (monthElementInteraction.includes("상극")) tensionWeight += 1.0;
  if (monthElementInteraction.includes("같은")) {
    synergyWeight += 0.4;
    tensionWeight += 0.35;
  }

  if (directMonthCross) {
    if (POSITIVE_BRANCH.has(directMonthCross.type)) synergyWeight += 1.5;
    if (TENSION_BRANCH.has(directMonthCross.type)) tensionWeight += 1.8;
  }

  const summaryParts: string[] = [
    `월지 오행: ${monthElementInteraction}`,
  ];
  if (directMonthCross) {
    summaryParts.push(
      `월지 직접 ${directMonthCross.type} — ${directMonthCross.interpretation}`,
    );
  } else if (monthCrossHits.length) {
    summaryParts.push(
      `월지 연관 신호 ${monthCrossHits.length}건 (합·충 등)`,
    );
  }

  return {
    directMonthCross,
    monthElementInteraction,
    monthCrossHits,
    synergyWeight,
    tensionWeight,
    summary: summaryParts.join(" · "),
  };
}

function classifyStemInteraction(
  stemA: string,
  stemB: string,
  rules: RelationRuleRow[],
): Pick<WorkStemPairHit, "interaction" | "type"> {
  const combine = findStemCombineRule(rules, stemA, stemB);
  if (combine?.meaning_ko) {
    return { interaction: `천간합 — ${combine.meaning_ko}`, type: "천간합" };
  }
  if (isStemClash(stemA, stemB)) {
    return {
      interaction: "천간충 — 회의·의사결정에서 정면 충돌·속도 차가 날 수 있음",
      type: "천간충",
    };
  }
  const elA = stemElement.get(stemA) ?? "unknown";
  const elB = stemElement.get(stemB) ?? "unknown";
  const raw = elementInteraction(elA, elB);
  if (raw.includes("상생")) {
    return { interaction: `천간 상생 — ${raw}`, type: "상생" };
  }
  if (raw.includes("상극")) {
    return { interaction: `천간 상극 — ${raw}`, type: "상극" };
  }
  if (raw.includes("같은")) {
    return { interaction: raw, type: "동기" };
  }
  return { interaction: "직접 생극 약함 — 맥락·안건에 따라 달라짐", type: "중립" };
}

function scoreStemPair(type: WorkStemPairHit["type"], weight: number): number {
  const base =
    type === "천간합"
      ? 18
      : type === "상생"
        ? 14
        : type === "동기"
          ? 8
          : type === "중립"
            ? 4
            : type === "상극"
              ? -6
              : -12;
  return base * weight;
}

function analyzeStemCommunicationWork(
  chartA: ChartContext,
  chartB: ChartContext,
): WorkStemCommunicationAnalysis {
  const rules = REF_RELATION_RULES as unknown as RelationRuleRow[];
  const stemPairs: WorkStemPairHit[] = [];

  for (const pa of chartA.pillars) {
    for (const pb of chartB.pillars) {
      const palaceA = palaceFromLabel(pa.name);
      const palaceB = palaceFromLabel(pb.name);
      const weight = Math.max(
        WORK_STEM_PALACE_WEIGHT[palaceA] ?? 0.4,
        WORK_STEM_PALACE_WEIGHT[palaceB] ?? 0.4,
      );
      const { interaction, type } = classifyStemInteraction(
        pa.stemCode,
        pb.stemCode,
        rules,
      );
      const weightedScore = scoreStemPair(type, weight);
      stemPairs.push({
        personA_pillar: `${pa.name}(${pa.pillar})`,
        personB_pillar: `${pb.name}(${pb.pillar})`,
        interaction,
        type,
        weight,
        weightedScore,
      });
    }
  }

  stemPairs.sort((a, b) => b.weightedScore - a.weightedScore);

  const totalScore = stemPairs.reduce((s, p) => s + p.weightedScore, 0);
  const communicationFitScore = Math.max(
    0,
    Math.min(100, Math.round(48 + totalScore * 0.85)),
  );

  const topPositive = stemPairs.filter((p) => p.weightedScore > 0).slice(0, 2);
  const topTension = stemPairs
    .filter((p) => p.type === "천간충" || p.type === "상극")
    .sort((a, b) => a.weightedScore - b.weightedScore)
    .slice(0, 2);

  const meetingStyleSummary =
    topTension.length > 0
      ? `회의·의사결정: ${topTension.map((t) => `${t.personA_pillar}↔${t.personB_pillar} ${t.type}`).join(" · ")} — 안건을 나누거나 순서를 정하면 편해요.`
      : topPositive.length > 0
        ? `회의·의사결정: ${topPositive[0]!.interaction}`
        : "회의 스타일은 안건·역할에 따라 유연하게 맞추는 편이에요.";

  const communicationSummary =
    topPositive.length > 0
      ? `업무 소통 핏: ${topPositive.map((p) => p.interaction).join(" / ")}`
      : "천간 생극이 약해, 프로세스·역할 정의가 소통 핏을 좌우해요.";

  return {
    stemPairs,
    communicationFitScore,
    meetingStyleSummary,
    communicationSummary,
  };
}

function hasWeightedStemCombine(stemPairs: WorkStemPairHit[]): boolean {
  return stemPairs.some(
    (p) => p.type === "천간합" && p.weight >= WORK_STEM_PALACE_WEIGHT.월주!,
  );
}

function hasWeightedStemTension(stemPairs: WorkStemPairHit[]): boolean {
  return stemPairs.some(
    (p) =>
      (p.type === "천간충" || p.type === "상극") &&
      p.weight >= WORK_STEM_PALACE_WEIGHT.월주! * 0.85,
  );
}

function detectElementMutualComplement(
  chartA: ChartContext,
  chartB: ChartContext,
  base: PairSajuAnalysis,
): boolean {
  const elA = countElements(chartA);
  const elB = countElements(chartB);
  const keys = ["wood", "fire", "earth", "metal", "water"] as const;
  for (const k of keys) {
    const aWeak = (elA[k] ?? 0) <= 1;
    const bStrong = (elB[k] ?? 0) >= 3;
    const bWeak = (elB[k] ?? 0) <= 1;
    const aStrong = (elA[k] ?? 0) >= 3;
    if ((aWeak && bStrong) || (bWeak && aStrong)) return true;
  }
  return base.combinedElementNote.includes("약한 기운");
}

function extractScoringSignals(
  work: Omit<WorkPairSajuAnalysis, "scoringSignals">,
): WorkScoringSignals {
  const month = work.monthBranch;
  const stems = work.stemCommunication;
  const { wonjin, guimun } = detectMonthWonjinGuimun(
    work.chartA,
    work.chartB,
  );

  const monthDirectChung = monthCrossIsType(month.directMonthCross, ["충"]);
  const monthCombine = monthCrossIsType(month.directMonthCross, [
    "육합",
    "삼합",
    "방합",
  ]);
  const monthClashPunish =
    monthCrossHitsOfType(month.monthCrossHits, ["충", "형"], true) !== null;
  const haPaHae =
    monthCrossHitsOfType(month.monthCrossHits, ["해", "파", "형"], false) !==
    null;

  const elementComplement = detectElementMutualComplement(
    work.chartA,
    work.chartB,
    work.base,
  );

  const gongmang =
    detectGongmangCrossHit(work.chartA, work.chartB) ||
    detectGongmangCrossHit(work.chartB, work.chartA);

  const monthFlow =
    month.monthElementInteraction.includes("상생") ||
    month.monthElementInteraction.includes("같은");

  return {
    hasStemCombine: hasWeightedStemCombine(stems.stemPairs),
    hasElementMutualComplement: elementComplement,
    hasStemClashOrOvercome: hasWeightedStemTension(stems.stemPairs),
    hasMonthDirectCombine: monthCombine,
    hasMonthElementFlow: monthFlow,
    hasMonthClashOrPunish: monthClashPunish,
    hasMonthDirectChung: monthDirectChung,
    hasWonjinOrGuimun: wonjin || guimun,
    hasHaPaHae: haPaHae,
    hasGongmangHit: gongmang,
  };
}

export function analyzeWorkPairSaju(
  sajuA: SajuPillars,
  sajuB: SajuPillars,
  prebuilt?: {
    chartA: ChartContext;
    chartB: ChartContext;
    pairAnalysis: PairSajuAnalysis;
  },
): WorkPairSajuAnalysis {
  const chartA = prebuilt?.chartA ?? buildChartContext(sajuA);
  const chartB = prebuilt?.chartB ?? buildChartContext(sajuB);
  const base =
    prebuilt?.pairAnalysis ??
    analyzePairSaju(sajuA, sajuB, { chartA, chartB });

  const monthBranch = analyzeMonthBranchWork(
    chartA,
    chartB,
    base.allCrossHits,
  );
  const stemCommunication = analyzeStemCommunicationWork(chartA, chartB);

  const partial = {
    base,
    chartA,
    chartB,
    monthBranch,
    stemCommunication,
  };

  return {
    ...partial,
    scoringSignals: extractScoringSignals(partial),
  };
}
