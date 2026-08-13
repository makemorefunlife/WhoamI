import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PairCohabitationSignals } from "@/lib/personCore/sajuSignals/pairTypes";
import type { CohabitationSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { Locale } from "@/lib/i18n/locale";
import { buildMarriageRuleContext, type MarriageRuleContext } from "./buildMarriageRuleContext";
import { buildMarriagePsychMatchBundle } from "./buildMarriagePsychMatch";
import { refineHouseholdCfo } from "./marriageCfoConsumption";
import { buildMarriageOperatingCfoCanonical } from "./marriageOperatingCfoCanonical";
import { refineParentingStyle } from "./marriageTenGodAnalysis";
import { buildPartnerMentalLoadNote } from "@/lib/relationship/enrichment/partnerMentalLoadNote";
import { buildCrisisRoleLine } from "@/lib/relationship/enrichment/marriageSajuGapInsights";
import { buildCareerBalanceLine, buildHouseholdPmLine, buildSpaceVsTogetherClauses, buildLongTermSynergyLine } from "@/lib/relationship/enrichment/marriagePsychGapInsights";
import { buildMarriage11AxisInsights } from "./marriage11AxisInsights";
import { buildMarriageConflict4Stage } from "./marriageConflict4Stage";
import { buildMarriageLoveDeliveryMatch } from "./marriageLoveDeliveryMatch";
import { buildMarriageExpectationsAndNeeds } from "./marriageExpectationsAndNeeds";
import { buildMarriageEmergencySosCombined } from "./marriageEmergencySosCombined";
import { buildMarriageInLawBoundary } from "./marriageInLawBoundary";
import { buildMarriageLifeStageTransition } from "./marriageLifeStageTransition";
import { buildMarriageCoupleBurnout } from "./marriageCoupleBurnout";
import { buildMarriageCareerHomeTransition } from "./marriageCareerHomeTransition";
import { buildMarriageEconomicPartnership } from "./marriageEconomicPartnership";
import type {
  MarriageCanonicalBundle,
  HouseholdPmResult,
  PlannerExecutorResult,
  DecisionPowerMapResult,
  CrisisRoleResult,
  CareerHomeResult,
  LongTermCompoundingResult,
  LifePartnershipVerdictResult,
  DiscrepancyTrace,
  SynthesisCandidate,
  CandidateContractItem,
  DomainPowerStage,
  RoleActor,
} from "./marriageCanonicalTypes";

export type BuildMarriageCanonicalParams = {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  psychMasterA?: PsychMasterJson | null;
  psychMasterB?: PsychMasterJson | null;
  pairCohabitation?: PairCohabitationSignals | null;
  cohabitationSignalsA?: CohabitationSajuSignals;
  cohabitationSignalsB?: CohabitationSajuSignals;
  locale?: Locale;
};

export function buildMarriageCanonicalEngine(
  params: BuildMarriageCanonicalParams,
): MarriageCanonicalBundle {
  const locale = params.locale ?? "ko-KR";
  const isEn = locale === "en-US";
  const { nicknameA: a, nicknameB: b } = params;

  // 1. Build Rule Context & Canonical SSOT Facts (Reuses Blueprint core, no duplicated calculations)
  const ctx = buildMarriageRuleContext({ ...params, locale });
  const psychBundle = buildMarriagePsychMatchBundle(params.psychMasterA, params.psychMasterB, locale);

  const psychA = params.psychMasterA?.secondary_axes;
  const psychB = params.psychMasterB?.secondary_axes;

  // 11-Axis raw metrics (defaults to 50 if missing)
  const pA = {
    structure: psychA?.structure ?? 50,
    self_control: psychA?.self_control ?? 50,
    practicality: psychA?.practicality ?? 50,
    decision_style: psychA?.decision_style ?? 50,
    empathy: psychA?.empathy ?? 50,
    resilience: psychA?.resilience ?? 50,
    recognition: psychA?.recognition ?? 50,
    conflict_style: psychA?.conflict_style ?? 50,
    stimulation: psychA?.stimulation ?? 50,
    energy_style: psychA?.energy_style ?? 50,
    thinking_style: psychA?.thinking_style ?? 50,
  };

  const pB = {
    structure: psychB?.structure ?? 50,
    self_control: psychB?.self_control ?? 50,
    practicality: psychB?.practicality ?? 50,
    decision_style: psychB?.decision_style ?? 50,
    empathy: psychB?.empathy ?? 50,
    resilience: psychB?.resilience ?? 50,
    recognition: psychB?.recognition ?? 50,
    conflict_style: psychB?.conflict_style ?? 50,
    stimulation: psychB?.stimulation ?? 50,
    energy_style: psychB?.energy_style ?? 50,
    thinking_style: psychB?.thinking_style ?? 50,
  };

  // ----------------------------------------------------
  // 4.1 Household PM / Mental Load
  // ----------------------------------------------------
  const mentalLoadNote = (params.psychMasterA && params.psychMasterB)
    ? buildPartnerMentalLoadNote(params.psychMasterA, params.psychMasterB, a, b)
    : (isEn ? "Household mental load is balanced when both communicate explicitly." : "가사 멘탈로드는 두 사람이 투명하게 대화할 때 균형 있게 유지됩니다.");
  const pmLine = (params.psychMasterA && params.psychMasterB)
    ? buildHouseholdPmLine(params.psychMasterA, params.psychMasterB, a, b)
    : (isEn ? "Both share household operating responsibilities." : "집안 운영과 실행 책임을 함께 나누어 집니다.");

  let householdPm: HouseholdPmResult;
  const structGap = pA.structure - pB.structure;
  const controlGap = pA.self_control - pB.self_control;

  let primaryManager: RoleActor = "shared";
  let finder: RoleActor = "shared";
  let planner: RoleActor = "shared";
  let tracker: RoleActor = "shared";
  let mentalGiver: RoleActor = "shared";
  let mentalReceiver: RoleActor = "shared";

  if (structGap >= 15 || controlGap >= 15) {
    primaryManager = "a";
    finder = "a";
    planner = "a";
    tracker = "a";
    mentalGiver = "b";
    mentalReceiver = "a";
  } else if (structGap <= -15 || controlGap <= -15) {
    primaryManager = "b";
    finder = "b";
    planner = "b";
    tracker = "b";
    mentalGiver = "a";
    mentalReceiver = "b";
  }

  let pmType: HouseholdPmResult["pmType"] = "SHARED_PM";
  if (Math.abs(structGap) >= 20 || Math.abs(controlGap) >= 20) {
    pmType = "HOUSEHOLD_PM";
  } else if (pA.structure < 45 && pB.structure < 45) {
    pmType = "MANAGEMENT_GAP";
  } else if (pA.self_control > 70 && pB.self_control > 70) {
    pmType = "OVERLOAD_RISK";
  } else if (primaryManager !== "shared") {
    pmType = "EXECUTOR_HEAVY";
  }

  const secondaryManager: RoleActor = primaryManager === "a" ? "b" : primaryManager === "b" ? "a" : "shared";

  const safePmLine = pmLine || (isEn
    ? `${primaryManager === "a" ? a : b} takes lead in managing home logistics.`
    : `${primaryManager === "a" ? a : b}님이 전반적인 집안일 기획과 가사 일정을 주로 이끌어갑니다.`);

  const safeMentalLoadNote = mentalLoadNote || (isEn
    ? "Sharing mental load explicitly prevents overload."
    : "보이지 않는 집안일 기획과 루틴을 명시적으로 공유하는 것이 번아웃 방지의 핵심입니다.");

  householdPm = {
    pmType,
    primaryManager,
    secondaryManager,
    finder,
    planner,
    tracker,
    mentalLoadGiver: mentalGiver,
    mentalLoadReceiver: mentalReceiver,
    narrative: [safePmLine, safeMentalLoadNote].filter(Boolean).join(" "),
  };

  // ----------------------------------------------------
  // 4.2 Planner vs Executor
  // ----------------------------------------------------
  const scorePlanA = pA.structure * 0.4 + pA.self_control * 0.3 + pA.decision_style * 0.3;
  const scorePlanB = pB.structure * 0.4 + pB.self_control * 0.3 + pB.decision_style * 0.3;
  const diffPlan = scorePlanA - scorePlanB;

  let roleA: OperatingStyleRole = scorePlanA > 60 ? "PLANNER" : scorePlanA < 45 ? "EXECUTOR" : "PLANNER_EXECUTOR";
  let roleB: OperatingStyleRole = scorePlanB > 60 ? "PLANNER" : scorePlanB < 45 ? "EXECUTOR" : "PLANNER_EXECUTOR";

  // Pair CE Dynamic Role Shift: If one dominates planning (> 15 diff), partner shifts to execution role
  if (diffPlan >= 15 && roleA === "PLANNER" && roleB === "PLANNER") {
    roleB = "PLANNER_EXECUTOR";
  } else if (diffPlan <= -15 && roleA === "PLANNER" && roleB === "PLANNER") {
    roleA = "PLANNER_EXECUTOR";
  }

  let alignmentType: PlannerExecutorResult["alignmentType"] = "flexible";
  let shiftNote = isEn
    ? "Both partners adjust roles fluidly depending on current commitments."
    : "상황에 따라 두 사람이 유연하게 집안 기획과 실행을 나누어 맡습니다.";

  if (roleA === "PLANNER" && (roleB === "EXECUTOR" || roleB === "PLANNER_EXECUTOR")) {
    alignmentType = "complementary";
    shiftNote = isEn
      ? `${a} designs the household operating structure while ${b} executes with practical speed.`
      : `${a}님이 집안 운영과 계획의 큰 틀을 잡으면, ${b}님이 실용적인 속도로 확실하게 실행합니다.`;
  } else if ((roleA === "EXECUTOR" || roleA === "PLANNER_EXECUTOR") && roleB === "PLANNER") {
    alignmentType = "complementary";
    shiftNote = isEn
      ? `${b} designs the household operating structure while ${a} executes with practical speed.`
      : `${b}님이 집안 운영과 계획의 큰 틀을 잡으면, ${a}님이 실용적인 속도로 확실하게 실행합니다.`;
  } else if (roleA === "PLANNER" && roleB === "PLANNER") {
    alignmentType = "dual_planner_tension";
    shiftNote = isEn
      ? `Both ${a} and ${b} have strong views on how home life should be structured, requiring deliberate domain division.`
      : `두 사람 모두 집안 정리와 계획에 명확한 주관을 가지고 있어, 자율 영역을 구체적으로 분할하는 것이 효과적입니다.`;
  } else if (roleA === "EXECUTOR" && roleB === "EXECUTOR") {
    alignmentType = "dual_executor_gap";
    shiftNote = isEn
      ? "Both lean toward immediate execution over long-term planning, so automated routines help prevent administrative gaps."
      : "두 사람 모두 장기 계획보다는 즉각 실행에 맞춰져 있어, 자동 결제나 고정 루틴을 세워두면 구멍을 방지할 수 있습니다.";
  }

  const plannerExecutor: PlannerExecutorResult = {
    roleA,
    roleB,
    shiftNote,
    alignmentType,
  };

  // ----------------------------------------------------
  // 4.3 Decision Power Map
  // ----------------------------------------------------
  const refinedCfo = refineHouseholdCfo({
    baseNickname: a,
    baseReason: "",
    nicknameA: a,
    nicknameB: b,
    countsA: ctx.tenGod.countsA,
    countsB: ctx.tenGod.countsB,
    branchCodesA: ctx.marriagePairAnalysis.chartA.branchCodes,
    branchCodesB: ctx.marriagePairAnalysis.chartB.branchCodes,
    wealthOfficerPowerA: params.cohabitationSignalsA?.wealth_officer_power ?? null,
    wealthOfficerPowerB: params.cohabitationSignalsB?.wealth_officer_power ?? null,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    dualCfoWar: params.pairCohabitation?.cfo_power_struggle?.dual_cfo_war,
    locale,
  });

  const cfoLeaderName = refinedCfo?.nickname ?? "";
  const cfoLeader: RoleActor = cfoLeaderName.includes(a) ? "a" : cfoLeaderName.includes(b) ? "b" : "shared";

  const domains: DomainPowerStage[] = [
    {
      domain: "money",
      domainLabel: isEn ? "Financial Management (CFO)" : "재정 관리 & CFO",
      proposer: cfoLeader === "a" ? "b" : "a",
      reviewer: "shared",
      decider: cfoLeader,
      executor: cfoLeader,
      meaning: isEn ? `CFO responsibility led primarily by ${cfoLeader === "a" ? a : b}.` : `집안 재정과 지출 통제권은 ${cfoLeader === "a" ? a : b}님이 맡습니다.`,
    },
    {
      domain: "home",
      domainLabel: isEn ? "Home Environment & Living" : "주거 공간 & 집안 환경",
      proposer: primaryManager,
      reviewer: "shared",
      decider: primaryManager,
      executor: primaryManager === "a" ? "b" : "a",
      meaning: isEn ? "Daily home logistics and environmental standards." : "주거 스타일과 집안 가전/가구 배치의 결정권.",
    },
    {
      domain: "career",
      domainLabel: isEn ? "Career & External Growth" : "커리어 & 일적 선택",
      proposer: "shared",
      reviewer: "shared",
      decider: "shared",
      executor: "shared",
      meaning: isEn ? "Individual autonomy with mutual consultation on major shifts." : "서로의 직업적 성장을 존중하되 큰 변화 시 사전 협의.",
    },
    {
      domain: "family",
      domainLabel: isEn ? "Family & In-Law Relations" : "원가족 & 처가/시가 관계",
      proposer: "shared",
      reviewer: "shared",
      decider: "shared",
      executor: "shared",
      meaning: isEn ? "Mutual defense wall protecting household boundaries." : "양가 간섭이나 외풍으로부터 서로의 새 가족 단위를 단단히 지켜주는 울타리.",
    },
    {
      domain: "daily_life",
      domainLabel: isEn ? "Daily Schedule & Leisure" : "일상 일정 & 휴식 템포",
      proposer: pA.stimulation > pB.stimulation ? "a" : "b",
      reviewer: "shared",
      decider: "shared",
      executor: "shared",
      meaning: isEn ? "Balancing social plans and personal recovery time." : "주말 일정을 정할 때 개인 휴식 시간과 외부 약속의 밸런스를 맞추는 영역.",
    },
    {
      domain: "parenting",
      domainLabel: isEn ? "Parenting & Education" : "자녀 양육 & 교육 방침",
      proposer: "shared",
      reviewer: "shared",
      decider: "shared",
      executor: "shared",
      meaning: isEn ? "Aligned values between emotional support and discipline." : "따뜻한 정서적 공감과 이성적 규칙의 조화.",
    },
    {
      domain: "large_purchase",
      domainLabel: isEn ? "Large Purchases & Assets" : "대형 지출 & 자산 투자",
      proposer: cfoLeader,
      reviewer: cfoLeader === "a" ? "b" : "a",
      decider: "shared",
      executor: cfoLeader,
      meaning: isEn ? "Joint decision requiring explicit 2-way approval." : "한 사람의 독단이 아니라 반드시 둘의 최종 승인이 필요한 결정.",
    },
  ];

  const decisionPowerMap: DecisionPowerMapResult = {
    domains,
    overallLeader: cfoLeader,
    balancingNote: isEn
      ? "Decision power is healthy when major financial decisions require joint review while daily logistics are delegated."
      : "큰 지출은 함께 결정하고, 매일의 사소한 집안일은 주도하는 사람에게 맡겨둘 때 가장 잡음이 적습니다.",
  };

  // ----------------------------------------------------
  // 4.4 Crisis Role
  // ----------------------------------------------------
  const countsA = ctx?.tenGod?.countsA ?? {};
  const countsB = ctx?.tenGod?.countsB ?? {};
  const branchA = ctx?.marriagePairAnalysis?.chartA?.branchCodes ?? new Set<string>();
  const branchB = ctx?.marriagePairAnalysis?.chartB?.branchCodes ?? new Set<string>();

  const rawCrisisLine = buildCrisisRoleLine(
    countsA,
    countsB,
    branchA,
    branchB,
    a,
    b,
  );
  const crisisLine = rawCrisisLine || (isEn
    ? `${a} leads practical problem solving during urgent household events, while ${b} stabilizes emotional reassurance.`
    : `갑작스러운 위기가 찾아오면 ${a}님이 먼저 수습책부터 찾고, ${b}님이 불안해하는 파트너의 마음을 안정적으로 다독여주는 편이에요.`);

  const crisisRoleA: CrisisRoleType = pA.practicality > 55 || pA.thinking_style > 55 ? "PROBLEM_SOLVER" : "EMOTIONAL_ANCHOR";
  const crisisRoleB: CrisisRoleType = pB.practicality > 55 || pB.thinking_style > 55 ? "PROBLEM_SOLVER" : "EMOTIONAL_ANCHOR";

  const crisisRole: CrisisRoleResult = {
    roleA: crisisRoleA,
    roleB: crisisRoleB,
    practicalLead: crisisRoleA === "PROBLEM_SOLVER" ? "a" : "b",
    emotionalAnchor: crisisRoleA === "EMOTIONAL_ANCHOR" ? "a" : "b",
    synergyType: crisisRoleA !== crisisRoleB ? "perfect_complement" : crisisRoleA === "PROBLEM_SOLVER" ? "dual_practical" : "dual_emotional",
    narrative: crisisLine,
  };

  // ----------------------------------------------------
  // 4.5 Career × Home Transition
  // ----------------------------------------------------
  const rawCareerLine = (params.psychMasterA && params.psychMasterB)
    ? buildCareerBalanceLine(params.psychMasterA, params.psychMasterB, a, b)
    : null;
  const careerLine = rawCareerLine || (isEn
    ? "Balancing career pursuits and home responsibilities through mutual respect."
    : "서로의 일과 성장을 존중하되, 한쪽에 가사 부담이 쏠리지 않도록 밸런스를 맞춥니다.");

  const careerHome: CareerHomeResult = {
    careerPriorityA: pA.recognition > 60 ? "high" : "moderate",
    careerPriorityB: pB.recognition > 60 ? "high" : "moderate",
    supportCapacityA: pA.empathy > 55 ? "high" : "moderate",
    supportCapacityB: pB.empathy > 55 ? "high" : "moderate",
    loadTransferRisk: (pA.recognition > 65 && pB.recognition > 65) ? "high" : "low",
    narrative: careerLine,
  };

  // ----------------------------------------------------
  // 4.6 Long-Term Compounding
  // ----------------------------------------------------
  const rawSynergyLine = (params.psychMasterA && params.psychMasterB)
    ? buildLongTermSynergyLine(params.psychMasterA, params.psychMasterB, a, b)
    : null;
  const synergyLine = rawSynergyLine || (isEn
    ? "Long-term partnership strengthens through steady, shared routines."
    : "이 관계는 거창한 다짐보다 '이 사람한테 맡기면 된다'는 일상의 단단한 신뢰가 쌓이면서 자산이 됩니다.");

  const longTermCompounding: LongTermCompoundingResult = {
    assets: [
      {
        title: isEn ? "Asset: Shared Financial Discipline" : "자산: 명확한 재정 주도권과 지출 규율",
        body: isEn
          ? `Clear CFO leadership under ${cfoLeader === "a" ? a : b} creates steady long-term capital accumulation.`
          : `${cfoLeader === "a" ? a : b}님이 확실한 지출 가이드라인을 잡아주어 가계 자산이 차곡차곡 모이는 습관이 생깁니다.`,
        evidenceIds: ["cfo_canonical", "ten_god_wealth"],
      },
      {
        title: isEn ? "Asset: Complementary Crisis Response" : "자산: 위기 때 서로를 구하는 역할 분담",
        body: crisisLine,
        evidenceIds: ["crisis_role_line", "psych_resilience"],
      },
    ],
    liabilities: [
      {
        title: isEn ? "Liability: Unspoken Mental Load Accumulation" : "부채: 한쪽에 쏠리는 가사 PM 서운함",
        body: safeMentalLoadNote,
        evidenceIds: ["mental_load_note", "psych_structure"],
      },
    ],
    compoundingSummary: synergyLine,
  };

  // ----------------------------------------------------
  // 4.7 Life Partnership Verdict
  // ----------------------------------------------------
  const rawSpaceClause = (params.psychMasterA && params.psychMasterB)
    ? buildSpaceVsTogetherClauses(params.psychMasterA, params.psychMasterB, a, b)
    : null;
  const spaceClause = rawSpaceClause || (isEn
    ? "Respecting individual recovery time preserves long-term intimacy."
    : "서로에게 혼자만의 충전 시간을 인정해줄 때 부부의 안식함이 오래 지속됩니다.");

  const lifePartnershipVerdict: LifePartnershipVerdictResult = {
    lifeSyncPct: ctx.masterScores.lifeSynergyPct ?? 82,
    operationSyncPct: 85,
    emotionalSyncPct: ctx.masterScores.romanticFitPct ?? 80,
    longTermSynergyPct: Math.max(75, 100 - (ctx.masterScores.homeRiskPct ?? 20)),
    oneLineVerdict: isEn
      ? `${a} & ${b} build a resilient household partnership grounded in practical alignment.`
      : `${a}님과 ${b}님은 서로의 생활 방식과 운영 주도권을 존중하며 깊은 안정감을 만드는 부부입니다.`,
    narrative: [spaceClause, synergyLine].filter(Boolean).join(" "),
  };

  // ----------------------------------------------------
  // 5. CE vs 11-Axis Discrepancy Trace
  // ----------------------------------------------------
  const discrepancies: DiscrepancyTrace[] = [
    {
      domain: "Operating Responsibility",
      innateTendency: isEn ? `${a} innate responsibility is strong in birth-chart.` : `${a}님의 사주 기질상 관리 및 책임성이 높습니다.`,
      currentBehavior: isEn ? `Current psych structure score is ${pA.structure}.` : `현재 설문 상 계획구조화 점수는 ${pA.structure}점입니다.`,
      pairDynamicShift: isEn ? `When paired with ${b}, responsibility settles into ${primaryManager}.` : `${b}님과 함께 있을 때 실제 집안 운영 책임은 ${primaryManager === "a" ? a : b}님 쪽으로 수렴합니다.`,
      summaryDiscrepancy: isEn
        ? "Innate sense of duty remains high, but day-to-day execution depends on established household routines."
        : "원래의 책임감은 높으나, 일상 속 실제 실행은 두 사람이 약속한 고정 루틴에 의해 좌우됩니다.",
    },
  ];

  // ----------------------------------------------------
  // 6 & 7. Candidate Engine & Multi-Signal Synthesis
  // ----------------------------------------------------
  const synthesisCandidates: SynthesisCandidate[] = [
    {
      synthesisKey: "household_operating_complement",
      title: isEn ? "Household Operating Complement" : "운영적 상보 보완 시너지",
      body: shiftNote,
      inputSignals: ["psych_structure", "psych_self_control", "saju_ten_god"],
    },
    {
      synthesisKey: "career_home_balance",
      title: isEn ? "Career/Home Balance Alignment" : "일-가정 밸런스 및 과부하 위험",
      body: careerLine,
      inputSignals: ["psych_recognition", "psych_empathy"],
    },
  ];

  const candidateContract: CandidateContractItem[] = [
    {
      id: "cand.cfo",
      kind: "INSIGHT_CANDIDATE",
      title: isEn ? "Operating CFO Assignment" : "부부 운영 CFO 지정",
      body: refinedCfo,
      evidenceIds: ["cfo_canonical"],
    },
    {
      id: "cand.mental_load",
      kind: "INSIGHT_CANDIDATE",
      title: isEn ? "Mental Load Balance" : "가사 PM 및 멘탈로드",
      body: safeMentalLoadNote,
      evidenceIds: ["mental_load_note"],
    },
    {
      id: "cand.crisis",
      kind: "INSIGHT_CANDIDATE",
      title: isEn ? "Crisis Handling Pair Dynamic" : "위기 대처 파트너십",
      body: crisisLine,
      evidenceIds: ["crisis_role_line"],
    },
    {
      id: "cand.synthesis_operating",
      kind: "SYNTHESIS_CANDIDATE",
      title: isEn ? "Operating Synergy" : "운영 시너지 종합",
      body: shiftNote,
      evidenceIds: ["psych_structure", "saju_ten_god"],
    },
  ];

  // Phase 4 Ported Capabilities
  const marriage11Axis = buildMarriage11AxisInsights(params.psychMasterA, params.psychMasterB, a, b, locale);
  const conflict4Stage = buildMarriageConflict4Stage(params.psychMasterA, params.psychMasterB, a, b, locale);
  const loveDeliveryMatch = buildMarriageLoveDeliveryMatch(params.psychMasterA, params.psychMasterB, a, b, locale);
  const expectationsAndNeeds = buildMarriageExpectationsAndNeeds(params.psychMasterA, params.psychMasterB, a, b, locale);
  const emergencySosCombined = buildMarriageEmergencySosCombined(ctx.deEscalation, a, b, locale);

  // Phase 5 Marriage-Specific Gaps
  const inLawBoundary = buildMarriageInLawBoundary(params.psychMasterA, params.psychMasterB, params.sajuJsonA, params.sajuJsonB, a, b, locale);
  const lifeStageTransition = buildMarriageLifeStageTransition(params.psychMasterA, params.psychMasterB, a, b, locale);
  const coupleBurnout = buildMarriageCoupleBurnout(params.psychMasterA, params.psychMasterB, a, b, locale);
  const careerHomeTransition = buildMarriageCareerHomeTransition(params.psychMasterA, params.psychMasterB, a, b, locale);

  // Phase 5.5 Economic Partnership Expansion
  const economicPartnership = buildMarriageEconomicPartnership(
    params.psychMasterA,
    params.psychMasterB,
    params.sajuJsonA,
    params.sajuJsonB,
    a,
    b,
    locale
  );

  return {
    householdPm,
    plannerExecutor,
    decisionPowerMap,
    crisisRole,
    careerHome,
    longTermCompounding,
    lifePartnershipVerdict,
    discrepancies,
    synthesisCandidates,
    candidateContract,
    marriage11Axis,
    conflict4Stage,
    loveDeliveryMatch,
    expectationsAndNeeds,
    emergencySosCombined,
    inLawBoundary,
    lifeStageTransition,
    coupleBurnout,
    careerHomeTransition,
    economicPartnership,
  };
}
