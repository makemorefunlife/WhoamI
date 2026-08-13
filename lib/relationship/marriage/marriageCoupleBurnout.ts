import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Marriage V2 Couple Burnout & Household Overload Engine
 */

export type LoadCategory =
  | "VISIBLE_WORK"
  | "MENTAL_LOAD"
  | "EMOTIONAL_LOAD"
  | "FINANCIAL_LOAD"
  | "CARE_LOAD"
  | "RELATIONSHIP_MAINTENANCE_LOAD";

export type IndividualLoadBreakdown = {
  personName: string;
  primaryManagerCategory: LoadCategory;
  invisibleLoadPct: number;
  burnoutTrigger: string;
  recoveryRequirement: string;
};

export type MarriageBurnoutBundle = {
  personA: IndividualLoadBreakdown;
  personB: IndividualLoadBreakdown;
  primaryOverloadRiskPartner: "a" | "b" | "balanced";
  reciprocityGap: "HIGH" | "MODERATE" | "LOW";
  overallNarrative: string;
};

export function buildMarriageCoupleBurnout(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  nameA: string,
  nameB: string,
  locale: Locale = "ko-KR",
): MarriageBurnoutBundle {
  const isEn = locale === "en-US";
  const axesA = psychA?.secondary_axes ?? {};
  const axesB = psychB?.secondary_axes ?? {};

  const structA = axesA.structure ?? 50;
  const structB = axesB.structure ?? 50;
  const empA = axesA.empathy ?? 50;
  const empB = axesB.empathy ?? 50;

  const gapStruct = structA - structB;

  let primaryOverloadRiskPartner: "a" | "b" | "balanced" = "balanced";
  if (gapStruct >= 20) primaryOverloadRiskPartner = "a";
  else if (gapStruct <= -20) primaryOverloadRiskPartner = "b";

  const personA: IndividualLoadBreakdown = {
    personName: nameA,
    primaryManagerCategory: gapStruct >= 15 ? "MENTAL_LOAD" : empA > 65 ? "EMOTIONAL_LOAD" : "VISIBLE_WORK",
    invisibleLoadPct: gapStruct >= 15 ? 75 : 45,
    burnoutTrigger: isEn
      ? "When planning and tracking chores goes unrecognized while taking full responsibility for household logistics"
      : "집안 정돈과 일정 기획을 혼자 챙기면서 그 노고가 '당연한 것'으로 치부될 때",
    recoveryRequirement: isEn
      ? "Explicit verbal recognition and receiving 1 full day of zero-responsibility rest"
      : "보이지 않는 기획에 대한 명확한 인정과 주 1회 완전히 손을 떼는 차단 휴식 시간",
  };

  const personB: IndividualLoadBreakdown = {
    personName: nameB,
    primaryManagerCategory: gapStruct <= -15 ? "MENTAL_LOAD" : empB > 65 ? "EMOTIONAL_LOAD" : "VISIBLE_WORK",
    invisibleLoadPct: gapStruct <= -15 ? 75 : 40,
    burnoutTrigger: isEn
      ? "When immediate physical execution is criticized for not meeting strict planning standards"
      : "실제 현장 실행을 빠르게 처리했음에도 세부 정리 정돈 방식이 꼼꼼하지 못하다고 지적받을 때",
    recoveryRequirement: isEn
      ? "Accepting flexible execution styles and acknowledging practical effort"
      : "실행 방식에 대한 자율성 보장과 실질적인 수고에 대한 긍정적 백업",
  };

  const reciprocityGap = Math.abs(gapStruct) >= 20 ? "HIGH" : Math.abs(gapStruct) >= 10 ? "MODERATE" : "LOW";

  const overallNarrative = primaryOverloadRiskPartner === "a"
    ? (isEn ? `${nameA} carries a high invisible Mental Load (planning & remembering). Unburdening this load prevents sudden burnout.` : `${nameA}님이 집안 운영을 기획하고 기억하는 보이지 않는 멘탈로드를 더 많이 짊어지고 있어, 이를 명시적으로 나눠 지는 것이 번아웃 방지의 핵심입니다.`)
    : primaryOverloadRiskPartner === "b"
    ? (isEn ? `${nameB} carries a high invisible Mental Load (planning & remembering). Unburdening this load prevents sudden burnout.` : `${nameB}님이 집안 운영을 기획하고 기억하는 보이지 않는 멘탈로드를 더 많이 짊어지고 있어, 이를 명시적으로 나눠 지는 것이 번아웃 방지의 핵심입니다.`)
    : (isEn ? `Both ${nameA} and ${nameB} balance household load evenly, with low overall burnout risk.` : `${nameA}님과 ${nameB}님은 가사 노동과 멘탈로드를 비교적 균형 있게 나눠 지고 있어 번아웃 위험이 낮습니다.`);

  return {
    personA,
    personB,
    primaryOverloadRiskPartner,
    reciprocityGap,
    overallNarrative,
  };
}
