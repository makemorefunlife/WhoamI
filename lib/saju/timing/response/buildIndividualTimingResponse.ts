import type { TimingFacts, CanonicalTimingEvidencePackage } from "../types";
import type {
  PsychScoresInput,
  IndividualTimingResponse,
  IndividualResponseStyle,
} from "./types";

function getScore(
  input: PsychScoresInput | undefined,
  axisKey: string,
  defaultValue = 50,
): number {
  if (!input) return defaultValue;

  const pri = input.primary?.[axisKey as keyof typeof input.primary];
  if (typeof pri === "number") return pri;

  const sec = input.secondary?.[axisKey as keyof typeof input.secondary];
  if (typeof sec === "number") return sec;

  return defaultValue;
}

export type BuildIndividualTimingResponseOptions = {
  timingFacts: TimingFacts;
  evidencePackage: CanonicalTimingEvidencePackage;
  psychInput?: PsychScoresInput;
  targetYear?: number;
};

/**
 * Builds domain-neutral Individual Timing Response.
 * Answers: "How is this person likely to experience and respond to the timing activation?"
 * STRICT RULE: No domain predictions (no "should change jobs", "marriage stress", etc.).
 */
export function buildIndividualTimingResponse(
  options: BuildIndividualTimingResponseOptions,
): IndividualTimingResponse {
  const { timingFacts, evidencePackage, psychInput, targetYear } = options;

  const year = targetYear ?? evidencePackage.targetYears[0] ?? new Date().getFullYear();
  const yearSeunFact = timingFacts.yearlySeun.find((y) => y.year === year);
  const yearSignals = evidencePackage.signals.filter((s) => s.key.endsWith(`_${year}`));

  const backgroundThemes = yearSignals
    .filter((s) => s.key.includes("_background_"))
    .map((s) => s.key.replace(`_${year}`, ""));

  const annualActivations = yearSignals
    .filter((s) => s.key.includes("_activation_"))
    .map((s) => s.key.replace(`_${year}`, ""));

  const structuralSignals = yearSignals
    .filter((s) => !s.key.includes("_background_") && !s.key.includes("_activation_"))
    .map((s) => s.key.replace(`_${year}`, ""));

  const frictionPoints: string[] = [];
  const supportPoints: string[] = [];
  const evidenceRefs: string[] = [];

  // Track Psych Axes Scores
  const adaptability = getScore(psychInput, "adaptability");
  const stability = getScore(psychInput, "stability");
  const structure = getScore(psychInput, "structure");
  const decisionStyle = getScore(psychInput, "decision_style");
  const selfControl = getScore(psychInput, "self_control");
  const resilience = getScore(psychInput, "resilience");
  const practicality = getScore(psychInput, "practicality");
  const stimulation = getScore(psychInput, "stimulation");
  const autonomy = getScore(psychInput, "autonomy");
  const connection = getScore(psychInput, "connection");
  const empathy = getScore(psychInput, "empathy");
  const conflictStyle = getScore(psychInput, "conflict_style");

  // 1. CHANGE RESPONSE
  let changeResponse: IndividualResponseStyle | undefined;
  const changeSignal = yearSignals.find((s) => s.key.startsWith("change_pressure_"));

  if (changeSignal) {
    evidenceRefs.push(changeSignal.key);

    if (adaptability > 60 && decisionStyle > 60) {
      changeResponse = {
        style: "fluid_adaptation",
        label: "유연한 신속 적응",
        summary: "변화 기류가 형성될 때 유연하고 신속하게 적응하며 수용하는 스타일",
        contributingPsychAxes: ["adaptability", "decision_style"],
        contributingTimingSignals: [changeSignal.key],
      };
      supportPoints.push("변화 기류에 유연하게 대처할 수 있는 높은 적응 수용성");
    } else if (structure > 60 || stability > 60) {
      changeResponse = {
        style: "controlled_structured_change",
        label: "안정적 구조 기반 점진 변화",
        summary: "변화 압력 속에서 예측 가능성과 안정적 절차를 먼저 확보하려는 스타일",
        contributingPsychAxes: ["structure", "stability"],
        contributingTimingSignals: [changeSignal.key],
      };
      frictionPoints.push("급작스러운 변화 자극 시 구체적 구조와 계획 확인 필요");
    } else if (adaptability < 45 && resilience < 45) {
      changeResponse = {
        style: "cautious_delayed_change",
        label: "신중한 유보적 관망",
        summary: "변화 기류 앞에서 충분한 탐색 후 신중하게 반응하려는 스타일",
        contributingPsychAxes: ["adaptability", "resilience"],
        contributingTimingSignals: [changeSignal.key],
      };
      frictionPoints.push("환경적 변화 기류와 개인의 수용 속도 사이의 시차 발생 가능성");
    } else {
      changeResponse = {
        style: "controlled_structured_change",
        label: "절차적 점진 적응",
        summary: "상황을 관조하며 점진적으로 수용 절차를 정돈하는 스타일",
        contributingPsychAxes: ["stability"],
        contributingTimingSignals: [changeSignal.key],
      };
    }
  }

  // 2. PRESSURE / RESPONSIBILITY RESPONSE
  let pressureResponse: IndividualResponseStyle | undefined;
  const officerSignal = yearSignals.find(
    (s) => s.key.startsWith("officer_theme_activation_") || s.key.startsWith("officer_theme_background_"),
  );

  if (officerSignal) {
    evidenceRefs.push(officerSignal.key);

    if (structure > 60 && selfControl > 60) {
      pressureResponse = {
        style: "structured_boundary_setting",
        label: "체계적 경계 및 역할 정돈",
        summary: "역할이나 의무 주제가 활성화될 때 체계적으로 역할을 분담하고 경계를 세우는 스타일",
        contributingPsychAxes: ["structure", "self_control"],
        contributingTimingSignals: [officerSignal.key],
      };
      supportPoints.push("책임과 요구가 집중될 때 규칙과 역할을 체계화하는 역량");
    } else if (resilience > 60 && practicality > 60) {
      pressureResponse = {
        style: "controlled_endurance",
        label: "현실적 묵직한 인내",
        summary: "부과된 과업이나 정성적 무게감을 현실적으로 묵묵히 버텨내는 스타일",
        contributingPsychAxes: ["resilience", "practicality"],
        contributingTimingSignals: [officerSignal.key],
      };
      supportPoints.push("무게감이 강화되는 시기에 묵묵히 마무리를 수행하는 회복 탄력성");
    } else if (resilience < 45 && selfControl < 45) {
      pressureResponse = {
        style: "overload_risk_under_duty",
        label: "과부하 민감성 증가",
        summary: "요구사항 축적 시 에너지 과부하에 민감하게 반응하는 스타일",
        contributingPsychAxes: ["resilience", "self_control"],
        contributingTimingSignals: [officerSignal.key],
      };
      frictionPoints.push("역할 무게감 누적 시 휴식 시간 확보 필요");
    }
  }

  // 3. ACTION / EXPANSION RESPONSE
  let actionResponse: IndividualResponseStyle | undefined;
  const actionSignal = yearSignals.find(
    (s) =>
      s.key.startsWith("output_theme_") ||
      s.key.startsWith("wealth_theme_"),
  );

  if (actionSignal) {
    evidenceRefs.push(actionSignal.key);

    if (stimulation > 60 && decisionStyle > 60) {
      actionResponse = {
        style: "fast_experimental_initiative",
        label: "신속한 시도 및 주도적 실행",
        summary: "표출 및 시도 기류가 들어올 때 신속하고 다채롭게 시도해보는 스타일",
        contributingPsychAxes: ["stimulation", "decision_style"],
        contributingTimingSignals: [actionSignal.key],
      };
      supportPoints.push("실행 기류를 동력 삼아 새로운 시도를 개척하는 주도성");
    } else if (practicality > 60 && structure > 60) {
      actionResponse = {
        style: "deliberate_secure_implementation",
        label: "실용적 점검 중심 진행",
        summary: "실행 기류를 실질적 안정성과 결과물 중심으로 점검하며 진행하는 스타일",
        contributingPsychAxes: ["practicality", "structure"],
        contributingTimingSignals: [actionSignal.key],
      };
      supportPoints.push("실행 및 자산 기류를 현실적으로 검증하며 안착시키는 신중함");
    } else if (autonomy > 60) {
      actionResponse = {
        style: "cautious_practical_testing",
        label: "자율적 개별 속도 추진",
        summary: "자율성과 주도권을 유지하며 개별 속도로 탐색을 추진하는 스타일",
        contributingPsychAxes: ["autonomy"],
        contributingTimingSignals: [actionSignal.key],
      };
    }
  }

  // 4. RELATIONSHIP RESPONSE
  let relationshipResponse: IndividualResponseStyle | undefined;
  const relSignal = yearSignals.find((s) => s.key.startsWith("relationship_sensitivity_"));

  if (relSignal) {
    evidenceRefs.push(relSignal.key);

    if (connection > 60 && empathy > 60) {
      relationshipResponse = {
        style: "seeking_closeness_reassurance",
        label: "정서적 연결 및 다정한 재확인 선호",
        summary: "관계 자극 시 솔직한 다정함과 연결감을 확인하고자 하는 스타일",
        contributingPsychAxes: ["connection", "empathy"],
        contributingTimingSignals: [relSignal.key],
      };
      supportPoints.push("민감한 상황에서도 관계 강화를 위해 교류를 시도하는 다정함");
    } else if (conflictStyle > 60 || structure > 60) {
      relationshipResponse = {
        style: "seeking_explicit_clarification",
        label: "명확한 원인 대화 및 설명 선호",
        summary: "서운함이나 불편 자극 시 원인과 이유를 분명히 정리하고자 하는 스타일",
        contributingPsychAxes: ["conflict_style", "structure"],
        contributingTimingSignals: [relSignal.key],
      };
      frictionPoints.push("감정 정돈 전 조급한 원인 추궁 시 대화 마찰 가능성");
    } else if (autonomy > 60 || connection < 45) {
      relationshipResponse = {
        style: "seeking_processing_space",
        label: "감정 정돈을 위한 거리가꿈 및 공간 선호",
        summary: "서운함 자극 시 감정이 정리될 때까지 혼자만의 시간을 필요로 하는 스타일",
        contributingPsychAxes: ["autonomy", "connection"],
        contributingTimingSignals: [relSignal.key],
      };
      frictionPoints.push("갈등 상황에서 대화를 유보하고 침묵 모드로 들어가는 경향");
    }
  }

  // 5. RECOVERY RESPONSE
  let recoveryResponse: IndividualResponseStyle | undefined;
  const sealSignal = yearSignals.find(
    (s) => s.key.startsWith("seal_theme_") || s.key.startsWith("stability_support_"),
  );

  if (sealSignal || resilience > 60 || autonomy > 60) {
    if (resilience > 60) {
      recoveryResponse = {
        style: "structured_routine_recovery",
        label: "규칙적 수면 및 일상 루틴 회복",
        summary: "정돈된 규칙성과 탄력적 습관을 통해 에너지를 회복하는 스타일",
        contributingPsychAxes: ["resilience"],
        contributingTimingSignals: sealSignal ? [sealSignal.key] : [],
      };
    } else {
      recoveryResponse = {
        style: "inward_solitary_recharge",
        label: "혼자만의 내적 정돈 및 재충전",
        summary: "조용한 개인 공간에서 내면을 정리하며 에너지를 재충전하는 스타일",
        contributingPsychAxes: ["autonomy"],
        contributingTimingSignals: sealSignal ? [sealSignal.key] : [],
      };
    }
  }

  // Determine Confidence
  const hasPsychData = psychInput && (psychInput.primary || psychInput.secondary);
  const factConfidence = "HIGH" as const;
  const interpretationConfidence = hasPsychData ? ("HIGH" as const) : ("MEDIUM" as const);

  return {
    personId: timingFacts.personId,
    year,
    birthDate: timingFacts.birthDate,
    timingContext: {
      backgroundThemes,
      annualActivations,
      structuralSignals,
    },
    responseProfile: {
      changeResponse,
      pressureResponse,
      actionResponse,
      relationshipResponse,
      recoveryResponse,
    },
    frictionPoints,
    supportPoints,
    factConfidence,
    interpretationConfidence,
    evidenceRefs,
  };
}
