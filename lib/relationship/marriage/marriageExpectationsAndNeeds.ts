import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";
import { resolveDirectionalMarriageRole } from "./marriageEvidenceResolution";

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

const GAP_GATE = 15;

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

  // 1. What Not to Expect — gated on a real structure gap (who is LESS
  // likely to independently track routines/chores without discussion),
  // never fixed to one slot. Below the gate, this narrows to a shared,
  // non-attributed reminder instead of inventing which person has the gap.
  const structureRole = resolveDirectionalMarriageRole({
    scoreA: axesA.structure ?? 50,
    scoreB: axesB.structure ?? 50,
    gapGate: GAP_GATE,
    roleForHigher: "a" as const,
    roleForLower: "b" as const,
    sharedRole: "shared" as const,
    source: "PSYCH" as const,
  });
  const lessStructuredName =
    structureRole.actor === "a" ? nameB : structureRole.actor === "b" ? nameA : null;
  const moreStructuredName =
    structureRole.actor === "a" ? nameA : structureRole.actor === "b" ? nameB : null;

  const expectationsAtoB: ExpectationItem[] = [
    lessStructuredName
      ? {
          giverName: lessStructuredName,
          receiverName: lessStructuredName === nameA ? nameB : nameA,
          whatNotToExpect: isEn
            ? `Expecting ${lessStructuredName} to intuitively handle all chores and routines without ever discussing a domain split`
            : `${lessStructuredName}님이 말하지 않아도 모든 집안일과 루틴을 완벽히 파악해 알아서 챙겨주기를 기대하는 것`,
          reason: isEn
            ? "Implicit expectations lead to silent frustration; an explicit domain split works better for the person whose own structure evidence is lighter here."
            : "암묵적인 기대는 서운함을 만듭니다. 이 영역에서 상대적으로 구조화 성향이 약한 쪽에게는 구체적인 역할과 구역을 나누는 것이 훨씬 평화롭습니다.",
        }
      : {
          giverName: nameB,
          receiverName: nameA,
          whatNotToExpect: isEn
            ? "Expecting either partner to intuitively handle all chores without ever discussing a domain split"
            : "말하지 않아도 누군가 모든 집안일과 루틴을 알아서 챙겨줄 것이라 기대하는 것",
          reason: isEn
            ? "Neither of you shows a clearly lighter structure tendency here — an explicit domain split still helps, but it isn't specifically either person's gap."
            : "이 부분에서 두 사람의 구조화 성향에 뚜렷한 차이가 없습니다. 그래도 구체적인 역할 분담은 도움이 되지만, 특정 한쪽의 몫으로 단정할 근거는 아닙니다.",
        },
  ];

  const expectationsBtoA: ExpectationItem[] = [
    moreStructuredName
      ? {
          giverName: moreStructuredName,
          receiverName: moreStructuredName === nameA ? nameB : nameA,
          whatNotToExpect: isEn
            ? `Expecting ${moreStructuredName} to always move at your exact preferred speed on financial decisions`
            : `${moreStructuredName}님이 항상 원하는 속도와 템포로 빠르게 재정 결정을 내려주기를 기대하는 것`,
          reason: isEn
            ? "The more structure-oriented partner's caution usually comes from a desire for long-term security, not reluctance to support."
            : "구조화 성향이 상대적으로 강한 쪽의 신중한 재정 검토는 불안감 완화를 위한 성향이며 의도적인 미룸이 아닙니다.",
        }
      : {
          giverName: nameA,
          receiverName: nameB,
          whatNotToExpect: isEn
            ? "Expecting financial decisions to always move at one preferred speed"
            : "재정 결정이 항상 한 사람이 원하는 속도로만 이뤄지기를 기대하는 것",
          reason: isEn
            ? "Neither of you shows a clearly stronger caution tendency here — pace mismatches are still worth naming, just not as one person's fixed trait."
            : "이 부분에서 두 사람의 신중함 성향에 뚜렷한 차이가 없습니다. 속도 차이는 여전히 짚어볼 만하지만, 한쪽의 고정된 성향으로 단정할 근거는 아닙니다.",
        },
  ];

  // 2. When We Need Each Other Most — gated on a real resilience/recognition
  // gap (who is more likely to be strained by external pressure right now),
  // rather than fixed to "A gets career-strained, B gets emotionally worn."
  const strainRole = resolveDirectionalMarriageRole({
    scoreA: (axesA.recognition ?? 50) + (100 - (axesA.resilience ?? 50)),
    scoreB: (axesB.recognition ?? 50) + (100 - (axesB.resilience ?? 50)),
    gapGate: GAP_GATE,
    roleForHigher: "a" as const,
    roleForLower: "b" as const,
    sharedRole: "shared" as const,
    source: "PSYCH" as const,
  });
  const personLikelierUnderExternalStrain = strainRole.actor === "a" ? nameA : strainRole.actor === "b" ? nameB : null;
  const otherPerson = personLikelierUnderExternalStrain === nameA ? nameB : nameA;

  const momentsAtoB: CriticalMomentItem[] = personLikelierUnderExternalStrain
    ? [
        {
          personInNeed: personLikelierUnderExternalStrain,
          supportingPartner: otherPerson,
          sceneTitle: isEn ? "When career shifts strain household routines" : "커리어 결정이나 업무 과중으로 집안 운영이 흔들릴 때",
          sceneDescription: isEn
            ? `${personLikelierUnderExternalStrain} may need ${otherPerson} to step in and absorb day-to-day logistics without judgment.`
            : `${personLikelierUnderExternalStrain}님의 업무 부담이 가중될 때, ${otherPerson}님이 집안 가사 운영을 든든히 받쳐주면 깊은 고마움을 느낄 수 있습니다.`,
        },
      ]
    : [
        {
          personInNeed: nameA,
          supportingPartner: nameB,
          sceneTitle: isEn ? "When outside pressure strains household routines" : "외부 부담으로 집안 운영이 흔들릴 때",
          sceneDescription: isEn
            ? "Whichever of you is under more external pressure at a given time may need the other to step in without judgment — this shifts with circumstances, not with who either of you fundamentally is."
            : "그 시기에 외부 부담이 더 큰 쪽이 상대의 도움을 필요로 할 수 있습니다 — 이는 두 사람의 고정된 성향이 아니라 상황에 따라 바뀌는 부분입니다.",
        },
      ];

  const momentsBtoA: CriticalMomentItem[] = personLikelierUnderExternalStrain
    ? [
        {
          personInNeed: otherPerson,
          supportingPartner: personLikelierUnderExternalStrain,
          sceneTitle: isEn ? "When burnout drains emotional battery" : "번아웃이나 정서적 소진으로 혼자만의 시간이 절실할 때",
          sceneDescription: isEn
            ? `${otherPerson} may need ${personLikelierUnderExternalStrain} to protect their private recovery window without questioning.`
            : `${otherPerson}님이 방전되었을 때, ${personLikelierUnderExternalStrain}님이 재촉 없이 혼자만의 시간을 지켜주면 큰 안도를 느낄 수 있습니다.`,
        },
      ]
    : [
        {
          personInNeed: nameB,
          supportingPartner: nameA,
          sceneTitle: isEn ? "When burnout drains emotional battery" : "번아웃이나 정서적 소진으로 혼자만의 시간이 절실할 때",
          sceneDescription: isEn
            ? "Whichever of you is running low may need the other to protect a private recovery window without questioning it."
            : "둘 중 방전된 쪽이 재촉 없는 혼자만의 시간을 필요로 할 수 있습니다 — 이는 상황에 따라 바뀌는 부분입니다.",
        },
      ];

  // 3. Need x Actual Delivery x Gap — receiver/giver now follow the actual
  // gap direction per category instead of being fixed to nameA=receiver,
  // nameB=giver regardless of the evidence.
  const categories: { cat: NeedCategory; label: string; axisKey: "structure" | "empathy" | "practicality" | "stimulation" | "decision_style" | null }[] = [
    { cat: "EMOTIONAL_NEED", label: isEn ? "Emotional Care Need" : "정서적 공감 & 따뜻한 돌봄", axisKey: "empathy" },
    { cat: "PRACTICAL_SUPPORT_NEED", label: isEn ? "Practical Support Need" : "실용적 현장 문제 해결", axisKey: "practicality" },
    { cat: "SECURITY_NEED", label: isEn ? "Financial Security Need" : "재정적 안정감 & 예측 가능성", axisKey: "decision_style" },
    { cat: "AUTONOMY_NEED", label: isEn ? "Autonomy Need" : "개인 공간 & 자율성 존중", axisKey: "stimulation" },
    { cat: "HOUSEHOLD_SUPPORT_NEED", label: isEn ? "Household PM Need" : "가사 분담 & 운영 부담 완화", axisKey: "structure" },
    { cat: "INTIMACY_NEED", label: isEn ? "Bedroom Intimacy Need" : "신체적 친밀감 & 애정 스킨십", axisKey: null },
  ];

  const needGaps: NeedSupplyGapItem[] = categories.map(({ cat, label, axisKey }) => {
    // For each axis, treat the HIGHER-scoring person as the one currently
    // supplying more of that quality (giver) and the lower-scoring person
    // as the one more likely to be seeking it (receiver) — a real,
    // evidence-driven direction, not a fixed nameA/nameB assignment.
    const role = axisKey
      ? resolveDirectionalMarriageRole({
          scoreA: axesA[axisKey] ?? 50,
          scoreB: axesB[axisKey] ?? 50,
          gapGate: GAP_GATE,
          roleForHigher: "a" as const,
          roleForLower: "b" as const,
          sharedRole: "shared" as const,
          source: "PSYCH" as const,
        })
      : { actor: "shared" as const, gap: 0 };

    // On a genuine tie ("shared"), there is no evidence-based direction at
    // all — defaulting to nameA would silently reintroduce a slot-based
    // pick (nameA IS the slot). Tie-break on the actual name strings
    // instead, which is a property of the two people themselves and stays
    // the same regardless of which argument position either of them is
    // passed in.
    const tieGiverIsNameA = nameA <= nameB;
    const giverName = role.actor === "a" ? nameA : role.actor === "b" ? nameB : (tieGiverIsNameA ? nameA : nameB);
    const receiverName = role.actor === "a" ? nameB : role.actor === "b" ? nameA : (tieGiverIsNameA ? nameB : nameA);

    let status: NeedSupplyStatus = "WELL_SUPPLIED";
    let narrative = "";

    if (cat === "HOUSEHOLD_SUPPORT_NEED") {
      if (role.actor !== "shared") {
        status = "PARTIALLY_SUPPLIED";
        narrative = isEn
          ? `Household PM load currently leans toward ${giverName}; explicit domain division helps balance it out.`
          : `집안일 운영 책임이 현재 ${giverName}님 쪽으로 조금 더 기울어 있어, 영역별 고정 분담을 통해 충족도를 올릴 필요가 있습니다.`;
      } else {
        narrative = isEn ? "Household operating support is mutually balanced." : "가사 운영 부담을 서로 균형 있게 나눠 지고 있습니다.";
      }
    } else if (cat === "EMOTIONAL_NEED") {
      if (role.actor !== "shared" && Math.abs(role.gap) >= 25) {
        status = "NEEDS_ATTENTION";
        narrative = isEn
          ? `Emotional care from ${giverName} may lean more practical than verbal — worth checking whether that reads as care to ${receiverName}.`
          : `${giverName}님의 정서적 공감 표현이 언어보다는 실질적 조언 쪽에 가까울 수 있어, ${receiverName}님에게 가끔 섭섭함으로 느껴질 수 있습니다.`;
      } else {
        narrative = isEn ? "Mutual emotional care is steadily supplied." : "서로의 정서적 케어와 경청이 원활히 이뤄지고 있습니다.";
      }
    } else {
      narrative = isEn ? "Needs in this domain are adequately met through existing routines." : "현재 주거 시스템하에서 비교적 안정적으로 충족되고 있습니다.";
    }

    return {
      category: cat,
      categoryLabel: label,
      receiverName,
      giverName,
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
