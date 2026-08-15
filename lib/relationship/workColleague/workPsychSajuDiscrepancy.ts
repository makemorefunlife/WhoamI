import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";

export type DiscrepancyStatus = "CONFIRMED" | "NUANCED" | "DISCREPANT" | "INSUFFICIENT";

export type WorkDiscrepancyResult = {
  axis: "decision" | "communication" | "risk" | "recognition" | "stimulation";
  status: DiscrepancyStatus;
  innateLabel: string;
  currentLabel: string;
  insightLine: string | null;
};

/**
 * Innate (Saju) vs Current (Psych) Work Discrepancy Engine.
 * Does NOT overwrite Saju with Psych. Instead, preserves both and treats
 * discrepancies as meaningful context signals (e.g., innate fast drive vs current cautious due-diligence mode).
 */
export function analyzeWorkInnateVsCurrentDiscrepancy(params: {
  sajuJson: SajuDataForIntegrated;
  psychMaster: PsychMasterJson | null | undefined;
  name: string;
  locale?: Locale;
}): WorkDiscrepancyResult[] {
  const { sajuJson, psychMaster, name } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  if (!psychMaster?.secondary_axes) {
    return [
      {
        axis: "decision",
        status: "INSUFFICIENT",
        innateLabel: "기본 기질",
        currentLabel: "미측정",
        insightLine: null,
      },
    ];
  }

  const results: WorkDiscrepancyResult[] = [];
  const axes = psychMaster.secondary_axes;

  // 1. Decision Tempo (Saju Day Stem / Geokguk vs Psych decision_style)
  const dayStem = sajuJson.saju?.dayPillar?.[0] ?? "";
  const isFastInnate = ["갑", "병", "무", "경", "임"].includes(dayStem);
  const decisionStyle = axes.decision_style ?? 50;

  if (isFastInnate && decisionStyle <= 35) {
    results.push({
      axis: "decision",
      status: "DISCREPANT",
      innateLabel: pick(locale, "Fast Initiative Drive", "추진형 기질"),
      currentLabel: "신중 검토 모드",
      insightLine: pick(
        locale,
        `${name}'s innate drive naturally seeks fast momentum, but currently operates with thorough verification and caution — a signs of high due-diligence in the current role.`,
        `${name}님은 본래 결단과 추진 속도가 빠른 기질이지만, 현재는 리스크 검증과 신중함을 높여 일하는 상태입니다.`,
      ),
    });
  } else if (isFastInnate && decisionStyle >= 65) {
    results.push({
      axis: "decision",
      status: "CONFIRMED",
      innateLabel: pick(locale, "Fast Initiative Drive", "추진형 기질"),
      currentLabel: "신속 결단 실행",
      insightLine: pick(
        locale,
        `${name}'s innate drive matches their current work style: fast decision-making and clear momentum.`,
        `${name}님은 타고난 추진 기질과 현재 업무 방식이 일치하여 빠른 의사결정과 실행력을 보여줍니다.`,
      ),
    });
  } else {
    results.push({
      axis: "decision",
      status: "NUANCED",
      innateLabel: pick(locale, "Balanced Tempo", "조율형 기질"),
      currentLabel: "상황별 유연 대응",
      insightLine: pick(
        locale,
        `${name} balances innate speed with contextual flexibility depending on task priorities.`,
        `${name}님은 기본 기질과 상황별 필요에 따라 속도와 신중함의 균형을 조율하고 있습니다.`,
      ),
    });
  }

  // 2. Recognition & Visibility (Saju Officer/Peer vs Psych recognition)
  const recognitionScore = axes.recognition ?? 50;
  if (recognitionScore >= 70) {
    results.push({
      axis: "recognition",
      status: "CONFIRMED",
      innateLabel: pick(locale, "High Visibility Preference", "명확한 성과 노출 선호"),
      currentLabel: "대외 발표·공로 인정 중시",
      insightLine: pick(
        locale,
        `${name} values clear project ownership and public acknowledgment for team contributions.`,
        `${name}님은 프로젝트에 대한 명확한 R&R 표시와 성과에 대한 대외적 공로 인정을 중시합니다.`,
      ),
    });
  } else if (recognitionScore <= 35) {
    results.push({
      axis: "recognition",
      status: "CONFIRMED",
      innateLabel: pick(locale, "Behind-the-scenes Execution", "실속형 내실 선호"),
      currentLabel: "조용한 실무 완수 중시",
      insightLine: pick(
        locale,
        `${name} prefers focusing on solid operational output rather than standing in the spotlight.`,
        `${name}님은 화려한 성과 스포트라이트보다 실질적인 결과물 완성에 집중하는 스타일입니다.`,
      ),
    });
  }

  // 3. Stimulation & Task Variety (Psych stimulation)
  const stimulationScore = axes.stimulation ?? 50;
  if (stimulationScore >= 70) {
    results.push({
      axis: "stimulation",
      status: "CONFIRMED",
      innateLabel: pick(locale, "New Initiative Preference", "신규 프로젝트 선호"),
      currentLabel: "변화·도전 기획 우세",
      insightLine: pick(
        locale,
        `${name} thrives when launching new initiatives, exploring fresh ideas, and taking on varied tasks.`,
        `${name}님은 새로운 프로젝트를 론칭하거나 변화가 있는 기획을 맡을 때 에너지가 크게 살아납니다.`,
      ),
    });
  } else if (stimulationScore <= 35) {
    results.push({
      axis: "stimulation",
      status: "CONFIRMED",
      innateLabel: pick(locale, "Stable Operations Preference", "안정적 운영 선호"),
      currentLabel: "체계적 루틴 완수",
      insightLine: pick(
        locale,
        `${name} excels at bringing stability, structure, and predictable execution to ongoing operations.`,
        `${name}님은 잦은 변수보다 안정적이고 예측 가능한 운영 절차를 지키며 고퀄리티 결과를 만듭니다.`,
      ),
    });
  }

  return results;
}
