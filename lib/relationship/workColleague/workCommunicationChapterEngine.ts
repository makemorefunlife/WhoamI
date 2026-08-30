/**
 * Phase 2 English remediation: every returned string below now goes through
 * `pick(locale, en, ko)`; the Korean strings and the conditional logic that
 * selects between them are unchanged. English copy is a natural rewrite for
 * a US reader, not a word-for-word translation. `buildIndividualCommunicationProfile`
 * gained a `locale` param (it previously had none); `buildWorkCommunicationChapterBundle`
 * now actually destructures `locale` (it was previously in the type but
 * silently dropped).
 */
import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { WorkColleagueReportBody } from "./viewModel/workReportSectionTypes";
import { buildCanonicalWorkRoleMap } from "./workCanonicalRoleModel";
import { analyzeWorkInnateVsCurrentDiscrepancy } from "./workPsychSajuDiscrepancy";
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";

void analyzeWorkInnateVsCurrentDiscrepancy;

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
  locale?: Locale;
}): IndividualCommunicationProfile {
  const { name, sajuChart, psych, locale = LEGACY_FALLBACK_LOCALE } = params;
  const axes = psych?.secondary_axes;

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
    shortThinkLabel = pick(locale, "Talks it out to narrow down the answer", "말하면서 답을 좁히는 편");
    thinkMeaning = pick(
      locale,
      "Refines ideas and sharpens their thinking through back-and-forth conversation.",
      "대화 안에서 소통을 주고받으며 아이디어를 다듬고 생각을 구체화합니다.",
    );
  } else if (deliberateVal <= 40 || structureVal >= 60) {
    shortThinkLabel = pick(locale, "Organizes their thoughts before speaking up", "정리한 뒤 의견을 꺼내는 편");
    thinkMeaning = pick(
      locale,
      "Gets clearer once they've worked through the key issues and conditions on their own first.",
      "안건의 핵심 쟁점과 조건을 혼자 먼저 정리한 후 말할 때 명확성이 높아집니다.",
    );
  } else {
    shortThinkLabel = pick(locale, "Flexes their approach depending on the situation", "상황에 따라 유연하게 구성하는 편");
    thinkMeaning = pick(
      locale,
      "Moves fluidly between thinking things through alone and expanding ideas out loud, depending on what the topic calls for.",
      "안건의 성격에 따라 개별 생각 정리와 대화형 아이디어 확장을 유연하게 오갑니다.",
    );
  }

  // Innate vs Current reconciliation
  let thinkStatus: InnateVsCurrentCommunicationStatus = "aligned";
  let innateThinkLabel = pick(locale, isYangInnate ? "An intuitive, lead-with-instinct temperament" : "A receptive, converging temperament", isYangInnate ? "직관 추진형 기질" : "수용 수렴형 기질");
  let currentThinkLabel = pick(locale, extEnergyVal >= 60 ? "Outward, conversation-driven communication" : "Inward, reflective communication", extEnergyVal >= 60 ? "외향 대화 소통" : "내향 사색 소통");
  let thinkSynthesisSentence = "";

  if (isYangInnate && extEnergyVal < 40) {
    thinkStatus = "adapted";
    thinkSynthesisSentence = pick(
      locale,
      `${name} is naturally quick to sense things and speak up, but has adapted to reviewing things carefully before weighing in.`,
      `${name}님은 본래 직관과 표현이 빠른 기질이나, 현재는 신중하게 안건을 검토한 후 의견을 꺼내는 적응형 패턴을 보입니다.`,
    );
  } else if (!isYangInnate && extEnergyVal >= 60) {
    thinkStatus = "adapted";
    thinkSynthesisSentence = pick(
      locale,
      `${name} is naturally more reflective and inward, but has learned to lead through active conversation at work.`,
      `${name}님은 본래 내부 사색과 수렴 기질이 강하나, 현재 실무에서는 적극적인 소통과 대화를 통해 의견을 이끄는 방식을 발휘합니다.`,
    );
  } else if (psych && psych.secondary_axes) {
    thinkStatus = "aligned";
    thinkSynthesisSentence = pick(
      locale,
      `${name}'s natural way of processing things and how they actually communicate at work line up well.`,
      `${name}님은 타고난 생각 정리 기질과 현재 업무에서의 소통 방식이 조화롭게 일치합니다.`,
    );
  } else {
    thinkStatus = "low_confidence";
    thinkSynthesisSentence = pick(
      locale,
      `Based on what we have on ${name}, they show a flexible communication pattern.`,
      `${name}님의 성향 데이터를 바탕으로 유연한 소통 패턴을 보여줍니다.`,
    );
  }

  // 2. Meeting Opinion Style
  const conflictVal = axes?.conflict_style ?? 50;
  let shortMeetingLabel = "";
  let meetingDesc = "";
  let primaryRole: "conclusion_puller" | "condition_checker" | "possibility_expander" | "assumption_challenger" = "conclusion_puller";

  if (deliberateVal <= 40 && conflictVal <= 45) {
    shortMeetingLabel = pick(locale, "Pulls the conversation toward a conclusion", "결론을 앞으로 끌어내는 편");
    meetingDesc = pick(
      locale,
      "When a discussion runs long, brings it back to the core goal and lays out a clear deadline and direction.",
      "논의가 길어질 때 핵심 목표로 대화를 수렴시키고 마감과 방향을 명확히 제시합니다.",
    );
    primaryRole = "conclusion_puller";
  } else if (structureVal >= 60 || deliberateVal >= 60) {
    shortMeetingLabel = pick(locale, "Checks for what's missing", "빠진 조건을 확인하는 편");
    meetingDesc = pick(
      locale,
      "Before anything moves forward, carefully checks for gaps, risks, or missing requirements.",
      "실행에 앞서 빠진 조항이나 위험 요소, 필요 조건이 완비되었는지 정밀히 점검합니다.",
    );
    primaryRole = "condition_checker";
  } else if (extEnergyVal >= 60) {
    shortMeetingLabel = pick(locale, "Throws out a range of options", "다양한 대안을 제안하는 편");
    meetingDesc = pick(
      locale,
      "Isn't tied to the usual way of doing things — freely brings new angles and ideas worth expanding on.",
      "기존 방식에 갇히지 않고 새로운 관점과 확장 가능한 아이디어를 자유롭게 펼칩니다.",
    );
    primaryRole = "possibility_expander";
  } else {
    shortMeetingLabel = pick(locale, "Tests the core assumptions", "핵심 가정을 점검하는 편");
    meetingDesc = pick(
      locale,
      "Quietly checks whether the underlying assumptions actually hold up and serve the real goal.",
      "전제 조건의 타당성을 짚고 근본적인 목표에 부합하는지 조용히 검증합니다.",
    );
    primaryRole = "assumption_challenger";
  }

  // 3. Reporting & Information Sharing Style
  const practicalityVal = axes?.practicality ?? 50;
  const reportingDimensions: Array<{ label: string; pattern: string }> = [];
  const leadsWithConclusion = deliberateVal <= 45 || practicalityVal >= 60;
  const includesDetail = structureVal >= 60;

  reportingDimensions.push({
    label: pick(locale, "Delivery order", "전달 순서"),
    pattern: leadsWithConclusion
      ? pick(locale, "Leads with the conclusion", "결론부터 두괄식 보고")
      : pick(locale, "Explains the background first", "배경 맥락부터 설명"),
  });

  reportingDimensions.push({
    label: pick(locale, "Level of detail", "정보 깊이"),
    pattern: includesDetail
      ? pick(locale, "Includes the reasoning and the details", "근거 및 세부 과정 포함")
      : pick(locale, "Sticks to a high-level summary", "핵심 요약 위주 노출"),
  });

  const reportingSummary = pick(
    locale,
    `${name} tends to ${leadsWithConclusion ? "lead with the conclusion" : "start with the background context"} and ${includesDetail ? "include the reasoning behind it" : "keep it to a high-level summary"}.`,
    `${name}님은 ${reportingDimensions.map((d) => d.pattern).join(" 및 ")}를 선호하는 전달 스타일에 해당합니다.`,
  );

  // 4. Feedback Reception Style
  const empathyVal = axes?.empathy ?? 50;
  const recognitionVal = axes?.recognition ?? 50;

  let easyConditionTitle = "";
  let easyConditionExplanation = "";
  let hardConditionTitle = "";
  let hardConditionExplanation = "";

  if (structureVal >= 60 || deliberateVal >= 60) {
    easyConditionTitle = pick(locale, "When there's clear evidence and a clear reason for the change", "객관적 근거와 개선 이유가 명확할 때");
    easyConditionExplanation = pick(
      locale,
      "Takes feedback well when it comes with concrete facts and a clear standard, not just an emotional judgment call.",
      "감정적 평가 대신 구체적 사실 데이터와 명확한 수용 기준이 제시되면 수용도가 높아집니다.",
    );
    hardConditionTitle = pick(locale, "Vague criticism with no context", "맥락 없는 모호한 지적");
    hardConditionExplanation = pick(
      locale,
      `Struggles to accept feedback that's just pressure or "should" statements with no real reasoning behind it.`,
      "근거 없이 당위성이나 조급함만 강요받으면 받아들이기 힘들어합니다.",
    );
  } else if (empathyVal >= 60 || recognitionVal >= 60) {
    easyConditionTitle = pick(locale, "When the effort is acknowledged and the ask is framed clearly", "노고에 대한 인정과 기대 역할이 전달될 때");
    easyConditionExplanation = pick(
      locale,
      "Comes around quickly when you first acknowledge what they tried, then frame the feedback as a suggestion.",
      "시도와 성과에 대한 존중을 먼저 표현한 뒤 제안 형식으로 전달할 때 빠르게 수용합니다.",
    );
    hardConditionTitle = pick(locale, "Being called out publicly or an emotional tone", "공개적인 문책이나 감정적 표현");
    hardConditionExplanation = pick(
      locale,
      "Can go on the defensive if it feels like their pride is being hurt in front of others or it's all blame, no support.",
      "타인 앞에서 자존감을 상하게 하거나 책임만 추궁하면 방어 모드로 전환될 수 있습니다.",
    );
  } else {
    easyConditionTitle = pick(locale, "When the problem comes with a concrete alternative", "핵심 문제와 구체적 대안이 함께 올 때");
    easyConditionExplanation = pick(
      locale,
      "Welcomes feedback that includes an actual solution for wherever things got stuck.",
      "막힌 구간에 대한 구체적인 솔루션 가이드가 포함된 피드백을 환영합니다.",
    );
    hardConditionTitle = pick(locale, "The same feedback repeated with no direction", "방향 없는 반복 피드백");
    hardConditionExplanation = pick(
      locale,
      "Gets worn down by hearing the same problem flagged again and again with no alternative offered.",
      "대안 없이 문제점만 반복 언급되면 피로감을 느낍니다.",
    );
  }

  // 5. Decision Criteria
  const decisionCriteria: Array<{ title: string; question: string }> = [];

  if (deliberateVal <= 45) {
    decisionCriteria.push({
      title: pick(locale, "Speed", "실행 속도"),
      question: pick(locale, "Can we start now and seize the opportunity?", "지금 즉시 착수하여 기회를 잡을 수 있는가?"),
    });
  } else {
    decisionCriteria.push({
      title: pick(locale, "Stability and how thoroughly it's been reviewed", "안정성과 검토 수준"),
      question: pick(locale, "Have we checked the risks thoroughly enough and set clear guardrails?", "충분한 리스크 검증과 가이드라인이 서 있는가?"),
    });
  }

  if (practicalityVal >= 55) {
    decisionCriteria.push({
      title: pick(locale, "Real, practical results", "실질적 결과물"),
      question: pick(locale, "Is the payoff clearly worth what we're putting in?", "투입 대비 실질적인 성과와 효율이 확실한가?"),
    });
  } else {
    decisionCriteria.push({
      title: pick(locale, "Polish and meeting the bar", "완성도 및 기준 충족"),
      question: pick(locale, "Does this meet the team's and the product's quality standard?", "팀과 서비스의 품질 기준에 부합하는가?"),
    });
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
  const { nameA, nameB, sajuChartA, sajuChartB, workSignalsA, workSignalsB, psychA, psychB, locale = LEGACY_FALLBACK_LOCALE } = params;

  const personA = buildIndividualCommunicationProfile({
    name: nameA,
    partnerName: nameB,
    sajuChart: sajuChartA,
    workSignals: workSignalsA,
    psych: psychA,
    locale,
  });

  const personB = buildIndividualCommunicationProfile({
    name: nameB,
    partnerName: nameA,
    sajuChart: sajuChartB,
    workSignals: workSignalsB,
    psych: psychB,
    locale,
  });

  // Section 1 Pair Think Mode Synthesis
  const thinkModePairSynthesis = {
    title: pick(locale, "When you two get on the same page", "둘이 생각을 맞출 때"),
    summary: pick(
      locale,
      `${nameA}, who ${personA.thinkMode.shortLabel.toLowerCase()}, and ${nameB}, who ${personB.thinkMode.shortLabel.toLowerCase()}, need to find a shared pace for conversation. It helps to share the agenda ahead of time, so one of you can float ideas while the other has room to think it through.`,
      `${nameA}님의 ${personA.thinkMode.shortLabel}와 ${nameB}님의 ${personB.thinkMode.shortLabel}가 만나 대화의 템포 조율이 필요합니다. 한쪽의 발상 제안 후 다른 한쪽이 정리할 수 있는 사전 안건 공유 시간이 도움이 됩니다.`,
    ),
  };

  // Section 2 Pair Meeting Manifestation
  const meetingStylePairManifestation = {
    title: pick(locale, "In an actual meeting", "실제 회의에서는"),
    summary: pick(
      locale,
      `In a meeting, ${nameA} tends to be the one who ${personA.meetingStyle.shortLabel.toLowerCase()}, while ${nameB} tends to be the one who ${personB.meetingStyle.shortLabel.toLowerCase()}. When one of you pushes the pace, the other holds the line on conditions and quality — together that balances speed with follow-through.`,
      `회의 중 ${nameA}님이 ${personA.meetingStyle.shortLabel} 역할을 할 때, ${nameB}님은 ${personB.meetingStyle.shortLabel} 역할을 수행하게 됩니다. 한쪽이 추진 속도를 내면 다른 한쪽이 조건과 품질을 챙겨 속도와 완성도의 균형을 맞춥니다.`,
    ),
  };

  // Section 3 Reporting Mismatch Note
  const reportingMismatchNote = {
    title: pick(locale, "What's easy to miss between you two", "둘 사이에서 놓치기 쉬운 것"),
    summary: pick(
      locale,
      `One of you may feel like the key point's already been shared once the conclusion's out, while the other feels like the background and the details behind it are still missing.`,
      `한쪽은 결론 위주로 이미 핵심을 공유했다고 판단하지만, 다른 쪽은 공유된 정보의 배경 근거나 세부 과정이 빠졌다고 느낄 수 있습니다.`,
    ),
  };

  // Section 4 Feedback Pair Insight
  const feedbackPairInsight = {
    title: pick(locale, "Where feedback can get lost in translation between you", "서로 피드백할 때 생길 수 있는 오해"),
    summary: pick(
      locale,
      `${nameA} takes feedback best ${personA.feedbackStyle.easyConditionTitle.toLowerCase()}, while for ${nameB} what matters most is ${personB.feedbackStyle.easyConditionTitle.toLowerCase()}. Shaping how you deliver feedback around what actually lands for the other person cuts down on unintended friction.`,
      `${nameA}님은 ${personA.feedbackStyle.easyConditionTitle}를 바라는 반면, ${nameB}님은 ${personB.feedbackStyle.easyConditionTitle}가 중요합니다. 상대의 수용 기준을 고려하여 전달 형식을 다듬으면 의도치 않은 오해를 줄일 수 있습니다.`,
    ),
  };

  // Section 5 Decision Tension
  const fallbackCriterionEn = pick(locale, "speed of execution", "실행력");
  const fallbackCriterionBEn = pick(locale, "a clear review standard", "검토 기준");
  const decisionTension = {
    title: pick(locale, "So when you disagree", "그래서 의견이 갈리면"),
    summary: pick(
      locale,
      `When opinions clash, ${nameA} tends to prioritize ${personA.decisionCriteria[0]?.title || fallbackCriterionEn}, while ${nameB} wants to check ${personB.decisionCriteria[0]?.title || fallbackCriterionBEn} first. The most effective approach is to let the urgency and stakes of the actual issue decide which standard takes priority.`,
      `의견이 마찰할 때 ${nameA}님은 ${personA.decisionCriteria[0]?.title || "실행력"}을 우선시하고, ${nameB}님은 ${personB.decisionCriteria[0]?.title || "검토 기준"}을 확인하려 합니다. 두 기준 중 안건의 시급성과 중요도에 따라 우선순위를 결정하는 것이 효과적입니다.`,
    ),
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
      decisionTypeTitle: pick(locale, "Fast-execution tasks", "빠른 실행 과제 (Fast Execution)"),
      primaryOwner: executionLeadName,
      inputRole: pick(locale, `${qualityLeadName}'s risk check`, `${qualityLeadName}의 리스크 점검`),
      closureGuide: pick(
        locale,
        `${executionLeadName} makes the call to move forward, and it's locked in as soon as it clears ${qualityLeadName}'s check for any critical risk.`,
        `${executionLeadName}님이 추진 결정을 내리되, ${qualityLeadName}님의 치명적 리스크 체크만 통과하면 즉시 확정합니다.`,
      ),
    },
    {
      decisionTypeTitle: pick(locale, "Quality & risk-review tasks", "품질 · 리스크 검토 과제 (Quality & Risk)"),
      primaryOwner: qualityLeadName,
      inputRole: pick(locale, `${executionLeadName}'s execution timeline`, `${executionLeadName}의 실행 타임라인`),
      closureGuide: pick(
        locale,
        `${qualityLeadName} checks whether it meets the quality bar and gives final sign-off.`,
        `${qualityLeadName}님이 품질과 기준 충족 여부를 확인하여 최종 승인합니다.`,
      ),
    },
    {
      decisionTypeTitle: pick(locale, "Strategy & scope decisions", "사업 방향 및 스코프 확정 (Strategy & Scope)"),
      primaryOwner: directionLeadName,
      inputRole: pick(locale, "Joint discussion", "상호 협의"),
      closureGuide: pick(
        locale,
        `${directionLeadName} sets the overall priorities and scope and closes out the final call.`,
        `${directionLeadName}님이 전체 우선순위와 범위를 조율하고 최종 의사결정을 클로징합니다.`,
      ),
    },
  ];

  // Section 7 Pair Communication Rhythm Sequence
  const communicationRhythmSteps: PairCommunicationRhythmStep[] = [
    {
      phase: "BEFORE",
      phaseTitle: pick(locale, "Share ahead of time", "사전 공유"),
      actionText: pick(
        locale,
        "An hour before an important meeting, share the key agenda and goal in writing.",
        "중요 미팅 1시간 전 핵심 안건과 목표를 텍스트로 미리 공유합니다.",
      ),
    },
    {
      phase: "DISCUSS",
      phaseTitle: pick(locale, "Talk it through", "의견 교환"),
      actionText: pick(
        locale,
        "Use the conversation to open up the options, then narrow it down to 2-3 real choices.",
        "대화로 아이디어 옵션을 넓히고 핵심 선택지 2~3개로 범위를 압축합니다.",
      ),
    },
    {
      phase: "CHECK",
      phaseTitle: pick(locale, "Check the conditions", "조건 확인"),
      actionText: pick(
        locale,
        "Do a final check for any missing requirements or risks before moving forward.",
        "실행에 빠진 조항이나 위험 요소가 없는지 최종 리스크 팩트를 검토합니다.",
      ),
    },
    {
      phase: "DECIDE",
      phaseTitle: pick(locale, "Confirm the owner", "Owner 확정"),
      actionText: pick(
        locale,
        "The person who owns this closes out the decision and locks in the next timeline.",
        "정해진 담당 R&R Owner가 최종 결론을 짓고 다음 실행 타임라인을 확정합니다.",
      ),
    },
  ];

  return {
    subtitle: pick(locale, "From how you think things through, to meetings, reporting, feedback, and the final call", "생각을 정리하는 방식부터 회의, 보고, 피드백, 최종 결정까지"),
    introSummary: pick(
      locale,
      "The order you each move through a problem — forming an opinion, talking it out, sharing information, making the final call — can look different. Here's how your communication and decision-making rhythms compare.",
      "두 사람은 문제를 인식하고 해결하는 시순서(의견 구상, 대화 방식, 정보 공유, 최종 의사결정)가 서로 다를 수 있습니다. 두 사람의 소통과 판단 리듬을 분석합니다.",
    ),
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
