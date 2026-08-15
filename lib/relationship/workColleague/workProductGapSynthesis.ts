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

export type CrunchDeadlineModeResult = {
  normalVsDeadlineShift: string;
  personAPressureShift: string;
  personBPressureShift: string;
  crunchRoleSplit: string;
  pressureFrictionPoint: string;
  priorityCutLead: string;
  baselineHolder: string;
  bufferSupportNeed: string;
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

/**
 * 6. Crunch / Deadline Mode Synthesis
 * Answers: "평소에는 괜찮아도 마감이나 위기 상황에서는 둘이 어떻게 달라지는가?"
 * Coherent narrative flow:
 * 평소에는 → 압박이 오면 → 둘의 차이가 커지는 지점 → 위기에서의 역할 분담 → 그래서 이렇게 운영하면 좋다
 */
export function buildCrunchDeadlineModeSynthesis(params: {
  nameA: string;
  nameB: string;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  canonicalRoleMap?: CanonicalPairRoleMap;
  locale?: Locale;
}): CrunchDeadlineModeResult {
  const { nameA, nameB, psychA, psychB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const resA = psychA?.secondary_axes.resilience ?? 50;
  const resB = psychB?.secondary_axes.resilience ?? 50;
  const scA = psychA?.secondary_axes.self_control ?? 50;
  const scB = psychB?.secondary_axes.self_control ?? 50;
  const decA = psychA?.secondary_axes.decision_style ?? 50;
  const decB = psychB?.secondary_axes.decision_style ?? 50;
  const strA = psychA?.secondary_axes.structure ?? 50;
  const strB = psychB?.secondary_axes.structure ?? 50;

  // 1. Normal vs Deadline shift overview
  const normalVsDeadlineShift = pick(
    locale,
    `In routine conditions, ${nameA} and ${nameB} maintain a balanced collaborative workflow. However, as deadline pressure peaks, their stress tolerance and task acceleration patterns diverge sharply.`,
    `평소 안정적인 상황에서는 ${nameA}님과 ${nameB}님이 일정한 리듬으로 협업하지만, 마감 시한이 임박하고 작업 압박이 최고조에 달하면 각자의 스트레스 반응과 과제 처리 속도가 크게 달라집니다.`,
  );

  // 2. Person A pressure shift
  const personAPressureShift =
    scA < 60 || decA >= 60
      ? pick(
          locale,
          `${nameA} accelerates execution speed under pressure, cutting non-essential discussion to push the deliverable across the finish line quickly.`,
          `${nameA}님은 마감 임박 시 즉각적인 목표 완성을 위해 과감하게 일하는 속도를 올리며, 부수적인 회의나 검수 절차를 대폭 단축하는 공격적 추진 모드로 전환합니다.`,
        )
      : pick(
          locale,
          `${nameA} focuses on maintaining procedural integrity under pressure, verifying each critical handoff step to avoid high-risk mistakes.`,
          `${nameA}님은 압박 상황에서도 섣부른 조급함보다는 주요 단계별 완성도와 위험 요소를 한 번 더 점검하는 신중한 모드로 들어갑니다.`,
        );

  // 3. Person B pressure shift
  const personBPressureShift =
    strB >= 60 || scB >= 60
      ? pick(
          locale,
          `${nameB} tightens quality gates under pressure, ensuring core specifications and safety baselines remain uncompromised despite tight schedules.`,
          `${nameB}님은 마감 압박이 커질수록 시스템 결함이나 품질 하한선이 무너지지 않도록 핵심 검수 게이트를 더욱 철저히 사수합니다.`,
        )
      : pick(
          locale,
          `${nameB} prioritizes rapid completion under pressure, adapting flexibly to scope changes to resolve bottlenecks fast.`,
          `${nameB}님은 긴급 상황 시 유연하게 범위를 조율하며 병목 구간을 빠르게 뚫어내는 유연한 실행 모드를 발휘합니다.`,
        );

  // 4. Crunch role division
  const speedLeadName = decA >= decB ? nameA : nameB;
  const qualityCheckName = strA >= strB ? nameA : nameB;
  const crunchRoleSplit =
    speedLeadName !== qualityCheckName
      ? pick(
          locale,
          `In emergency situations, ${speedLeadName} takes charge of fast priority decisions and scope trimming, while ${qualityCheckName} guards the non-negotiable operational baseline.`,
          `위기 상황 발생 시 ${speedLeadName}님이 핵심 우선순위 결정과 과감한 스코프 조율을 이끌고, ${qualityCheckName}님이 비즈니스 위협을 막는 최소 품질 기준선을 사수합니다.`,
        )
      : pick(
          locale,
          `In emergency situations, both partners align on clear task boundaries — one taking point on external delivery while the other stabilizes internal operations.`,
          `긴급 상황 시 두 사람은 명확한 구역 분담을 통해 한 사람이 외부 대응 및 마감 제출을 전담하고, 다른 한 사람이 내부 실무 수습을 전담하는 구도가 가장 효과적입니다.`,
        );

  // 5. Pressure friction point
  const pressureFrictionPoint =
    Math.abs(scA - scB) >= 12 || Math.abs(decA - decB) >= 12
      ? pick(
          locale,
          `Friction occurs when one partner's urge for immediate speed clashes with the other's requirement for thorough risk verification before sign-off.`,
          `마감 직전 한 쪽의 '빠른 마무리' 욕구와 다른 한 쪽의 '확실한 검수' 요구가 부딪힐 때 가장 큰 감정 마찰이나 소통 병목이 발생할 수 있습니다.`,
        )
      : pick(
          locale,
          `Friction occurs under ambiguous priority calls where both partners try to solve the same bottleneck simultaneously without assigned leads.`,
          `우선순위가 불분명한 마감 상황에서 조율자 없이 두 사람이 동일한 병목 지점에 동시 개입할 때 혼선이 발생할 수 있습니다.`,
        );

  // 6. Practical operational rules
  const steadyName = resA >= resB ? nameA : nameB;
  const sensitiveName = resA < resB ? nameA : nameB;

  const priorityCutLead = pick(
    locale,
    `Under crunch, ${speedLeadName} leads the priority-cut decision to drop low-impact deliverables immediately.`,
    `마감 임박 시 ${speedLeadName}님이 불필요한 부속 과제를 즉시 쳐내는 우선순위 정리권을 리드하세요.`,
  );

  const baselineHolder = pick(
    locale,
    `${qualityCheckName} defines the non-negotiable minimum quality bar that cannot be compromised under schedule stress.`,
    `${qualityCheckName}님이 마감 압박 속에서도 결코 양보할 수 없는 최소 품질 검수 기준선을 명확히 지정하세요.`,
  );

  const bufferSupportNeed = pick(
    locale,
    `Under heavy crunch pressure, ${sensitiveName} needs quick buffer time and clear priority boundaries to avoid overload, while ${steadyName} holds the operational baseline steady.`,
    `마감 임박 압박이 높아지면 ${sensitiveName}님은 과부하 방지를 위한 우선순위 정리와 버퍼 시간이 필요하며, ${steadyName}님이 기준점을 지켜줄 때 최적의 수습이 가능합니다.`,
  );

  return {
    normalVsDeadlineShift,
    personAPressureShift,
    personBPressureShift,
    crunchRoleSplit,
    pressureFrictionPoint,
    priorityCutLead,
    baselineHolder,
    bufferSupportNeed,
  };
}
