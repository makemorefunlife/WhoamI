import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { WorkColleagueReportBody } from "./viewModel/workReportSectionTypes";
import { buildCanonicalWorkRoleMap } from "./workCanonicalRoleModel";
import { analyzeWorkInnateVsCurrentDiscrepancy } from "./workPsychSajuDiscrepancy";

export type InnateVsCurrentCommunicationStatus = "aligned" | "adapted" | "mixed" | "low_confidence";

export type IndividualCommunicationProfile = {
  name: string;
  // 1. 생각을 정리하는 방식
  thinkMode: {
    shortLabel: string;
    meaning: string;
    innateVsCurrent: {
      status: InnateVsCurrentCommunicationStatus;
      innateLabel: string;
      currentLabel: string;
      synthesisSentence: string;
    };
  };
  // 2. 회의에서 의견을 내는 방식
  meetingStyle: {
    shortLabel: string;
    description: string;
    primaryRole: "conclusion_puller" | "condition_checker" | "possibility_expander" | "assumption_challenger";
  };
  // 3. 보고하고 공유하는 방식
  reportingStyle: {
    dimensions: Array<{
      label: string;
      pattern: string;
    }>;
    summary: string;
  };
  // 4. 피드백을 주고받는 방식
  feedbackStyle: {
    easyConditionTitle: string;
    easyConditionExplanation: string;
    hardConditionTitle: string;
    hardConditionExplanation: string;
  };
  // 5. 의견이 다를 때 무엇을 보고 결정할까
  decisionCriteria: Array<{
    title: string;
    question: string;
  }>;
};

export type PairDecisionFlowItem = {
  decisionTypeTitle: string;
  primaryOwner: string;
  inputRole: string;
  closureGuide: string;
};

export type PairCommunicationRhythmStep = {
  phase: "BEFORE" | "DISCUSS" | "CHECK" | "DECIDE";
  phaseTitle: string;
  actionText: string;
};

export type WorkCommunicationChapterBundle = {
  subtitle: string;
  introSummary: string;
  personA: IndividualCommunicationProfile;
  personB: IndividualCommunicationProfile;
  
  // Section 1 pair synthesis
  thinkModePairSynthesis: {
    title: string;
    summary: string;
  };

  // Section 2 pair manifestation
  meetingStylePairManifestation: {
    title: string;
    summary: string;
  };

  // Section 3 pair info mismatch
  reportingMismatchNote: {
    title: string;
    summary: string;
  };

  // Section 4 pair feedback insight
  feedbackPairInsight: {
    title: string;
    summary: string;
  };

  // Section 5 pair decision tension
  decisionTension: {
    title: string;
    summary: string;
  };

  // Section 6 decision flow (Consumes Ch03 R&R)
  decisionFlowItems: PairDecisionFlowItem[];

  // Section 7 pair communication rhythm
  communicationRhythmSteps: PairCommunicationRhythmStep[];
};

/**
 * Cleanly formats person communication profile using CE, 11-Axis, and Innate vs Current reconciliation.
 */
function buildIndividualCommunicationProfile(params: {
  name: string;
  partnerName: string;
  sajuChart?: SajuDataForIntegrated | null;
  workSignals?: WorkSajuSignals | null;
  psych?: PsychMasterJson | null;
}): IndividualCommunicationProfile {
  const { name, partnerName, sajuChart, workSignals, psych } = params;
  const axes = psych?.secondary_axes;
  const unknownHour = Boolean(sajuChart?.calendar?.birth_time_unknown);

  // 1. Thinking Mode (11-axis thinking_style, external_energy, deliberate_decision + Saju CE)
  const dayStem = sajuChart?.saju?.dayPillar?.[0] ?? "";
  const isYangInnate = ["갑", "병", "무", "경", "임"].includes(dayStem);

  const thinkingStyleVal = axes?.thinking_style ?? 50;
  const extEnergyVal = axes?.external_energy ?? 50;
  const deliberateVal = axes?.deliberate_decision ?? 50;
  const structureVal = axes?.structure ?? 50;

  // Derive Think Mode
  let shortThinkLabel = "";
  let thinkMeaning = "";
  if (extEnergyVal >= 60 || thinkingStyleVal >= 60) {
    shortThinkLabel = "말하면서 답을 좁히는 편";
    thinkMeaning = "대화 안에서 소통을 주고받으며 아이디어를 다듬고 생각을 구체화합니다.";
  } else if (deliberateVal <= 40 || structureVal >= 60) {
    shortThinkLabel = "정리한 뒤 의견을 꺼내는 편";
    thinkMeaning = "안건의 핵심 쟁점과 조건을 혼자 먼저 정리한 후 말할 때 명확성이 높아집니다.";
  } else {
    shortThinkLabel = "상황에 따라 유연하게 구성하는 편";
    thinkMeaning = "안건의 성격에 따라 개별 생각 정리와 대화형 아이디어 확장을 유연하게 오갑니다.";
  }

  // Innate vs Current reconciliation
  let thinkStatus: InnateVsCurrentCommunicationStatus = "aligned";
  let innateThinkLabel = isYangInnate ? "직관 추진형 기질" : "수용 수렴형 기질";
  let currentThinkLabel = extEnergyVal >= 60 ? "외향 대화 소통" : "내향 사색 소통";
  let thinkSynthesisSentence = "";

  if (isYangInnate && extEnergyVal < 40) {
    thinkStatus = "adapted";
    thinkSynthesisSentence = `${name}님은 본래 직관과 표현이 빠른 기질이나, 현재는 신중하게 안건을 검토한 후 의견을 꺼내는 적응형 패턴을 보입니다.`;
  } else if (!isYangInnate && extEnergyVal >= 60) {
    thinkStatus = "adapted";
    thinkSynthesisSentence = `${name}님은 본래 내부 사색과 수렴 기질이 강하나, 현재 실무에서는 적극적인 소통과 대화를 통해 의견을 이끄는 방식을 발휘합니다.`;
  } else if (psych && psych.secondary_axes) {
    thinkStatus = "aligned";
    thinkSynthesisSentence = `${name}님은 타고난 생각 정리 기질과 현재 업무에서의 소통 방식이 조화롭게 일치합니다.`;
  } else {
    thinkStatus = "low_confidence";
    thinkSynthesisSentence = `${name}님의 성향 데이터를 바탕으로 유연한 소통 패턴을 보여줍니다.`;
  }

  // 2. Meeting Opinion Style
  const conflictVal = axes?.conflict_style ?? 50;
  let shortMeetingLabel = "";
  let meetingDesc = "";
  let primaryRole: "conclusion_puller" | "condition_checker" | "possibility_expander" | "assumption_challenger" = "conclusion_puller";

  if (deliberateVal <= 40 && conflictVal <= 45) {
    shortMeetingLabel = "결론을 앞으로 끌어내는 편";
    meetingDesc = "논의가 길어질 때 핵심 목표로 대화를 수렴시키고 마감과 방향을 명확히 제시합니다.";
    primaryRole = "conclusion_puller";
  } else if (structureVal >= 60 || deliberateVal >= 60) {
    shortMeetingLabel = "빠진 조건을 확인하는 편";
    meetingDesc = "실행에 앞서 빠진 조항이나 위험 요소, 필요 조건이 완비되었는지 정밀히 점검합니다.";
    primaryRole = "condition_checker";
  } else if (extEnergyVal >= 60) {
    shortMeetingLabel = "다양한 대안을 제안하는 편";
    meetingDesc = "기존 방식에 갇히지 않고 새로운 관점과 확장 가능한 아이디어를 자유롭게 펼칩니다.";
    primaryRole = "possibility_expander";
  } else {
    shortMeetingLabel = "핵심 가정을 점검하는 편";
    meetingDesc = "전제 조건의 타당성을 짚고 근본적인 목표에 부합하는지 조용히 검증합니다.";
    primaryRole = "assumption_challenger";
  }

  // 3. Reporting & Information Sharing Style
  const practicalityVal = axes?.practicality ?? 50;
  const reportingDimensions: Array<{ label: string; pattern: string }> = [];

  if (deliberateVal <= 45 || practicalityVal >= 60) {
    reportingDimensions.push({ label: "전달 순서", pattern: "결론부터 두괄식 보고" });
  } else {
    reportingDimensions.push({ label: "전달 순서", pattern: "배경 맥락부터 설명" });
  }

  if (structureVal >= 60) {
    reportingDimensions.push({ label: "정보 깊이", pattern: "근거 및 세부 과정 포함" });
  } else {
    reportingDimensions.push({ label: "정보 깊이", pattern: "핵심 요약 위주 노출" });
  }

  const reportingSummary = `${name}님은 ${reportingDimensions.map(d => d.pattern).join(" 및 ")}를 선호하는 전달 스타일에 해당합니다.`;

  // 4. Feedback Reception Style
  const empathyVal = axes?.empathy ?? 50;
  const recognitionVal = axes?.recognition ?? 50;

  let easyConditionTitle = "";
  let easyConditionExplanation = "";
  let hardConditionTitle = "";
  let hardConditionExplanation = "";

  if (structureVal >= 60 || deliberateVal >= 60) {
    easyConditionTitle = "객관적 근거와 개선 이유가 명확할 때";
    easyConditionExplanation = "감정적 평가 대신 구체적 사실 데이터와 명확한 수용 기준이 제시되면 수용도가 높아집니다.";
    hardConditionTitle = "맥락 없는 모호한 지적";
    hardConditionExplanation = "근거 없이 당위성이나 조급함만 강요받으면 받아들이기 힘들어합니다.";
  } else if (empathyVal >= 60 || recognitionVal >= 60) {
    easyConditionTitle = "노고에 대한 인정과 기대 역할이 전달될 때";
    easyConditionExplanation = "시도와 성과에 대한 존중을 먼저 표현한 뒤 제안 형식으로 전달할 때 빠르게 수용합니다.";
    hardConditionTitle = "공개적인 문책이나 감정적 표현";
    hardConditionExplanation = "타인 앞에서 자존감을 상하게 하거나 책임만 추궁하면 방어 모드로 전환될 수 있습니다.";
  } else {
    easyConditionTitle = "핵심 문제와 구체적 대안이 함께 올 때";
    easyConditionExplanation = "막힌 구간에 대한 구체적인 솔루션 가이드가 포함된 피드백을 환영합니다.";
    hardConditionTitle = "방향 없는 반복 피드백";
    hardConditionExplanation = "대안 없이 문제점만 반복 언급되면 피로감을 느낍니다.";
  }

  // 5. Decision Criteria
  const decisionCriteria: Array<{ title: string; question: string }> = [];

  if (deliberateVal <= 45) {
    decisionCriteria.push({ title: "실행 속도", question: "지금 즉시 착수하여 기회를 잡을 수 있는가?" });
  } else {
    decisionCriteria.push({ title: "안정성과 검토 수준", question: "충분한 리스크 검증과 가이드라인이 서 있는가?" });
  }

  if (practicalityVal >= 55) {
    decisionCriteria.push({ title: "실질적 결과물", question: "투입 대비 실질적인 성과와 효율이 확실한가?" });
  } else {
    decisionCriteria.push({ title: "완성도 및 기준 충족", question: "팀과 서비스의 품질 기준에 부합하는가?" });
  }

  return {
    name,
    thinkMode: {
      shortLabel: shortThinkLabel,
      meaning: thinkMeaning,
      innateVsCurrent: {
        status: thinkStatus,
        innateLabel: innateThinkLabel,
        currentLabel: currentThinkLabel,
        synthesisSentence: thinkSynthesisSentence,
      },
    },
    meetingStyle: {
      shortLabel: shortMeetingLabel,
      description: meetingDesc,
      primaryRole,
    },
    reportingStyle: {
      dimensions: reportingDimensions,
      summary: reportingSummary,
    },
    feedbackStyle: {
      easyConditionTitle,
      easyConditionExplanation,
      hardConditionTitle,
      hardConditionExplanation,
    },
    decisionCriteria,
  };
}

/**
 * Builds Chapter 04 Work Communication & Decision Intelligence Bundle.
 */
export function buildWorkCommunicationChapterBundle(params: {
  nameA: string;
  nameB: string;
  sajuChartA?: SajuDataForIntegrated | null;
  sajuChartB?: SajuDataForIntegrated | null;
  workSignalsA?: WorkSajuSignals | null;
  workSignalsB?: WorkSajuSignals | null;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  officeReport?: WorkColleagueReportBody | null;
  locale?: Locale;
}): WorkCommunicationChapterBundle {
  const { nameA, nameB, sajuChartA, sajuChartB, workSignalsA, workSignalsB, psychA, psychB, officeReport } = params;

  const personA = buildIndividualCommunicationProfile({
    name: nameA,
    partnerName: nameB,
    sajuChart: sajuChartA,
    workSignals: workSignalsA,
    psych: psychA,
  });

  const personB = buildIndividualCommunicationProfile({
    name: nameB,
    partnerName: nameA,
    sajuChart: sajuChartB,
    workSignals: workSignalsB,
    psych: psychB,
  });

  // Section 1 Pair Think Mode Synthesis
  const thinkModePairSynthesis = {
    title: "둘이 생각을 맞출 때",
    summary: `${nameA}님의 ${personA.thinkMode.shortLabel}와 ${nameB}님의 ${personB.thinkMode.shortLabel}가 만나 대화의 템포 조율이 필요합니다. 한쪽의 발상 제안 후 다른 한쪽이 정리할 수 있는 사전 안건 공유 시간이 도움이 됩니다.`,
  };

  // Section 2 Pair Meeting Manifestation
  const meetingStylePairManifestation = {
    title: "실제 회의에서는",
    summary: `회의 중 ${nameA}님이 ${personA.meetingStyle.shortLabel} 역할을 할 때, ${nameB}님은 ${personB.meetingStyle.shortLabel} 역할을 수행하게 됩니다. 한쪽이 추진 속도를 내면 다른 한쪽이 조건과 품질을 챙겨 속도와 완성도의 균형을 맞춥니다.`,
  };

  // Section 3 Reporting Mismatch Note
  const reportingMismatchNote = {
    title: "둘 사이에서 놓치기 쉬운 것",
    summary: `한쪽은 결론 위주로 이미 핵심을 공유했다고 판단하지만, 다른 쪽은 공유된 정보의 배경 근거나 세부 과정이 빠졌다고 느낄 수 있습니다.`,
  };

  // Section 4 Feedback Pair Insight
  const feedbackPairInsight = {
    title: "서로 피드백할 때 생길 수 있는 오해",
    summary: `${nameA}님은 ${personA.feedbackStyle.easyConditionTitle}를 바라는 반면, ${nameB}님은 ${personB.feedbackStyle.easyConditionTitle}가 중요합니다. 상대의 수용 기준을 고려하여 전달 형식을 다듬으면 의도치 않은 오해를 줄일 수 있습니다.`,
  };

  // Section 5 Decision Tension
  const decisionTension = {
    title: "그래서 의견이 갈리면",
    summary: `의견이 마찰할 때 ${nameA}님은 ${personA.decisionCriteria[0]?.title || "실행력"}을 우선시하고, ${nameB}님은 ${personB.decisionCriteria[0]?.title || "검토 기준"}을 확인하려 합니다. 두 기준 중 안건의 시급성과 중요도에 따라 우선순위를 결정하는 것이 효과적입니다.`,
  };

  // Section 6 Decision Flow (Consumes Canonical Chapter 03 R&R!)
  const canonicalRoles = buildCanonicalWorkRoleMap({
    nameA,
    nameB,
    sajuJsonA: sajuChartA ?? ({} as any),
    sajuJsonB: sajuChartB ?? ({} as any),
    workSignalsA: workSignalsA ?? undefined,
    workSignalsB: workSignalsB ?? undefined,
    psychA: psychA ?? undefined,
    psychB: psychB ?? undefined,
  });

  const executionLeadName = canonicalRoles.executionOwner === "B" ? nameB : nameA;
  const qualityLeadName = canonicalRoles.qaRiskOwner === "B" ? nameB : nameA;
  const directionLeadName = canonicalRoles.directionOwner === "B" ? nameB : nameA;

  const decisionFlowItems: PairDecisionFlowItem[] = [
    {
      decisionTypeTitle: "빠른 실행 과제 (Fast Execution)",
      primaryOwner: executionLeadName,
      inputRole: `${qualityLeadName}의 리스크 점검`,
      closureGuide: `${executionLeadName}님이 추진 결정을 내리되, ${qualityLeadName}님의 치명적 리스크 체크만 통과하면 즉시 확정합니다.`,
    },
    {
      decisionTypeTitle: "품질 · 리스크 검토 과제 (Quality & Risk)",
      primaryOwner: qualityLeadName,
      inputRole: `${executionLeadName}의 실행 타임라인`,
      closureGuide: `${qualityLeadName}님이 품질과 기준 충족 여부를 확인하여 최종 승인합니다.`,
    },
    {
      decisionTypeTitle: "사업 방향 및 스코프 확정 (Strategy & Scope)",
      primaryOwner: directionLeadName,
      inputRole: "상호 협의",
      closureGuide: `${directionLeadName}님이 전체 우선순위와 범위를 조율하고 최종 의사결정을 클로징합니다.`,
    },
  ];

  // Section 7 Pair Communication Rhythm Sequence
  const communicationRhythmSteps: PairCommunicationRhythmStep[] = [
    {
      phase: "BEFORE",
      phaseTitle: "사전 공유",
      actionText: "중요 미팅 1시간 전 핵심 안건과 목표를 텍스트로 미리 공유합니다.",
    },
    {
      phase: "DISCUSS",
      phaseTitle: "의견 교환",
      actionText: "대화로 아이디어 옵션을 넓히고 핵심 선택지 2~3개로 범위를 압축합니다.",
    },
    {
      phase: "CHECK",
      phaseTitle: "조건 확인",
      actionText: "실행에 빠진 조항이나 위험 요소가 없는지 최종 리스크 팩트를 검토합니다.",
    },
    {
      phase: "DECIDE",
      phaseTitle: "Owner 확정",
      actionText: "정해진 담당 R&R Owner가 최종 결론을 짓고 다음 실행 타임라인을 확정합니다.",
    },
  ];

  return {
    subtitle: "생각을 정리하는 방식부터 회의, 보고, 피드백, 최종 결정까지",
    introSummary: "두 사람은 문제를 인식하고 해결하는 시순서(의견 구상, 대화 방식, 정보 공유, 최종 의사결정)가 서로 다를 수 있습니다. 두 사람의 소통과 판단 리듬을 분석합니다.",
    personA,
    personB,
    thinkModePairSynthesis,
    meetingStylePairManifestation,
    reportingMismatchNote,
    feedbackPairInsight,
    decisionTension,
    decisionFlowItems,
    communicationRhythmSteps,
  };
}
