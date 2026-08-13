import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Marriage V2 11-Axis Full Integration & Dark Axis Insights Engine
 */

export type MarriageAxisDomainKey =
  | "lifestyle_rhythm"
  | "money_management"
  | "chores_living"
  | "planning_structure"
  | "decision_power"
  | "conflict_resolution"
  | "emotional_care"
  | "personal_space"
  | "social_tempo"
  | "career_priority"
  | "recovery_recharge";

export type DarkAxisInsightItem = {
  axisKey: MarriageAxisDomainKey;
  axisLabel: string;
  scoreA: number;
  scoreB: number;
  gap: number;
  dynamicType: "RESONANCE" | "COMPLEMENT" | "TENSION";
  realLifePhenomenon: string;
  coordinationPoint: string;
};

export type Marriage11AxisBundle = {
  highlights: {
    maxResonance: DarkAxisInsightItem;
    maxTension: DarkAxisInsightItem;
  };
  darkAxisInsights: DarkAxisInsightItem[];
};

export function buildMarriage11AxisInsights(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  nameA: string,
  nameB: string,
  locale: Locale = "ko-KR",
): Marriage11AxisBundle {
  const isEn = locale === "en-US";
  const axesA = psychA?.secondary_axes ?? {};
  const axesB = psychB?.secondary_axes ?? {};

  const getA = (key: string, def = 50) => (axesA as any)[key] ?? def;
  const getB = (key: string, def = 50) => (axesB as any)[key] ?? def;

  const mapping: { key: MarriageAxisDomainKey; label: string; axisSourceKey: string }[] = [
    { key: "lifestyle_rhythm", label: isEn ? "Living Rhythm" : "생활 리듬 & 활동 템포", axisSourceKey: "energy_style" },
    { key: "money_management", label: isEn ? "Financial Control" : "돈 관리 & 소비관", axisSourceKey: "practicality" },
    { key: "chores_living", label: isEn ? "Household Order" : "집안일 & 주거 정돈", axisSourceKey: "structure" },
    { key: "planning_structure", label: isEn ? "Planning & Routine" : "계획 & 고정 루틴", axisSourceKey: "structure" },
    { key: "decision_power", label: isEn ? "Decision Style" : "결정 속도 & 신중함", axisSourceKey: "decision_style" },
    { key: "conflict_resolution", label: isEn ? "Conflict Stance" : "갈등 직면 & 대화 태도", axisSourceKey: "conflict_style" },
    { key: "emotional_care", label: isEn ? "Emotional Care" : "정서적 공감 & 돌봄", axisSourceKey: "empathy" },
    { key: "personal_space", label: isEn ? "Personal Autonomy" : "개인 공간 & 혼자만의 시간", axisSourceKey: "stimulation" },
    { key: "social_tempo", label: isEn ? "Social Energy" : "외부 모임 & 사교 템포", axisSourceKey: "stimulation" },
    { key: "career_priority", label: isEn ? "Career Ambition" : "커리어 & 성취 인정", axisSourceKey: "recognition" },
    { key: "recovery_recharge", label: isEn ? "Stress Resilience" : "회복 탄력성 & 스트레스 해소", axisSourceKey: "resilience" },
  ];

  const darkAxisInsights: DarkAxisInsightItem[] = mapping.map(({ key, label, axisSourceKey }) => {
    const valA = getA(axisSourceKey);
    const valB = getB(axisSourceKey);
    const gap = Math.abs(valA - valB);

    let dynamicType: DarkAxisInsightItem["dynamicType"] = "COMPLEMENT";
    if (gap <= 10) dynamicType = "RESONANCE";
    else if (gap >= 25) dynamicType = "TENSION";

    let realLifePhenomenon = "";
    let coordinationPoint = "";

    if (key === "planning_structure" || key === "chores_living") {
      if (dynamicType === "TENSION") {
        const leader = valA > valB ? nameA : nameB;
        const follower = valA > valB ? nameB : nameA;
        realLifePhenomenon = isEn
          ? `${leader} sets high organizational standards, while ${follower} feels micromanaged under strict routines.`
          : `${leader}님은 집안 정돈과 계획의 규칙을 명확히 세우고자 하나, ${follower}님은 지나친 개입이나 압박으로 느낄 수 있습니다.`;
        coordinationPoint = isEn
          ? "Delegate clear independent domains instead of judging daily execution methods."
          : "가사 조율 시 세부 방식 지적보다는 서율 영역을 구체적으로 분할하는 것이 효과적입니다.";
      } else {
        realLifePhenomenon = isEn
          ? `Both share balanced views on household organization.`
          : `두 사람의 생활 루틴과 집안 정돈 기준이 비슷하여 편안한 조화를 이룹니다.`;
        coordinationPoint = isEn
          ? "Maintain current shared routines."
          : "현재의 자연스러운 가사 정돈 루틴을 유지하세요.";
      }
    } else if (key === "money_management") {
      if (dynamicType === "TENSION") {
        realLifePhenomenon = isEn
          ? "Disagreements may surface around spending priorities and savings tempo."
          : "지출의 시급성과 자산 투자 방식에서 시각차가 발생하여 예산 합의 시 피로감이 누적될 수 있습니다.";
        coordinationPoint = isEn
          ? "Assign clear CFO authority for daily budgets while reviewing large expenditures jointly."
          : "일상 용돈과 고정비는 CFO 지주에게 위임하고, 일정 금액 이상의 대형 지출만 공동 승인제로 운영하세요.";
      } else {
        realLifePhenomenon = isEn
          ? "Harmonious financial discipline and mutual understanding of spending values."
          : "재정 지출과 미래 가치관에 대한 신뢰와 이해가 높아 안정적인 자산 형성이 가능합니다.";
        coordinationPoint = isEn ? "Keep periodic budget reviews transparent." : "정기 재정 점검을 투명하게 이어가세요.";
      }
    } else {
      realLifePhenomenon = isEn
        ? `${nameA} (score ${valA}) and ${nameB} (score ${valB}) display distinct operational rhythms in this domain.`
        : `${nameA}님(점수 ${valA})과 ${nameB}님(점수 ${valB})은 이 영역에서 각자 고유한 기질적 템포를 보입니다.`;
      coordinationPoint = isEn
        ? "Acknowledge behavioral differences without forcing identical responses."
        : "서로의 기질적 차이를 인정하고 동일한 반응을 강요하지 않는 것이 관계의 안정을 지켜줍니다.";
    }

    return {
      axisKey: key,
      axisLabel: label,
      scoreA: valA,
      scoreB: valB,
      gap,
      dynamicType,
      realLifePhenomenon,
      coordinationPoint,
    };
  });

  const sortedByGap = [...darkAxisInsights].sort((x, y) => y.gap - x.gap);
  const maxTension = sortedByGap[0];
  const maxResonance = sortedByGap[sortedByGap.length - 1];

  return {
    highlights: {
      maxResonance,
      maxTension,
    },
    darkAxisInsights,
  };
}
