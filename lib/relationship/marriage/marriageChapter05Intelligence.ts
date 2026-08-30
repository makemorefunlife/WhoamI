import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";
import { pick } from "./marriageCopy";

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

export type CrisisResilienceRoleKey = "REALITY_ORGANIZER" | "INCOME_EXPLORER" | "RISK_TAKER" | "ENDURANCE_HOLDER";

export type PairCrisisResilienceRole = {
  roleKey: CrisisResilienceRoleKey;
  roleLabel: string;
  personName: string;
};

export type IndividualLivelihoodProfile = {
  personName: string;
  editorialLabel: string;
  narrative: string;
};

export type EconomicCrisisResilienceSection = {
  title: string;
  pairRoles: PairCrisisResilienceRole[];
  oneLineSynthesis: string;
  profileA: IndividualLivelihoodProfile;
  profileB: IndividualLivelihoodProfile;
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
  economicCrisisResilience: EconomicCrisisResilienceSection; // 06
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
    if (diff >= 1.5) return { leadName: pick(locale, `${nameA}-led`, `${nameA} 중심`), actor: "A_DOMINANT" };
    if (diff <= -1.5) return { leadName: pick(locale, `${nameB}-led`, `${nameB} 중심`), actor: "B_DOMINANT" };
    if (scoreA >= 3 && scoreB >= 3) return { leadName: pick(locale, "Both are strong here", "둘 다 강점"), actor: "SHARED_STRENGTH" };
    if (scoreA < 2 && scoreB < 2) return { leadName: pick(locale, "Easy for both to put off", "서로 미루기 쉬움"), actor: "ROLE_VACUUM" };
    return { leadName: pick(locale, "Natural collaboration", "자연스러운 협력"), actor: "COMPLEMENTARY" };
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
      capabilityLabel: pick(locale, "Setting direction", "방향 잡기"),
      leadName: planActor.leadName,
      actor: planActor.actor,
      narrative: planActor.actor === "A_DOMINANT"
        ? pick(locale, `${nameA} tends to shape the goal and the overall framework first.`, `${nameA}님이 목표와 전체 틀을 먼저 구상하는 편입니다.`)
        : planActor.actor === "B_DOMINANT"
        ? pick(locale, `${nameB} tends to refine the overall direction and priorities first.`, `${nameB}님이 전체 방향과 우선순위를 먼저 가다듬는 편입니다.`)
        : pick(locale, "Both of you think through the overall goal together and set the direction as a team.", "두 사람 모두 전체적인 목표를 함께 고민하고 방향을 잡는 흐름을 보입니다."),
    },
    {
      capabilityKey: "DECIDE",
      capabilityLabel: pick(locale, "Making decisions", "결정 내리기"),
      leadName: decActor.leadName,
      actor: decActor.actor,
      narrative: decActor.actor === "A_DOMINANT"
        ? pick(locale, `${nameA} takes the lead in drawing a conclusion at the moment of choice.`, `${nameA}님이 선택의 순간에 주도적으로 결론을 이끌어냅니다.`)
        : decActor.actor === "B_DOMINANT"
        ? pick(locale, `${nameB} stays centered and makes the call at the moment of choice.`, `${nameB}님이 선택의 순간에 중심을 잡고 판단을 내립니다.`)
        : pick(locale, "At important decision points, the two of you actively trade ideas and land on a conclusion together.", "중요한 판단 순간에 두 사람이 활발히 의견을 주고받으며 결론을 냅니다."),
    },
    {
      capabilityKey: "EXECUTE",
      capabilityLabel: pick(locale, "Getting it done", "실행하기"),
      leadName: execActor.leadName,
      actor: execActor.actor,
      narrative: execActor.actor === "A_DOMINANT"
        ? pick(locale, `${nameA} has strong drive to move decisions into real action quickly.`, `${nameA}님이 결정을 실제 행동으로 빠르게 옮기는 추진력이 강합니다.`)
        : execActor.actor === "B_DOMINANT"
        ? pick(locale, `${nameB} handles the necessary legwork and action without delay.`, `${nameB}님이 필요한 실무와 행동을 지체 없이 기함해냅니다.`)
        : pick(locale, "When something needs doing, the two of you move together at a good pace.", "필요한 일 앞에서 두 사람이 속도감 있게 같이 움직이는 조화를 이룹니다."),
    },
    {
      capabilityKey: "MAINTAIN",
      capabilityLabel: pick(locale, "Keeping it up", "꾸준히 챙기기"),
      leadName: maintActor.leadName,
      actor: maintActor.actor,
      narrative: maintActor.actor === "A_DOMINANT"
        ? pick(locale, `${nameA} has real strength in keeping set routines and rules consistent.`, `${nameA}님이 정해진 루틴과 규칙을 변함없이 지켜내는 힘이 큽니다.`)
        : maintActor.actor === "B_DOMINANT"
        ? pick(locale, `${nameB} is the steady anchor for regular expenses and everyday household upkeep.`, `${nameB}님이 정기적인 지출과 집안의 일상을 꾸준히 챙기는 중심축입니다.`)
        : pick(locale, "You share the recurring routines and daily upkeep between you without either feeling burdened.", "반복적인 일상과 루틴을 서로 부담 없이 이어서 관리하는 조합입니다."),
    },
    {
      capabilityKey: "CHECK",
      capabilityLabel: pick(locale, "Double-checking", "다시 점검하기"),
      leadName: checkActor.leadName,
      actor: checkActor.actor,
      narrative: checkActor.actor === "A_DOMINANT"
        ? pick(locale, `${nameA} catches real-world risks or missing numbers with a second pass.`, `${nameA}님이 현실적인 리스크나 빠진 숫자를 한 번 더 짚어냅니다.`)
        : checkActor.actor === "B_DOMINANT"
        ? pick(locale, `${nameB} carefully re-checks the fine details and precise spending numbers.`, `${nameB}님이 세부 내역과 꼼꼼한 지출 숫자를 꼼꼼히 재확인합니다.`)
        : pick(locale, "Both of you have a good eye for detail, catching unexpected expenses before they happen.", "두 사람 모두 꼼꼼히 짚어보는 감각이 있어 돌발 지출을 사전에 예방합니다."),
    },
    {
      capabilityKey: "ADAPT",
      capabilityLabel: pick(locale, "Handling surprises", "돌발 상황 수습"),
      leadName: adaptActor.leadName,
      actor: adaptActor.actor,
      narrative: adaptActor.actor === "A_DOMINANT"
        ? pick(locale, `${nameA} thinks on their feet and finds alternatives when something unexpected happens.`, `${nameA}님이 예기치 못한 상황에서 순발력 있게 대안을 찾습니다.`)
        : adaptActor.actor === "B_DOMINANT"
        ? pick(locale, `${nameB} stays calm and gets the recovery moving when a variable comes up.`, `${nameB}님이 변수가 생겼을 때 당황하지 않고 수습의 물꼬를 틉니다.`)
        : pick(locale, "Even when an unexpected variable hits, the two of you adapt flexibly and get back on the same page.", "예상치 못한 변수가 터져도 두 사람이 유연하게 대처하며 기준을 맞춰갑니다."),
    },
  ];

  let teamType = pick(locale, "Role-sharing synergy", "역할 분담형 시너지");
  if (planActor.actor === "A_DOMINANT" && execActor.actor === "B_DOMINANT") {
    teamType = pick(locale, `${nameA} plans × ${nameB} executes`, `${nameA} 기획 × ${nameB} 실행 보완형`);
  } else if (planActor.actor === "B_DOMINANT" && execActor.actor === "A_DOMINANT") {
    teamType = pick(locale, `${nameB} plans × ${nameA} executes`, `${nameB} 기획 × ${nameA} 실행 보완형`);
  } else if (planActor.actor === "SHARED_STRENGTH" || execActor.actor === "SHARED_STRENGTH") {
    teamType = pick(locale, "Joint-lead household", "동반 주도형 패밀리");
  }

  const coupleOperatingSystem: CoupleOperatingSystemSection = {
    title: isEn ? "01. Household Operating System" : "01. 우리 집은 누가 어떻게 굴릴까?",
    teamTypeTitle: teamType,
    capabilities,
    pairInsight: pick(
      locale,
      `Rather than one of you steering everything alone, ${nameA} and ${nameB} tend to naturally trade the lead depending on whose strengths fit the task at hand.`,
      `${nameA}님과 ${nameB}님은 한 사람이 독단적으로 끌어가기보다, 각자의 강점이 발휘되는 업무에서自然스러운 주도권을 번갈아 주고받는 운영 방식을 보입니다.`,
    ),
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
    importantValueA: secA ? pick(locale, "A stable future foundation", "안정된 미래 기반") : expA ? pick(locale, "The quality of life right now", "현재 삶의 경험과 질") : pick(locale, "Freedom to live by their own values", "자유로운 가치 실현"),
    spendingStyleA: expA ? pick(locale, "Spends without hesitation on experiences and growth", "경험과 성장에 주저 없이 투입") : pick(locale, "Spends within a planned budget", "계획된 예산 범위 안에서 지출"),
    savingStyleA: secA ? pick(locale, "Sets a target amount and saves toward it first", "목표액을 정해두고 우선 저축") : pick(locale, "Steadily saves whatever's left over", "여유 자금이 생길 때 꾸준히 누적"),
    importantValueB: secB ? pick(locale, "A stable future foundation", "안정된 미래 기반") : expB ? pick(locale, "The quality of life right now", "현재 삶의 경험과 질") : pick(locale, "Freedom to live by their own values", "자유로운 가치 실현"),
    spendingStyleB: expB ? pick(locale, "Spends without hesitation on experiences and growth", "경험과 성장에 주저 없이 투입") : pick(locale, "Spends within a planned budget", "계획된 예산 범위 안에서 지출"),
    savingStyleB: secB ? pick(locale, "Sets a target amount and saves toward it first", "목표액을 정해두고 우선 저축") : pick(locale, "Steadily saves whatever's left over", "여유 자금이 생길 때 꾸준히 누적"),
    togetherInsight: secA === secB
      ? pick(locale, "Both of you share a similar sense of what money means and where spending lines are, so there's little unnecessary friction over purchases.", "두 사람 모두 돈의 의미와 지출의 기준이 비슷하여 소비로 인한 불필요한 마찰이 적은 편입니다.")
      : pick(locale, "One of you prioritizes security, the other prioritizes experience, so it helps to run separate budgets for 'future assets' and 'today's enjoyment.'", "한 쪽은 안정을, 한 쪽은 경험을 우선시하므로 예산을 '미래 자산'과 '오늘의 즐거움'으로 분리하여 운용하는 것이 좋습니다."),
    underPressureInsight: (axesA.resilience !== undefined && axesB.resilience !== undefined)
      ? pick(locale, "When spare cash shrinks, the two of you tend to calmly rework fixed expenses first rather than cutting spending indiscriminately.", "여유 자금이 줄어들면 두 사람은 무작정 소비를 끊기보다 고정 지출 항목부터 차분히 재정비하는 성향을 보입니다.")
      : undefined,
  };

  // ---------------------------------------------------------------------------
  // 03. WEALTH_BUILDING_STYLE
  // ---------------------------------------------------------------------------
  const riskA = (axesA.growth ?? 50) > 60 || (countsA["편재"] ?? 0) > 0;
  const riskB = (axesB.growth ?? 50) > 60 || (countsB["편재"] ?? 0) > 0;

  const wealthBuildingStyle: WealthBuildingStyleSection = {
    title: isEn ? "03. Wealth Building Style" : "03. 우리 돈은 어떤 방식으로 키우는 게 잘 맞을까?",
    baseStyleA: riskA ? pick(locale, "Leans toward inflation protection and growing assets over just preserving principal", "원금 보존보다 인플레이션 방어와 자산 확장 지향") : pick(locale, "Prefers steady, reliable asset building over market volatility", "시장의 변동성보다 확실하고 안정적인 자산 축적 선호"),
    opportunityStyleA: riskA ? pick(locale, "Approaches promising growth opportunities carefully", "유망한 성장 가능성에 신중하게 접근") : pick(locale, "Focuses on thoroughly proven, safe assets", "충분히 검증된 안전 자산에 집중"),
    naturalDirectionA: riskA ? pick(locale, "Long-term diversified investing and growth-oriented assets", "장기 분산 적립 및 성장 자산 운용") : pick(locale, "Automatic long-term saving and principal-preserving assets", "자동 장기 축적 및 원금 보존형 자산"),
    cautionPatternA: riskA ? pick(locale, "Watch out for getting overly sensitive to short-term volatility", "단기 변동성에 과도하게 민감해지는 것 조심") : pick(locale, "Watch out for freezing funds too conservatively", "과도하게 보수적인 자금 동결 조심"),
    baseStyleB: riskB ? pick(locale, "Leans toward inflation protection and growing assets over just preserving principal", "원금 보존보다 인플레이션 방어와 자산 확장 지향") : pick(locale, "Prefers steady, reliable asset building over market volatility", "시장의 변동성보다 확실하고 안정적인 자산 축적 선호"),
    opportunityStyleB: riskB ? pick(locale, "Approaches promising growth opportunities carefully", "유망한 성장 가능성에 신중하게 접근") : pick(locale, "Focuses on thoroughly proven, safe assets", "충분히 검증된 안전 자산에 집중"),
    naturalDirectionB: riskB ? pick(locale, "Long-term diversified investing and growth-oriented assets", "장기 분산 적립 및 성장 자산 운용") : pick(locale, "Automatic long-term saving and principal-preserving assets", "자동 장기 축적 및 원금 보존형 자산"),
    cautionPatternB: riskB ? pick(locale, "Watch out for getting overly sensitive to short-term volatility", "단기 변동성에 과도하게 민감해지는 것 조심") : pick(locale, "Watch out for freezing funds too conservatively", "과도하게 보수적인 자금 동결 조심"),
    pairSynergyInsight: riskA !== riskB
      ? pick(locale, `${nameA} and ${nameB} balance each other well — one partner's drive to grow assets and the other's sense of risk control combine into a balanced approach to building wealth.`, `${nameA}님과 ${nameB}님은 한 사람의 확장 욕구와 다른 한 사람의 리스크 제어 감각이 조화를 이루어 밸런스 있는 자산 형성이 가능합니다.`)
      : pick(locale, "Your values around managing assets line up, which makes synergy easy — but it's worth making a habit of regularly reviewing risk together.", "두 사람의 자산 관리 가치관이 일치하여 시너지 효과를 내기 쉽지만, 리스크 검토 과정을 정례화하는 것이 안전합니다."),
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
    return pick(locale, "Both of you", "둘 다");
  };

  const steps: MoneyDecisionStep[] = [
    { stepKey: "FIND", stepLabel: pick(locale, "Spotting the opportunity", "기회 찾기"), actorName: resolveStepActor(findA, findB), confidence: "HIGH" },
    { stepKey: "TRACK", stepLabel: pick(locale, "Keeping an eye on it", "계속 지켜보기"), actorName: resolveStepActor(trackA, trackB), confidence: "HIGH" },
    { stepKey: "CHECK", stepLabel: pick(locale, "Checking the numbers and risk", "숫자·위험 확인"), actorName: resolveStepActor(chkA, chkB), confidence: "HIGH" },
    { stepKey: "ACT", stepLabel: pick(locale, "Actually acting on it", "실제 실행"), actorName: resolveStepActor(actA, actB), confidence: "HIGH" },
    { stepKey: "REVIEW", stepLabel: pick(locale, "One last check", "마지막 점검"), actorName: resolveStepActor(reviewA, reviewB), confidence: "HIGH" },
  ];

  const finder = steps[0].actorName;
  const checker = steps[2].actorName;
  const doer = steps[3].actorName;

  const bothLabel = pick(locale, "Both of you", "둘 다");
  const fmtName = (name: string) => (name === bothLabel ? pick(locale, "both of you", "두 사람") : pick(locale, name, `${name}님`));

  let oneLineSynthesis = "";
  if (finder === doer && finder !== bothLabel && checker !== finder && checker !== bothLabel) {
    oneLineSynthesis = pick(
      locale,
      `${fmtName(finder)} tends to open the opportunity and put it into action, while ${fmtName(checker)} keeps tracking it and checking the numbers and risk.`,
      `${fmtName(finder)}이 기회를 열고 실제 행동으로 옮기면, ${fmtName(checker)}이 그 기회를 계속 추적하며 숫자와 위험을 확인하는 흐름에 가깝습니다.`,
    );
  } else if (finder !== doer && finder !== bothLabel && doer !== bothLabel) {
    oneLineSynthesis = pick(
      locale,
      `${fmtName(finder)} explores new investment opportunities, ${fmtName(checker)} reviews the numbers and conditions, and then ${fmtName(doer)} carries it through to execution.`,
      `${fmtName(finder)}이 새로운 투자 기회를 탐색하고 ${fmtName(checker)}이 숫자와 조건을 검토한 뒤, 최종 실행은 ${fmtName(doer)}이 밀어주는 워크플로우를 보입니다.`,
    );
  } else if (finder === bothLabel || doer === bothLabel) {
    oneLineSynthesis = pick(
      locale,
      "Both of you are equally driven to find and act on opportunities, so it's worth making a habit of checking the numbers and risk before you commit.",
      "두 사람 모두 기회를 찾고 실행하는 추진력은 활발하지만, 사전 숫자·위험 점검 단계를 정례화하는 것이 안전합니다.",
    );
  } else {
    oneLineSynthesis = pick(
      locale,
      `When ${fmtName(finder)} spots an opportunity, ${fmtName(checker)} reviews the risk and the numbers from multiple angles before you finalize the decision together.`,
      `${fmtName(finder)}이 기회를 포착하면 ${fmtName(checker)}이 리스크와 숫자를 다각도로 검토한 후 함께 결정을 완성해가는 흐름입니다.`,
    );
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

  let opStyle = pick(locale, "Shared roles, jointly managed", "역할 분담 및 공동 관리");
  let opLeadA = pick(locale, `${nameA} (cash flow)`, `${nameA} (현금 흐름)`);
  let opLeadB = pick(locale, `${nameB} (fixed costs & paperwork)`, `${nameB} (고정비·서류)`);

  if (opScoreA - opScoreB >= 2.5) {
    opStyle = pick(locale, `${nameA} leads overall management`, `${nameA} 주도 총괄 관리`);
    opLeadA = pick(locale, `${nameA} (overall execution)`, `${nameA} (전반적 집행)`);
    opLeadB = pick(locale, `${nameB} (kept in the loop)`, `${nameB} (상호 공유)`);
  } else if (opScoreB - opScoreA >= 2.5) {
    opStyle = pick(locale, `${nameB} leads overall management`, `${nameB} 주도 총괄 관리`);
    opLeadA = pick(locale, `${nameA} (kept in the loop)`, `${nameA} (상호 공유)`);
    opLeadB = pick(locale, `${nameB} (overall execution)`, `${nameB} (전반적 집행)`);
  }

  const financialOperation: FinancialOperationSection = {
    title: isEn ? "05. Financial Operation" : "05. 평소 돈 관리는 누가 더 자연스러울까?",
    flowTracker: opLeadA,
    billsAndDocs: opLeadB,
    largeExpenseCheck: pick(locale, "Both confirm together", "둘 다 공동 확인"),
    operationStyle: opStyle,
    operationInsight: pick(
      locale,
      "It runs smoothest when there's a clear owner for monthly fixed expenses and account flow, paired with a regular check-in on where things stand.",
      "매월 고정 지출과 통장 흐름은 담당자를 명확히 두고, 정기적인 자산 현황 브리핑을 통해 투명성을 유지할 때 가장 잡음이 없습니다.",
    ),
    boundaryInsight: (axesA.autonomy !== undefined && axesB.autonomy !== undefined)
      ? pick(
          locale,
          "Keeping a shared household account separate from each person's own spending money protects both emotional autonomy and household stability at the same time.",
          "공동 생활비 계좌와 각자의 개인 용돈 계좌를 구별하여 운영할 때 정서적 자율성과 가계의 안정성이 동시에 확보됩니다.",
        )
      : undefined,
  };

  // ---------------------------------------------------------------------------
  // 06. ECONOMIC_CRISIS_RESILIENCE (경제적 위기가 오면?)
  // ---------------------------------------------------------------------------
  const realA = (countsA["관성"] ?? 0) * 1.5 + (countsA["재성"] ?? 0) + (countsA["인성"] ?? 0) + ((axesA.practicality ?? 50) > 55 ? 2 : 0) + ((axesA.self_control ?? 50) > 55 ? 1.5 : 0);
  const realB = (countsB["관성"] ?? 0) * 1.5 + (countsB["재성"] ?? 0) + (countsB["인성"] ?? 0) + ((axesB.practicality ?? 50) > 55 ? 2 : 0) + ((axesB.self_control ?? 50) > 55 ? 1.5 : 0);

  const expA_res = (countsA["식상"] ?? 0) * 1.5 + (countsA["비겁"] ?? 0) + (countsA["편재"] ?? 0) + ((axesA.adaptability ?? 50) > 55 ? 2 : 0) + ((axesA.growth ?? 50) > 55 ? 1.5 : 0);
  const expB_res = (countsB["식상"] ?? 0) * 1.5 + (countsB["비겁"] ?? 0) + (countsB["편재"] ?? 0) + ((axesB.adaptability ?? 50) > 55 ? 2 : 0) + ((axesB.growth ?? 50) > 55 ? 1.5 : 0);

  const rskA = (countsA["비겁"] ?? 0) * 1.5 + (countsA["편재"] ?? 0) + ((axesA.stimulation ?? 50) > 55 ? 2 : 0) + ((axesA.autonomy ?? 50) > 55 ? 1.5 : 0);
  const rskB = (countsB["비겁"] ?? 0) * 1.5 + (countsB["편재"] ?? 0) + ((axesB.stimulation ?? 50) > 55 ? 2 : 0) + ((axesB.autonomy ?? 50) > 55 ? 1.5 : 0);

  const endA = (countsA["관성"] ?? 0) * 1.5 + (countsA["인성"] ?? 0) + ((axesA.resilience ?? 50) > 55 ? 2 : 0) + ((axesA.self_control ?? 50) > 55 ? 1.5 : 0);
  const endB = (countsB["관성"] ?? 0) * 1.5 + (countsB["인성"] ?? 0) + ((axesB.resilience ?? 50) > 55 ? 2 : 0) + ((axesB.self_control ?? 50) > 55 ? 1.5 : 0);

  const noEdgeLabel = pick(locale, "No clear lead", "뚜렷한 우위 없음");
  const resolvePairPerson = (scoreA: number, scoreB: number): string => {
    const diff = scoreA - scoreB;
    if (diff >= 1.5) return nameA;
    if (diff <= -1.5) return nameB;
    if (Math.abs(diff) < 0.5) return bothLabel;
    return noEdgeLabel;
  };

  const pairRoles: PairCrisisResilienceRole[] = [
    { roleKey: "REALITY_ORGANIZER", roleLabel: pick(locale, "The one who gets real first", "먼저 현실을 정리하는 사람"), personName: resolvePairPerson(realA, realB) },
    { roleKey: "INCOME_EXPLORER", roleLabel: pick(locale, "The one who finds new income", "새 수입원을 찾는 사람"), personName: resolvePairPerson(expA_res, expB_res) },
    { roleKey: "RISK_TAKER", roleLabel: pick(locale, "The one who can take the risk", "위험을 감수할 수 있는 사람"), personName: resolvePairPerson(rskA, rskB) },
    { roleKey: "ENDURANCE_HOLDER", roleLabel: pick(locale, "The one who holds on to the end", "끝까지 버티는 사람"), personName: resolvePairPerson(endA, endB) },
  ];

  const organizerPerson = pairRoles[0].personName;
  const explorerPerson = pairRoles[1].personName;

  let crisisOneLine = "";
  if (organizerPerson !== explorerPerson && organizerPerson !== bothLabel && explorerPerson !== bothLabel && organizerPerson !== noEdgeLabel && explorerPerson !== noEdgeLabel) {
    crisisOneLine = pick(locale, "One of you holds the line so things don't collapse, while the other looks for the way back up.", "한 사람은 무너지지 않게 지키고, 다른 사람은 다시 올라갈 방법을 찾는 조합입니다.");
  } else if (organizerPerson === bothLabel || explorerPerson === bothLabel) {
    crisisOneLine = pick(locale, "Both of you have strong instincts and willingness to act in a crisis, making you a partnership that pushes through financial pressure together.", "두 사람 모두 위기 시 현실 감각과 대처 의지가 강하여 경제적 압박을 함께 돌파해 나가는 파트너십입니다.");
  } else {
    crisisOneLine = pick(locale, "Depending on the situation, the two of you trade off between steadying things and getting back on your feet, protecting your financial footing together.", "상황에 따라 두 사람이 기지개와 안정화 역할을 번갈아 나누며 경제적 기반을 수호하는 조화를 이룹니다.");
  }

  const buildIndividualProfile = (name: string, counts: Record<string, number>, axes: Record<string, number>): IndividualLivelihoodProfile => {
    const resScore = (axes.resilience ?? 50) + (counts["관성"] ?? 0) * 10;
    const adaptScore = (axes.adaptability ?? 50) + (counts["식상"] ?? 0) * 10;
    const stimScore = (axes.stimulation ?? 50) + (counts["비겁"] ?? 0) * 10;
    const pracScore = (axes.practicality ?? 50) + (counts["재성"] ?? 0) * 10;

    if (resScore >= adaptScore && resScore >= stimScore && resScore >= pracScore) {
      return {
        personName: name,
        editorialLabel: pick(locale, "Holds the line to the end once responsible for it", "책임지면 끝까지 버티는 생활력"),
        narrative: pick(
          locale,
          `When financial pressure hits, ${name} tends to get realistic first, and will put off their own comfort if needed to protect the household's foundation to the end.`,
          `${name}님은 경제적으로 압박이 생기면 현실을 먼저 정돈하고, 필요하다면 자신의 편안함을 미루면서까지 가정의 기반을 끝까지 지키려는 편입니다.`,
        ),
      };
    } else if (adaptScore >= stimScore && adaptScore >= pracScore) {
      return {
        personName: name,
        editorialLabel: pick(locale, "Breaks through by changing approach", "방법을 바꿔 돌파하는 생활력"),
        narrative: pick(
          locale,
          `When things get stuck, ${name} doesn't stay tied to one approach — they quickly pivot toward new opportunities and alternative sources of income.`,
          `${name}님은 상황이 막혔을 때 한 가지 방식에 메이지 않고, 새로운 기회와 대안을 찾아 발 빠르게 경제적 수입 행동으로 전환하는 편입니다.`,
        ),
      };
    } else if (stimScore >= pracScore) {
      return {
        personName: name,
        editorialLabel: pick(locale, "Moves first when an opportunity appears", "기회가 보이면 먼저 움직이는 생활력"),
        narrative: pick(
          locale,
          `Even in a crisis, ${name} doesn't sit still — they show independent drive, boldly trying something new to change the situation.`,
          `${name}님은 위기 속에서도 주저앉지 않고 과감하게 새로운 시도를 통해 판을 바꾸려 움직이는 독립적인 추진력을 보입니다.`,
        ),
      };
    } else {
      return {
        personName: name,
        editorialLabel: pick(locale, "Cuts risk first and protects the foundation", "위험부터 줄이고 기반을 지키는 생활력"),
        narrative: pick(
          locale,
          `${name} tightens spending and prioritizes stable resource management, giving them an organized way of minimizing the impact of a financial shock.`,
          `${name}님은 지출을 타이트하게 조절하고 안정적인 자원 관리를 최우선으로 두어 경제적 충격을 최소화하는 정돈된 대응력을 가집니다.`,
        ),
      };
    }
  };

  const economicCrisisResilience: EconomicCrisisResilienceSection = {
    title: isEn ? "06. Economic Resilience Under Crisis" : "06. 경제적 위기가 오면?",
    pairRoles,
    oneLineSynthesis: crisisOneLine,
    profileA: buildIndividualProfile(nameA, countsA, axesA),
    profileB: buildIndividualProfile(nameB, countsB, axesB),
  };

  // ---------------------------------------------------------------------------
  // ENDING. HOUSEHOLD_MAP
  // ---------------------------------------------------------------------------
  const householdMapEnding: HouseholdMapEnding = {
    title: isEn ? "Ending. Household Summary Map" : "우리 집 운영 한눈에 보기",
    moneyBehaviorSummary: pick(locale, `Spending & saving standards: ${moneyBehavior.togetherInsight}`, `돈의 지출과 저축 기준: ${moneyBehavior.togetherInsight}`),
    wealthStyleSummary: pick(locale, `Direction for building wealth: ${wealthBuildingStyle.pairSynergyInsight}`, `자산 형성 방향: ${wealthBuildingStyle.pairSynergyInsight}`),
    bigMoneyDecisionSummary: pick(locale, `Major spending decisions: ${majorMoneyDecisions.oneLineSynthesis}`, `대형 지출 결정: ${majorMoneyDecisions.oneLineSynthesis}`),
    lifeCompetenceSummary: pick(locale, `Resilience under pressure: ${economicCrisisResilience.oneLineSynthesis}`, `위기 대응 생활력: ${economicCrisisResilience.oneLineSynthesis}`),
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
    economicCrisisResilience,
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
      teamTypeTitle: pick(locale, "Complementary role-sharing", "상보적 역할 분담형"),
      capabilities: [
        { capabilityKey: "PLAN", capabilityLabel: pick(locale, "Setting direction", "방향 잡기"), leadName: pick(locale, `${nameA}-led`, `${nameA} 중심`), actor: "A_DOMINANT", narrative: pick(locale, `${nameA} tends to shape the goal and the overall framework first.`, `${nameA}님이 목표와 전체 틀을 먼저 구상하는 편입니다.`) },
        { capabilityKey: "DECIDE", capabilityLabel: pick(locale, "Making decisions", "결정 내리기"), leadName: pick(locale, "Natural collaboration", "자연스러운 협력"), actor: "COMPLEMENTARY", narrative: pick(locale, "At important decision points, the two of you actively trade ideas and land on a conclusion together.", "중요한 판단 순간에 두 사람이 활발히 의견을 주고받으며 결론을 냅니다.") },
        { capabilityKey: "EXECUTE", capabilityLabel: pick(locale, "Getting it done", "실행하기"), leadName: pick(locale, `${nameB}-led`, `${nameB} 중심`), actor: "B_DOMINANT", narrative: pick(locale, `${nameB} handles the necessary legwork and action without delay.`, `${nameB}님이 필요한 실무와 행동을 지체 없이 실행해냅니다.`) },
        { capabilityKey: "MAINTAIN", capabilityLabel: pick(locale, "Keeping it up", "꾸준히 챙기기"), leadName: pick(locale, `${nameB}-led`, `${nameB} 중심`), actor: "B_DOMINANT", narrative: pick(locale, `${nameB} is the steady anchor for regular expenses and everyday household upkeep.`, `${nameB}님이 정기적인 지출과 집안의 일상을 꾸준히 챙기는 중심축입니다.`) },
        { capabilityKey: "CHECK", capabilityLabel: pick(locale, "Double-checking", "다시 점검하기"), leadName: pick(locale, `${nameA}-led`, `${nameA} 중심`), actor: "A_DOMINANT", narrative: pick(locale, `${nameA} catches real-world risks or missing numbers with a second pass.`, `${nameA}님이 현실적인 리스크나 빠진 숫자를 한 번 더 짚어냅니다.`) },
        { capabilityKey: "ADAPT", capabilityLabel: pick(locale, "Handling surprises", "돌발 상황 수습"), leadName: pick(locale, "Both are strong here", "둘 다 강점"), actor: "SHARED_STRENGTH", narrative: pick(locale, "Even when an unexpected variable hits, the two of you adapt flexibly and get back on the same page.", "예상치 못한 변수가 터져도 두 사람이 유연하게 대처하며 기준을 맞춰갑니다.") },
      ],
      pairInsight: pick(
        locale,
        `Rather than one of you steering everything alone, ${nameA} and ${nameB} tend to naturally trade the lead depending on whose strengths fit the task at hand.`,
        `${nameA}님과 ${nameB}님은 한 사람이 독단적으로 끌어가기보다, 각자의 강점이 발휘되는 업무에서 자연스러운 주도권을 번갈아 주고받는 운영 방식을 보입니다.`,
      ),
    },
    moneyBehavior: {
      title: isEn ? "02. Money Behavior" : "02. 우리는 어떻게 쓰고, 어떻게 모을까?",
      importantValueA: pick(locale, "A stable future foundation", "안정된 미래 기반"),
      spendingStyleA: pick(locale, "Spends within a planned budget", "계획된 예산 범위 안에서 지출"),
      savingStyleA: pick(locale, "Sets a target amount and saves toward it first", "목표액을 정해두고 우선 저축"),
      importantValueB: pick(locale, "The quality of life right now", "현재 삶의 경험과 질"),
      spendingStyleB: pick(locale, "Spends without hesitation on experiences and growth", "경험과 성장에 주저 없이 투입"),
      savingStyleB: pick(locale, "Steadily saves whatever's left over", "여유 자금이 생길 때 꾸준히 누적"),
      togetherInsight: pick(locale, "One of you prioritizes security, the other prioritizes experience, so it helps to run separate budgets for 'future assets' and 'today's enjoyment.'", "한 쪽은 안정을, 한 쪽은 경험을 우선시하므로 예산을 '미래 자산'과 '오늘의 즐거움'으로 분리하여 운용하는 것이 좋습니다."),
    },
    wealthBuildingStyle: {
      title: isEn ? "03. Wealth Building Style" : "03. 우리 돈은 어떤 방식으로 키우는 게 잘 맞을까?",
      baseStyleA: pick(locale, "Prefers steady, reliable asset building over market volatility", "시장의 변동성보다 확실하고 안정적인 자산 축적 선호"),
      opportunityStyleA: pick(locale, "Focuses on thoroughly proven, safe assets", "충분히 검증된 안전 자산에 집중"),
      naturalDirectionA: pick(locale, "Automatic long-term saving and principal-preserving assets", "자동 장기 축적 및 원금 보존형 자산"),
      cautionPatternA: pick(locale, "Watch out for freezing funds too conservatively", "과도하게 보수적인 자금 동결 조심"),
      baseStyleB: pick(locale, "Leans toward inflation protection and growing assets over just preserving principal", "원금 보존보다 인플레이션 방어와 자산 확장 지향"),
      opportunityStyleB: pick(locale, "Approaches promising growth opportunities carefully", "유망한 성장 가능성에 신중하게 접근"),
      naturalDirectionB: pick(locale, "Long-term diversified investing and growth-oriented assets", "장기 분산 적립 및 성장 자산 운용"),
      cautionPatternB: pick(locale, "Watch out for getting overly sensitive to short-term volatility", "단기 변동성에 과도하게 민감해지는 것 조심"),
      pairSynergyInsight: pick(
        locale,
        `${nameA} and ${nameB} balance each other well — one partner's drive to grow assets and the other's sense of risk control combine into a balanced approach to building wealth.`,
        `${nameA}님과 ${nameB}님은 한 사람의 확장 욕구와 다른 한 사람의 리스크 제어 감각이 조화를 이루어 밸런스 있는 자산 형성이 가능합니다.`,
      ),
    },
    majorMoneyDecisions: {
      title: isEn ? "04. Major Money & Investment Decisions" : "04. 큰돈과 투자 기회 앞에서 우리는 어떻게 움직일까?",
      steps: [
        { stepKey: "FIND", stepLabel: pick(locale, "Spotting the opportunity", "기회 찾기"), actorName: nameB, confidence: "HIGH" },
        { stepKey: "TRACK", stepLabel: pick(locale, "Keeping an eye on it", "계속 지켜보기"), actorName: nameA, confidence: "HIGH" },
        { stepKey: "CHECK", stepLabel: pick(locale, "Checking the numbers and risk", "숫자·위험 확인"), actorName: nameA, confidence: "HIGH" },
        { stepKey: "ACT", stepLabel: pick(locale, "Actually acting on it", "실제 실행"), actorName: nameB, confidence: "HIGH" },
        { stepKey: "REVIEW", stepLabel: pick(locale, "One last check", "마지막 점검"), actorName: nameA, confidence: "HIGH" },
      ],
      oneLineSynthesis: pick(
        locale,
        `${nameB} tends to open the opportunity and put it into action, while ${nameA} keeps tracking it and checking the numbers and risk.`,
        `${nameB}님이 기회를 열고 실제 행동으로 옮기면, ${nameA}님이 그 기회를 계속 추적하며 숫자와 위험을 확인하는 흐름에 가깝습니다.`,
      ),
    },
    financialOperation: {
      title: isEn ? "05. Financial Operation" : "05. 평소 돈 관리는 누가 더 자연스러울까?",
      flowTracker: pick(locale, `${nameA} (cash flow)`, `${nameA} (현금 흐름)`),
      billsAndDocs: pick(locale, `${nameB} (fixed costs & paperwork)`, `${nameB} (고정비·서류)`),
      largeExpenseCheck: pick(locale, "Both confirm together", "둘 다 공동 확인"),
      operationStyle: pick(locale, "Shared roles, jointly managed", "역할 분담 및 공동 관리"),
      operationInsight: pick(
        locale,
        "It runs smoothest when there's a clear owner for monthly fixed expenses and account flow, paired with a regular check-in on where things stand.",
        "매월 고정 지출과 통장 흐름은 담당자를 명확히 두고, 정기적인 자산 현황 브리핑을 통해 투명성을 유지할 때 가장 잡음이 없습니다.",
      ),
    },
    economicCrisisResilience: {
      title: isEn ? "06. Economic Resilience Under Crisis" : "06. 경제적 위기가 오면?",
      pairRoles: [
        { roleKey: "REALITY_ORGANIZER", roleLabel: pick(locale, "The one who gets real first", "먼저 현실을 정리하는 사람"), personName: nameA },
        { roleKey: "INCOME_EXPLORER", roleLabel: pick(locale, "The one who finds new income", "새 수입원을 찾는 사람"), personName: nameB },
        { roleKey: "RISK_TAKER", roleLabel: pick(locale, "The one who can take the risk", "위험을 감수할 수 있는 사람"), personName: nameB },
        { roleKey: "ENDURANCE_HOLDER", roleLabel: pick(locale, "The one who holds on to the end", "끝까지 버티는 사람"), personName: nameA },
      ],
      oneLineSynthesis: pick(locale, "One of you holds the line so things don't collapse, while the other looks for the way back up.", "한 사람은 무너지지 않게 지키고, 다른 사람은 다시 올라갈 방법을 찾는 조합입니다."),
      profileA: {
        personName: nameA,
        editorialLabel: pick(locale, "Holds the line to the end once responsible for it", "책임지면 끝까지 버티는 생활력"),
        narrative: pick(
          locale,
          `When financial pressure hits, ${nameA} tends to get realistic first, and will put off their own comfort if needed to protect the household's foundation to the end.`,
          `${nameA}님은 경제적으로 압박이 생기면 현실을 먼저 정돈하고, 필요하다면 자신의 편안함을 미루면서까지 가정의 기반을 끝까지 지키려는 편입니다.`,
        ),
      },
      profileB: {
        personName: nameB,
        editorialLabel: pick(locale, "Breaks through by changing approach", "방법을 바꿔 돌파하는 생활력"),
        narrative: pick(
          locale,
          `When things get stuck, ${nameB} doesn't stay tied to one approach — they quickly pivot toward new opportunities and alternative sources of income.`,
          `${nameB}님은 상황이 막혔을 때 한 가지 방식에 메이지 않고, 새로운 기회와 대안을 찾아 발 빠르게 경제적 수입 행동으로 전환하는 편입니다.`,
        ),
      },
    },
    householdMapEnding: {
      title: isEn ? "Ending. Household Summary Map" : "우리 집 운영 한눈에 보기",
      moneyBehaviorSummary: pick(locale, "Spending & saving standards: budget split between 'future assets' and 'today's enjoyment'", "돈의 지출과 저축 기준: 예산을 '미래 자산'과 '오늘의 즐거움'으로 분리하여 운용"),
      wealthStyleSummary: pick(locale, `Direction for building wealth: ${nameA}'s risk control and ${nameB}'s asset growth balance each other out`, `자산 형성 방향: ${nameA}님의 리스크 제어와 ${nameB}님의 자산 확장이 조화를 이룸`),
      bigMoneyDecisionSummary: pick(locale, `Major spending decisions: ${nameB} opens the opportunity and ${nameA} checks it, balancing each other in the workflow`, `대형 지출 결정: ${nameB}님이 기회를 열고 ${nameA}님이 점검하며 조화를 이루는 워크플로우`),
      lifeCompetenceSummary: pick(locale, "Resilience under pressure: one of you holds the line so things don't collapse, while the other looks for the way back up", "위기 대응 생활력: 한 사람은 무너지지 않게 지키고, 다른 사람은 다시 올라갈 방법을 찾는 조합"),
    },
  };
}
