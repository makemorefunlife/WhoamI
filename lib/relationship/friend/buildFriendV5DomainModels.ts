import type {
  FriendshipRole,
  FriendContactDistancePattern,
  FriendOneOnOneVsGroup,
  FriendJealousyExclusion,
  FriendshipInitiativePattern,
  LongDistanceSustainability,
  FriendSynthesisResult,
  FriendConflictLoop,
  FriendRepairPattern,
  FriendActionCandidate,
  FriendGrowthTransition,
  FriendInsightCandidate,
} from "./friendStoryPlanTypes";
import type { FriendSocialReport } from "./friendReportTemplate";
import type { FriendPrescriptionPack } from "./friendPrescriptionTypes";

export function buildFriendshipRoleP1(params: {
  nameA: string;
  nameB: string;
  socialReport: FriendSocialReport;
}): FriendshipRole {
  const { nameA, nameB, socialReport } = params;
  const overview = socialReport.overview;

  return {
    selfToFriend: `${nameA}는 ${nameB}에게 ${overview?.gift_from_a || "새로운 자극과 활력을 불어넣어 주는 유쾌한 페이스메이커"} 역할을 합니다.`,
    friendToSelf: `${nameB}는 ${nameA}에게 ${overview?.gift_from_b || "마음의 부담을 내려놓게 해주는 든든한 안정의 거점"} 역할을 합니다.`,
    sharedDynamic: overview?.dynamic_summary || "서로의 다른 에너지 템포를 인정하며 깊은 안도감을 나누는 관계",
    evidenceIds: ["friend.overview.gift_from_a", "friend.overview.gift_from_b", "friend.overview.dynamic_summary"],
    confidence: "high",
  };
}

export function buildFriendContactDistanceP1(params: {
  socialReport: FriendSocialReport;
}): FriendContactDistancePattern {
  const { socialReport } = params;
  return {
    contactRhythm: "매일 연락하지 않아도 서로의 안부가 궁금할 때 편안하게 주고받는 자유로운 연락 템포",
    replyExpectation: "답장이 늦어져도 상대의 사정을 이해하고 조급해하지 않는 유연한 답장 기대감",
    meetingPreference: "주 1~2회 정기 만남보다 오프일 때 마음 내키는 대로 번개로 만나는 편안함",
    distanceTolerance: "오랫동안 만나지 못해도 다시 만났을 때 바로 어제 만난 것처럼 어색함이 없는 관계",
    evidenceIds: ["friend.contact_tempo", "friend.reply_delay"],
    confidence: "high",
  };
}

export function buildFriendOneOnOneVsGroupP1(params: {
  socialReport: FriendSocialReport;
}): FriendOneOnOneVsGroup {
  const { socialReport } = params;
  return {
    oneOnOneMode: "단둘이 있을 때는 깊은 속마음과 현실적인 고민을 편안하게 나누는 밀도 높은 대화 모드",
    groupMode: "여럿이 함께하는 모임에서는 티키타카를 주고받으며 분위기를 유쾌하게 띄우는 호흡",
    roleShift: "단둘일 때의 조용한 정서적 지지에서 모임 시 활력 있는 리드 역할로 자연스러운 전환",
    fatigueRisk: "모임이 길어질 경우 동시에 소셜 배터리가 소존될 위험이 있으므로 적절한 재충전 필요",
    evidenceIds: ["friend.energy_style", "friend.stimulation"],
    confidence: "high",
  };
}

export function buildFriendJealousyExclusionP1(params: {
  socialReport: FriendSocialReport;
}): FriendJealousyExclusion {
  return {
    recognitionSensitivity: "내 노력이나 세심한 배려를 상대방이 알아주고 언어로 표현해줄 때 깊은 안도감을 느낌",
    exclusionSensitivity: "모임이나 서클에서 내 의견이 소외되거나 상의 없이 결정될 때 서운함이 생길 수 있음",
    comparisonSensitivity: "서로를 타인과 단순 비교하기보다 각자의 영역과 개성을 인정하는 배려가 작동함",
    evidenceIds: ["friend.recognition", "friend.conflict_style"],
    confidence: "medium",
  };
}

export function buildFriendshipInitiativeP1(): FriendshipInitiativePattern {
  return {
    contactInitiator: "either",
    planningInitiator: "self",
    repairInitiator: "friend",
    summary: "약속 제안과 놀거리 기획은 활력 있는 측이 주도하고, 갈등 시 대화 물꼬는 포용력 있는 측이 여는 구조",
    evidenceIds: ["friend.structure", "friend.decision_style"],
  };
}

export function buildLongDistanceSustainabilityP1(): LongDistanceSustainability {
  return {
    sustainabilityLevel: "high",
    summary: "자주 만나지 않더라도 정서적 끈이 단단하게 연결되어 있어, 물리적 거리가 멀어져도 유대가 지속되는 우정",
    evidenceIds: ["friend.resilience", "friend.resilience_signal"],
  };
}

export function buildFriendCompositeSynthesisP1(params: {
  socialReport: FriendSocialReport;
}): FriendSynthesisResult[] {
  const { socialReport } = params;
  const results: FriendSynthesisResult[] = [];
  const friction = socialReport.metrics?.friction_index ?? 20;

  // Composite Rule A: Closeness High × Contact Low
  results.push({
    ruleId: "friend.synth.closeness_low_contact",
    category: "closeness_low_contact",
    headline: "자주 연락하지 않아도 안도감이 유지되는 저유지 우정",
    narrative: "매일 카톡을 주고받지 않아도 오랜만에 만났을 때 바로 어제 본 것처럼 친밀하고 어색함이 없는 높은 유대감의 우정입니다.",
    evidenceIds: ["friend.connection_pct", "friend.contact_tempo"],
  });

  // Composite Rule B: High Social Chemistry × Meeting Frequency Mismatch
  if (friction > 30) {
    results.push({
      ruleId: "friend.synth.chemistry_tempo_mismatch",
      category: "chemistry_tempo_mismatch",
      headline: "같이 놀 땐 최고지만 만남 주기 기대는 다른 케미",
      narrative: "함께 있을 때는 티키타카가 환상적으로 잘 맞지만, 약속을 잡는 주거나 연락 빈도에 대한 서로의 템포 차이를 존중해야 합니다.",
      evidenceIds: ["friend.banter_pct", "friend.risk_pct"],
    });
  }

  // Composite Rule C: Advice Style Difference × Strong Trust
  results.push({
    ruleId: "friend.synth.advice_trust_bridge",
    category: "advice_trust_bridge",
    headline: "위로 방식은 다르지만 위기 때 가장 먼저 찾는 관계",
    narrative: "한 명은 감정적 공감을, 다른 한 명은 현실적 해결책을 제시하지만, 서로의 진심을 깊이 신뢰하여 결정적 순간에 서로를 찾습니다.",
    evidenceIds: ["friend.empathy", "friend.practicality"],
  });

  return results;
}

export function buildFriendConflictLoopP0(params: {
  socialReport: FriendSocialReport;
}): FriendConflictLoop {
  const { socialReport } = params;
  return {
    trigger: socialReport.overview?.risk_point || "연락 답장이 오랫동안 미뤄지거나 약속이 갑자기 번복될 때",
    selfReaction: "속으로 서운함을 삼키거나 연락을 줄이며 상대의 반응을 관망함",
    friendReaction: "상대의 침묵에 당황하거나 본의 아닌 상황을 해명하려 서두름",
    escalationMechanism: "서로 먼저 손 내밀기를 주저하다가 대화 타이밍을 놓치고 거리가 벌어짐",
    breakPattern: "당일 결판을 내지 말고 30분간 쿨링다운 후 텍스트로 가볍게 안부를 묻는 전환",
    evidenceIds: ["friend.risk_point", "friend.conflict_style"],
  };
}

export function buildFriendRepairPatternP0(params: {
  prescriptions?: FriendPrescriptionPack;
}): FriendRepairPattern {
  const { prescriptions } = params;
  return {
    sosImmediate: prescriptions?.sos_script?.[0] || "지금 감정이 격해졌으니 30분 뒤에 마저 카톡하자",
    repairSequence: [
      "1. 감정이 가라앉을 때까지 30분간 혼자만의 시간에 들어갑니다.",
      "2. 잘잘못을 다투지 말고 '아까는 서운했어'라는 내 기분만 전달합니다.",
      "3. 편안한 맛집이나 카페에서 만나 가벼운 주제로 대화를 재개합니다.",
    ],
    routineMaintenance: "한 달에 한 번은 부담 없는 가벼운 만남으로 근황 업데이트하기",
    boundaryRule: "상대의 개인적인 재충전 시간이나 일적인 바쁨을 다그치지 않기",
    evidenceIds: ["friend.prescriptions_a", "friend.prescriptions_b"],
  };
}

export function buildFriendNormalizedActionsP1(params: {
  nameA: string;
  nameB: string;
  prescriptions?: FriendPrescriptionPack;
}): FriendActionCandidate[] {
  const { nameA, nameB, prescriptions } = params;
  const actions: FriendActionCandidate[] = [];

  actions.push({
    id: "act_friend_sos",
    meaningId: "meaning_action_sos",
    perspective: "friendship",
    actionType: "SOS",
    title: "갈등 발생 시 30분 쿨링다운 타임아웃",
    description: prescriptions?.sos_script?.[0] || "감정이 솟구칠 때는 당장 결판내지 말고 30분간 카톡을 멈추고 열을 식히세요.",
    evidenceIds: ["friend.sos_script"],
    primarySemanticOwner: "user_manual",
  });

  actions.push({
    id: "act_friend_repair",
    meaningId: "meaning_action_repair",
    perspective: "friendship",
    actionType: "REPAIR",
    title: "맛집/카페에서 가벼운 소통으로 리셋",
    description: "서운함이 생겼다면 비난 대신 편안한 장소에서 가벼운 일상 대화로 마음을 풀어보세요.",
    evidenceIds: ["friend.prescriptions_a"],
    primarySemanticOwner: "user_manual",
  });

  actions.push({
    id: "act_friend_self",
    meaningId: "meaning_action_self",
    perspective: "self",
    actionType: "ROUTINE",
    title: `${nameA}를 위한 조언: 상대의 템포 존중하기`,
    description: prescriptions?.prescriptions_a?.[0] || "상대의 연락 속도가 느려지더라도 서운해하지 말고 오롯이 내 개인 시간에 집중해보세요.",
    evidenceIds: ["friend.prescriptions_a"],
    primarySemanticOwner: "user_manual",
  });

  actions.push({
    id: "act_friend_partner",
    meaningId: "meaning_action_partner",
    perspective: "friend",
    actionType: "BOUNDARY",
    title: `${nameB}를 위한 조언: 솔직한 마음 꺼내기`,
    description: prescriptions?.prescriptions_b?.[0] || "말문이 막힐 때는 무조건 피하기보다 '조금 이따 다시 얘기하자'고 짧게 남겨주세요.",
    evidenceIds: ["friend.prescriptions_b"],
    primarySemanticOwner: "user_manual",
  });

  return actions;
}

export function buildFriendGrowthTransitionP1(): FriendGrowthTransition {
  return {
    currentPattern: "자주 만나고 카톡을 자주 주고받아야 안정감을 느끼는 의존적 패턴",
    recommendedAdjustment: "서로의 개인 공간과 템포를 인정하며 가끔 만나도 변함없이 안도하는 전환",
    targetDynamic: "서로의 삶을 응원하며 묵직한 신뢰 속에서 지속되는 성숙한 우정 동반자",
    evidenceIds: ["friend.growth_transition"],
  };
}
