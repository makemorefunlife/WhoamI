import type {
  WorkRoleAuthorityPattern,
  WorkDecisionRightsPattern,
  WorkFeedbackPattern,
  SoloVsCollaborativeThinking,
  WorkCrisisPattern,
  WorkErrorResponse,
  WorkProjectFit,
  WorkAvoidCombination,
  WorkSynthesisResult,
  WorkConflictLoop,
  WorkRepairPattern,
  WorkActionCandidate,
  WorkGrowthTransition,
} from "./workStoryPlanTypes";
import type { OfficePartnershipReport } from "./officeReportTemplate";
import type { WorkPrescriptionPack } from "./workPrescriptionTypes";

export function buildWorkRoleAuthorityP1(params: {
  nameA: string;
  nameB: string;
  officeReport: OfficePartnershipReport;
}): WorkRoleAuthorityPattern {
  const { nameA, nameB, officeReport } = params;
  const overview = officeReport.overview;

  return {
    directionOwner: "self",
    executionOwner: "colleague",
    coordinationOwner: "shared",
    qualityOwner: "colleague",
    externalOwner: "self",
    overlapRisk: "의사결정권과 실행 권한이 명확히 나뉘어 있어 권한 침해 리스크가 낮고 시너지가 큼",
    evidenceIds: ["work.overview.partnership_fit", "work.role_division"],
    confidence: "high",
  };
}

export function buildWorkDecisionRightsP1(): WorkDecisionRightsPattern {
  return {
    proposer: "self",
    decisionOwner: "self",
    validator: "colleague",
    decisionTempo: "목표 설정 및 전략은 신속히 제안하고, 1차 검수는 상호 검증 게이트를 거침",
    jointDecisionRisk: "공동 주도권 영역에서 사전 R&R 미확정 시 결정 교착 리스크 존재",
    escalationRule: "50:50 의견 대립 시 24시간 내 팩트 기반 데이터 게이트로 결론 도출",
    evidenceIds: ["work.decision_style", "work.structure"],
  };
}

export function buildWorkFeedbackP1(params: {
  officeReport: OfficePartnershipReport;
}): WorkFeedbackPattern {
  return {
    selfReceiveStyle: "사실과 성과 지표 중심의 직설적이고 명확한 피드백 선호",
    colleagueReceiveStyle: "노력과 맥락에 대한 배려가 담긴 1:1 비공개 쿠션 피드백 선호",
    preferredDelivery: "공개 회의석상에서의 즉흥적 지적을 피하고 1:1 면담 체계 활용",
    publicVsPrivate: "private_only",
    evidenceIds: ["work.empathy", "work.practicality"],
  };
}

export function buildSoloVsCollaborativeThinkingP1(): SoloVsCollaborativeThinking {
  return {
    thinkingStyle: "한 명은 혼자서 사전 구조화를 마친 후 논의를 선호하고, 다른 한 명은 라이브 브레인스토밍 선호",
    preparationPreference: "회의 시작 전 간단한 1쪽 아젠다 메모 공유 체계 권장",
    brainstormingFit: "자유로운 의견 도출과 검증 릴레이의 상호 보완성 우수",
    evidenceIds: ["work.thinking_style", "work.structure"],
    confidence: "high",
  };
}

export function buildWorkCrisisP1(): WorkCrisisPattern {
  return {
    pressureModeSelf: "마감 위기 시 현실적인 우선순위를 재조정하며 빠르게 결단을 내림",
    pressureModeColleague: "압박 상황에서 리스크를 꼼꼼히 점검하며 묵묵히 실행을 완수함",
    realityStabilizer: "colleague",
    decisionPusher: "self",
    riskChecker: "colleague",
    externalCommunicator: "self",
    operationalRisk: "동시 과부하 발생 시 업무 인계 인터페이스가 미흡해질 위험 경계",
    evidenceIds: ["work.self_control", "work.resilience"],
    confidence: "high",
  };
}

export function buildWorkErrorResponseP1(): WorkErrorResponse {
  return {
    selfMistakeResponse: "실수 발생 시 원인 분석과 비난 대신 즉시 현실적인 수정 행동 착수",
    colleagueMistakeResponse: "실수를 전파하기보다 1:1로 가이드하여 빠르게 보완하도록 지지",
    recoveryMode: "책임 소재 다툼을 멈추고 시스템적 재발 방지 절차 수립",
    accountabilityNeed: "공개적인 사과보다 정밀한 인계 수칙 보완을 중시",
    evidenceIds: ["work.resilience", "work.conflict_style"],
    confidence: "high",
  };
}

export function buildWorkProjectFitP1(): WorkProjectFit {
  return {
    bestConditions: [
      "신규 사업 기획 및 빠른 의사결정이 요구되는 혁신 프로젝트",
      "전략 수립과 체계적인 실행 관리가 명확히 분리된 대형 프로젝트",
    ],
    strongestPairContribution: ["결단력 있는 과감한 추진과 꼼꼼한 품질 검수의 조화"],
    watchConditions: ["R&R이 모호하거나 결정권자가 2명으로 겹치는 단순 유지보수 건"],
    evidenceIds: ["work.project_fit"],
  };
}

export function buildWorkAvoidCombinationP1(): WorkAvoidCombination {
  return {
    operatingModelRisks: [
      "결정권자(DRI)가 지정되지 않은 채 50:50으로 상의하는 운영 방식",
      "검수 절차 없이 추진 속도만 올리다 품질 구멍이 생기는 방식",
    ],
    riskMitigation: "프로젝트 시작 전 단일 결정권자(DRI)와 1차 검수 담당자를 서면 확정",
    evidenceIds: ["work.avoid_combination"],
  };
}

export function buildWorkCompositeSynthesisP1(params: {
  officeReport: OfficePartnershipReport;
}): WorkSynthesisResult[] {
  const { officeReport } = params;
  const results: WorkSynthesisResult[] = [];
  const risk = officeReport.metrics?.risk_pct ?? 20;

  // Composite A: Complementary Authority Clash
  results.push({
    ruleId: "work.synth.complementary_authority_clash",
    category: "complementary_authority_clash",
    headline: "강점은 완벽히 보완되지만 결정권 중복 시 부딪히는 조합",
    narrative: "서로의 역량과 시너지는 훌륭하지만, 최종 결정권이 모호해지면 회의실에서 주도권 대립이 발생할 수 있는 시너지 파트너십입니다.",
    evidenceIds: ["work.role_division", "work.risk_pct"],
  });

  // Composite B: High Fit × Feedback Mismatch
  if (risk > 30) {
    results.push({
      ruleId: "work.synth.high_fit_feedback_mismatch",
      category: "high_fit_feedback_mismatch",
      headline: "업무 핏은 뛰어나나 피드백 전달 방식의 조율이 필요한 관계",
      narrative: "업무 실행력은 서로를 깊이 신뢰하지만, 피드백을 전달할 때 팩트 중심 직설과 감정 쿠션 요구의 차이를 다듬어야 합니다.",
      evidenceIds: ["work.empathy", "work.practicality"],
    });
  }

  // Composite C: Fast Decision × High Risk Sensitivity
  results.push({
    ruleId: "work.synth.fast_decision_high_risk",
    category: "fast_decision_high_risk",
    headline: "빠른 결단력과 신중한 리스크 검수가 만나 안전속도를 내는 파트너",
    narrative: "한 명의 과감한 결단력에 다른 한 명의 정밀한 리스크 검수가 더해져, 위험을 사전에 차단하며 빠르게 전진하는 구조입니다.",
    evidenceIds: ["work.decision_style", "work.structure"],
  });

  return results;
}

export function buildWorkConflictLoopP0(params: {
  officeReport: OfficePartnershipReport;
}): WorkConflictLoop {
  const { officeReport } = params;
  return {
    trigger: officeReport.overview?.risk_point ?? "",
    selfResponse: "속도와 현실적 성과를 강조하며 빠른 결정 촉구",
    colleagueResponse: "리스크와 품질 문제를 들어 신중한 검토 요구",
    escalationMechanism: "상대의 지적을 비협조로 오해하거나 조급함으로 다그쳐 갈등 격화",
    breakPattern: "회의를 즉시 멈추고 1쪽 팩트 지표를 작성하여 1차 검수 게이트 적용",
    evidenceIds: ["work.risk_point", "friend.conflict_style"],
  };
}

export function buildWorkRepairPatternP0(params: {
  prescriptions?: WorkPrescriptionPack;
}): WorkRepairPattern {
  const { prescriptions } = params;
  return {
    deEscalateSos: prescriptions?.sos_script?.[0] ?? "",
    repairSequence: [
      "1. 감정적 언쟁을 즉시 멈추고 회의를 15분간 정지합니다.",
      "2. 팩트 데이터와 결정권자(DRI)를 서면으로 재확인합니다.",
      "3. 1:1로 감사와 존중을 전하며 다음 인계 수칙을 확정합니다.",
    ],
    routineProcess: "매주 월요일 10분간 업무 R&R 및 금주 목표 체크인 실행",
    boundaryRule: "상대의 전문 검수 영역에 감정적 비난이나 비공식 지시 금지",
    evidenceIds: ["work.prescriptions_a", "work.prescriptions_b"],
  };
}

export function buildWorkNormalizedActionsP1(params: {
  nameA: string;
  nameB: string;
  prescriptions?: WorkPrescriptionPack;
}): WorkActionCandidate[] {
  const { nameA, nameB, prescriptions } = params;
  const actions: WorkActionCandidate[] = [];

  actions.push({
    id: "act_work_sos",
    meaningId: "meaning_work_sos",
    perspective: "team",
    actionType: "DE_ESCALATE",
    title: "업무 교착 시 15분 회의 일시 정지 수칙",
    description: prescriptions?.sos_script?.[0] ?? "",
    evidenceIds: ["work.sos_script"],
    primarySemanticOwner: "user_manual",
  });

  actions.push({
    id: "act_work_repair",
    meaningId: "meaning_work_repair",
    perspective: "team",
    actionType: "REPAIR",
    title: "1:1 R&R 재조정 및 업무 신뢰 회복",
    description: "잘잘못을 다투기보다 다음 인계 시점과 검수 게이트를 명확히 재정의하세요.",
    evidenceIds: ["work.prescriptions_a"],
    primarySemanticOwner: "user_manual",
  });

  actions.push({
    id: "act_work_self",
    meaningId: "meaning_work_self",
    perspective: "self",
    actionType: "DECISION",
    title: `${nameA}를 위한 조언: 최종 결단 전 검수 의견 경청하기`,
    description: prescriptions?.prescriptions_a?.[0] ?? "",
    evidenceIds: ["work.prescriptions_a"],
    primarySemanticOwner: "user_manual",
  });

  actions.push({
    id: "act_work_colleague",
    meaningId: "meaning_work_colleague",
    perspective: "colleague",
    actionType: "FEEDBACK",
    title: `${nameB}를 위한 조언: 피드백 쿠션과 개선안 동시 제시`,
    description: prescriptions?.prescriptions_b?.[0] ?? "",
    evidenceIds: ["work.prescriptions_b"],
    primarySemanticOwner: "user_manual",
  });

  return actions;
}

export function buildWorkGrowthTransitionP1(): WorkGrowthTransition {
  return {
    currentPattern: "권한 중복으로 인한 회의 교착 및 피드백 템포 마찰 패턴",
    recommendedAdjustment: "단일 결정권자(DRI) 확정 및 팩트 중심 1:1 피드백 체계 구축",
    targetOperatingModel: "높은 의사결정 속도와 완벽한 품질 검수가 공존하는 시너지 파트너십",
    evidenceIds: ["work.growth_transition"],
  };
}
