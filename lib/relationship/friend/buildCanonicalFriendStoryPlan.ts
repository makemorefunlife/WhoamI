import type {
  CanonicalFriendStoryPlan,
  FriendClaim,
} from "./friendStoryPlanTypes";
import type { FriendSocialReport } from "./friendReportTemplate";
import type { FriendPrescriptionPack } from "./friendPrescriptionTypes";
import {
  buildFriendshipRoleP1,
  buildFriendContactDistanceP1,
  buildFriendOneOnOneVsGroupP1,
  buildFriendJealousyExclusionP1,
  buildFriendshipInitiativeP1,
  buildLongDistanceSustainabilityP1,
  buildFriendCompositeSynthesisP1,
  buildFriendConflictLoopP0,
  buildFriendRepairPatternP0,
  buildFriendNormalizedActionsP1,
  buildFriendGrowthTransitionP1,
} from "./buildFriendV5DomainModels";

export function buildCanonicalFriendStoryPlan(params: {
  nameA: string;
  nameB: string;
  oneLineFriendship: string;
  socialReport: FriendSocialReport;
  prescriptions?: FriendPrescriptionPack;
  locale?: "ko-KR" | "en-US";
}): CanonicalFriendStoryPlan {
  const { nameA, nameB, oneLineFriendship, socialReport, prescriptions, locale = "ko-KR" } = params;

  const selectedClaims: FriendClaim[] = [];
  const suppressedClaims: FriendClaim[] = [];
  const seenMeaningIds = new Set<string>();

  const trackClaim = (claim: FriendClaim) => {
    if (seenMeaningIds.has(claim.meaningId)) {
      suppressedClaims.push({ ...claim });
    } else {
      seenMeaningIds.add(claim.meaningId);
      selectedClaims.push(claim);
    }
  };

  // 1. Overview / Identity
  trackClaim({
    id: "claim_friend_identity",
    meaningId: "meaning_friend_identity",
    topic: "identity",
    perspective: "friendship",
    polarity: "strength",
    evidenceIds: ["friend.one_line_friendship"],
    sourceType: "rule",
    primarySemanticOwner: "overview",
    confidence: "high",
  });

  // 2. Communication / Contact Tempo
  trackClaim({
    id: "claim_contact_tempo",
    meaningId: "meaning_contact_tempo",
    topic: "communication",
    perspective: "friendship",
    polarity: "neutral",
    evidenceIds: ["friend.contact_tempo"],
    sourceType: "psych",
    primarySemanticOwner: "part1_communication",
    confidence: "high",
  });

  // Duplicate claim tracking test for overview duplicate suppression
  trackClaim({
    id: "claim_contact_tempo_dup",
    meaningId: "meaning_contact_tempo",
    topic: "communication",
    perspective: "friendship",
    polarity: "neutral",
    evidenceIds: ["friend.contact_tempo"],
    sourceType: "psych",
    primarySemanticOwner: "overview",
    confidence: "high",
  });

  // 3. Social Battery / Energy
  trackClaim({
    id: "claim_social_battery",
    meaningId: "meaning_social_battery",
    topic: "social_energy",
    perspective: "friendship",
    polarity: "neutral",
    evidenceIds: ["friend.battery"],
    sourceType: "psych",
    primarySemanticOwner: "social_dna",
    confidence: "high",
  });

  // 4. Support Style
  trackClaim({
    id: "claim_counseling_style",
    meaningId: "meaning_counseling_style",
    topic: "support",
    perspective: "self",
    polarity: "strength",
    evidenceIds: ["friend.counseling"],
    sourceType: "psych",
    primarySemanticOwner: "hidden_flow",
    confidence: "high",
  });

  // 5. Reset / Repair
  trackClaim({
    id: "claim_repair_reset",
    meaningId: "meaning_repair_reset",
    topic: "repair",
    perspective: "friendship",
    polarity: "strength",
    evidenceIds: ["friend.reset"],
    sourceType: "rule",
    primarySemanticOwner: "user_manual",
    confidence: "high",
  });

  // Phase 5B Domain Models
  const friendshipRoleP1 = buildFriendshipRoleP1({ nameA, nameB, socialReport });
  const contactDistanceP1 = buildFriendContactDistanceP1({ socialReport });
  const oneOnOneVsGroupP1 = buildFriendOneOnOneVsGroupP1({ socialReport });
  const jealousyExclusionP1 = buildFriendJealousyExclusionP1({ socialReport });
  const initiativeP1 = buildFriendshipInitiativeP1();
  const longDistanceSustainabilityP1 = buildLongDistanceSustainabilityP1();
  const synthesisResultsP1 = buildFriendCompositeSynthesisP1({ socialReport });
  const conflictLoopP0 = buildFriendConflictLoopP0({ socialReport });
  const repairPatternP0 = buildFriendRepairPatternP0({ prescriptions });
  const normalizedActionCandidatesP1 = buildFriendNormalizedActionsP1({ nameA, nameB, prescriptions });
  const growthTransitionP1 = buildFriendGrowthTransitionP1();

  return {
    schemaVersion: "friend_story_plan_v1",
    locale,
    names: { a: nameA, b: nameB },
    friendshipCore: {
      identityLine: oneLineFriendship,
      chemistryLevel: `${socialReport.snapshot?.connection_pct ?? 80}%`,
      socialRiskLevel: `${socialReport.snapshot?.risk_pct ?? 20}%`,
    },
    mutualRoles: {
      selfRole: socialReport.overview?.dynamic_summary,
      friendRole: socialReport.overview?.gift_from_b,
      sharedDynamic: socialReport.overview?.dynamic_summary,
    },
    communication: {
      contactTempo: socialReport.overview?.dynamic_summary,
      conversationRhythm: socialReport.overview?.dynamic_summary,
      hurtExpression: socialReport.overview?.risk_point,
    },
    socialEnergy: {
      batteryPattern: socialReport.overview?.dynamic_summary,
      planningStyle: socialReport.overview?.dynamic_summary,
    },
    supportStyle: {
      selfSupport: socialReport.overview?.gift_from_a,
      friendSupport: socialReport.overview?.gift_from_b,
    },
    closenessDistance: {
      distancePattern: socialReport.overview?.dynamic_summary,
      sustainability: socialReport.overview?.dynamic_summary,
    },
    conflict: {
      trigger: socialReport.overview?.risk_point,
    },
    repair: {
      currentResetPattern: prescriptions?.sos_script?.[0] || "서로 열을 식힌 후 편안하게 소통 재개",
    },
    actions: {
      selfAdvice: prescriptions?.prescriptions_a || [],
      friendAdvice: prescriptions?.prescriptions_b || [],
      sharedAdvice: prescriptions?.shared_activities || [],
    },
    friendshipRoleP1,
    contactDistanceP1,
    oneOnOneVsGroupP1,
    jealousyExclusionP1,
    initiativeP1,
    longDistanceSustainabilityP1,
    synthesisResultsP1,
    conflictLoopP0,
    repairPatternP0,
    normalizedActionCandidatesP1,
    growthTransitionP1,
    selectedClaims,
    suppressedClaims,
  };
}
