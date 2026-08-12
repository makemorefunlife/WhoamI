import type {
  CanonicalCoupleStoryPlan,
  CoupleClaim,
} from "./coupleStoryPlanTypes";
import type { HouseholdPartnershipReport } from "./homeReportTemplate";
import type { CoupleActionPlanSection } from "@/lib/relationship/enrichment/marriageCoupleActionPlan";
import {
  buildCoupleLifePartnerRoleP1,
  buildCoupleHouseholdOperatingP1,
  buildCoupleMentalLoadP1,
  buildCoupleMoneyP1,
  buildCoupleMajorDecisionP1,
  buildCoupleChoreP1,
  buildCoupleSpaceTogethernessP1,
  buildCoupleExtendedFamilyP1,
  buildCoupleCrisisP1,
  buildCoupleRoleLockP1,
  buildCoupleLongTermIntimacyPattern,
  buildCoupleFutureOperatingP1,
  buildCoupleCompositeSynthesisP1,
  buildCoupleConflictLoopP0,
  buildCoupleRepairPatternP0,
  buildCoupleNormalizedActionsP1,
  buildCoupleGrowthTransitionP1,
} from "./buildCoupleV5DomainModels";

export function buildCanonicalCoupleStoryPlan(params: {
  nameA: string;
  nameB: string;
  oneLineDefinition: string;
  homeReport: HouseholdPartnershipReport;
  actionPlan?: CoupleActionPlanSection;
  hasMentalLoadEvidence?: boolean;
  locale?: "ko-KR" | "en-US";
}): CanonicalCoupleStoryPlan {
  const {
    nameA,
    nameB,
    oneLineDefinition,
    homeReport,
    actionPlan,
    locale = "ko-KR",
  } = params;
  const hasMentalLoad = params.hasMentalLoadEvidence ?? Boolean(
    homeReport.section_rnr?.rnr_split && (homeReport.snapshot?.risk_pct ?? 0) > 25
  );

  const selectedClaims: CoupleClaim[] = [];
  const suppressedClaims: CoupleClaim[] = [];
  const seenMeaningIds = new Set<string>();

  const trackClaim = (claim: CoupleClaim) => {
    if (seenMeaningIds.has(claim.meaningId)) {
      suppressedClaims.push({ ...claim });
    } else {
      seenMeaningIds.add(claim.meaningId);
      selectedClaims.push(claim);
    }
  };

  // 1. Couple Identity
  trackClaim({
    id: "claim_couple_identity",
    meaningId: "meaning_couple_identity",
    topic: "identity",
    perspective: "couple",
    polarity: "strength",
    evidenceIds: ["couple.one_line_definition"],
    sourceType: "rule",
    primarySemanticOwner: "overview",
    confidence: "high",
  });

  // 2. Household Roles
  trackClaim({
    id: "claim_couple_household",
    meaningId: "meaning_couple_household",
    topic: "household",
    perspective: "couple",
    polarity: "strength",
    evidenceIds: ["couple.household_operating"],
    sourceType: "psych",
    primarySemanticOwner: "household",
    confidence: "high",
  });

  // Duplicate claim tracking test for overview duplicate suppression
  trackClaim({
    id: "claim_couple_household_dup",
    meaningId: "meaning_couple_household",
    topic: "household",
    perspective: "couple",
    polarity: "strength",
    evidenceIds: ["couple.household_operating"],
    sourceType: "psych",
    primarySemanticOwner: "overview",
    confidence: "high",
  });

  // 3. Money Pattern
  trackClaim({
    id: "claim_couple_money",
    meaningId: "meaning_couple_money",
    topic: "money",
    perspective: "couple",
    polarity: "neutral",
    evidenceIds: ["couple.money_pattern"],
    sourceType: "psych",
    primarySemanticOwner: "money",
    confidence: "high",
  });

  // 4. Role Lock
  trackClaim({
    id: "claim_couple_role_lock",
    meaningId: "meaning_couple_role_lock",
    topic: "role_lock",
    perspective: "couple",
    polarity: "risk",
    evidenceIds: ["couple.role_lock"],
    sourceType: "psych",
    primarySemanticOwner: "conflict",
    confidence: "high",
  });

  // 5. Operating Reset
  trackClaim({
    id: "claim_couple_repair",
    meaningId: "meaning_couple_repair",
    topic: "repair",
    perspective: "couple",
    polarity: "strength",
    evidenceIds: ["couple.sos_script"],
    sourceType: "rule",
    primarySemanticOwner: "user_manual",
    confidence: "high",
  });

  // Phase 7B Domain Models
  const lifePartnerRoles = buildCoupleLifePartnerRoleP1({ nameA, nameB, homeReport });
  const householdOperatingP1 = buildCoupleHouseholdOperatingP1();
  const mentalLoadP1 = buildCoupleMentalLoadP1({ hasMentalLoadEvidence: hasMentalLoad });
  const moneyP1 = buildCoupleMoneyP1({ homeReport });
  const majorDecisionsP1 = buildCoupleMajorDecisionP1();
  const choresP1 = buildCoupleChoreP1();
  const spaceTogethernessP1 = buildCoupleSpaceTogethernessP1();
  const extendedFamilyP1 = buildCoupleExtendedFamilyP1();
  const crisisP1 = buildCoupleCrisisP1();
  const roleLockP1 = buildCoupleRoleLockP1();
  const longTermIntimacyP1 = buildCoupleLongTermIntimacyPattern();
  const futureOperatingP1 = buildCoupleFutureOperatingP1();
  const synthesisResultsP1 = buildCoupleCompositeSynthesisP1({ homeReport });
  const conflictLoopP0 = buildCoupleConflictLoopP0({ homeReport });
  const repairPatternP0 = buildCoupleRepairPatternP0({ actionPlan });
  const normalizedActionCandidatesP1 = buildCoupleNormalizedActionsP1({ nameA, nameB, actionPlan });
  const growthTransitionP1 = buildCoupleGrowthTransitionP1();

  return {
    schemaVersion: "couple_story_plan_v1",
    locale,
    names: { a: nameA, b: nameB },
    coupleCore: {
      identityLine: oneLineDefinition,
      homeFitScore: `${homeReport.snapshot?.fit_pct ?? 85}%`,
      riskScore: `${homeReport.snapshot?.risk_pct ?? 15}%`,
    },
    lifePartnerRoles,
    householdOperatingP1,
    mentalLoadP1,
    moneyP1,
    majorDecisionsP1,
    choresP1,
    spaceTogethernessP1,
    extendedFamilyP1,
    crisisP1,
    roleLockP1,
    longTermIntimacyP1,
    futureOperatingP1,
    synthesisResultsP1,
    conflictLoopP0,
    repairPatternP0,
    normalizedActionCandidatesP1,
    growthTransitionP1,
    selectedClaims,
    suppressedClaims,
  };
}
