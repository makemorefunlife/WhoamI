import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Marriage V2 Expectations, Critical Moments & Need x Delivery Gap Engine
 */

export type ExpectationItem = {
  giverName: string; // The person being asked not to expect
  receiverName: string; // The person asking
  whatNotToExpect: string;
  reason: string;
};

export type CriticalMomentItem = {
  personInNeed: string;
  supportingPartner: string;
  sceneTitle: string;
  sceneDescription: string;
};

export type NeedCategory =
  | "EMOTIONAL_NEED"
  | "PRACTICAL_SUPPORT_NEED"
  | "SECURITY_NEED"
  | "AUTONOMY_NEED"
  | "HOUSEHOLD_SUPPORT_NEED"
  | "INTIMACY_NEED";

export type NeedSupplyStatus = "WELL_SUPPLIED" | "PARTIALLY_SUPPLIED" | "MISMATCHED" | "NEEDS_ATTENTION";

export type NeedSupplyGapItem = {
  category: NeedCategory;
  categoryLabel: string;
  receiverName: string;
  giverName: string;
  status: NeedSupplyStatus;
  narrative: string;
};

export type MarriageExpectationsAndNeedsBundle = {
  expectationsAtoB: ExpectationItem[];
  expectationsBtoA: ExpectationItem[];
  momentsAtoB: CriticalMomentItem[];
  momentsBtoA: CriticalMomentItem[];
  needGaps: NeedSupplyGapItem[];
};

export function buildMarriageExpectationsAndNeeds(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  nameA: string,
  nameB: string,
  locale: Locale = "ko-KR",
): MarriageExpectationsAndNeedsBundle {
  const isEn = locale === "en-US";
  const axesA = psychA?.secondary_axes ?? {};
  const axesB = psychB?.secondary_axes ?? {};

  // 1. What Not to Expect
  const expectationsAtoB: ExpectationItem[] = [
    {
      giverName: nameB,
      receiverName: nameA,
      whatNotToExpect: isEn
        ? `Expecting ${nameB} to intuitively handle all chores without clear domain split`
        : `${nameB}님이 말하지 않아도 모든 집안일과 루틴을 완벽히 파악해 알아서 챙겨주기를 기대하는 것`,
      reason: isEn
        ? "Imposing implicit expectations leads to silent frustration; explicit domain division is required."
        : "암묵적인 기대는 서운함을 만듭니다. 구체적인 역할과 구역을 나누는 것이 훨씬 평화롭습니다.",
    },
  ];

  const expectationsBtoA: ExpectationItem[] = [
    {
      giverName: nameA,
      receiverName: nameB,
      whatNotToExpect: isEn
        ? `Expecting ${nameA} to always make financial decisions at your exact speed`
        : `${nameA}님이 항상 내가 원하는 속도와 템포로 빠르게 재정 결정을 내려주기를 기대하는 것`,
      reason: isEn
        ? "Financial caution comes from a desire for long-term security, not reluctance to support."
        : "신중한 재정 검토는 불안감 완화를 위한 성향이며 의도적인 미룸이 아닙니다.",
    },
  ];

  // 2. When We Need Each Other Most
  const momentsAtoB: CriticalMomentItem[] = [
    {
      personInNeed: nameA,
      supportingPartner: nameB,
      sceneTitle: isEn ? "When career shifts strain household routines" : "커리어 결정이나 업무 과중으로 집안 운영이 흔들릴 때",
      sceneDescription: isEn
        ? `${nameA} needs ${nameB} to step in and absorb day-to-day logistics without judgment.`
        : `${nameA}님의 업무 부담이 가중될 때, ${nameB}님이 집안 가사 운영을 든든히 받쳐주면 깊은 고마움을 느낍니다.`,
    },
  ];

  const momentsBtoA: CriticalMomentItem[] = [
    {
      personInNeed: nameB,
      supportingPartner: nameA,
      sceneTitle: isEn ? "When burnout drains emotional battery" : "번아웃이나 정서적 소진으로 혼자만의 시간이 절실할 때",
      sceneDescription: isEn
        ? `${nameB} needs ${nameA} to protect their private recovery window without questioning.`
        : `${nameB}님이 방전되었을 때, ${nameA}님이 아무런 재촉 없이 혼자만의 침묵 시간을 조용히 지켜줄 때 가장 큰 안도를 느낍니다.`,
    },
  ];

  // 3. Need x Actual Delivery x Gap
  const categories: { cat: NeedCategory; label: string }[] = [
    { cat: "EMOTIONAL_NEED", label: isEn ? "Emotional Care Need" : "정서적 공감 & 따뜻한 돌봄" },
    { cat: "PRACTICAL_SUPPORT_NEED", label: isEn ? "Practical Support Need" : "실용적 현장 문제 해결" },
    { cat: "SECURITY_NEED", label: isEn ? "Financial Security Need" : "재정적 안정감 & 예측 가능성" },
    { cat: "AUTONOMY_NEED", label: isEn ? "Autonomy Need" : "개인 공간 & 자율성 존중" },
    { cat: "HOUSEHOLD_SUPPORT_NEED", label: isEn ? "Household PM Need" : "가사 분담 & 운영 부담 완화" },
    { cat: "INTIMACY_NEED", label: isEn ? "Bedroom Intimacy Need" : "신체적 친밀감 & 애정 스킨십" },
  ];

  const needGaps: NeedSupplyGapItem[] = categories.map(({ cat, label }) => {
    let status: NeedSupplyStatus = "WELL_SUPPLIED";
    let narrative = "";

    if (cat === "HOUSEHOLD_SUPPORT_NEED") {
      const gapStruct = Math.abs((axesA.structure ?? 50) - (axesB.structure ?? 50));
      if (gapStruct >= 20) {
        status = "PARTIALLY_SUPPLIED";
        narrative = isEn
          ? "Household PM load relies heavily on one partner; explicit domain division helps balance supply."
          : "집안일 운영 책임이 한쪽으로 가중되어 있어, 영역별 고정 분담을 통해 충족도를 올릴 필요가 있습니다.";
      } else {
        status = "WELL_SUPPLIED";
        narrative = isEn ? "Household operating support is mutually balanced." : "가사 운영 부담을 서로 균형 있게 나눠 지고 있습니다.";
      }
    } else if (cat === "EMOTIONAL_NEED") {
      const gapEmp = Math.abs((axesA.empathy ?? 50) - (axesB.empathy ?? 50));
      if (gapEmp >= 25) {
        status = "NEEDS_ATTENTION";
        narrative = isEn
          ? "Emotional care is expressed through practical help rather than verbal empathy."
          : "정서적 공감의 표현이 언어보다는 실질적 조언으로 전달되어 가끔 섭섭함이 발생할 수 있습니다.";
      } else {
        status = "WELL_SUPPLIED";
        narrative = isEn ? "Mutual emotional care is steadily supplied." : "서로의 정서적 케어와 경청이 원활히 이뤄지고 있습니다.";
      }
    } else {
      status = "WELL_SUPPLIED";
      narrative = isEn ? "Needs in this domain are adequately met through existing routines." : "현재 주거 시스템하에서 비교적 안정적으로 충족되고 있습니다.";
    }

    return {
      category: cat,
      categoryLabel: label,
      receiverName: nameA,
      giverName: nameB,
      status,
      narrative,
    };
  });

  return {
    expectationsAtoB,
    expectationsBtoA,
    momentsAtoB,
    momentsBtoA,
    needGaps,
  };
}
