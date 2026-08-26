import type { TimingFacts } from "../types";
import type { IndividualTimingResponse } from "../response/types";
import type {
  CoupleTimingModel,
  PairYearState,
  PairStateCategory,
  PartnerRoleSide,
} from "./types";

export type BuildCoupleTimingModelOptions = {
  personAFacts: TimingFacts;
  personBFacts: TimingFacts;
  personAResponses: IndividualTimingResponse[];
  personBResponses: IndividualTimingResponse[];
  targetYears?: number[];
};

/**
 * Domain-neutral Couple Timing Model Synthesizer.
 * Answers: "How do Person A and Person B timing & response systems meet?"
 * NEVER references marriage, fortune quality, good/bad years, or modern predictions.
 */
export function buildCoupleTimingModel(
  options: BuildCoupleTimingModelOptions,
): CoupleTimingModel {
  const {
    personAFacts,
    personBFacts,
    personAResponses,
    personBResponses,
    targetYears = [2026, 2027, 2028],
  } = options;

  const yearlyStates: PairYearState[] = [];
  const transitionYears: Array<{ year: number; partner: PartnerRoleSide }> = [];

  let highestChangeScore = -1;
  let strongestChangeYear: number | undefined;

  let highestAlignScore = -1;
  let strongestAlignedYear: number | undefined;

  let highestMismatchScore = -1;
  let strongestMismatchYear: number | undefined;

  for (const yr of targetYears) {
    const responseA = personAResponses.find((r) => r.year === yr);
    const responseB = personBResponses.find((r) => r.year === yr);

    const seunFactA = personAFacts.yearlySeun.find((y) => y.year === yr);
    const seunFactB = personBFacts.yearlySeun.find((y) => y.year === yr);

    // Daewoon Shift Proximity (within +-1 year)
    const aShift = personAFacts.daewoon.periods.some(
      (p) => Math.abs(p.startYear - yr) <= 1,
    );
    const bShift = personBFacts.daewoon.periods.some(
      (p) => Math.abs(p.startYear - yr) <= 1,
    );

    // Structural Change Signals
    const aChange =
      responseA?.timingContext.structuralSignals.includes("change_pressure") ?? false;
    const bChange =
      responseB?.timingContext.structuralSignals.includes("change_pressure") ?? false;

    // Relational Sensitivity Signals
    const aRelSens =
      responseA?.timingContext.structuralSignals.includes("relationship_sensitivity") ?? false;
    const bRelSens =
      responseB?.timingContext.structuralSignals.includes("relationship_sensitivity") ?? false;

    // Response Styles
    const styleA_change = responseA?.responseProfile.changeResponse?.style;
    const styleB_change = responseB?.responseProfile.changeResponse?.style;

    const styleA_action = responseA?.responseProfile.actionResponse?.style;
    const styleB_action = responseB?.responseProfile.actionResponse?.style;

    // Track Evidence IDs & Provenance
    const timingEvidenceA: string[] = [];
    const timingEvidenceB: string[] = [];
    const psychEvidenceA: string[] = [];
    const psychEvidenceB: string[] = [];

    if (aShift) timingEvidenceA.push(`daewoon_shift_A_${yr}`);
    if (bShift) timingEvidenceB.push(`daewoon_shift_B_${yr}`);

    if (aChange) timingEvidenceA.push(`change_pressure_A_${yr}`);
    if (bChange) timingEvidenceB.push(`change_pressure_B_${yr}`);

    if (aRelSens) timingEvidenceA.push(`relationship_sensitivity_A_${yr}`);
    if (bRelSens) timingEvidenceB.push(`relationship_sensitivity_B_${yr}`);

    if (responseA?.responseProfile.changeResponse) {
      psychEvidenceA.push(...responseA.responseProfile.changeResponse.contributingPsychAxes);
    }
    if (responseB?.responseProfile.changeResponse) {
      psychEvidenceB.push(...responseB.responseProfile.changeResponse.contributingPsychAxes);
    }

    // Determine Pair State Category & Asymmetry Sides
    let category: PairStateCategory = "MIXED";
    let stateLabel = "복합적 기류 흐름";
    let stateDescription = "두 사람의 타이밍과 수용 스타일이 다채롭게 어우러지는 해";
    let primaryChangingSide: PartnerRoleSide = "NEITHER";
    let stabilizingSide: PartnerRoleSide = "NEITHER";

    if (aShift && bShift) {
      category = "MUTUAL_TRANSITION";
      stateLabel = "양측 장기적 배경 주기의 동시 전환기";
      stateDescription = "두 사람 모두 10년 주기의 장기적 삶의 배경 기류가 함께 바뀌는 주요 환경 전환해";
      primaryChangingSide = "BOTH";
      transitionYears.push({ year: yr, partner: "BOTH" });
    } else if (aShift || bShift) {
      category = "ONE_PARTNER_TRANSITION";
      primaryChangingSide = aShift ? "PERSON_A" : "PERSON_B";
      stabilizingSide = aShift ? "PERSON_B" : "PERSON_A";
      const partnerName = aShift ? "파트너 A" : "파트너 B";
      stateLabel = `${partnerName} 10년 주기 삶의 배경 전환기`;
      stateDescription = `${partnerName}의 10년 주기 장기적 삶의 기류가 교체되며 새로운 배경이 형성되는 해`;
      transitionYears.push({ year: yr, partner: primaryChangingSide });
    } else if (aChange && bChange) {
      category = "DUAL_PRESSURE";
      stateLabel = "양측 동시 환경 변화 압력";
      stateDescription = "두 사람 모두 환경적 변화와 과업 무게감을 동시에 수용하는 해";
      primaryChangingSide = "BOTH";
    } else if (aChange && !bChange) {
      if (styleB_change === "controlled_structured_change") {
        category = "SUPPORTIVE_ASYMMETRY";
        stateLabel = "한쪽 변화 추진 & 한쪽 지지적 안착";
        stateDescription = "파트너 A가 변화를 수용할 때 파트너 B가 구조적 안정감을 제공하는 해";
      } else {
        category = "DIFFERENT_SPEED";
        stateLabel = "변화 수용 속도의 시차";
        stateDescription = "파트너 A의 변화 기류가 강해 수용 속도에 시차가 발생하는 해";
      }
      primaryChangingSide = "PERSON_A";
      stabilizingSide = "PERSON_B";
    } else if (!aChange && bChange) {
      if (styleA_change === "controlled_structured_change") {
        category = "SUPPORTIVE_ASYMMETRY";
        stateLabel = "한쪽 변화 추진 & 한쪽 지지적 안착";
        stateDescription = "파트너 B가 변화를 수용할 때 파트너 A가 구조적 안정감을 제공하는 해";
      } else {
        category = "DIFFERENT_SPEED";
        stateLabel = "변화 수용 속도의 시차";
        stateDescription = "파트너 B의 변화 기류가 강해 수용 속도에 시차가 발생하는 해";
      }
      primaryChangingSide = "PERSON_B";
      stabilizingSide = "PERSON_A";
    } else if (styleA_action && styleB_action) {
      category = "EXPAND_VS_STABILIZE";
      stateLabel = "실행 및 확장 기류 공유";
      stateDescription = "두 사람의 시도와 추진 기류가 활성화되는 해";
      primaryChangingSide = "BOTH";
    } else if (!aChange && !bChange && !aShift && !bShift) {
      category = "SHARED_STABILITY";
      stateLabel = "공유된 평온 및 안정 흐름";
      stateDescription = "큰 변화 자극 없이 기존의 리듬을 안정적으로 유지하는 해";
      stabilizingSide = "BOTH";
    }

    // Determine Turning Point Candidate Status
    // Rule: Turning Point requires (aShift || bShift) AND (aChange || bChange), OR MUTUAL_TRANSITION, OR DUAL_PRESSURE with relSens.
    let isTurningPointCandidate = false;
    let turningPointReason: string | undefined;

    if (aShift && bShift) {
      isTurningPointCandidate = true;
      turningPointReason = "두 사람 동시 10년 주기 삶의 배경 전환 경계선 매칭";
    } else if ((aShift || bShift) && (aChange || bChange)) {
      isTurningPointCandidate = true;
      const whoShift = aShift ? "파트너 A" : "파트너 B";
      turningPointReason = `${whoShift}의 10년 주기 배경 전환과 환경적 변화 압력이 함께 작용`;
    } else if (category === "DUAL_PRESSURE" && (aRelSens || bRelSens)) {
      isTurningPointCandidate = true;
      turningPointReason = "양측 동시 변화 압력 및 관계 민감 자극 중첩";
    }

    // Scoring for Summary Highlights
    const changeScore = (aChange ? 2 : 0) + (bChange ? 2 : 0) + (aShift ? 3 : 0) + (bShift ? 3 : 0);
    if (changeScore > highestChangeScore) {
      highestChangeScore = changeScore;
      strongestChangeYear = yr;
    }

    if (category === "SHARED_STABILITY" || category === "ALIGNED_MOMENTUM") {
      const alignScore = 5;
      if (alignScore > highestAlignScore) {
        highestAlignScore = alignScore;
        strongestAlignedYear = yr;
      }
    }

    if (category === "DIFFERENT_SPEED" || category === "EXPAND_VS_STABILIZE") {
      const mismatchScore = 5;
      if (mismatchScore > highestMismatchScore) {
        highestMismatchScore = mismatchScore;
        strongestMismatchYear = yr;
      }
    }

    yearlyStates.push({
      year: yr,
      pairState: category,
      stateLabel,
      stateDescription,
      primaryChangingSide,
      stabilizingSide,
      personAEvidenceIds: [...responseA?.evidenceRefs ?? [], ...timingEvidenceA],
      personBEvidenceIds: [...responseB?.evidenceRefs ?? [], ...timingEvidenceB],
      psychEvidenceA,
      psychEvidenceB,
      timingEvidenceA,
      timingEvidenceB,
      isTurningPointCandidate,
      turningPointReason,
      factConfidence: "HIGH",
      interpretationConfidence:
        responseA?.interpretationConfidence === "HIGH" && responseB?.interpretationConfidence === "HIGH"
          ? "HIGH"
          : "MEDIUM",
    });
  }

  return {
    targetYears,
    yearlyStates,
    strongestChangeYear,
    strongestAlignedYear,
    strongestMismatchYear,
    transitionYears,
  };
}
