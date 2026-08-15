import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";
import {
  buildCanonicalWorkRoleMap,
  type CanonicalPairRoleMap,
} from "./workCanonicalRoleModel";

export type MistakeResponseResult = {
  name: string;
  primarySensitivity: "accountability" | "solution_action" | "explanation_detail";
  allowedClaim: string;
};

export type DirectionalRepairProfile = {
  giverName: string;
  receiverName: string;
  primaryNeed: "immediate_action" | "process_explanation" | "acknowledgement_space";
  repairGuidance: string;
};

export type RepairApologyStyleResult = {
  repairAtoB: DirectionalRepairProfile;
  repairBtoA: DirectionalRepairProfile;
};

export type ThinkVsDiscussResult = {
  pairPattern: "THINK_THEN_DISCUSS" | "DISCUSS_THEN_THINK" | "MIXED_CONTEXTUAL";
  nameAStyle: string;
  nameBStyle: string;
};

export type MutualGrowthResult = {
  aGrowsThroughB: string;
  bGrowsThroughA: string;
};

export type BestVsRiskyConfigResult = {
  bestConfiguration: {
    directionOwner: string;
    executionOwner: string;
    qaReviewOwner: string;
    externalOwner: string;
    summary: string;
  };
  riskyConfiguration: {
    primaryRiskPattern: string;
    warningNote: string;
  };
};

/**
 * 1. Directional Mistake Response
 * "What bothers this person about the mistake?"
 * Directional: aOnBMistake (how A reacts to B's mistake) vs bOnAMistake (how B reacts to A's mistake).
 */
export function buildMistakeResponseSynthesis(params: {
  nameA: string;
  nameB: string;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): { aOnBMistake: MistakeResponseResult; bOnAMistake: MistakeResponseResult } {
  const { nameA, nameB, psychA, psychB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const resolveSensitivity = (
    psych: PsychMasterJson | null | undefined,
    partnerName: string,
  ): MistakeResponseResult => {
    const prac = psych?.secondary_axes.practicality ?? 50;
    const str = psych?.secondary_axes.structure ?? 50;

    if (prac >= 65) {
      return {
        name: partnerName,
        primarySensitivity: "solution_action",
        allowedClaim: pick(
          locale,
          `${partnerName} prioritizes immediate corrective action and practical solutions over excuses or formal apologies.`,
          `${partnerName}님은 감정적 사과보다 즉각적인 보완 액션과 실질적 해결책을 가장 먼저 확인합니다.`,
        ),
      };
    }
    if (str >= 65) {
      return {
        name: partnerName,
        primarySensitivity: "explanation_detail",
        allowedClaim: pick(
          locale,
          `${partnerName} is sensitive to process breakdowns and requires a clear root-cause explanation and recurrence prevention plan.`,
          `${partnerName}님은 프로세스 누락에 민감하며, 명확한 원인 분석과 재발 방지책을 작성할 때 신뢰를 유지합니다.`,
        ),
      };
    }
    return {
      name: partnerName,
      primarySensitivity: "accountability",
      allowedClaim: pick(
        locale,
        `${partnerName} values transparent responsibility ownership and non-defensive communication.`,
        `${partnerName}님은 핑계 없는 솔직한 책임 인정과 대화 채널 오픈을 가장 중요하게 생각합니다.`,
      ),
    };
  };

  return {
    aOnBMistake: resolveSensitivity(psychB, nameB),
    bOnAMistake: resolveSensitivity(psychA, nameA),
  };
}

/**
 * 2. Directional Repair / Apology Style
 * "What restores trust afterward?"
 * Directional: repairAtoB (A made mistake -> what B needs) vs repairBtoA (B made mistake -> what A needs).
 * Strips hardcoded operational prescriptions ("1-page action fix", "30 minutes").
 */
export function buildRepairApologyStyle(params: {
  nameA: string;
  nameB: string;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): RepairApologyStyleResult {
  const { nameA, nameB, psychA, psychB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const buildProfile = (
    giverName: string,
    receiverName: string,
    receiverPsych: PsychMasterJson | null | undefined,
  ): DirectionalRepairProfile => {
    const prac = receiverPsych?.secondary_axes.practicality ?? 50;
    const str = receiverPsych?.secondary_axes.structure ?? 50;

    if (prac >= 60) {
      return {
        giverName,
        receiverName,
        primaryNeed: "immediate_action",
        repairGuidance: pick(
          locale,
          `When ${giverName} makes a mistake, ${receiverName}'s trust is restored fastest when ${giverName} presents an immediate corrective action plan.`,
          `${giverName}님이 실수했을 때, ${receiverName}님의 신뢰는 구체적인 보완 액션을 즉시 제시할 때 가장 빠르게 복구됩니다.`,
        ),
      };
    }
    if (str >= 60) {
      return {
        giverName,
        receiverName,
        primaryNeed: "process_explanation",
        repairGuidance: pick(
          locale,
          `When ${giverName} makes a mistake, ${receiverName}'s trust is restored when ${giverName} provides a clear timeline and process prevention check.`,
          `${giverName}님이 실수했을 때, ${receiverName}님의 신뢰는 경과 타임라인과 프로세스 재발 방지책을 명확히 설명할 때 복구됩니다.`,
        ),
      };
    }
    return {
      giverName,
      receiverName,
      primaryNeed: "acknowledgement_space",
      repairGuidance: pick(
        locale,
        `When ${giverName} makes a mistake, ${receiverName}'s trust is restored through prompt personal acknowledgement without defensiveness.`,
        `${giverName}님이 실수했을 때, ${receiverName}님의 신뢰는 핑계 없는 빠른 1:1 오류 인정과 소통 채널 오픈을 통해 복구됩니다.`,
      ),
    };
  };

  return {
    repairAtoB: buildProfile(nameA, nameB, psychB),
    repairBtoA: buildProfile(nameB, nameA, psychA),
  };
}

/**
 * 3. Multi-Evidence Think First vs Discuss First Synthesis
 * Evaluates thinking_style, energy_style, structure, and decision_style.
 * Removes hardcoded prescription numbers ("30 minutes", "1-page agenda") from canonical layer.
 */
export function buildThinkVsDiscussSynthesis(params: {
  nameA: string;
  nameB: string;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): ThinkVsDiscussResult {
  const { nameA, nameB, psychA, psychB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const thinkA = psychA?.secondary_axes.thinking_style ?? 50;
  const thinkB = psychB?.secondary_axes.thinking_style ?? 50;
  const strA = psychA?.secondary_axes.structure ?? 50;
  const strB = psychB?.secondary_axes.structure ?? 50;

  const scoreA = thinkA * 0.6 + strA * 0.4;
  const scoreB = thinkB * 0.6 + strB * 0.4;
  const diff = scoreA - scoreB;

  if (diff >= 15) {
    return {
      pairPattern: "THINK_THEN_DISCUSS",
      nameAStyle: pick(locale, `${nameA} relies on solo pre-structuring before discussion.`, `${nameA}님은 혼자 사전 구조화를 마친 뒤 논의하길 선호합니다.`),
      nameBStyle: pick(locale, `${nameB} develops ideas through interactive discussion.`, `${nameB}님은 라이브 대화를 통해 아이디어를 발전시키는 편입니다.`),
    };
  }
  if (diff <= -15) {
    return {
      pairPattern: "DISCUSS_THEN_THINK",
      nameAStyle: pick(locale, `${nameA} develops ideas through interactive discussion.`, `${nameA}님은 라이브 대화를 통해 아이디어를 발전시키는 편입니다.`),
      nameBStyle: pick(locale, `${nameB} relies on solo pre-structuring before discussion.`, `${nameB}님은 혼자 사전 구조화를 마친 뒤 논의하길 선호합니다.`),
    };
  }

  return {
    pairPattern: "MIXED_CONTEXTUAL",
    nameAStyle: pick(locale, `${nameA} adapts thinking rhythm depending on task urgency.`, `${nameA}님은 업무 긴급도에 따라 사전 정리와 대화를 유연하게 조율합니다.`),
    nameBStyle: pick(locale, `${nameB} balances solo prep with interactive sync.`, `${nameB}님은 개인 사전 정리와 인터랙티브 논의의 균형을 맞춥니다.`),
  };
}

/**
 * 4. Directional Mutual Growth Effect ($A + B \rightarrow C$ Synthesis)
 * Multi-axis diagonal deltas across structure, empathy, decision_style, and thinking_style.
 * Frame as current developmental pressure/opportunity (no future prophecy).
 */
export function buildMutualGrowthEffectSynthesis(params: {
  nameA: string;
  nameB: string;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): MutualGrowthResult {
  const { nameA, nameB, psychA, psychB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const strA = psychA?.secondary_axes.structure ?? 50;
  const strB = psychB?.secondary_axes.structure ?? 50;
  const empA = psychA?.secondary_axes.empathy ?? 50;
  const empB = psychB?.secondary_axes.empathy ?? 50;
  const decA = psychA?.secondary_axes.decision_style ?? 50;
  const decB = psychB?.secondary_axes.decision_style ?? 50;

  // A grows through B
  let aGrowth = "";
  if (strB - strA >= 12) {
    aGrowth = pick(
      locale,
      `Working alongside ${nameB} introduces process discipline and data validation, strengthening ${nameA}'s execution consistency.`,
      `${nameB}님과 함께 일하면서 ${nameA}님은 정밀한 검수 체계와 데이터 검증 감각을 학습하는 계기를 얻습니다.`,
    );
  } else if (empB - empA >= 12) {
    aGrowth = pick(
      locale,
      `Working alongside ${nameB} provides exposure to stakeholder empathy and room reading, broadening ${nameA}'s team coordination style.`,
      `${nameB}님과 함께 일하면서 ${nameA}님은 이해관계자 조율과 세심한 공감 커뮤니케이션 감각을 배우게 됩니다.`,
    );
  } else {
    aGrowth = pick(
      locale,
      `Working alongside ${nameB} encourages ${nameA} to balance operational speed with contextual flexibility.`,
      `${nameB}님과 함께 일하면서 ${nameA}님은 실행 속도와 환경 적응력의 균형을 맞추는 법을 익히게 됩니다.`,
    );
  }

  // B grows through A
  let bGrowth = "";
  if (decA - decB >= 12) {
    bGrowth = pick(
      locale,
      `Working alongside ${nameA} introduces decisive momentum under ambiguity, helping ${nameB} overcome over-analysis.`,
      `${nameA}님과 함께 일하면서 ${nameB}님은 불확실성 속에서의 과감한 결단력과 추진 에너지를 배우게 됩니다.`,
    );
  } else if (strA - strB >= 12) {
    bGrowth = pick(
      locale,
      `Working alongside ${nameA} provides exposure to structured workflow organization, helping ${nameB} build solid execution routines.`,
      `${nameA}님과 함께 일하면서 ${nameB}님은 체계적인 프로세스 정리와 표준화 습관을 학습하게 됩니다.`,
    );
  } else {
    bGrowth = pick(
      locale,
      `Working alongside ${nameA} encourages ${nameB} to expand initiative scope and strategic vision.`,
      `${nameA}님과 함께 일하면서 ${nameB}님은 프로젝트의 큰 방향을 읽고 주도적으로 범위를 넓히는 감각을 익히게 됩니다.`,
    );
  }

  return {
    aGrowsThroughB: aGrowth,
    bGrowsThroughA: bGrowth,
  };
}

/**
 * 5. Best vs Risky Work Configuration Synthesis
 * Consolidates CanonicalPairRoleMap into authoritative setup guidance.
 */
export function buildBestVsRiskyConfigurationSynthesis(params: {
  nameA: string;
  nameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  workSignalsA?: WorkSajuSignals;
  workSignalsB?: WorkSajuSignals;
  locale?: Locale;
}): BestVsRiskyConfigResult {
  const { nameA, nameB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const roleMap = buildCanonicalWorkRoleMap(params);

  const formatOwner = (owner: "A" | "B" | "SHARED") =>
    owner === "A" ? nameA : owner === "B" ? nameB : pick(locale, "Shared Co-Lead", "공동 분담");

  return {
    bestConfiguration: {
      directionOwner: formatOwner(roleMap.directionOwner),
      executionOwner: formatOwner(roleMap.executionOwner),
      qaReviewOwner: formatOwner(roleMap.qaRiskOwner),
      externalOwner: formatOwner(roleMap.externalOwner),
      summary: pick(
        locale,
        `Best setup: ${formatOwner(roleMap.directionOwner)} leads Direction/Strategy, ${formatOwner(roleMap.executionOwner)} leads Execution, and ${formatOwner(roleMap.qaRiskOwner)} owns final QA gates.`,
        `최적의 배치: ${formatOwner(roleMap.directionOwner)}님이 방향·전략을 이끌고, ${formatOwner(roleMap.executionOwner)}님이 현장 실행을 전담하며, ${formatOwner(roleMap.qaRiskOwner)}님이 최종 품질 검수 게이트를 맡는 구조입니다.`,
      ),
    },
    riskyConfiguration: {
      primaryRiskPattern: pick(
        locale,
        "Ambiguous 50:50 ownership on final sign-off or duplicate QA checks.",
        "최종 승인권 50:50 미확정 또는 중복 품질 검수로 인한 의사결정 교착",
      ),
      warningNote: pick(
        locale,
        "Avoid assigning both as equal co-PMs without explicit tie-breaker rules.",
        "명확한 중재 규칙 없이 두 사람을 완전 동일 권한의 공동 PM으로 배치하는 구도는 피하세요.",
      ),
    },
  };
}
