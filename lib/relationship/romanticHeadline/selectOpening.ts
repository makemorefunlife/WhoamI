import type { PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";
import { isPrimaryPalaceCross } from "@/lib/saju/palaceWeight";
import {
  computeRelationshipEventScores,
  formatEventScoresReason,
  triScoreToGrade,
  type RelationshipEventScores,
} from "@/lib/relationship/pairEventScores";
import type { RomanticInsightCandidate, RomanticOpeningSelection } from "./types";
import { joinRelationshipName, metaphorShortLabel } from "./buildInsightPool";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";

export type CompatibilityGradeResult = {
  grade: "A" | "B" | "C" | "D";
  reason: string;
  eventScores: RelationshipEventScores;
};

/** 궁위 가중 cross + 3점수(activation/benefit/risk)로 등급 산출 */
export function computeCompatibilityGrade(
  pair: PairSajuAnalysis,
  opts?: { hasStrengthComplement?: boolean },
): CompatibilityGradeResult {
  const eventScores = computeRelationshipEventScores(pair, opts);
  const grade = triScoreToGrade(eventScores.overall);
  const primaryPos = pair.allCrossHits.filter(
    (h) =>
      ["육합", "천간합", "삼합", "방합"].includes(h.type) &&
      isPrimaryPalaceCross(h),
  ).length;
  const primaryTension = pair.allCrossHits.filter(
    (h) =>
      ["충", "형", "해", "파"].includes(h.type) && isPrimaryPalaceCross(h),
  ).length;

  const reason =
    formatEventScoresReason(eventScores, grade) +
    ` · 일·월 궁 시너지 ${primaryPos} · 긴장 ${primaryTension}`;

  return { grade, reason, eventScores };
}

/** Headline Engine — selector: ranked[0] = Screen 1 Opening */
export function selectRomanticOpening(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  pairAnalysis: PairSajuAnalysis;
  insightPool: RomanticInsightCandidate[];
  hasStrengthComplement?: boolean;
  locale?: import("@/lib/relationship/romanticHeadline/locale").RomanticHeadlineLocale;
}): RomanticOpeningSelection {
  const { sajuJsonA, sajuJsonB, pairAnalysis, insightPool } = params;
  const locale = params.locale ?? "ko";

  const ranked = [...insightPool]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const top = ranked[0];
  const { grade, reason, eventScores } = computeCompatibilityGrade(
    pairAnalysis,
    { hasStrengthComplement: params.hasStrengthComplement },
  );

  const metaphorName = joinRelationshipName(
    metaphorShortLabel(sajuJsonA),
    metaphorShortLabel(sajuJsonB),
    locale,
  );

  if (!top) {
    return {
      relationship_name: metaphorName,
      one_line_summary: "두 사람의 기질이 만나 새로운 균형을 만들어요.",
      grade,
      grade_reason: reason,
      event_scores: eventScores,
      selected_insight_id: "fallback_empty_pool",
      ranked_insights: [],
    };
  }

  return {
    relationship_name: top.headline,
    one_line_summary: top.body,
    grade,
    grade_reason: reason,
    event_scores: eventScores,
    selected_insight_id: top.id,
    ranked_insights: ranked,
  };
}
