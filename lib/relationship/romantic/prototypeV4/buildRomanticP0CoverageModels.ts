import type {
  RomanticConflictLoop,
  RomanticRepairPattern,
  RomanticActionCandidate,
  CanonicalRelationshipStoryPlan,
} from "./canonicalStoryPlanTypes";

export function buildRomanticConflictLoopP0(
  storyPlan: CanonicalRelationshipStoryPlan
): RomanticConflictLoop | undefined {
  const recurringLoop = storyPlan.recurringLoop;
  const misreads = storyPlan.misreads || [];
  const topDifferences = storyPlan.topDifferences || [];

  const conflictAxis = topDifferences.find(
    (d) => d.axisKey === "conflict_style" || d.axisKey === "communication_style"
  );

  const triggerEvidenceIds = [
    ...(conflictAxis ? [`psych.${conflictAxis.axisKey}`] : []),
    ...(recurringLoop?.provenance ? recurringLoop.provenance.map((p) => p.evidenceId) : []),
  ];

  const trigger = recurringLoop?.triggerScene || "의사소통 템포 차이 및 서운함 발생 지점";
  const selfResponse = "내 기대와 상반된 반응을 접했을 때 서운함이나 조급함 표출";
  const partnerResponse = "즉각적인 설명보다 침묵이나 시간 벌기 선택";
  const escalationMechanism = conflictAxis?.axisKey === "conflict_style"
    ? "한쪽은 즉각적인 해명을 요구하고 다른 한쪽은 대화를 미루면서 감정 격화"
    : "서로의 기대와 반응 템포가 엇갈릴 때 답답함 고조";
  const breakPattern = "감정이 격해졌을 때 결판을 내지 않고 30분간 대화를 일시 중단하는 포즈 루틴";

  const confidence = (triggerEvidenceIds.length >= 2 && conflictAxis)
    ? "high"
    : "medium";

  return {
    triggerEvidenceIds,
    trigger,
    selfResponse,
    partnerResponse,
    escalationMechanism,
    breakPattern,
    confidence,
  };
}

export function buildRomanticRepairPatternP0(
  storyPlan: CanonicalRelationshipStoryPlan
): RomanticRepairPattern {
  const topDifferences = storyPlan.topDifferences || [];
  const resilienceAxis = topDifferences.find((d) => d.axisKey === "resilience");
  const isSlowRecovery = resilienceAxis && resilienceAxis.gap >= 30;

  const repairSection = storyPlan.repair;
  const evidenceIds = repairSection?.provenance
    ? repairSection.provenance.map((p) => p.evidenceId)
    : [];

  return {
    coolingNeed: isSlowRecovery ? "extended" : "moderate",
    initiatorRole: "either",
    effectiveRepairStyle:
      repairSection?.helpsA?.[0] ||
      "잘잘못을 따지지 않고 '나 아까 서운해서 그랬어'라며 내 마음만 툭 꺼내어 말하는 방식",
    ineffectiveRepairStyle:
      repairSection?.avoid?.[0] ||
      "누가 맞고 틀렸는지 끝까지 논리적으로 따지는 훈계조 대화 재개",
    reconnectionAction:
      "약속한 쿨링 시간이 지난 후 감정이 가라앉은 상태에서 가볍게 온기를 주고받는 대화 재개",
    evidenceIds,
    confidence: isSlowRecovery ? "high" : "medium",
  };
}

export function buildRomanticP0ActionCandidates(
  storyPlan: CanonicalRelationshipStoryPlan
): RomanticActionCandidate[] {
  const repair = storyPlan.repair;
  const candidates: RomanticActionCandidate[] = [];

  if (repair?.sequence?.[0]) {
    candidates.push({
      id: "action_sos_pause",
      perspective: "couple",
      actionType: "SOS",
      evidenceIds: ["repair.sequence"],
      targetTopic: "conflict_interruption",
      priority: 1,
      copy: repair.sequence[0],
      confidence: "high",
    });
  }

  if (repair?.helpsA?.[0]) {
    candidates.push({
      id: "action_self_repair",
      perspective: "self",
      actionType: "REPAIR",
      evidenceIds: ["repair.helpsA"],
      targetTopic: "self_reconnection",
      priority: 2,
      copy: repair.helpsA[0],
      confidence: "high",
    });
  }

  if (repair?.helpsB?.[0]) {
    candidates.push({
      id: "action_partner_understanding",
      perspective: "partner",
      actionType: "REPAIR",
      evidenceIds: ["repair.helpsB"],
      targetTopic: "partner_reconnection",
      priority: 3,
      copy: repair.helpsB[0],
      confidence: "high",
    });
  }

  if (storyPlan.closing?.rememberA) {
    candidates.push({
      id: "action_routine_remember",
      perspective: "couple",
      actionType: "ROUTINE",
      evidenceIds: ["closing.rememberA"],
      targetTopic: "relationship_maintenance",
      priority: 4,
      copy: storyPlan.closing.rememberA,
      confidence: "high",
    });
  }

  return candidates;
}
