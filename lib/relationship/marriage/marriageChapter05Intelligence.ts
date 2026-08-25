import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";

export type CapabilityActor = "A_DOMINANT" | "B_DOMINANT" | "SHARED_STRENGTH" | "SHARED_GAP" | "ROLE_VACUUM" | "COMPLEMENTARY";

export type CapabilityPairAnalysis = {
  capabilityKey: "PLAN" | "DECIDE" | "EXECUTE" | "MAINTAIN" | "CHECK" | "ADAPT";
  capabilityLabel: string;
  leadName: string;
  actor: CapabilityActor;
  narrative: string;
};

export type CoupleOperatingSystemSection = {
  title: string;
  teamTypeTitle: string;
  capabilities: CapabilityPairAnalysis[];
  pairInsight: string;
};

export type MoneyBehaviorSection = {
  title: string;
  importantValueA: string;
  spendingStyleA: string;
  savingStyleA: string;
  importantValueB: string;
  spendingStyleB: string;
  savingStyleB: string;
  togetherInsight: string;
  underPressureInsight?: string;
};

export type WealthBuildingStyleSection = {
  title: string;
  baseStyleA: string;
  opportunityStyleA: string;
  naturalDirectionA: string;
  cautionPatternA: string;
  baseStyleB: string;
  opportunityStyleB: string;
  naturalDirectionB: string;
  cautionPatternB: string;
  pairSynergyInsight: string;
};

export type MoneyDecisionStepKey = "FIND" | "TRACK" | "CHECK" | "ACT" | "REVIEW";

export type MoneyDecisionStep = {
  stepKey: MoneyDecisionStepKey;
  stepLabel: string;
  actorName: string;
  confidence: "HIGH" | "MODERATE" | "LOW";
};

export type MajorMoneyDecisionsSection = {
  title: string;
  steps: MoneyDecisionStep[];
  oneLineSynthesis: string;
};

export type FinancialOperationSection = {
  title: string;
  flowTracker: string;
  billsAndDocs: string;
  largeExpenseCheck: string;
  operationStyle: string;
  operationInsight: string;
  boundaryInsight?: string;
};

export type LifeCompetenceProfile = {
  notice: string;
  plan: string;
  do: string;
  maintain: string;
  recover: string;
};

export type PracticalLifeCompetenceSection = {
  title: string;
  profileA: LifeCompetenceProfile;
  profileB: LifeCompetenceProfile;
  pairSynergyInsight: string;
};

export type HouseholdMapEnding = {
  title: string;
  moneyBehaviorSummary: string;
  wealthStyleSummary: string;
  bigMoneyDecisionSummary: string;
  lifeCompetenceSummary: string;
};

export type MarriageChapter05Intelligence = {
  introQuestion: string;
  coupleOperatingSystem: CoupleOperatingSystemSection; // 01
  moneyBehavior: MoneyBehaviorSection; // 02
  wealthBuildingStyle: WealthBuildingStyleSection; // 03
  majorMoneyDecisions: MajorMoneyDecisionsSection; // 04
  financialOperation: FinancialOperationSection; // 05
  practicalLifeCompetence: PracticalLifeCompetenceSection; // 06
  householdMapEnding: HouseholdMapEnding; // ENDING
};

export function buildMarriageChapter05Intelligence(params: {
  ctx: MarriageRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): MarriageChapter05Intelligence {
  const { ctx, psychA, psychB, locale = "ko-KR" } = params;
  const isEn = locale === "en-US";
  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const countsA = ctx.tenGod?.countsA ?? {};
  const countsB = ctx.tenGod?.countsB ?? {};
  const axesA = psychA?.secondary_axes ?? {};
  const axesB = psychB?.secondary_axes ?? {};

  // ---------------------------------------------------------------------------
  // 01. COUPLE_OPERATING_SYSTEM
  // ---------------------------------------------------------------------------
  const planA = (countsA["인성"] ?? 0) * 1.5 + (countsA["관성"] ?? 0) + ((axesA.structure ?? 50) > 60 ? 2 : 0);
  const planB = (countsB["인성"] ?? 0) * 1.5 + (countsB["관성"] ?? 0) + ((axesB.structure ?? 50) > 60 ? 2 : 0);

  const decA = (countsA["비겁"] ?? 0) * 1.5 + (countsA["식상"] ?? 0) + ((axesA.decision_style ?? 50) > 60 ? 2 : 0);
  const decB = (countsB["비겁"] ?? 0) * 1.5 + (countsB["식상"] ?? 0) + ((axesB.decision_style ?? 50) > 60 ? 2 : 0);

  const execA = (countsA["식상"] ?? 0) * 1.5 + (countsA["비겁"] ?? 0) + ((axesA.energy_style ?? 50) > 60 ? 2 : 0);
  const execB = (countsB["식상"] ?? 0) * 1.5 + (countsB["비겁"] ?? 0) + ((axesB.energy_style ?? 50) > 60 ? 2 : 0);

  const maintA = (countsA["관성"] ?? 0) * 1.5 + (countsA["재성"] ?? 0) + ((axesA.self_control ?? 50) > 60 ? 2 : 0);
  const maintB = (countsB["관성"] ?? 0) * 1.5 + (countsB["재성"] ?? 0) + ((axesB.self_control ?? 50) > 60 ? 2 : 0);

  const checkA = (countsA["인성"] ?? 0) + (countsA["재성"] ?? 0) + ((axesA.practicality ?? 50) > 60 ? 2 : 0);
  const checkB = (countsB["인성"] ?? 0) + (countsB["재성"] ?? 0) + ((axesB.practicality ?? 50) > 60 ? 2 : 0);

  const adaptA = (countsA["식상"] ?? 0) + ((axesA.adaptability ?? 50) > 60 ? 2 : 0);
  const adaptB = (countsB["식상"] ?? 0) + ((axesB.adaptability ?? 50) > 60 ? 2 : 0);

  const resolveActor = (scoreA: number, scoreB: number): { leadName: string; actor: CapabilityActor } => {
    const diff = scoreA - scoreB;
    if (diff >= 1.5) return { leadName: `${nameA} 중심`, actor: "A_DOMINANT" };
    if (diff <= -1.5) return { leadName: `${nameB} 중심`, actor: "B_DOMINANT" };
    if (scoreA >= 3 && scoreB >= 3) return { leadName: "둘 다 강점", actor: "SHARED_STRENGTH" };
    if (scoreA < 2 && scoreB < 2) return { leadName: "서로 미루기 쉬움", actor: "ROLE_VACUUM" };
    return { leadName: "자연스러운 협력", actor: "COMPLEMENTARY" };
  };

  const planActor = resolveActor(planA, planB);
  const decActor = resolveActor(decA, decB);
  const execActor = resolveActor(execA, execB);
  const maintActor = resolveActor(maintA, maintB);
  const checkActor = resolveActor(checkA, checkB);
  const adaptActor = resolveActor(adaptA, adaptB);

  const capabilities: CapabilityPairAnalysis[] = [
    {
      capabilityKey: "PLAN",
      capabilityLabel: "방향 잡기",
      leadName: planActor.leadName,
      actor: planActor.actor,
      narrative: planActor.actor === "A_DOMINANT"
        ? `${nameA}님이 목표와 전체 틀을 먼저 구상하는 편입니다.`
        : planActor.actor === "B_DOMINANT"
        ? `${nameB}님이 전체 방향과 우선순위를 먼저 가다듬는 편입니다.`
        : "두 사람 모두 전체적인 목표를 함께 고민하고 방향을 잡는 흐름을 보입니다.",
    },
    {
      capabilityKey: "DECIDE",
      capabilityLabel: "결정 내리기",
      leadName: decActor.leadName,
      actor: decActor.actor,
      narrative: decActor.actor === "A_DOMINANT"
        ? `${nameA}님이 선택의 순간에 주도적으로 결론을 이끌어냅니다.`
        : decActor.actor === "B_DOMINANT"
        ? `${nameB}님이 선택의 순간에 중심을 잡고 판단을 내립니다.`
        : "중요한 판단 순간에 두 사람이 활발히 의견을 주고받으며 결론을 냅니다.",
    },
    {
      capabilityKey: "EXECUTE",
      capabilityLabel: "실행하기",
      leadName: execActor.leadName,
      actor: execActor.actor,
      narrative: execActor.actor === "A_DOMINANT"
        ? `${nameA}님이 결정을 실제 행동으로 빠르게 옮기는 추진력이 강합니다.`
        : execActor.actor === "B_DOMINANT"
        ? `${nameB}님이 필요한 실무와 행동을 지체 없이 기함해냅니다.`
        : "필요한 일 앞에서 두 사람이 속도감 있게 같이 움직이는 조화를 이룹니다.",
    },
    {
      capabilityKey: "MAINTAIN",
      capabilityLabel: "꾸준히 챙기기",
      leadName: maintActor.leadName,
      actor: maintActor.actor,
      narrative: maintActor.actor === "A_DOMINANT"
        ? `${nameA}님이 정해진 루틴과 규칙을 변함없이 지켜내는 힘이 큽니다.`
        : maintActor.actor === "B_DOMINANT"
        ? `${nameB}님이 정기적인 지출과 집안의 일상을 꾸준히 챙기는 중심축입니다.`
        : "반복적인 일상과 루틴을 서로 부담 없이 이어서 관리하는 조합입니다.",
    },
    {
      capabilityKey: "CHECK",
      capabilityLabel: "다시 점검하기",
      leadName: checkActor.leadName,
      actor: checkActor.actor,
      narrative: checkActor.actor === "A_DOMINANT"
        ? `${nameA}님이 현실적인 리스크나 빠진 숫자를 한 번 더 짚어냅니다.`
        : checkActor.actor === "B_DOMINANT"
        ? `${nameB}님이 세부 내역과 꼼꼼한 지출 숫자를 꼼꼼히 재확인합니다.`
        : "두 사람 모두 꼼꼼히 짚어보는 감각이 있어 돌발 지출을 사전에 예방합니다.",
    },
    {
      capabilityKey: "ADAPT",
      capabilityLabel: "돌발 상황 수습",
      leadName: adaptActor.leadName,
      actor: adaptActor.actor,
      narrative: adaptActor.actor === "A_DOMINANT"
        ? `${nameA}님이 예기치 못한 상황에서 순발력 있게 대안을 찾습니다.`
        : adaptActor.actor === "B_DOMINANT"
        ? `${nameB}님이 변수가 생겼을 때 당황하지 않고 수습의 물꼬를 틉니다.`
        : "예상치 못한 변수가 터져도 두 사람이 유연하게 대처하며 기준을 맞춰갑니다.",
    },
  ];

  let teamType = "역할 분담형 시너지";
  if (planActor.actor === "A_DOMINANT" && execActor.actor === "B_DOMINANT") {
    teamType = `${nameA} 기획 × ${nameB} 실행 보완형`;
  } else if (planActor.actor === "B_DOMINANT" && execActor.actor === "A_DOMINANT") {
    teamType = `${nameB} 기획 × ${nameA} 실행 보완형`;
  } else if (planActor.actor === "SHARED_STRENGTH" || execActor.actor === "SHARED_STRENGTH") {
    teamType = "동반 주도형 패밀리";
  }

  const coupleOperatingSystem: CoupleOperatingSystemSection = {
    title: isEn ? "01. Household Operating System" : "01. 우리 집은 누가 어떻게 굴릴까?",
    teamTypeTitle: teamType,
    capabilities,
    pairInsight: `${nameA}님과 ${nameB}님은 한 사람이 독단적으로 끌어가기보다, 각자의 강점이 발휘되는 업무에서自然스러운 주도권을 번갈아 주고받는 운영 방식을 보입니다.`,
  };

  // ---------------------------------------------------------------------------
  // 02. MONEY_BEHAVIOR
  // ---------------------------------------------------------------------------
  const secA = (countsA["정재"] ?? 0) > 0 || (axesA.stability ?? 50) > 60;
  const expA = (countsA["편재"] ?? 0) > 0 || (axesA.stimulation ?? 50) > 60;
  const secB = (countsB["정재"] ?? 0) > 0 || (axesB.stability ?? 50) > 60;
  const expB = (countsB["편재"] ?? 0) > 0 || (axesB.stimulation ?? 50) > 60;

  const moneyBehavior: MoneyBehaviorSection = {
    title: isEn ? "02. Money Behavior" : "02. 우리는 어떻게 쓰고, 어떻게 모을까?",
    importantValueA: secA ? "안정된 미래 기반" : expA ? "현재 삶의 경험과 질" : "자유로운 가치 실현",
    spendingStyleA: expA ? "경험과 성장에 주저 없이 투입" : "계획된 예산 범위 안에서 지출",
    savingStyleA: secA ? "목표액을 정해두고 우선 저축" : "여유 자금이 생길 때 꾸준히 누적",
    importantValueB: secB ? "안정된 미래 기반" : expB ? "현재 삶의 경험과 질" : "자유로운 가치 실현",
    spendingStyleB: expB ? "경험과 성장에 주저 없이 투입" : "계획된 예산 범위 안에서 지출",
    savingStyleB: secB ? "목표액을 정해두고 우선 저축" : "여유 자금이 생길 때 꾸준히 누적",
    togetherInsight: secA === secB
      ? "두 사람 모두 돈의 의미와 지출의 기준이 비슷하여 소비로 인한 불필요한 마찰이 적은 편입니다."
      : "한 쪽은 안정을, 한 쪽은 경험을 우선시하므로 예산을 '미래 자산'과 '오늘의 즐거움'으로 분리하여 운용하는 것이 좋습니다.",
    underPressureInsight: (axesA.resilience !== undefined && axesB.resilience !== undefined)
      ? "여유 자금이 줄어들면 두 사람은 무작정 소비를 끊기보다 고정 지출 항목부터 차분히 재정비하는 성향을 보입니다."
      : undefined,
  };

  // ---------------------------------------------------------------------------
  // 03. WEALTH_BUILDING_STYLE
  // ---------------------------------------------------------------------------
  const riskA = (axesA.growth ?? 50) > 60 || (countsA["편재"] ?? 0) > 0;
  const riskB = (axesB.growth ?? 50) > 60 || (countsB["편재"] ?? 0) > 0;

  const wealthBuildingStyle: WealthBuildingStyleSection = {
    title: isEn ? "03. Wealth Building Style" : "03. 우리 돈은 어떤 방식으로 키우는 게 잘 맞을까?",
    baseStyleA: riskA ? "원금 보존보다 인플레이션 방어와 자산 확장 지향" : "시장의 변동성보다 확실하고 안정적인 자산 축적 선호",
    opportunityStyleA: riskA ? "유망한 성장 가능성에 신중하게 접근" : "충분히 검증된 안전 자산에 집중",
    naturalDirectionA: riskA ? "장기 분산 적립 및 성장 자산 운용" : "자동 장기 축적 및 원금 보존형 자산",
    cautionPatternA: riskA ? "단기 변동성에 과도하게 민감해지는 것 조심" : "과도하게 보수적인 자금 동결 조심",
    baseStyleB: riskB ? "원금 보존보다 인플레이션 방어와 자산 확장 지향" : "시장의 변동성보다 확실하고 안정적인 자산 축적 선호",
    opportunityStyleB: riskB ? "유망한 성장 가능성에 신중하게 접근" : "충분히 검증된 안전 자산에 집중",
    naturalDirectionB: riskB ? "장기 분산 적립 및 성장 자산 운용" : "자동 장기 축적 및 원금 보존형 자산",
    cautionPatternB: riskB ? "단기 변동성에 과도하게 민감해지는 것 조심" : "과도하게 보수적인 자금 동결 조심",
    pairSynergyInsight: riskA !== riskB
      ? `${nameA}님과 ${nameB}님은 한 사람의 확장 욕구와 다른 한 사람의 리스크 제어 감각이 조화를 이루어 밸런스 있는 자산 형성이 가능합니다.`
      : "두 사람의 자산 관리 가치관이 일치하여 시너지 효과를 내기 쉽지만, 리스크 검토 과정을 정례화하는 것이 안전합니다.",
  };

  // ---------------------------------------------------------------------------
  // 04. MAJOR_MONEY_DECISIONS (Money & Investment Decision Lifecycle)
  // ---------------------------------------------------------------------------
  const findA = (countsA["식상"] ?? 0) * 1.5 + (countsA["비겁"] ?? 0) + ((axesA.growth ?? 50) > 55 ? 1.5 : 0) + ((axesA.stimulation ?? 50) > 55 ? 1 : 0);
  const findB = (countsB["식상"] ?? 0) * 1.5 + (countsB["비겁"] ?? 0) + ((axesB.growth ?? 50) > 55 ? 1.5 : 0) + ((axesB.stimulation ?? 50) > 55 ? 1 : 0);

  const trackA = (countsA["관성"] ?? 0) + (countsA["인성"] ?? 0) + (countsA["재성"] ?? 0) + ((axesA.self_control ?? 50) > 55 ? 1.5 : 0) + ((axesA.structure ?? 50) > 55 ? 1.5 : 0);
  const trackB = (countsB["관성"] ?? 0) + (countsB["인성"] ?? 0) + (countsB["재성"] ?? 0) + ((axesB.self_control ?? 50) > 55 ? 1.5 : 0) + ((axesB.structure ?? 50) > 55 ? 1.5 : 0);

  const chkA = (countsA["인성"] ?? 0) * 1.5 + (countsA["관성"] ?? 0) + (countsA["재성"] ?? 0) + ((axesA.practicality ?? 50) > 55 ? 2 : 0) + ((axesA.thinking_style ?? 50) > 55 ? 1 : 0);
  const chkB = (countsB["인성"] ?? 0) * 1.5 + (countsB["관성"] ?? 0) + (countsB["재성"] ?? 0) + ((axesB.practicality ?? 50) > 55 ? 2 : 0) + ((axesB.thinking_style ?? 50) > 55 ? 1 : 0);

  const actA = (countsA["식상"] ?? 0) + (countsA["비겁"] ?? 0) * 1.5 + (countsA["재성"] ?? 0) + ((axesA.decision_style ?? 50) > 55 ? 1.5 : 0) + ((axesA.energy_style ?? 50) > 55 ? 1.5 : 0);
  const actB = (countsB["식상"] ?? 0) + (countsB["비겁"] ?? 0) * 1.5 + (countsB["재성"] ?? 0) + ((axesB.decision_style ?? 50) > 55 ? 1.5 : 0) + ((axesB.energy_style ?? 50) > 55 ? 1.5 : 0);

  const reviewA = (countsA["인성"] ?? 0) + (countsA["관성"] ?? 0) * 1.5 + ((axesA.structure ?? 50) > 55 ? 1.5 : 0) + ((axesA.resilience ?? 50) > 55 ? 1 : 0);
  const reviewB = (countsB["인성"] ?? 0) + (countsB["관성"] ?? 0) * 1.5 + ((axesB.structure ?? 50) > 55 ? 1.5 : 0) + ((axesB.resilience ?? 50) > 55 ? 1 : 0);

  const resolveStepActor = (scoreA: number, scoreB: number): string => {
    const diff = scoreA - scoreB;
    if (diff >= 1.2) return nameA;
    if (diff <= -1.2) return nameB;
    return "둘 다";
  };

  const steps: MoneyDecisionStep[] = [
    { stepKey: "FIND", stepLabel: "기회 찾기", actorName: resolveStepActor(findA, findB), confidence: "HIGH" },
    { stepKey: "TRACK", stepLabel: "계속 지켜보기", actorName: resolveStepActor(trackA, trackB), confidence: "HIGH" },
    { stepKey: "CHECK", stepLabel: "숫자·위험 확인", actorName: resolveStepActor(chkA, chkB), confidence: "HIGH" },
    { stepKey: "ACT", stepLabel: "실제 실행", actorName: resolveStepActor(actA, actB), confidence: "HIGH" },
    { stepKey: "REVIEW", stepLabel: "마지막 점검", actorName: resolveStepActor(reviewA, reviewB), confidence: "HIGH" },
  ];

  const finder = steps[0].actorName;
  const checker = steps[2].actorName;
  const doer = steps[3].actorName;

  const fmtName = (name: string) => (name === "둘 다" ? "두 사람" : `${name}님`);

  let oneLineSynthesis = "";
  if (finder === doer && finder !== "둘 다" && checker !== finder && checker !== "둘 다") {
    oneLineSynthesis = `${fmtName(finder)}이 기회를 열고 실제 행동으로 옮기면, ${fmtName(checker)}이 그 기회를 계속 추적하며 숫자와 위험을 확인하는 흐름에 가깝습니다.`;
  } else if (finder !== doer && finder !== "둘 다" && doer !== "둘 다") {
    oneLineSynthesis = `${fmtName(finder)}이 새로운 투자 기회를 탐색하고 ${fmtName(checker)}이 숫자와 조건을 검토한 뒤, 최종 실행은 ${fmtName(doer)}이 밀어주는 워크플로우를 보입니다.`;
  } else if (finder === "둘 다" || doer === "둘 다") {
    oneLineSynthesis = `두 사람 모두 기회를 찾고 실행하는 추진력은 활발하지만, 사전 숫자·위험 점검 단계를 정례화하는 것이 안전합니다.`;
  } else {
    oneLineSynthesis = `${fmtName(finder)}이 기회를 포착하면 ${fmtName(checker)}이 리스크와 숫자를 다각도로 검토한 후 함께 결정을 완성해가는 흐름입니다.`;
  }

  const majorMoneyDecisions: MajorMoneyDecisionsSection = {
    title: isEn ? "04. Major Money & Investment Decisions" : "04. 큰돈과 투자 기회 앞에서 우리는 어떻게 움직일까?",
    steps,
    oneLineSynthesis,
  };

  // ---------------------------------------------------------------------------
  // 05. FINANCIAL_OPERATION
  // ---------------------------------------------------------------------------
  const opScoreA = (countsA["재성"] ?? 0) + (countsA["관성"] ?? 0) + ((axesA.structure ?? 50) > 55 ? 2 : 0);
  const opScoreB = (countsB["재성"] ?? 0) + (countsB["관성"] ?? 0) + ((axesB.structure ?? 50) > 55 ? 2 : 0);

  let opStyle = "역할 분담 및 공동 관리";
  let opLeadA = `${nameA} (현금 흐름)`;
  let opLeadB = `${nameB} (고정비·서류)`;

  if (opScoreA - opScoreB >= 2.5) {
    opStyle = `${nameA} 주도 총괄 관리`;
    opLeadA = `${nameA} (전반적 집행)`;
    opLeadB = `${nameB} (상호 공유)`;
  } else if (opScoreB - opScoreA >= 2.5) {
    opStyle = `${nameB} 주도 총괄 관리`;
    opLeadA = `${nameA} (상호 공유)`;
    opLeadB = `${nameB} (전반적 집행)`;
  }

  const financialOperation: FinancialOperationSection = {
    title: isEn ? "05. Financial Operation" : "05. 평소 돈 관리는 누가 더 자연스러울까?",
    flowTracker: opLeadA,
    billsAndDocs: opLeadB,
    largeExpenseCheck: "둘 다 공동 확인",
    operationStyle: opStyle,
    operationInsight: "매월 고정 지출과 통장 흐름은 담당자를 명확히 두고, 정기적인 자산 현황 브리핑을 통해 투명성을 유지할 때 가장 잡음이 없습니다.",
    boundaryInsight: (axesA.autonomy !== undefined && axesB.autonomy !== undefined)
      ? "공동 생활비 계좌와 각자의 개인 용돈 계좌를 구별하여 운영할 때 정서적 자율성과 가계의 안정성이 동시에 확보됩니다."
      : undefined,
  };

  // ---------------------------------------------------------------------------
  // 06. PRACTICAL_LIFE_COMPETENCE
  // ---------------------------------------------------------------------------
  const profA: LifeCompetenceProfile = {
    notice: (axesA.structure ?? 50) > 60 ? "집안의 필요한 일이나 정리가 필요한 부분을 즉각 포착" : "일상의 소소한 불편함을 부담 없이 편안하게 지켜봄",
    plan: (axesA.structure ?? 50) > 60 ? "구체적인 일정과 동선을 머릿속에 미리 정리" : "상황에 맞춰 유연하고 자유롭게 움직이는 편",
    do: (axesA.energy_style ?? 50) > 60 ? "해야 할 일이 생기면 미루지 않고 빠르게 집행" : "마음의 여유를 두고 차분히 하나씩 해결",
    maintain: (axesA.self_control ?? 50) > 60 ? "정해진 가사 루틴과 생활 질서를 꾸준히 유지" : "상황에 따라 유연하게 원칙을 조율함",
    recover: (axesA.adaptability ?? 50) > 60 ? "예상치 못한 가전 고장이나 변수 발생 시 즉각 수습" : "상대와 상의하며 차분하게 대안을 탐색",
  };

  const profB: LifeCompetenceProfile = {
    notice: (axesB.structure ?? 50) > 60 ? "집안의 필요한 일이나 정리가 필요한 부분을 즉각 포착" : "일상의 소소한 불편함을 부담 없이 편안하게 지켜봄",
    plan: (axesB.structure ?? 50) > 60 ? "구체적인 일정과 동선을 머릿속에 미리 정리" : "상황에 맞춰 유연하고 자유롭게 움직이는 편",
    do: (axesB.energy_style ?? 50) > 60 ? "해야 할 일이 생기면 미루지 않고 빠르게 집행" : "마음의 여유를 두고 차분히 하나씩 해결",
    maintain: (axesB.self_control ?? 50) > 60 ? "정해진 가사 루틴과 생활 질서를 꾸준히 유지" : "상황에 따라 유연하게 원칙을 조율함",
    recover: (axesB.adaptability ?? 50) > 60 ? "예상치 못한 가전 고장이나 변수 발생 시 즉각 수습" : "상대와 상의하며 차분하게 대안을 탐색",
  };

  const practicalLifeCompetence: PracticalLifeCompetenceSection = {
    title: isEn ? "06. Practical Life Competence" : "06. 같이 살아보면 드러나는 생활력",
    profileA: profA,
    profileB: profB,
    pairSynergyInsight: `${nameA}님과 ${nameB}님은 각자 더 민감하게 반응하는 영역에서 생활력을 발휘하며, 서로의 부족한 실행력을 자연스럽게 메워주는 팀워크를 보여줍니다.`,
  };

  // ---------------------------------------------------------------------------
  // ENDING. HOUSEHOLD_MAP
  // ---------------------------------------------------------------------------
  const householdMapEnding: HouseholdMapEnding = {
    title: isEn ? "Ending. Household Summary Map" : "우리 집 운영 한눈에 보기",
    moneyBehaviorSummary: `돈의 지출과 저축 기준: ${moneyBehavior.togetherInsight}`,
    wealthStyleSummary: `자산 형성 방향: ${wealthBuildingStyle.pairSynergyInsight}`,
    bigMoneyDecisionSummary: `대형 지출 결정: ${majorMoneyDecisions.oneLineSynthesis}`,
    lifeCompetenceSummary: `일상 생활력 시너지: ${practicalLifeCompetence.pairSynergyInsight}`,
  };

  return {
    introQuestion: isEn
      ? "How do we operate daily life, money, and household responsibilities as a married team?"
      : "돈을 쓰고 모으는 것부터 집안의 보이지 않는 일까지, 우리는 현실의 삶을 어떻게 함께 굴려가는 부부일까?",
    coupleOperatingSystem,
    moneyBehavior,
    wealthBuildingStyle,
    majorMoneyDecisions,
    financialOperation,
    practicalLifeCompetence,
    householdMapEnding,
  };
}

export function createDefaultMarriageChapter05Intelligence(params: {
  nameA: string;
  nameB: string;
  locale?: Locale;
}): MarriageChapter05Intelligence {
  const { nameA, nameB, locale = "ko-KR" } = params;
  const isEn = locale === "en-US";

  return {
    introQuestion: isEn
      ? "How do we operate daily life, money, and household responsibilities as a married team?"
      : "돈을 쓰고 모으는 것부터 집안의 보이지 않는 일까지, 우리는 현실의 삶을 어떻게 함께 굴려가는 부부일까?",
    coupleOperatingSystem: {
      title: isEn ? "01. Household Operating System" : "01. 우리 집은 누가 어떻게 굴릴까?",
      teamTypeTitle: "상보적 역할 분담형",
      capabilities: [
        { capabilityKey: "PLAN", capabilityLabel: "방향 잡기", leadName: `${nameA} 중심`, actor: "A_DOMINANT", narrative: `${nameA}님이 목표와 전체 틀을 먼저 구상하는 편입니다.` },
        { capabilityKey: "DECIDE", capabilityLabel: "결정 내리기", leadName: "자연스러운 협력", actor: "COMPLEMENTARY", narrative: "중요한 판단 순간에 두 사람이 활발히 의견을 주고받으며 결론을 냅니다." },
        { capabilityKey: "EXECUTE", capabilityLabel: "실행하기", leadName: `${nameB} 중심`, actor: "B_DOMINANT", narrative: `${nameB}님이 필요한 실무와 행동을 지체 없이 실행해냅니다.` },
        { capabilityKey: "MAINTAIN", capabilityLabel: "꾸준히 챙기기", leadName: `${nameB} 중심`, actor: "B_DOMINANT", narrative: `${nameB}님이 정기적인 지출과 집안의 일상을 꾸준히 챙기는 중심축입니다.` },
        { capabilityKey: "CHECK", capabilityLabel: "다시 점검하기", leadName: `${nameA} 중심`, actor: "A_DOMINANT", narrative: `${nameA}님이 현실적인 리스크나 빠진 숫자를 한 번 더 짚어냅니다.` },
        { capabilityKey: "ADAPT", capabilityLabel: "돌발 상황 수습", leadName: "둘 다 강점", actor: "SHARED_STRENGTH", narrative: "예상치 못한 변수가 터져도 두 사람이 유연하게 대처하며 기준을 맞춰갑니다." },
      ],
      pairInsight: `${nameA}님과 ${nameB}님은 한 사람이 독단적으로 끌어가기보다, 각자의 강점이 발휘되는 업무에서 자연스러운 주도권을 번갈아 주고받는 운영 방식을 보입니다.`,
    },
    moneyBehavior: {
      title: isEn ? "02. Money Behavior" : "02. 우리는 어떻게 쓰고, 어떻게 모을까?",
      importantValueA: "안정된 미래 기반",
      spendingStyleA: "계획된 예산 범위 안에서 지출",
      savingStyleA: "목표액을 정해두고 우선 저축",
      importantValueB: "현재 삶의 경험과 질",
      spendingStyleB: "경험과 성장에 주저 없이 투입",
      savingStyleB: "여유 자금이 생길 때 꾸준히 누적",
      togetherInsight: "한 쪽은 안정을, 한 쪽은 경험을 우선시하므로 예산을 '미래 자산'과 '오늘의 즐거움'으로 분리하여 운용하는 것이 좋습니다.",
    },
    wealthBuildingStyle: {
      title: isEn ? "03. Wealth Building Style" : "03. 우리 돈은 어떤 방식으로 키우는 게 잘 맞을까?",
      baseStyleA: "시장의 변동성보다 확실하고 안정적인 자산 축적 선호",
      opportunityStyleA: "충분히 검증된 안전 자산에 집중",
      naturalDirectionA: "자동 장기 축적 및 원금 보존형 자산",
      cautionPatternA: "과도하게 보수적인 자금 동결 조심",
      baseStyleB: "원금 보존보다 인플레이션 방어와 자산 확장 지향",
      opportunityStyleB: "유망한 성장 가능성에 신중하게 접근",
      naturalDirectionB: "장기 분산 적립 및 성장 자산 운용",
      cautionPatternB: "단기 변동성에 과도하게 민감해지는 것 조심",
      pairSynergyInsight: `${nameA}님과 ${nameB}님은 한 사람의 확장 욕구와 다른 한 사람의 리스크 제어 감각이 조화를 이루어 밸런스 있는 자산 형성이 가능합니다.`,
    },
    majorMoneyDecisions: {
      title: isEn ? "04. Major Money Decisions" : "04. 큰돈 앞에서는 누가 액셀을 밟고, 누가 브레이크를 밟을까?",
      optionProposer: `${nameB} (가능성 탐색)`,
      numberChecker: `${nameA} (숫자 검토)`,
      riskBrake: `${nameA} (안전판 역할)`,
      commitPusher: `${nameB} (최종 결정)`,
      decisionPatternSummary: "큰 돈을 지출할 때 한 쪽이 아이디어를 가져오면 다른 한 쪽이 현실적 예산과 리스크를 상호 검토한 뒤 실행에 옮기는 건강한 워크플로우를 가집니다.",
    },
    financialOperation: {
      title: isEn ? "05. Financial Operation" : "05. 평소 돈 관리는 누가 더 자연스러울까?",
      flowTracker: `${nameA} (현금 흐름)`,
      billsAndDocs: `${nameB} (고정비·서류)`,
      largeExpenseCheck: "둘 다 공동 확인",
      operationStyle: "역할 분담 및 공동 관리",
      operationInsight: "매월 고정 지출과 통장 흐름은 담당자를 명확히 두고, 정기적인 자산 현황 브리핑을 통해 투명성을 유지할 때 가장 잡음이 없습니다.",
    },
    practicalLifeCompetence: {
      title: isEn ? "06. Practical Life Competence" : "06. 같이 살아보면 드러나는 생활력",
      profileA: {
        notice: "집안의 필요한 일이나 정리가 필요한 부분을 즉각 포착",
        plan: "구체적인 일정과 동선을 머릿속에 미리 정리",
        do: "차분하게 하나씩 순서대로 해결",
        maintain: "정해진 가사 루틴과 생활 질서를 꾸준히 유지",
        recover: "상대와 상의하며 차분하게 대안을 탐색",
      },
      profileB: {
        notice: "일상의 소소한 불편함을 부담 없이 편안하게 지켜봄",
        plan: "상황에 맞춰 유연하고 자유롭게 움직이는 편",
        do: "해야 할 일이 생기면 미루지 않고 빠르게 집행",
        maintain: "상황에 따라 유연하게 원칙을 조율함",
        recover: "예상치 못한 가전 고장이나 변수 발생 시 즉각 수습",
      },
      pairSynergyInsight: `${nameA}님과 ${nameB}님은 각자 더 민감하게 반응하는 영역에서 생활력을 발휘하며, 서로의 부족한 실행력을 자연스럽게 메워주는 팀워크를 보여줍니다.`,
    },
    householdMapEnding: {
      title: isEn ? "Ending. Household Summary Map" : "우리 집 운영 한눈에 보기",
      moneyBehaviorSummary: "돈의 지출과 저축 기준: 예산을 '미래 자산'과 '오늘의 즐거움'으로 분리하여 운용",
      wealthStyleSummary: `자산 형성 방향: ${nameA}님의 리스크 제어와 ${nameB}님의 자산 확장이 조화를 이룸`,
      bigMoneyDecisionSummary: `대형 지출 결정: ${nameB}님이 기회를 열고 ${nameA}님이 점검하며 조화를 이루는 워크플로우`,
      lifeCompetenceSummary: "일상 생활력 시너지: 각자 강점이 있는 집안일 영역에서 주도성 발휘",
    },
  };
}
