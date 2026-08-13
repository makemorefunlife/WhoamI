import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Marriage V2 In-Law & Original Family Boundary Engine
 */

export type PrimaryLoyalty = "SPOUSE_FIRST" | "ORIGINAL_FAMILY_FIRST" | "BALANCED_DUAL";
export type PartnerProtectionStyle = "ACTIVE_SHIELD" | "MEDIATOR_BALANCE" | "PASSIVE_STANDBY";
export type InLawPairVerdict = "HEALTHY_INDEPENDENT" | "FAMILY_ENMESHED_RISK" | "ASYMMETRIC_LOYALTY" | "NEGOTIATION_NEEDED";

export type IndividualInLawProfile = {
  personName: string;
  boundaryStrength: "HIGH" | "MODERATE" | "PERMEABLE";
  primaryLoyalty: PrimaryLoyalty;
  protectionStyle: PartnerProtectionStyle;
  guiltObligationTendency: "HIGH" | "MODERATE" | "LOW";
  interventionRiskDomain: string; // holiday, financial_advice, parenting, daily_checkin
};

export type MarriageInLawBoundaryBundle = {
  profileA: IndividualInLawProfile;
  profileB: IndividualInLawProfile;
  pairVerdict: InLawPairVerdict;
  narrative: string;
};

export function buildMarriageInLawBoundary(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  sajuJsonA: SajuDataForIntegrated,
  sajuJsonB: SajuDataForIntegrated,
  nameA: string,
  nameB: string,
  locale: Locale = "ko-KR",
): MarriageInLawBoundaryBundle {
  const isEn = locale === "en-US";
  const axesA = psychA?.secondary_axes ?? {};
  const axesB = psychB?.secondary_axes ?? {};

  const getProfile = (name: string, axes: any): IndividualInLawProfile => {
    const emp = axes.empathy ?? 50;
    const stim = axes.stimulation ?? 50;
    const str = axes.structure ?? 50;

    let primaryLoyalty: PrimaryLoyalty = "SPOUSE_FIRST";
    if (emp > 70 && str > 60) primaryLoyalty = "BALANCED_DUAL";
    else if (emp > 75 && stim < 40) primaryLoyalty = "ORIGINAL_FAMILY_FIRST";

    let protectionStyle: PartnerProtectionStyle = "MEDIATOR_BALANCE";
    if (axes.conflict_style > 60) protectionStyle = "ACTIVE_SHIELD";
    else if (axes.conflict_style < 40) protectionStyle = "PASSIVE_STANDBY";

    return {
      personName: name,
      boundaryStrength: str > 60 ? "HIGH" : str < 40 ? "PERMEABLE" : "MODERATE",
      primaryLoyalty,
      protectionStyle,
      guiltObligationTendency: emp > 65 ? "HIGH" : "MODERATE",
      interventionRiskDomain: isEn ? "Holiday schedules and parenting advice" : "명절/경조사 일정 및 육아 관련 의사결정",
    };
  };

  const profileA = getProfile(nameA, axesA);
  const profileB = getProfile(nameB, axesB);

  let pairVerdict: InLawPairVerdict = "HEALTHY_INDEPENDENT";
  if (profileA.primaryLoyalty === "ORIGINAL_FAMILY_FIRST" && profileB.primaryLoyalty === "ORIGINAL_FAMILY_FIRST") {
    pairVerdict = "FAMILY_ENMESHED_RISK";
  } else if (profileA.primaryLoyalty !== profileB.primaryLoyalty) {
    pairVerdict = "ASYMMETRIC_LOYALTY";
  } else if (profileA.boundaryStrength === "PERMEABLE" || profileB.boundaryStrength === "PERMEABLE") {
    pairVerdict = "NEGOTIATION_NEEDED";
  }

  let narrative = "";
  if (pairVerdict === "HEALTHY_INDEPENDENT") {
    narrative = isEn
      ? `Both ${nameA} and ${nameB} prioritize their new household boundary while maintaining warm, respectful ties with original families.`
      : `${nameA}님과 ${nameB}님 모두 원가족에 대한 존중을 유지하되, 새로운 부부 독립 가정을 최우선 방어벽으로 세우는 건강한 독립성을 지닙니다.`;
  } else if (pairVerdict === "ASYMMETRIC_LOYALTY") {
    narrative = isEn
      ? `${nameA} and ${nameB} show different levels of original family involvement, requiring explicit agreement on holiday and financial boundaries.`
      : `두 사람의 원가족 의존도 및 충성도에 시각차가 존재하므로, 명절 일정이나 부모님 경조사 결정 시 사전 합의 가이드라인이 필요합니다.`;
  } else {
    narrative = isEn
      ? `Clear, proactive boundary shields protect the couple's autonomy from outside interventions.`
      : `외부 개입으로부터 부부의 자율성을 지키기 위해 각자가 자신의 원가족과의 대화 창구를 책임지고 방어해주는 리더십이 요구됩니다.`;
  }

  return {
    profileA,
    profileB,
    pairVerdict,
    narrative,
  };
}
