import type { PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";
import type { RomanticInsightCandidate, RomanticOpeningSelection } from "./types";
import { joinRelationshipName, metaphorShortLabel } from "./buildInsightPool";
import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";

const POSITIVE_CROSS = new Set(["육합", "천간합", "삼합", "방합"]);
const TENSION_CROSS = new Set(["충", "형", "해", "파"]);

/** 기존 pair cross hit·일간 상생 결과만으로 등급 산출 (별도 점수 엔진 없음) */
export function computeCompatibilityGrade(pair: PairSajuAnalysis): {
  grade: "A" | "B" | "C" | "D";
  reason: string;
} {
  let score = 72;

  for (const hit of pair.allCrossHits) {
    if (POSITIVE_CROSS.has(hit.type)) score += 4;
    if (TENSION_CROSS.has(hit.type)) {
      const day =
        hit.personA_pillar.startsWith("일주") ||
        hit.personB_pillar.startsWith("일주");
      score -= day ? 9 : 5;
    }
  }

  if (pair.dayStemInteraction.includes("상생")) score += 6;
  if (pair.dayStemInteraction.includes("상극")) score -= 4;

  score = Math.max(35, Math.min(95, score));

  const grade: "A" | "B" | "C" | "D" =
    score >= 82 ? "A" : score >= 68 ? "B" : score >= 52 ? "C" : "D";

  const positive = pair.allCrossHits.filter((h) => POSITIVE_CROSS.has(h.type)).length;
  const tension = pair.allCrossHits.filter((h) => TENSION_CROSS.has(h.type)).length;

  return {
    grade,
    reason: `시너지 신호 ${positive}개 · 긴장 ${tension}개 · 핵심 기질 ${
      pair.dayStemInteraction.includes("상생")
        ? "서로 키워 줌"
        : pair.dayStemInteraction.includes("상극")
          ? "서로 자극"
          : "중립"
    }`,
  };
}

/** Headline Engine — selector: ranked[0] = Screen 1 Opening */
export function selectRomanticOpening(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  pairAnalysis: PairSajuAnalysis;
  insightPool: RomanticInsightCandidate[];
}): RomanticOpeningSelection {
  const { sajuJsonA, sajuJsonB, pairAnalysis, insightPool } = params;

  const ranked = [...insightPool]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const top = ranked[0];
  const { grade, reason } = computeCompatibilityGrade(pairAnalysis);

  const metaphorName = joinRelationshipName(
    metaphorShortLabel(sajuJsonA),
    metaphorShortLabel(sajuJsonB),
  );

  if (!top) {
    return {
      relationship_name: metaphorName,
      one_line_summary: "두 사람의 기질이 만나 새로운 균형을 만들어요.",
      grade,
      grade_reason: reason,
      selected_insight_id: "fallback_empty_pool",
      ranked_insights: [],
    };
  }

  return {
    relationship_name: top.headline,
    one_line_summary: top.body,
    grade,
    grade_reason: reason,
    selected_insight_id: top.id,
    ranked_insights: ranked,
  };
}
