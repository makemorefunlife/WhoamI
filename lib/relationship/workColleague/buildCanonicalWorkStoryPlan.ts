import type {
  CanonicalWorkStoryPlan,
  WorkClaim,
} from "./workStoryPlanTypes";
import type { OfficePartnershipReport } from "./officeReportTemplate";
import type { WorkPrescriptionPack } from "./workPrescriptionTypes";
import {
  buildWorkRoleAuthorityP1,
  buildWorkDecisionRightsP1,
  buildWorkFeedbackP1,
  buildSoloVsCollaborativeThinkingP1,
  buildWorkCrisisP1,
  buildWorkErrorResponseP1,
  buildWorkProjectFitP1,
  buildWorkAvoidCombinationP1,
  buildWorkCompositeSynthesisP1,
  buildWorkConflictLoopP0,
  buildWorkRepairPatternP0,
  buildWorkNormalizedActionsP1,
  buildWorkGrowthTransitionP1,
} from "./buildWorkV5DomainModels";
import { buildWorkOverviewChapterBundle } from "./workOverviewChapterEngine";
import { buildIndividualWorkChapterBundle } from "./individualWorkChapterEngine";

export function buildCanonicalWorkStoryPlan(params: {
  nameA: string;
  nameB: string;
  oneLineDefinition: string;
  officeReport: OfficePartnershipReport;
  prescriptions?: WorkPrescriptionPack;
  locale?: "ko-KR" | "en-US";
}): CanonicalWorkStoryPlan {
  const { nameA, nameB, oneLineDefinition, officeReport, prescriptions, locale = "ko-KR" } = params;

  const selectedClaims: WorkClaim[] = [];
  const suppressedClaims: WorkClaim[] = [];
  const seenMeaningIds = new Set<string>();

  const trackClaim = (claim: WorkClaim) => {
    if (seenMeaningIds.has(claim.meaningId)) {
      suppressedClaims.push({ ...claim });
    } else {
      seenMeaningIds.add(claim.meaningId);
      selectedClaims.push(claim);
    }
  };

  // 1. Partnership Identity
  trackClaim({
    id: "claim_work_identity",
    meaningId: "meaning_work_identity",
    topic: "identity",
    perspective: "team",
    polarity: "strength",
    evidenceIds: ["work.one_line_definition"],
    sourceType: "rule",
    primarySemanticOwner: "overview",
    confidence: "high",
  });

  // 2. Role Division
  trackClaim({
    id: "claim_work_roles",
    meaningId: "meaning_work_roles",
    topic: "role_authority",
    perspective: "team",
    polarity: "strength",
    evidenceIds: ["work.role_division"],
    sourceType: "psych",
    primarySemanticOwner: "role_division",
    confidence: "high",
  });

  // Duplicate claim tracking test for overview duplicate suppression
  trackClaim({
    id: "claim_work_roles_dup",
    meaningId: "meaning_work_roles",
    topic: "role_authority",
    perspective: "team",
    polarity: "strength",
    evidenceIds: ["work.role_division"],
    sourceType: "psych",
    primarySemanticOwner: "overview",
    confidence: "high",
  });

  // 3. Feedback Pattern
  trackClaim({
    id: "claim_work_feedback",
    meaningId: "meaning_work_feedback",
    topic: "feedback",
    perspective: "team",
    polarity: "neutral",
    evidenceIds: ["work.feedback_cushion"],
    sourceType: "psych",
    primarySemanticOwner: "feedback",
    confidence: "high",
  });

  // 4. Crisis Response
  trackClaim({
    id: "claim_work_crisis",
    meaningId: "meaning_work_crisis",
    topic: "crisis",
    perspective: "team",
    polarity: "risk",
    evidenceIds: ["work.stress_burnout"],
    sourceType: "psych",
    primarySemanticOwner: "stress_crisis",
    confidence: "high",
  });

  // 5. Operating Reset
  trackClaim({
    id: "claim_work_repair",
    meaningId: "meaning_work_repair",
    topic: "repair",
    perspective: "team",
    polarity: "strength",
    evidenceIds: ["work.sos_script"],
    sourceType: "rule",
    primarySemanticOwner: "user_manual",
    confidence: "high",
  });

  // Phase 6B Domain Models
  const roleAuthorityP1 = buildWorkRoleAuthorityP1({ nameA, nameB, officeReport });
  const decisionRightsP1 = buildWorkDecisionRightsP1();
  const feedbackP1 = buildWorkFeedbackP1({ officeReport });
  const thinkingModeP1 = buildSoloVsCollaborativeThinkingP1();
  const crisisP1 = buildWorkCrisisP1();
  const errorResponseP1 = buildWorkErrorResponseP1();
  const projectFitP1 = buildWorkProjectFitP1();
  const avoidCombinationP1 = buildWorkAvoidCombinationP1();
  const synthesisResultsP1 = buildWorkCompositeSynthesisP1({ officeReport });
  const conflictLoopP0 = buildWorkConflictLoopP0({ officeReport });
  const repairPatternP0 = buildWorkRepairPatternP0({ prescriptions });
  const normalizedActionCandidatesP1 = buildWorkNormalizedActionsP1({ nameA, nameB, prescriptions });
  const growthTransitionP1 = buildWorkGrowthTransitionP1();

  const fitPct = officeReport.snapshot?.fit_pct ?? (officeReport.metrics?.activation ?? 80);
  const synergyPct = officeReport.snapshot?.synergy_pct ?? (officeReport.metrics?.benefit ?? 75);
  const riskPct = officeReport.snapshot?.risk_pct ?? (officeReport.metrics?.risk_pct ?? 20);

  const psychA = (officeReport as any).personCore?.psych_a ?? null;
  const psychB = (officeReport as any).personCore?.psych_b ?? null;
  const sajuChartA = (officeReport as any).personCore?.saju_chart_a ?? null;
  const sajuChartB = (officeReport as any).personCore?.saju_chart_b ?? null;

  const overviewChapterBundle = buildWorkOverviewChapterBundle({
    nameA,
    nameB,
    locale,
    fitPct,
    synergyPct,
    riskPct,
    psychA,
    psychB,
  });

  const individualWorkBundle = buildIndividualWorkChapterBundle({
    nameA,
    nameB,
    locale,
    psychA,
    psychB,
    sajuChartA,
    sajuChartB,
    officeReport,
  });

  return {
    schemaVersion: "work_story_plan_v1",
    locale,
    names: { a: nameA, b: nameB },
    partnershipCore: {
      identityLine: oneLineDefinition,
      fitScore: `${fitPct}%`,
      riskScore: `${riskPct}%`,
    },
    overviewChapterBundle,
    individualWorkBundle,
    workRoles: {
      selfRole: officeReport.overview?.gift_from_a,
      colleagueRole: officeReport.overview?.gift_from_b,
      sharedSynergy: officeReport.overview?.dynamic_summary,
    },
    decisionDynamics: {
      decisionSpeed: officeReport.overview?.dynamic_summary,
      authorityDivision: officeReport.overview?.dynamic_summary,
    },
    communication: {
      workTempo: officeReport.overview?.dynamic_summary,
      feedbackStyle: officeReport.overview?.dynamic_summary,
    },
    stressCrisis: {
      pressurePattern: officeReport.overview?.risk_point,
      crisisRole: officeReport.overview?.dynamic_summary,
    },
    conflict: {
      meetingConflictTrigger: officeReport.overview?.risk_point,
    },
    repair: {
      operatingReset: prescriptions?.sos_script?.[0] ?? "",
    },
    actions: {
      selfAdvice: prescriptions?.prescriptions_a || [],
      colleagueAdvice: prescriptions?.prescriptions_b || [],
      sharedRoutine: prescriptions?.shared_activities || [],
    },
    roleAuthorityP1,
    decisionRightsP1,
    feedbackP1,
    thinkingModeP1,
    crisisP1,
    errorResponseP1,
    projectFitP1,
    avoidCombinationP1,
    synthesisResultsP1,
    conflictLoopP0,
    repairPatternP0,
    normalizedActionCandidatesP1,
    growthTransitionP1,
    selectedClaims,
    suppressedClaims,
  };
}
