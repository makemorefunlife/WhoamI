import type { OverviewCardData } from "../../../relationship/shared/overview/overviewTypes";
import { computeRelationshipEventScores } from "../../../relationship/pairEventScores";
import { interpretTopic } from "../../../relationship/romanticSnapshot/buildSnapshotNarrative";
import type { PairSajuAnalysis } from "../../../saju/pairChartAnalysis";
import type { RomanticHeadlineLocale } from "../../../relationship/romanticHeadline/locale";

export function buildRomanticOverviewSnapshot(params: {
  pairSajuAnalysis: PairSajuAnalysis;
  locale: RomanticHeadlineLocale;
}): OverviewCardData[] {
  const scores = computeRelationshipEventScores(params.pairSajuAnalysis);

  const intimacyNarrative = interpretTopic(
    { topic: "intimacy", label: params.locale === "en" ? "Intimacy" : "친밀감", ...scores.intimacy },
    undefined,
    undefined,
    params.locale
  );
  
  const stabilityNarrative = interpretTopic(
    { topic: "stability", label: params.locale === "en" ? "Stability" : "안정감", ...scores.stability },
    undefined,
    undefined,
    params.locale
  );

  const conflictNarrative = interpretTopic(
    { topic: "conflict", label: params.locale === "en" ? "Conflict" : "마찰", ...scores.conflict },
    undefined,
    undefined,
    params.locale
  );

  const resolveGrade = (score: number, inverted: boolean) => {
    if (inverted) {
      if (score < 40) return "안전한 편";
      if (score < 70) return "보통 수준";
      return "주의 필요";
    } else {
      if (score >= 70) return "매우 좋음";
      if (score >= 40) return "좋은 편";
      return "보통 수준";
    }
  };

  return [
    {
      key: "intimacy",
      icon: "🔥",
      label: intimacyNarrative.title,
      score: scores.intimacy.activation,
      inverted: false,
      tone: scores.intimacy.activation >= 60 ? "good" : "neutral",
      gradeLabel: resolveGrade(scores.intimacy.activation, false),
      oneLiner: intimacyNarrative.subtitle,
      measures: params.locale === "en" ? "How deeply you connect on a romantic and emotional level" : "두 사람이 연인으로서 정서적으로 얼마나 깊이 연결되어 있는지",
      why: intimacyNarrative.interpretation,
      thresholdText: intimacyNarrative.axisNote,
    },
    {
      key: "stability",
      icon: "🧩",
      label: stabilityNarrative.title,
      score: scores.stability.benefit,
      inverted: false,
      tone: scores.stability.benefit >= 60 ? "good" : "neutral",
      gradeLabel: resolveGrade(scores.stability.benefit, false),
      oneLiner: stabilityNarrative.subtitle,
      measures: params.locale === "en" ? "How well you navigate real-world challenges and build trust" : "현실적인 문제 앞에서 신뢰를 잃지 않고 얼마나 잘 맞춰갈 수 있는지",
      why: stabilityNarrative.interpretation,
      thresholdText: stabilityNarrative.axisNote,
    },
    {
      key: "conflict",
      icon: "⚡",
      label: conflictNarrative.title,
      score: scores.conflict.risk,
      inverted: true,
      tone: scores.conflict.risk >= 70 ? "warn" : scores.conflict.risk < 40 ? "good" : "neutral",
      gradeLabel: resolveGrade(scores.conflict.risk, true),
      oneLiner: conflictNarrative.subtitle,
      measures: params.locale === "en" ? "The potential for friction or misunderstanding in the relationship" : "연애 중 의사소통이나 가치관 차이로 마찰이 생길 가능성",
      why: conflictNarrative.interpretation,
      thresholdText: conflictNarrative.axisNote,
    }
  ];
}
