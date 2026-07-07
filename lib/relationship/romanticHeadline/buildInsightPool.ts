import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import {
  buildRomanticDayStemOneLiner,
  formatRomanticEssencePair,
  resolveDayStemRomanticProfileFromSaju,
  romanticHeadlineFromProfiles,
} from "@/lib/relationship/dayStemRomanticProfile";
import {
  crossHitDedupeKey,
  formatMetaphorPairLine,
  humanizeDayStemInteraction,
  humanizeElementNote,
  humanizePersonRelation,
  humanizeRomanticCrossBody,
  humanizeStrengthComplement,
  joinPersonalityHeadline,
  resolveDayStemNamesFromPair,
  resolvePersonalityLabel,
} from "@/lib/relationship/romanticEverydayText";
import {
  crossHitPalaceWeight,
  isPrimaryPalaceCross,
} from "@/lib/saju/palaceWeight";
import { buildChartContext } from "@/lib/saju/chartContext";
import {
  analyzePairSaju,
  sajuJsonToPillars,
  type CrossChartHit,
  type PairSajuAnalysis,
} from "@/lib/saju/pairChartAnalysis";
import { estimateStrengthBalance } from "@/lib/saju/romanticSajuDerivations";
import type {
  RomanticInsightCandidate,
  RomanticScreenHint,
} from "./types";

const POSITIVE_CROSS = new Set(["육합", "천간합", "삼합", "방합"]);
const TENSION_CROSS = new Set(["충", "형", "해", "파"]);

function metaphorShortLabel(sajuJson: SajuDataForIntegrated): string {
  return resolvePersonalityLabel(sajuJson);
}

function joinRelationshipName(labelA: string, labelB: string): string {
  return joinPersonalityHeadline(labelA, labelB);
}

function rankScore(c: {
  priority: number;
  impact: number;
  surprise: number;
}): number {
  return c.priority * 0.5 + c.impact * 0.3 + c.surprise * 0.2;
}

function crossImpact(hit: CrossChartHit, dayBranch: boolean): number {
  let impact = hit.weightedPriority ?? hit.priority;
  if (dayBranch) impact += 12;
  if (isPrimaryPalaceCross(hit)) impact += 10;
  if (TENSION_CROSS.has(hit.type)) impact += 8;
  if (POSITIVE_CROSS.has(hit.type)) impact += 6;
  if (crossHitPalaceWeight(hit) < 0.5) impact -= 15;
  return Math.min(100, Math.max(20, impact));
}

function crossSurprise(hit: CrossChartHit): number {
  if (TENSION_CROSS.has(hit.type)) return 75;
  if (POSITIVE_CROSS.has(hit.type)) return 55;
  return 40;
}

function crossScreenHint(hit: CrossChartHit): RomanticScreenHint {
  if (TENSION_CROSS.has(hit.type)) return "conflict";
  if (POSITIVE_CROSS.has(hit.type)) return "bond";
  return "nature";
}

function crossHeadline(hit: CrossChartHit): string {
  if (hit.type === "육합") return "끌리는 조합";
  if (hit.type === "충") return "예민해지는 지점";
  if (TENSION_CROSS.has(hit.type)) return "부딪히는 지점";
  if (POSITIVE_CROSS.has(hit.type)) return "잘 맞는 조합";
  return "서로 다른 리듬";
}

function pushCandidate(
  list: RomanticInsightCandidate[],
  partial: Omit<RomanticInsightCandidate, "score"> & { score?: number },
): void {
  list.push({
    ...partial,
    score: partial.score ?? rankScore(partial),
  });
}

export function buildRomanticInsightPool(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  pairAnalysis: PairSajuAnalysis;
}): RomanticInsightCandidate[] {
  const { nicknameA, nicknameB, sajuJsonA, sajuJsonB, pairAnalysis } = params;
  const candidates: RomanticInsightCandidate[] = [];

  const pillarsA = sajuJsonToPillars(
    sajuJsonA.saju as Required<NonNullable<SajuDataForIntegrated["saju"]>>,
  );
  const pillarsB = sajuJsonToPillars(
    sajuJsonB.saju as Required<NonNullable<SajuDataForIntegrated["saju"]>>,
  );

  const metaA = metaphorShortLabel(sajuJsonA);
  const metaB = metaphorShortLabel(sajuJsonB);
  const profileA = resolveDayStemRomanticProfileFromSaju(sajuJsonA);
  const profileB = resolveDayStemRomanticProfileFromSaju(sajuJsonB);
  const { stemNameA, stemNameB } = resolveDayStemNamesFromPair(
    sajuJsonA,
    sajuJsonB,
  );
  const crossCtx = {
    nicknameA,
    nicknameB,
    metaphorA: metaA,
    metaphorB: metaB,
    romanticProfileA: profileA,
    romanticProfileB: profileB,
    stemNameA,
    stemNameB,
    dayStemInteraction: pairAnalysis.dayStemInteraction,
  };
  pushCandidate(candidates, {
    id: "metaphor_combo",
    source: "metaphor_combo",
    priority: 70,
    impact: 65,
    surprise: 50,
    headline:
      profileA && profileB
        ? romanticHeadlineFromProfiles(profileA, profileB)
        : joinRelationshipName(metaA, metaB),
    body:
      profileA && profileB
        ? `${formatRomanticEssencePair(profileA, nicknameA, profileB, nicknameB)}가 만나 서로 다른 리듬을 채워요.`
        : `${formatMetaphorPairLine(metaA, nicknameA, metaB, nicknameB)}가 만나 서로 다른 리듬을 채워요.`,
    screenHint: "opening",
  });

  const strengthA = estimateStrengthBalance(pillarsA);
  const strengthB = estimateStrengthBalance(pillarsB);
  if (strengthA.label.includes("신강") && strengthB.label.includes("신약")) {
    pushCandidate(candidates, {
      id: "strength_complement_ab",
      source: "strength_complement",
      priority: 68,
      impact: 72,
      surprise: 60,
      headline: "버팀목과 공감의 짝",
      body: humanizeStrengthComplement(nicknameA, nicknameB),
      screenHint: "nature",
    });
  } else if (
    strengthB.label.includes("신강") &&
    strengthA.label.includes("신약")
  ) {
    pushCandidate(candidates, {
      id: "strength_complement_ba",
      source: "strength_complement",
      priority: 68,
      impact: 72,
      surprise: 60,
      headline: "버팀목과 공감의 짝",
      body: humanizeStrengthComplement(nicknameB, nicknameA),
      screenHint: "nature",
    });
  }

  if (pairAnalysis.dayStemInteraction.includes("상생")) {
    pushCandidate(candidates, {
      id: "day_stem_support",
      source: "pair_day_stem",
      ruleType: "상생",
      priority: 80,
      impact: 78,
      surprise: 45,
      headline:
        profileA && profileB
          ? romanticHeadlineFromProfiles(profileA, profileB)
          : "자연스럽게 살림을 주는 만남",
      body:
        profileA && profileB
          ? buildRomanticDayStemOneLiner({
              profileA,
              profileB,
              nicknameA,
              nicknameB,
              dayStemInteraction: pairAnalysis.dayStemInteraction,
              closeRelationship: true,
            })
          : humanizeDayStemInteraction(pairAnalysis.dayStemInteraction),
      screenHint: "bond",
    });
  } else if (pairAnalysis.dayStemInteraction.includes("상극")) {
    pushCandidate(candidates, {
      id: "day_stem_tension",
      source: "pair_day_stem",
      ruleType: "상극",
      priority: 75,
      impact: 82,
      surprise: 70,
      headline: "부딪히지만 자극이 되는 만남",
      body: humanizeDayStemInteraction(pairAnalysis.dayStemInteraction, {
        a: stemNameA,
        b: stemNameB,
      }),
      screenHint: "conflict",
    });
  }

  const seenCross = new Set<string>();
  for (const [i, hit] of pairAnalysis.allCrossHits.entries()) {
    const dedupeKey = crossHitDedupeKey(hit);
    if (seenCross.has(dedupeKey)) continue;
    seenCross.add(dedupeKey);

    const dayBranch =
      hit.personA_pillar.startsWith("일주") || hit.personB_pillar.startsWith("일주");
    if (crossHitPalaceWeight(hit) < 0.5 && !dayBranch) continue;

    pushCandidate(candidates, {
      id: `pair_cross_${i}_${hit.type}`,
      source: "pair_cross",
      ruleType: hit.type,
      priority: hit.weightedPriority ?? hit.priority,
      impact: crossImpact(hit, dayBranch),
      surprise: crossSurprise(hit),
      headline: crossHeadline(hit),
      body: humanizeRomanticCrossBody(hit, crossCtx, { closeRelationship: dayBranch }),
      screenHint: crossScreenHint(hit),
    });
  }

  if (pairAnalysis.combinedElementNote.includes("약한 기운")) {
    pushCandidate(candidates, {
      id: "pair_element_gap",
      source: "pair_element",
      priority: 62,
      impact: 58,
      surprise: 42,
      headline: "함께 채워야 하는 에너지",
      body: humanizeElementNote(pairAnalysis.combinedElementNote),
      screenHint: "action",
    });
  }

  for (const [who, json, nick] of [
    ["a", sajuJsonA, nicknameA],
    ["b", sajuJsonB, nicknameB],
  ] as const) {
    for (const [ri, rel] of (json.relations ?? []).entries()) {
      if (!rel.interpretation?.trim()) continue;
      const type = rel.type ?? "관계";
      pushCandidate(candidates, {
        id: `person_${who}_rel_${ri}`,
        source: "person_relation",
        ruleType: type,
        priority: TENSION_CROSS.has(type) ? 55 : 60,
        impact: 50,
        surprise: 35,
        headline: `${nick}의 마음 패턴`,
        body: humanizePersonRelation(rel.interpretation.trim()),
        screenHint: "hidden",
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

export function computePairAnalysisOnce(
  sajuJsonA: SajuDataForIntegrated,
  sajuJsonB: SajuDataForIntegrated,
): PairSajuAnalysis {
  const pillarsA = sajuJsonA.saju;
  const pillarsB = sajuJsonB.saju;
  if (!pillarsA?.dayPillar || !pillarsB?.dayPillar) {
    throw new Error("사주 팔자 데이터가 없어 궁합 분석을 할 수 없습니다.");
  }
  const pA = sajuJsonToPillars(pillarsA as Required<typeof pillarsA>);
  const pB = sajuJsonToPillars(pillarsB as Required<typeof pillarsB>);
  const chartA = buildChartContext(pA);
  const chartB = buildChartContext(pB);
  return analyzePairSaju(pA, pB, { chartA, chartB });
}

export { metaphorShortLabel, joinRelationshipName };
