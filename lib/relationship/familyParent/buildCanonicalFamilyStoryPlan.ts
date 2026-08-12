import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type { FamilyParentChildReport } from "./familyReportTemplate";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { buildFamilyPsychDynamicsProjections } from "./buildFamilyPsychDynamicsProjections";
import {
  buildFamilyInsightCandidates,
  buildFamilyActionCandidates,
} from "./buildFamilyCandidateEngine";
import { buildFamilyMultiSignalSynthesis } from "./buildFamilyMultiSignalSynthesis";
import { formatJosa } from "./familyParentLanguage";
import {
  buildFamilyConflictLoop,
  buildFamilyRepairPattern,
  buildFamilyGrowthTransition,
} from "./buildFamilyCoverageModels";
import { computeChildParentingNeedsEngine } from "./familyChildParentingNeedsEngine";
import type {
  CanonicalFamilyStoryPlan,
  FamilyClaim,
  FamilyClaimPriority,
} from "./familyStoryPlanTypes";

export function buildCanonicalFamilyStoryPlan(
  ctx: FamilyRuleContext,
  report: FamilyParentChildReport,
  psychParent: PsychMasterJson | null,
  psychChild: PsychMasterJson | null
): CanonicalFamilyStoryPlan {
  const selectedClaims: FamilyClaim[] = [];
  const suppressedClaims: FamilyClaim[] = [];
  const evidenceMap: Record<string, any> = {};

  const addClaim = (
    claimId: string,
    topic: FamilyClaim["topic"],
    perspective: FamilyClaim["perspective"],
    polarity: FamilyClaim["polarity"],
    owner: string,
    sourceType: FamilyClaim["sourceType"],
    evidenceId: string,
    meaning: string,
    priority: FamilyClaimPriority = "primary"
  ) => {
    // Duplicate Suppression Logic:
    // Only suppress if the SAME evidence is used with the SAME meaning 
    const isDuplicate = selectedClaims.some(
      (c) => c.evidenceIds.includes(evidenceId) && c.meaning === meaning
    );

    const claim: FamilyClaim = {
      id: claimId,
      topic,
      perspective,
      polarity,
      priority,
      owner,
      evidenceIds: [evidenceId],
      sourceType,
      meaning,
      needsSynthesis: false,
    };

    if (isDuplicate) {
      suppressedClaims.push(claim);
    } else {
      selectedClaims.push(claim);
      evidenceMap[evidenceId] = true;
    }
  };

  // 1. Relationship Core (Bond, Risk, Identity)
  const bondScore = ctx.masterScores.bond;
  const riskScore = ctx.masterScores.risk;
  
  let bondLevel: "high" | "medium" | "low" = "medium";
  if (bondScore >= 80) bondLevel = "high";
  else if (bondScore < 50) bondLevel = "low";

  let riskLevel: "high" | "medium" | "low" = "medium";
  if (riskScore >= 80) riskLevel = "high";
  else if (riskScore < 50) riskLevel = "low";

  addClaim(
    "core.bond",
    "relationshipCore",
    "pair",
    bondLevel === "high" ? "strength" : bondLevel === "low" ? "risk" : "neutral",
    "overview",
    "pair_saju",
    "masterScores.bond",
    `Bond score is ${bondLevel}`
  );

  addClaim(
    "core.risk",
    "relationshipCore",
    "pair",
    riskLevel === "high" ? "risk" : riskLevel === "low" ? "strength" : "neutral",
    "overview",
    "pair_saju",
    "masterScores.risk",
    `Risk score is ${riskLevel}`
  );

  // 2. Family Roles
  const householdParentRole = report.section_household_roles?.parent_role ?? "";
  const householdChildRole = report.section_household_roles?.child_role ?? "";
  const psychologicalChildRole = report.section_family_role?.child_role ?? null;

  if (householdParentRole) {
    addClaim(
      "role.parent.household",
      "familyRoles",
      "parent",
      "neutral",
      "householdRoles",
      "pair_saju",
      "household.parent",
      householdParentRole
    );
  }
  
  if (householdChildRole) {
    addClaim(
      "role.child.household",
      "familyRoles",
      "child",
      "neutral",
      "householdRoles",
      "pair_saju",
      "household.child",
      householdChildRole
    );
  }

  // 3. Child Profile (Talent, Guidance)
  const talentType = report.section_talent?.child_talent_title ?? "";
  const guidanceMode = report.section_child_dna?.child_talent?.talent_title ?? "";

  if (talentType) {
    addClaim(
      "childProfile.talent",
      "childProfile",
      "child",
      "neutral",
      "talentProfile",
      "ten_god",
      "talent.type",
      talentType
    );
  }

  // 4. Discipline
  const disciplineRisk = riskLevel;
  const disciplineTrigger = report.section_de_escalation?.trigger_point ?? "";

  // 5. Conflict (Safe Distance)
  const safeDistance = report.section_relationship_index?.safe_distance_note ?? "";
  if (safeDistance) {
    addClaim(
      "conflict.distance",
      "conflict",
      "pair",
      "neutral",
      "relationshipIndex",
      "pair_saju",
      "conflict.distance",
      safeDistance
    );
  }

  // 6. Growth (Synergy)
  const synergy = report.section_destiny?.harmony_one_liner ?? "";

  // 7. Deep Read
  const parentAdvice = report.section_growth_tunnel?.parent_advice ?? "";
  const childAdvice = report.section_growth_tunnel?.child_advice ?? "";
  const sharedAction = report.section_growth_tunnel?.shared_action ?? "";

  if (parentAdvice) {
    addClaim(
      "deepRead.parent",
      "deepRead",
      "parent",
      "neutral",
      "deepRead",
      "pair_saju",
      "growth_tunnel.parent",
      "Parent Advice Deep Read"
    );
  }

  // 8. Actions
  const sosScript = report.section_sos_script?.sos_line ?? "";
  if (sosScript) {
    addClaim(
      "actions.sos",
      "actions",
      "pair",
      "neutral",
      "actions",
      "pair_saju",
      "action.sos",
      sosScript
    );
  }
  
  // Track Wonjin/Guimun as evidence if exists
  if (ctx.canonicalPairFacts.hasGuimun || ctx.canonicalPairFacts.hasWonjin) {
    addClaim(
      "pair.wonjin",
      "conflict",
      "pair",
      "risk",
      "deepRead",
      "pair_saju",
      "wonjin_guimun",
      "감정 오해가 쉽게 커짐"
    );
    addClaim(
      "action.wonjin",
      "actions",
      "pair",
      "neutral",
      "actions",
      "pair_saju",
      "wonjin_guimun",
      "강한 톤으로 바로 교정하지 않기"
    );
  }

  // 9. 11-axis Projections
  if (psychParent && psychChild) {
    const psychProjections = buildFamilyPsychDynamicsProjections(ctx, psychParent, psychChild);
    
    for (const proj of psychProjections) {
      if (proj.category === "CONTEXT_ONLY") continue;
      
      for (const topic of proj.targetTopics) {
        addClaim(
          `psych.${proj.axis}`,
          topic,
          "pair",
          proj.relation === "tension" ? "risk" : proj.relation === "complement" ? "strength" : "neutral",
          topic, // semantic owner
          "psych_axis",
          `psych.${proj.axis}`,
          proj.familyMeaningId
        );
      }
    }
  }

  const insightCandidates = buildFamilyInsightCandidates(ctx, report);
  const actionCandidates = buildFamilyActionCandidates(ctx, report);
  const psychProjections = psychParent && psychChild ? buildFamilyPsychDynamicsProjections(ctx, psychParent, psychChild) : [];
  const synthesisResults = buildFamilyMultiSignalSynthesis(
    ctx,
    selectedClaims,
    psychProjections
  );
  const conflictLoop = buildFamilyConflictLoop(ctx, psychProjections);
  const repairPattern = buildFamilyRepairPattern(ctx, psychProjections);
  const growthTransition = buildFamilyGrowthTransition(ctx);

  // 4 Core Pair Meanings Computation (Deterministic & Evidence-based)
  const childRole = report.section_family_role?.child_role ?? "independent";
  const hasRoleReversal = childRole === "fixer" || childRole === "martyr" || childRole === "emotional_dump";
  
  const parentStructure = psychParent?.secondary_axes?.structure ?? 50;
  const childResilience = psychChild?.secondary_axes?.resilience ?? 50;
  const childRecognition = psychChild?.secondary_axes?.recognition ?? 50;
  const childStimulation = psychChild?.secondary_axes?.stimulation ?? 50;

  const dependencyProtection = {
    provider: parentStructure >= 60 ? "구조화된 울타리와 규칙 제공" : "자유로운 자율성과 포용적 수용",
    reliance: childRole === "puppy" ? "정서적 밀착과 열린 의존" : "독립적 공간 확보 후 필요한 때만 도움 요청",
    roleReversalRisk: hasRoleReversal,
    summary: hasRoleReversal
      ? `${formatJosa(ctx.childNickname, "이가")} 오히려 가정 내 기운이나 부모의 감정을 돌보는 역할 역전 가능성 주의`
      : `${ctx.parentNickname} 부모의 안정적인 보호 속에서 ${formatJosa(ctx.childNickname, "이가")} 자신의 결대로 자라나는 구도`,
  };

  const loveExpressionVsReception = {
    parentExpresses: parentStructure >= 60 ? "올바른 습관과 성취 지도" : "자유와 친밀한 정서 표현",
    childReceives: childRecognition >= 60 ? "무조건적인 인정과 세심한 칭찬" : "독립된 존중과 조용한 신뢰",
    alignment: (parentStructure >= 60 && childRecognition >= 60) ? ("misaligned" as const) : ("matched" as const),
    summary: (parentStructure >= 60 && childRecognition >= 60)
      ? `${ctx.parentNickname} 부모의 지도 조언이 ${formatJosa(ctx.childNickname, "에게는")} 단순 지적으로 해석될 수 있는 사랑 표현 엇갈림`
      : `${ctx.parentNickname} 부모의 마음이 ${formatJosa(ctx.childNickname, "에게")} 왜곡 없이 잘 전달되는 매칭 상태`,
  };

  const expectationGap = Math.abs(parentStructure - childResilience);
  const expectationVsPressure = {
    parentExpectation: parentStructure >= 70 ? "높은 목표와 완벽주의적 기준" : "수용적이고 유연한 성장 기대",
    childPressureReception: childResilience < 40 ? "작은 마찰에도 부담과 중압감을 크게 느낌" : "자극과 도전 과제로 긍정 흡수",
    gapLevel: expectationGap >= 30 ? ("high" as const) : expectationGap >= 15 ? ("moderate" as const) : ("low" as const),
    summary: expectationGap >= 30
      ? `${ctx.parentNickname} 부모의 기대 수준과 ${formatJosa(ctx.childNickname, "이")} 느끼는 중압감 사이의 갭이 커 속도 조절 필요`
      : `${ctx.parentNickname} 부모의 기대가 ${formatJosa(ctx.childNickname, "에게")} 성장의 좋은 동기부여로 작용함`,
  };

  const needsEngineOutput = computeChildParentingNeedsEngine({
    ctx,
    report,
    psychParent,
    psychChild,
  });

  const childCoreNeeds = {
    primaryNeeds: needsEngineOutput.primaryNeeds.map((n) => n.label),
    currentSupplyStatus: needsEngineOutput.primaryNeeds[0]?.gapStatus || "정상 수용 중",
    summary: needsEngineOutput.summary,
  };

  const pairMeanings = {
    dependencyProtection,
    loveExpressionVsReception,
    expectationVsPressure,
    childCoreNeeds,
    childCoreNeedsDetailed: needsEngineOutput,
  };

  return {
    relationshipCore: {
      bondLevel,
      riskLevel,
      identityLine: report.section_child_dna?.child_talent?.talent_title ?? "",
    },
    familyRoles: {
      householdParentRole,
      householdChildRole,
      psychologicalChildRole,
    },
    childProfile: {
      talentType,
      guidanceMode,
    },
    discipline: {
      risk: disciplineRisk,
      trigger: disciplineTrigger,
    },
    conflict: {
      safeDistance,
    },
    growth: {
      synergy,
    },
    deepRead: {
      parentAdvice,
      childAdvice,
      sharedAction,
    },
    actions: {
      doAction: report.section_de_escalation?.do_action ?? "",
      dontAction: report.section_de_escalation?.dont_action ?? "",
      sosScript: report.section_de_escalation?.parent_script ?? "",
      maintenanceRoutine: report.section_destiny?.harmony_one_liner ?? "",
    },
    pairMeanings,
    selectedClaims,
    suppressedClaims,
    insightCandidates,
    actionCandidates,
    synthesisResults,
    conflictLoop,
    repairPattern,
    growthTransition,
    evidenceMap,
  };
}
