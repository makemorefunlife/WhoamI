import type {
  CoupleLifePartnerRole,
  CoupleHouseholdOperatingPattern,
  CoupleMentalLoadPattern,
  CoupleMoneyPattern,
  CoupleMajorDecisionPattern,
  CoupleChorePattern,
  CoupleSpaceTogethernessPattern,
  CoupleExtendedFamilyBoundary,
  CoupleCrisisPattern,
  CoupleRoleLockPattern,
  CoupleLongTermIntimacyPattern,
  CoupleFutureOperatingPattern,
  CoupleSynthesisResult,
  CoupleConflictLoop,
  CoupleRepairPattern,
  CoupleActionCandidate,
  CoupleGrowthTransition,
} from "./coupleStoryPlanTypes";
import type { HouseholdPartnershipReport } from "./homeReportTemplate";
import type { CoupleActionPlanSection } from "@/lib/relationship/enrichment/marriageCoupleActionPlan";

export function buildCoupleLifePartnerRoleP1(params: {
  nameA: string;
  nameB: string;
  homeReport: HouseholdPartnershipReport;
}): CoupleLifePartnerRole {
  const { nameA, nameB, homeReport } = params;
  return {
    selfRole: `${nameA}는 가정의 장기적 방향성을 수립하고 현실적 기준을 잡아주는 든든한 가이드 역할을 맡습니다.`,
    partnerRole: `${nameB}는 일상 가사의 세밀한 운영과 가정 내 따뜻한 정서적 안도감을 채워주는 앵커 역할을 맡습니다.`,
    coupleSynergy: "서로의 명확한 시야와 포용력이 결합하여 어떤 어려움 앞에서도 쉽게 흔들리지 않는 집안 기틀을 형성합니다.",
    evidenceIds: ["couple.life_partner_role", "couple.home_fit"],
    confidence: "high",
  };
}

export function buildCoupleHouseholdOperatingP1(): CoupleHouseholdOperatingPattern {
  return {
    noticingOwner: "partner",
    planningOwner: "self",
    executionOwner: "shared",
    followUpOwner: "partner",
    coordinationPattern: "한 명이 필요한 과제를 먼저 파악하고 아젠다를 제시하면, 둘이 함께 템포를 맞춰 분담 실행",
    overloadRisk: "가사 알아채기와 마무리가 특정 한 사람에게 쏠리지 않도록 정기적인 체계 점검 필요",
    evidenceIds: ["couple.household_operating"],
    confidence: "high",
  };
}

export function buildCoupleMentalLoadP1(params: {
  hasMentalLoadEvidence: boolean;
}): CoupleMentalLoadPattern {
  if (!params.hasMentalLoadEvidence) {
    return {
      primaryCoordinator: "shared",
      invisibleLoadRisk: "insufficient",
      recognitionNeed: "현재 보이지 않는 멘탈로드 불균형 신호가 미비하여 가사 노고 상호 인정에 집중",
      redistributionNeed: "현재 가사 R&R 분담 유지",
      evidenceIds: ["couple.mental_load_insufficient"],
      confidence: "medium",
    };
  }

  return {
    primaryCoordinator: "partner",
    invisibleLoadRisk: "high",
    recognitionNeed: "보이지 않는 가정 관리(생필품 관리, 기념일/양가 챙김) 노고에 대한 세심한 인정과 감사 표현",
    redistributionNeed: "가정 관리 과제를 시각화하여 매주 10분간 분담 리스트 작성",
    evidenceIds: ["couple.mental_load_high"],
    confidence: "high",
  };
}

export function buildCoupleMoneyP1(params: {
  homeReport: HouseholdPartnershipReport;
}): CoupleMoneyPattern {
  return {
    dailySpendingStyle: "일상 소비에서는 합리적인 실용성을 중시하며 생활비 예산 범위를 준수함",
    savingOrientation: "장기적인 자산 안정성을 위해 정기적인 저축 및 위험 관리 지향",
    sharedExpenseHandling: "공동 생활비 통장을 정액 출자하여 관리하고 개인 용돈 영역 독립 유지",
    financialRiskSensitivity: "불확실한 고위험 투자보다는 검증된 안전 자산과 단계적 자산 증식 선호",
    evidenceIds: ["couple.money_pattern"],
  };
}

export function buildCoupleMajorDecisionP1(): CoupleMajorDecisionPattern {
  return {
    proposer: "self",
    evaluator: "partner",
    riskChecker: "partner",
    decisionTempo: "주거/큰돈 지출 시 1차 전략 제안 후 48시간의 독립적 쿨다운 검토 시간을 가짐",
    jointDecisionRule: "부동산/큰 지출 등 대형 사안은 양자 100% 동의 시에만 최종 결정 진행",
    vetoBoundary: "한쪽이 명확한 리스크를 이유로 거부권(Veto)을 행사할 경우 즉시 추진 정지 및 재검토",
    evidenceIds: ["couple.major_decisions"],
    confidence: "high",
  };
}

export function buildCoupleChoreP1(): CoupleChorePattern {
  return {
    cleanlinessStandardGap: "정돈 수준과 마감 시점에 대한 개인차 존재 (즉시 정돈 vs 모아서 정돈)",
    taskVisibility: "주요 가사 항목(설거지, 청소, 분리수거)을 눈에 보이는 분담표로 정용화",
    timingPreference: "퇴근 직후 30분간 가사 집중 완수 후 오롯한 휴식 시간 진입 권장",
    choreDivisionStyle: "서로 선호하는 가사 구역(주방/거실/빨래)을 전담제로 명확히 구분",
    evidenceIds: ["couple.chores"],
  };
}

export function buildCoupleSpaceTogethernessP1(): CoupleSpaceTogethernessPattern {
  return {
    closenessStyle: "서로에게 깊은 정서적 안정감을 주면서도 개인의 독립적 충전 시간을 존중함",
    personalSpaceNeed: "하루 최소 1시간 이상 오롯이 혼자만의 취미나 재충전을 위한 공간 필요",
    rechargeRhythmMatch: "한 명은 외출을 통해 에너지를 얻고 다른 한 명은 집에서 조용히 쉬며 에너지 충전",
    weekendTogethernessPattern: "주말 토요일은 함께하는 식사/외출, 일요일은 각자 개인 충전 시간 배분",
    evidenceIds: ["couple.space_togetherness"],
  };
}

export function buildCoupleExtendedFamilyP1(): CoupleExtendedFamilyBoundary {
  return {
    familyInvolvementStyle: "양가 부모님께 효도하되, 우리 부부의 삶의 의사결정이 우선되는 건강한 거리 유지",
    privacyBoundary: "부부간의 갈등이나 재정/주거 사안은 양가에 직접 노출하지 않고 둘만의 영역으로 보호",
    holidayEventHandling: "명절 및 양가 행사 참석 시 사전 합의된 시간과 역할 분담 기준을 준수",
    loyaltyBalanceRule: "양가 이슈 발생 시 내 부모님 소통은 내가 담당하여 파트너의 부담 최소화",
    evidenceIds: ["couple.extended_family"],
  };
}

export function buildCoupleCrisisP1(): CoupleCrisisPattern {
  return {
    logisticsHandler: "self",
    emotionalStabilizer: "partner",
    decisionPusher: "self",
    riskChecker: "partner",
    externalCommunicator: "self",
    operationalRiskUnderStress: "갑작스러운 환경 변화나 비상 상황 시 감정적 조급함으로 상대 다그침 경계",
    evidenceIds: ["couple.crisis"],
    confidence: "high",
  };
}

export function buildCoupleRoleLockP1(): CoupleRoleLockPattern {
  return {
    repeatingConflictRole: "서운함이 생겼을 때 '명확한 대답을 다그치는 추격자' vs '침묵하며 동굴로 들어가는 회피자' 고착",
    triggerContext: "가사 미이행이나 감정적 피로가 누적된 상태에서 피드백을 전달할 때 발화",
    lockMechanism: "한쪽의 확인 요구가 상대에게 압박으로 작용하여 대화를 닫게 만듦",
    deEscalationBreakPattern: "즉시 대화를 정지하고 30분 뒤 다시 만날 시각을 숫자로 분명히 약속한 후 동굴로 물러남",
    evidenceIds: ["couple.role_lock"],
  };
}

export function buildCoupleLongTermIntimacyPattern(): CoupleLongTermIntimacyPattern {
  return {
    sustainingFactors: [
      "서로의 노고에 대한 매일의 다정한 말 한마디와 스킨십",
      "주 1회 이상 둘만의 오롯한 대화와 데이트 타임 보장",
    ],
    erosionRisks: [
      "가사/육아 피로로 인해 정서적 대화가 기능적 업무 대화로만 바뀌는 현상",
      "감정이 서운할 때 표현하지 않고 속으로 삼켜 서운함이 누적되는 위험",
    ],
    intimacyMaintenanceNeed: "기능적인 집안 운영 파트너를 넘어 '애정 어린 연인'으로서의 관계성 상기",
    evidenceIds: ["couple.long_term_intimacy"],
  };
}

export function buildCoupleFutureOperatingP1(): CoupleFutureOperatingPattern {
  return {
    informationStage: "주거 및 자산 관련 정보를 투명하게 100% 공유",
    independentReflectionRule: "중요 사안에 대해 각자 최소 24시간 생각 정리",
    jointDiscussionStyle: "장단점 지표를 서면으로 작성하여 1:1 논의",
    riskReviewGate: "최악의 시나리오 및 자금 리스크 검증 완료",
    finalAgreementRule: "양자 전원 합의 시에만 실행 착수",
    evidenceIds: ["couple.future_operating"],
  };
}

export function buildCoupleCompositeSynthesisP1(params: {
  homeReport: HouseholdPartnershipReport;
}): CoupleSynthesisResult[] {
  const { homeReport } = params;
  const results: CoupleSynthesisResult[] = [];
  const risk = homeReport.snapshot?.risk_pct ?? 20;

  // Composite A: Strong Love × Weak Household Fit
  results.push({
    ruleId: "couple.synth.strong_love_weak_household",
    category: "strong_love_weak_household",
    headline: "애정은 깊으나 생활 운영의 정교한 룰 작성이 필요한 관계",
    narrative: "두 사람의 정서적 유대와 애정은 깊지만, 집안일 처리와 생활 템포의 기준 차이로 일상에서 피로가 누적될 수 있어 정밀한 가사 룰이 필요합니다.",
    evidenceIds: ["couple.home_fit", "couple.chores"],
  });

  // Composite B: Financial Align × Major Decision Clash
  if (risk > 30) {
    results.push({
      ruleId: "couple.synth.financial_align_major_decision_clash",
      category: "financial_align_major_decision_clash",
      headline: "일상 소비 가치관은 알맞으나 대형 지출 시 주도권 조율이 필요한 파트너",
      narrative: "매일의 생활비 관리는 알뜰하게 조화를 이루지만, 주거 이사나 큰돈 투자 등 대형 지출을 결정할 때 권한 상충이 발생할 수 있습니다.",
      evidenceIds: ["couple.money", "couple.major_decisions"],
    });
  }

  // Composite C: High Closeness × High Autonomy Need
  results.push({
    ruleId: "couple.synth.high_closeness_high_autonomy",
    category: "high_closeness_high_autonomy",
    headline: "깊은 애정 속에서도 서로의 개인 공간을 철저히 존중해야 하는 시너지 부부",
    narrative: "서로를 향한 애정과 신뢰가 깊은 만큼, 오롯이 혼자 숨 쉴 수 있는 시간과 공간을 보장해줄 때 관계의 탄력성이 극대화됩니다.",
    evidenceIds: ["couple.space_togetherness"],
  });

  return results;
}

export function buildCoupleConflictLoopP0(params: {
  homeReport: HouseholdPartnershipReport;
}): CoupleConflictLoop {
  const { homeReport } = params;
  return {
    trigger: homeReport.overview?.risk_point || "가사 미이행이나 집안일 처리 기준의 차이로 감정이 서운해질 때",
    selfResponse: "속상함과 불만을 밖으로 꺼내어 즉각적인 확답과 개선 요구",
    partnerResponse: "갑작스러운 피드백에 입을 닫고 침묵의 동굴로 물러남",
    roleLockMechanism: "추격자의 확인 다그침과 회피자의 침묵이 악순환 고리를 형성하여 대화 단절",
    breakPattern: "즉시 언쟁을 멈추고 30분간 떨어져 열을 식힌 후 팩트 기반 필요사항만 공유",
    evidenceIds: ["couple.risk_point", "couple.conflict"],
  };
}

export function buildCoupleRepairPatternP0(params: {
  actionPlan?: CoupleActionPlanSection;
}): CoupleRepairPattern {
  const { actionPlan } = params;
  return {
    deEscalateSos: actionPlan?.sos_deescalation?.script || "지금 서운함이 격해졌으니 30분간 각자 생각 정리하고 저녁 8시에 다시 얘기하자.",
    repairSequence: [
      "1. 잘잘못을 따지지 말고 '나는 불안했어'라는 내 마음의 필요만 말합니다.",
      "2. 상대의 동굴 시간을 조급하게 다그치지 않고 돌아올 시각을 숫자로 약속받습니다.",
      "3. 대화가 재개되면 다음번 가사/생활 룰 하나만 단순하게 수정하여 확정합니다.",
    ],
    routineProcess: "매주 일요일 저녁 15분간 금주 가사 분담 및 서로를 향한 감사 나눔 루틴",
    boundaryRule: "상대의 침묵이나 다소 느린 템포를 나에 대한 무관심으로 단정 짓지 않기",
    householdResetRule: "가사 관리가 한쪽으로 쏠렸을 때 가사 지표 리스트를 작성하여 정당하게 재배분",
    evidenceIds: ["couple.action_plan"],
  };
}

export function buildCoupleNormalizedActionsP1(params: {
  nameA: string;
  nameB: string;
  actionPlan?: CoupleActionPlanSection;
}): CoupleActionCandidate[] {
  const { nameA, nameB, actionPlan } = params;
  const actions: CoupleActionCandidate[] = [];

  actions.push({
    id: "act_couple_sos",
    meaningId: "meaning_couple_sos",
    perspective: "couple",
    actionType: "DE_ESCALATE",
    title: "갈등 시 30분 동굴 타임 및 시각 숫자 약속",
    description: actionPlan?.sos_deescalation?.script || "감정이 격해졌을 때는 즉시 언쟁을 멈추고 30분 뒤 다시 대화할 시각을 약속하세요.",
    evidenceIds: ["couple.sos_script"],
    primarySemanticOwner: "user_manual",
  });

  actions.push({
    id: "act_couple_repair",
    meaningId: "meaning_couple_repair",
    perspective: "couple",
    actionType: "REPAIR",
    title: "비난 멈추고 '나의 필요'만 전달하는 대화법",
    description: "상대를 탓하기보다 '나 지금 불안해'라고 내 마음만 툭 꺼내어 전달해보세요.",
    evidenceIds: ["couple.action_plan"],
    primarySemanticOwner: "user_manual",
  });

  actions.push({
    id: "act_couple_self",
    meaningId: "meaning_couple_self",
    perspective: "self",
    actionType: "HOUSEHOLD",
    title: `${nameA}를 위한 조언: 파트너의 노고 알아채고 다정한 감사 전달`,
    description: actionPlan?.prescriptions_a?.[0] || "당연하게 여겨지기 쉬운 일상 가사와 챙김에 대해 따뜻한 다정한 말 한마디를 건네보세요.",
    evidenceIds: ["couple.prescriptions_a"],
    primarySemanticOwner: "user_manual",
  });

  actions.push({
    id: "act_couple_partner",
    meaningId: "meaning_couple_partner",
    perspective: "partner",
    actionType: "BOUNDARY",
    title: `${nameB}를 위한 조언: 말문이 막힐 때 돌아올 시간 정하고 물러나기`,
    description: actionPlan?.prescriptions_b?.[0] || "무작정 침묵하기보다 '30분만 생각하고 올게'라며 언제 돌아올지 시각을 꼭 전해주세요.",
    evidenceIds: ["couple.prescriptions_b"],
    primarySemanticOwner: "user_manual",
  });

  return actions;
}

export function buildCoupleGrowthTransitionP1(): CoupleGrowthTransition {
  return {
    currentPattern: "가사/생활 운영 피로 누적 및 추격/회피 갈등 고착 패턴",
    recommendedAdjustment: "가정 PM R&R 서면 공유 및 30분 쿨다운 소통 수칙 준수",
    targetOperatingModel: "서로의 공간이 존중받고 정서적 안도감이 넘치는 성숙한 부부 파트너십",
    evidenceIds: ["couple.growth_transition"],
  };
}
