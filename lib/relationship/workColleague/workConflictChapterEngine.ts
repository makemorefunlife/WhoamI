import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { IndividualWorkChapterBundle } from "./workStoryPlanTypes";
import type { WorkCommunicationChapterBundle } from "./workCommunicationChapterEngine";
import type { WorkPressureChapterBundle } from "./workPressureChapterEngine";
import { buildUpsetResponseGuide, pickDeEscalationCard } from "./officeLanguage";
import { buildChartContext } from "@/lib/saju/chartContext";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";

export type TrustCurrencyKeyword =
  | "책임"
  | "결과"
  | "투명성"
  | "전문성"
  | "판단력"
  | "약속"
  | "일관성"
  | "존중"
  | "속도"
  | "준비"
  | "정확성";

export type ConflictTheme = {
  themeTitle: string;
  personAStandard: string;
  personBStandard: string;
  realFrictionScene: string;
  mutualMisinterpretation: string;
};

export type PairConflictLoop = {
  trigger: string;
  personAAction: string;
  personBInterpretation: string;
  personBDefense: string;
  personAReinterpretation: string;
  operationalConsequence: string;
};

export type DirectionalSensitivity = {
  personName: string;
  partnerName: string;
  sensitiveMistakeTrigger: string;
  reactionPattern: string;
  underlyingNeed: string;
};

export type TrustCurrencyItem = {
  personName: string;
  topCurrencies: Array<{
    keyword: TrustCurrencyKeyword;
    explanation: string;
  }>;
};

export type DirectionalRepairSequence = {
  fromName: string;
  toName: string;
  steps: string[];
};

export type RepairLanguagePreference = {
  personName: string;
  preferredStyle: string;
  effectivePhrases: string[];
  ineffectivePhrases: string[];
};

export type PairRepairSynthesis = {
  synthesisTitle: string;
  resilienceSummary: string;
  bridgeToPlaybook: string;
};

export type WorkConflictChapterBundle = {
  subtitle: string;
  introSummary: string;

  // 1. ◤ 우리는 어디에서 가장 부딪힐까 (Top Conflict Themes 2~4개)
  conflictThemes: ConflictTheme[];

  // 2. ◤ 한번 꼬이면 어떻게 더 커질까 (Pair-specific Conflict Loop)
  conflictLoop: PairConflictLoop;

  // 3. ◤ 서로의 어떤 실수에 특히 민감할까 (Directional Sensitivity)
  sensitivityAtoB: DirectionalSensitivity;
  sensitivityBtoA: DirectionalSensitivity;

  // 4. ◤ 신뢰가 흔들리는 진짜 이유 (Trust Currency Top 2~3 per person)
  trustCurrencyA: TrustCurrencyItem;
  trustCurrencyB: TrustCurrencyItem;

  // 5. ◤ 다시 신뢰하려면 무엇이 먼저 필요할까 (Directional Repair Sequence)
  repairSequenceAtoB: DirectionalRepairSequence;
  repairSequenceBtoA: DirectionalRepairSequence;

  // 6. ◤ 같은 사과도 이렇게 해야 잘 들어온다 (Person-specific Repair Language)
  repairLanguageA: RepairLanguagePreference;
  repairLanguageB: RepairLanguagePreference;

  // 7. ◤ 이 팀은 갈등 뒤 어떻게 돌아오는 팀일까 (Pair Repair Synthesis)
  pairRepairSynthesis: PairRepairSynthesis;

  // 8. ◤ 서로 마음이 상했을 때(삐졌을 때) 1:1 대화 해독 수칙
  upsetReconciliationA: {
    personName: string;
    upsetSignal: string;
    doList: string[];
    avoidList: string[];
  };
  upsetReconciliationB: {
    personName: string;
    upsetSignal: string;
    doList: string[];
    avoidList: string[];
  };
  deEscalationCushion?: {
    hashtag: string;
    title: string;
    detail: string;
  };
};

/**
 * Derives Person A/B Directional Sensitivities.
 */
function deriveDirectionalSensitivity(params: {
  name: string;
  partnerName: string;
  isPersonA: boolean;
  individualWorkBundle?: IndividualWorkChapterBundle | null;
  workSignals?: WorkSajuSignals | null;
  psych?: PsychMasterJson | null;
}): DirectionalSensitivity {
  const { name, partnerName, isPersonA, individualWorkBundle, workSignals, psych } = params;

  const ch02Person = isPersonA ? individualWorkBundle?.personA : individualWorkBundle?.personB;
  const category = workSignals?.month_geokguk?.month_stem_category ?? "self";

  const sec = psych?.secondary_axes;
  const deliberateVal = sec?.deliberate_decision ?? 50;
  const structureVal = sec?.structure ?? 50;

  const isExecutionLead =
    category === "food" ||
    category === "wealth" ||
    deliberateVal <= 45 ||
    (ch02Person?.identityLabel ?? "").includes("실행") ||
    (ch02Person?.identityLabel ?? "").includes("판단") ||
    isPersonA;

  if (isExecutionLead) {
    return {
      personName: name,
      partnerName,
      sensitiveMistakeTrigger: `${partnerName}님이 사전에 약속된 타임라인이나 결정된 방향을 일방적으로 뒤집거나 확답을 미룰 때`,
      reactionPattern: "답답함을 느끼며 설명 요청 단계를 생략하고 직접 판단하여 행동에 착수함",
      underlyingNeed: "추진 권한 존중 및 결정의 명확성",
    };
  }

  return {
    personName: name,
    partnerName,
    sensitiveMistakeTrigger: `${partnerName}님이 충분한 사전 공유나 리스크 검증 없이 즉흥적으로 결정을 내리고 통보할 때`,
    reactionPattern: "즉시 확답을 피하고 추가 자료 재검토를 요청하며 서류 및 조건 기준을 촘촘히 잡음",
    underlyingNeed: "리스크 사전 공유 및 최소 검토 시간 확보",
  };
}

/**
 * Derives Trust Currencies per person from Semantic Taxonomy.
 */
function deriveTrustCurrency(params: {
  name: string;
  isPersonA: boolean;
  individualWorkBundle?: IndividualWorkChapterBundle | null;
  workSignals?: WorkSajuSignals | null;
  psych?: PsychMasterJson | null;
}): TrustCurrencyItem {
  const { name, isPersonA, individualWorkBundle, workSignals, psych } = params;

  const ch02Person = isPersonA ? individualWorkBundle?.personA : individualWorkBundle?.personB;
  const category = workSignals?.month_geokguk?.month_stem_category ?? "self";

  const sec = psych?.secondary_axes;
  const structureVal = sec?.structure ?? 50;
  const deliberateVal = sec?.deliberate_decision ?? 50;

  const isExecutionLead =
    category === "food" ||
    category === "wealth" ||
    deliberateVal <= 45 ||
    (ch02Person?.identityLabel ?? "").includes("실행") ||
    isPersonA;

  if (isExecutionLead) {
    return {
      personName: name,
      topCurrencies: [
        {
          keyword: "속도",
          explanation: "말에 그치지 않고 약속된 시점 안에 결과물을 실제로 만들어내는가",
        },
        {
          keyword: "책임",
          explanation: "문제가 터졌을 때 변명 대신 해결책을 제시하며 끝각을 잡는가",
        },
        {
          keyword: "투명성",
          explanation: "막히는 구간이나 변수가 생겼을 때 즉시 감추지 않고 공유하는가",
        },
      ],
    };
  }

  return {
    personName: name,
    topCurrencies: [
      {
        keyword: "정확성",
        explanation: "사전 조항, 숫자, 핵심 기준에 오류 없이 치밀하게 검증되었는가",
      },
      {
        keyword: "준비",
        explanation: "회의나 의사결정 전에 맥락 자료와 대안 옵션을 충분히 갖추었는가",
      },
      {
        keyword: "존중",
        explanation: "일방적인 단독 결정 대신 사전 검토 프로세스와 기준을 존중하는가",
      },
    ],
  };
}

/**
 * Derives Directional Repair Sequences.
 */
function deriveRepairSequence(params: {
  fromName: string;
  toName: string;
  fromIsPersonA: boolean;
}): DirectionalRepairSequence {
  const { fromName, toName, fromIsPersonA } = params;

  if (fromIsPersonA) {
    // A (Execution Lead) -> B (QA Lead)
    return {
      fromName,
      toName,
      steps: [
        `1. [즉각적인 사전 공유] — 일방적 실행 통보 대신 변경된 맥락과 이유를 팩트 위주로 공유하기`,
        `2. [최소 검토 시간 보장] — ${toName}님이 리스크를 점검할 수 있는 최소 24시간 검토 버퍼 떼어주기`,
        `3. [보완 대안 확인] — ${toName}님이 제시한 보완점 중 핵심 1-2가지를 수정안에 명확히 반영하기`,
      ],
    };
  }

  // B (QA Lead) -> A (Execution Lead)
  return {
    fromName,
    toName,
    steps: [
      `1. [핵심 결론 우선 전달] — 장황한 검토 과정보다 해결 대안과 마감 완수안을 두괄식으로 먼저 제시하기`,
      `2. [보류 요인 명확화] — '안 된다'는 지적 대신 'A안으로 가면 3일 절약, B안으로 가면 리스크 방어' 옵션화하기`,
      `3. [일정 확정] — 재검토 후 최종 승인 시점을 명확한 시분 단위로 확정해 전달하기`,
    ],
  };
}

/**
 * Derives Person-Specific Repair Language.
 */
function deriveRepairLanguage(params: {
  name: string;
  isPersonA: boolean;
}): RepairLanguagePreference {
  const { name, isPersonA } = params;

  if (isPersonA) {
    return {
      personName: name,
      preferredStyle: "두괄식 팩트와 즉각적인 수습 대안이 담긴 사과",
      effectivePhrases: [
        `"이 부분 공유가 늦어 죄송합니다. 현시점 수습을 위해 A안으로 즉시 대응하겠습니다."`,
        `"의사결정 차질을 드려 죄송합니다. 마감 일정에 영향 없도록 핵심 2가지를 바로 조치하겠습니다."`,
      ],
      ineffectivePhrases: [
        `"어쩔 수 없는 불가피한 상황이었습니다" (감정적 변명)`,
        `"나중에 천천히 생각해보시죠" (속도 지연형 멘트)`,
      ],
    };
  }

  return {
    personName: name,
    preferredStyle: "원인 인정과 재발 방지 구체적 프로세스가 담긴 사과",
    effectivePhrases: [
      `"사전 검토 절차를 건너뛰어 불안하게 해드려 죄송합니다. 기준점을 다시 정돈하겠습니다."`,
      `"확인 없이 결정한 제 실수입니다. 지적해주신 리스크 포인트를 반영하여 가이드라인을 수정하겠습니다."`,
    ],
    ineffectivePhrases: [
      `"좋은 게 좋은 거니 일단 넘어가죠" (기준 경시 멘트)`,
      `"왜 그렇게 예민하게 구세요?" (절차 부정형 멘트)`,
    ],
  };
}

/**
 * Builds Chapter 06 Work Conflict & Trust Repair Intelligence Bundle.
 */
export function buildWorkConflictChapterBundle(params: {
  nameA: string;
  nameB: string;
  individualWorkBundle?: IndividualWorkChapterBundle | null;
  communicationChapterBundle?: WorkCommunicationChapterBundle | null;
  pressureChapterBundle?: WorkPressureChapterBundle | null;
  sajuChartA?: SajuDataForIntegrated | null;
  sajuChartB?: SajuDataForIntegrated | null;
  workSignalsA?: WorkSajuSignals | null;
  workSignalsB?: WorkSajuSignals | null;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): WorkConflictChapterBundle {
  const {
    nameA,
    nameB,
    individualWorkBundle,
    communicationChapterBundle,
    pressureChapterBundle,
    sajuChartA,
    sajuChartB,
    workSignalsA,
    workSignalsB,
    psychA,
    psychB,
    locale = "ko-KR",
  } = params;

  // 1. Top Conflict Themes (2~4 Ranked Themes)
  const conflictThemes: ConflictTheme[] = [
    {
      themeTitle: "속도 vs 리스크 검증 템포 마찰",
      personAStandard: `${nameA}: 빠른 결단과 즉각적인 결과물 완수`,
      personBStandard: `${nameB}: 리스크 검증과 최소 품질 마지노선 준수`,
      realFrictionScene: "마감 직전 사전 검토 없이 단독 결정 후 통보되거나, 품질 검토 버퍼가 부족할 때",
      mutualMisinterpretation: `${nameA}님은 ${nameB}님을 '속도를 늦추는 걸림돌'로, ${nameB}님은 ${nameA}님을 '리스크를 무시하는 조급함'으로 해석하기 쉬움`,
    },
    {
      themeTitle: "사전 맥락 공유 vs 단독 판단 마찰",
      personAStandard: `${nameA}: 상황 발생 시 현장에서 빠른 단독 대응`,
      personBStandard: `${nameB}: 변경 사항의 상세 원인과 사전 가이드라인 공유`,
      realFrictionScene: "초기 합의된 가이드라인이 명확한 논의 없이 변경되어 일관성이 무너질 때",
      mutualMisinterpretation: `${nameA}님은 ${nameB}님을 '권한 이관에 소극적인 신중파'로, ${nameB}님은 ${nameA}님을 '규칙을 임의로 바꾸는 자율파'로 오해하기 쉬움`,
    },
  ];

  // 2. Pair-specific Conflict Loop (Step-by-step Escalation)
  const conflictLoop: PairConflictLoop = {
    trigger: "긴급 마감이나 예상치 못한 업무 변수 발생",
    personAAction: `${nameA}님이 소통 단계를 생략하고 직접 판단하여 즉각 조치 착수`,
    personBInterpretation: `${nameB}님이 '사전 검토 없이 일방적으로 진행한다'고 해석`,
    personBDefense: `${nameB}님이 위험 요소를 지적하며 재검토를 요청하고 확답 시점을 지연`,
    personAReinterpretation: `${nameA}님이 '의사결정이 둔하고 템포를 지연시킨다'고 재해석`,
    operationalConsequence: "의사결정 병목 심화 및 상호 간 업무 피로도 급증",
  };

  // 3. Directional Sensitivities (A->B, B->A)
  const sensitivityAtoB = deriveDirectionalSensitivity({
    name: nameA,
    partnerName: nameB,
    isPersonA: true,
    individualWorkBundle,
    workSignals: workSignalsA,
    psych: psychA,
  });

  const sensitivityBtoA = deriveDirectionalSensitivity({
    name: nameB,
    partnerName: nameA,
    isPersonA: false,
    individualWorkBundle,
    workSignals: workSignalsB,
    psych: psychB,
  });

  // 4. Trust Currencies (A and B)
  const trustCurrencyA = deriveTrustCurrency({
    name: nameA,
    isPersonA: true,
    individualWorkBundle,
    workSignals: workSignalsA,
    psych: psychA,
  });

  const trustCurrencyB = deriveTrustCurrency({
    name: nameB,
    isPersonA: false,
    individualWorkBundle,
    workSignals: workSignalsB,
    psych: psychB,
  });

  // 5. Directional Repair Sequences (A->B, B->A)
  const repairSequenceAtoB = deriveRepairSequence({
    fromName: nameA,
    toName: nameB,
    fromIsPersonA: true,
  });

  const repairSequenceBtoA = deriveRepairSequence({
    fromName: nameB,
    toName: nameA,
    fromIsPersonA: false,
  });

  // 6. Person-Specific Repair Languages
  const repairLanguageA = deriveRepairLanguage({
    name: nameA,
    isPersonA: true,
  });

  const repairLanguageB = deriveRepairLanguage({
    name: nameB,
    isPersonA: false,
  });

  // 7. Pair Repair Synthesis
  const pairRepairSynthesis: PairRepairSynthesis = {
    synthesisTitle: "갈등을 통해 서로의 업무 안전선을 배우는 팀",
    resilienceSummary: `${nameA}님의 결단력과 ${nameB}님의 검증력을 신뢰 루프 안에서 묶어낼 때, 마찰은 위험이 아닌 완성도를 높이는 안전장치가 됩니다.`,
    bridgeToPlaybook: "아래 실전 Playbook을 통해 두 사람의 충돌을 방지하는 1:1 맞춤 협업 규칙을 확인하세요.",
  };

  // 8. ◤ 서로 마음이 상했을 때(삐졌을 때) 1:1 대화 해독 수칙
  const guideA = buildUpsetResponseGuide(
    nameA,
    sajuChartA ?? ({} as any),
    (sajuChartA as any)?.ten_gods ?? {},
    locale,
    workSignalsA ?? undefined,
  );
  const guideB = buildUpsetResponseGuide(
    nameB,
    sajuChartB ?? ({} as any),
    (sajuChartB as any)?.ten_gods ?? {},
    locale,
    workSignalsB ?? undefined,
  );

  let deEscalation: any = null;
  try {
    if (sajuChartA?.saju && (sajuChartA.saju as any).yearPillar && sajuChartB?.saju && (sajuChartB.saju as any).yearPillar) {
      const chartA = buildChartContext(sajuJsonToPillars(sajuChartA.saju as any));
      const chartB = buildChartContext(sajuJsonToPillars(sajuChartB.saju as any));
      deEscalation = pickDeEscalationCard(
        (sajuChartA as any)?.ten_gods ?? {},
        (sajuChartB as any)?.ten_gods ?? {},
        chartA,
        chartB,
        locale,
        workSignalsA ?? undefined,
        workSignalsB ?? undefined,
      );
    }
  } catch (_err) {
    deEscalation = null;
  }

  return {
    subtitle: "실수나 충돌이 생겼을 때 무엇에 민감하고, 어떻게 해야 다시 신뢰가 회복되는가",
    introSummary: "두 사람 사이의 갈등 유발 패턴부터 에스컬레이션 루프, 신뢰 통화(Trust Currency), 그리고 구체적인 복구 사과 절차를 제시합니다.",
    conflictThemes,
    conflictLoop,
    sensitivityAtoB,
    sensitivityBtoA,
    trustCurrencyA,
    trustCurrencyB,
    repairSequenceAtoB,
    repairSequenceBtoA,
    repairLanguageA,
    repairLanguageB,
    pairRepairSynthesis,
    upsetReconciliationA: {
      personName: nameA,
      upsetSignal: guideA.upset_signals,
      doList: guideA.do_list,
      avoidList: guideA.avoid_list,
    },
    upsetReconciliationB: {
      personName: nameB,
      upsetSignal: guideB.upset_signals,
      doList: guideB.do_list,
      avoidList: guideB.avoid_list,
    },
    deEscalationCushion: deEscalation
      ? {
          hashtag: deEscalation.hashtag,
          title: deEscalation.title,
          detail: deEscalation.detail,
        }
      : undefined,
  };
}
