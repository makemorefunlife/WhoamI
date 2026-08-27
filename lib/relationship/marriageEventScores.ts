import type { RelationshipEventScores, TopicTriScore } from "@/lib/relationship/pairEventScores";
import { triScoreToGrade } from "@/lib/relationship/pairEventScores";
import type { MarriagePairSajuAnalysis } from "@/lib/saju/marriageAnalysis";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/marriage/marriageCopy";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** 🔥 로맨틱 핏 · 🧩 라이프 시너지 · ⚡ 홈 리스크 (0~100) */
export type MarriageMasterScores = {
  /** 로맨틱 핏 */
  activation: number;
  /** 라이프 시너지 */
  benefit: number;
  /** 홈 리스크 (누적형, 높을수록 위험) */
  risk: number;
};

/**
 * 기획 정량 가중치 — MarriageScoringSignals 불리언 누적
 * 궁위 가중(일·시·월·년)은 marriageAnalysis.ts 신호 추출 단계에서 반영
 *
 * STATIC DETERMINISTIC — Phase 3B: this must depend only on the couple's
 * fixed saju signals, never on wall-clock time. It used to also fold in
 * threeYearForecast.storm_year_count/max_severity, which is a function of
 * new Date().getFullYear() (see buildThreeYearHomeRiskForecast) — so the
 * same couple's home_risk_pct/grade could silently drift depending on which
 * calendar year the report happened to be generated in. The 3-year forecast
 * remains a real, separately-displayed TIME-DEPENDENT signal (see
 * MarriageRuleContext.threeYearForecast) — it is just no longer allowed to
 * feed the static master score.
 */
export function computeMarriageMasterScores(
  marriage: MarriagePairSajuAnalysis,
): MarriageMasterScores {
  const sig = marriage.scoringSignals;

  let romanticFit = 50;
  if (sig.hasDayBranchCombine) romanticFit += 20;
  if (sig.hasDayBranchJohuComplement) romanticFit += 15;
  if (sig.hasDayStemMutualSupport) romanticFit += 15;
  if (sig.hasDayBranchChungHyung) romanticFit -= 20;

  let lifeSynergy = 50;
  if (sig.hasWealthOfficerComplement) lifeSynergy += 25;
  if (sig.hasFoodSealHarmony) lifeSynergy += 25;
  if (sig.hasWealthOfficerPowerStruggle) lifeSynergy -= 20;

  let homeRisk = 10;
  if (sig.hasDayHourHomeTension) homeRisk += 35;
  if (sig.hasWonjinOrGuimun) homeRisk += 25;
  if (sig.hasGongmangOverlap) homeRisk += 15;

  return {
    activation: clamp(romanticFit),
    benefit: clamp(lifeSynergy),
    risk: clamp(homeRisk),
  };
}

/** 스냅샷 3카드 — 주제당 대표 점수 1개만 사용 (중복 표기 방지) */
export function computeMarriageEventScores(
  marriage: MarriagePairSajuAnalysis,
): RelationshipEventScores {
  const master = computeMarriageMasterScores(marriage);

  const intimacy: TopicTriScore = {
    activation: master.activation,
    benefit: master.activation,
    risk: clamp(100 - master.activation),
  };
  const stability: TopicTriScore = {
    activation: master.benefit,
    benefit: master.benefit,
    risk: clamp(master.risk * 0.5),
  };
  const conflict: TopicTriScore = {
    activation: clamp(100 - master.risk),
    benefit: clamp(100 - master.risk),
    risk: master.risk,
  };
  const overall: TopicTriScore = {
    activation: master.activation,
    benefit: master.benefit,
    risk: master.risk,
  };

  return { intimacy, stability, conflict, overall };
}

export function computeMarriageCompatibilityGrade(
  marriage: MarriagePairSajuAnalysis,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): {
  grade: "A" | "B" | "C" | "D";
  reason: string;
  eventScores: RelationshipEventScores;
  masterScores: MarriageMasterScores;
} {
  const masterScores = computeMarriageMasterScores(marriage);
  const eventScores = computeMarriageEventScores(marriage);
  const grade = triScoreToGrade(eventScores.overall);

  const reason = pick(
    locale,
    `Cohabitation/marriage grade ${grade} — Romantic fit ${masterScores.activation}% · Life synergy ${masterScores.benefit}% · Home risk ${masterScores.risk}%`,
    `동거·결혼 등급 ${grade} — 로맨틱 핏 ${masterScores.activation}% · 라이프 시너지 ${masterScores.benefit}% · 홈 리스크 ${masterScores.risk}%`,
  );

  return { grade, reason, eventScores, masterScores };
}

export { triScoreToGrade };
