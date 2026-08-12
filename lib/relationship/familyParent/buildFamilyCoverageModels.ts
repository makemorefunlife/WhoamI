import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type {
  FamilyConflictLoop,
  FamilyRepairPattern,
  FamilyGrowthTransition,
} from "./familyStoryPlanTypes";
import type { FamilyPsychProjection } from "./familyPsychDynamicsTypes";

export function buildFamilyConflictLoop(
  ctx: FamilyRuleContext,
  psychProjections: FamilyPsychProjection[]
): FamilyConflictLoop | undefined {
  const conflictProj = psychProjections.find((p) => p.axis === "conflict_style");
  const structureProj = psychProjections.find((p) => p.axis === "structure");
  const hasClash = ctx.canonicalPairFacts.hasClash || ctx.canonicalPairFacts.hasWonjinOrGuimun;

  if (!hasClash && conflictProj?.relation !== "tension" && structureProj?.relation !== "tension") {
    return undefined;
  }

  const triggerEvidenceIds = [
    ...(hasClash ? ["canonical.clash"] : []),
    ...(conflictProj?.relation === "tension" ? [`psych.${conflictProj.axis}`] : []),
  ];

  return {
    triggerEvidenceIds,
    parentTrigger: "부모의 즉각적인 확인 요구 및 지침 전달",
    childReaction: "자녀의 거부감 표출 및 자기 방어적 소통 닫힘",
    parentEscalation: hasClash ? "부모의 서운함 증폭 및 단호한 톤 고조" : undefined,
    breakPattern: "즉답 재촉을 멈추고 일정 시간 떨어져 쿨링다운하는 포즈 루틴",
    confidence: hasClash ? "high" : "medium",
  };
}

export function buildFamilyRepairPattern(
  ctx: FamilyRuleContext,
  psychProjections: FamilyPsychProjection[]
): FamilyRepairPattern {
  const resilienceProj = psychProjections.find((p) => p.axis === "resilience");
  const isSlowRecovery = resilienceProj?.gap && resilienceProj.gap >= 50;

  return {
    coolingNeed: isSlowRecovery ? "extended" : "moderate",
    initiatorRole: "parent",
    effectiveRepairStyle:
      "잘잘못을 따지지 않고 '아까 놀라게 해서 미안해'라며 따뜻한 체온이나 가벼운 음식을 먼저 권하는 방식",
    ineffectiveRepairStyle: "누가 옳고 틀렸는지 끝까지 논리적으로 설명하고 인정받으려 하는 훈계조 대화 재개",
    reconnectionAction: "서로 정해둔 쿨링 시간 경과 후 거실이나 밖에서 평소 톤으로 가볍게 말 걸기",
  };
}

export function buildFamilyGrowthTransition(
  ctx: FamilyRuleContext
): FamilyGrowthTransition {
  const bondBand = ctx.familySignalsParent?.seal_parent?.parent_bond_band;
  const hasClash = ctx.canonicalPairFacts.hasClash;

  let currentRolePattern = "밀착형 케어 및 지침 제공";
  let recommendedShift = "자문가(Consultant) 역할로 전환";
  let transitionReason = "자녀의 독립성과 자율 욕구가 증가함에 따라 지시보다 조언 중심의 소통이 필요함";

  if (bondBand === "distant") {
    currentRolePattern = "거리감 있는 개별 자율 생활";
    recommendedShift = "정서적 지지와 필요 시 가이드 제공";
    transitionReason = "자녀가 혼자 고립감을 느끼지 않도록 필요할 때 기댈 수 있는 안전지대 역할 강화가 필요함";
  } else if (hasClash) {
    currentRolePattern = "직접적 충돌 및 간섭 패턴";
    recommendedShift = "명확한 경계 존중 및 상호 협의 방식";
    transitionReason = "규율과 통제 위주의 접근이 갈등을 유발하므로 영역 구분이 우선되어야 함";
  }

  return {
    currentRolePattern,
    recommendedShift,
    evidenceIds: [
      ...(bondBand ? [`seal.${bondBand}`] : []),
      ...(hasClash ? ["canonical.clash"] : []),
    ],
    transitionReason,
    boundaryRule: "자녀가 요청하기 전에는 먼저 개입하지 않고 기다려주는 영역 지정",
    confidence: "high",
  };
}
