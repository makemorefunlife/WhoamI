import type { Locale } from "@/lib/i18n/locale";
import type {
  CanonicalPersonalSajuFacts,
  CanonicalPairSajuFacts,
} from "@/lib/saju/pairChartAnalysis";

export type FriendGuardianRoleKey = "brain" | "business" | "bamboo";

export type FriendGuardianRoleMeaning = {
  giverName: string;
  receiverName: string;
  key: FriendGuardianRoleKey;
  label: string;
  description: string;
};

export type FriendConnectionSparkMeaning = {
  whyYouTitle: string;
  whyYouBody: string;
  whyMeTitle: string;
  whyMeBody: string;
  whyUsTitle: string;
  whyUsBody: string;
};

export type FriendContactDistanceSyncMeaning = {
  signatureClause: string | null;
  distanceResilienceLine: string | null;
  hasYeokma: boolean;
  contactRhythmNote: string | null;
};

export type FriendCounselingTrustMeaning = {
  counselingStyleA: string;
  counselingStyleB: string;
  counselingGapNote: string | null;
};

export type FriendTravelPlayMeaning = {
  plannerNickname: string | null;
  flexibleNickname: string | null;
  plannerDescription: string | null;
  flexibleDescription: string | null;
  rolePrescription: string | null;
};

export type FriendJealousyGuardMeaning = {
  jealousyGuardA: string | null;
  jealousyGuardB: string | null;
  jealousyTriggerScene: string | null;
};

export type FriendRepairResetMeaning = {
  hashtag: string;
  archetypeLabel: string;
  cheatScript: string;
  reconciliationScript: string | null;
  recoveryPaceNote: string | null;
};

export type FriendDiscrepancyStatus = "CONFIRMED" | "NUANCED" | "DISCREPANT" | "INSUFFICIENT";
export type FriendConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type FriendContactClosenessFitSynthesis = {
  key: "contact_closeness_fit";
  category: "tempo_mismatch" | "tempo_sync" | "low_frequency_durable";
  direction: "symmetrical" | "A_initiates" | "B_initiates";
  status: FriendDiscrepancyStatus;
  confidenceLevel: FriendConfidenceLevel;
  confidenceScore: number; // 0..100 derived from evidence completeness
  title: string;
  summary: string;
  dynamicDescription: string;
  practicalImplication: string;
};

export type FriendEmotionalSafetyFitSynthesis = {
  key: "emotional_safety_fit";
  category: "mutual_deep_safety" | "solution_vs_empathy_mismatch" | "asymmetrical_trust";
  direction: "symmetrical" | "A_trusts_B_more" | "B_trusts_A_more";
  status: FriendDiscrepancyStatus;
  confidenceLevel: FriendConfidenceLevel;
  confidenceScore: number;
  title: string;
  summary: string;
  directionalDetailAtoB: string;
  directionalDetailBtoA: string;
  practicalImplication: string;
};

export type FriendThirdPersonDynamicSynthesis = {
  key: "third_person_dynamic";
  category: "group_stable" | "one_on_one_preferred" | "exclusion_sensitive";
  direction: "symmetrical" | "A_sensitive" | "B_sensitive";
  status: FriendDiscrepancyStatus;
  confidenceLevel: FriendConfidenceLevel;
  confidenceScore: number;
  title: string;
  summary: string;
  groupVsOneOnOnePattern: string;
  riskNote: string | null;
  practicalImplication: string;
};

export type FriendMaintenanceDynamicSynthesis = {
  key: "friendship_maintenance_dynamic";
  category: "shared_initiation" | "anchor_initiator" | "low_maintenance_resilient";
  direction: "symmetrical" | "A_maintains" | "B_maintains";
  status: FriendDiscrepancyStatus;
  confidenceLevel: FriendConfidenceLevel;
  confidenceScore: number;
  title: string;
  summary: string;
  maintenanceRoleDescription: string;
  practicalImplication: string;
};

export type FriendInitiativeRoleProfile = {
  contactInitiator: "symmetrical" | "A_initiates" | "B_initiates";
  planningLead: "symmetrical" | "A_leads" | "B_leads";
  reconnectionLead: "symmetrical" | "A_reconnects" | "B_reconnects";
  summaryNote: string;
};

export type FriendThirdPersonExclusionProfile = {
  comparisonSensitivity: "low" | "moderate" | "high";
  exclusionSensitivity: "low" | "moderate" | "high";
  replacementSensitivity: "low" | "moderate" | "high";
  allowedClaim: string;
  forbiddenOverreach: string;
};

export type FriendTravelPlayRoleProfile = {
  ideaCreator: string;
  planLogisticsLead: string;
  practicalExecutor: string;
  adaptabilityLead: string;
  energyPace: "dense_itinerary" | "balanced_exploration" | "low_stimulation_relax";
};

export type FriendshipDistanceProfile = {
  category: "frequent_contact_bond" | "low_frequency_durable" | "asymmetric_distance_need" | "spontaneous_high_trust";
  replyTempoLabel: string;
  inPersonMeetingNeed: string;
  distanceResilienceSummary: string;
};

export type FriendCoverageProfiles = {
  initiativeRole?: FriendInitiativeRoleProfile;
  thirdPersonExclusion?: FriendThirdPersonExclusionProfile;
  travelPlayRole?: FriendTravelPlayRoleProfile;
  distanceProfile?: FriendshipDistanceProfile;
};

export type FriendCanonicalBundle = {
  schemaVersion: "2.0.0";
  meta: {
    nicknameA: string;
    nicknameB: string;
    locale: Locale;
    grade: string;
    gradeReason: string;
    connectionPct: number;
    banterPct: number;
    riskPct: number;
  };
  canonicalFacts: {
    personalA: CanonicalPersonalSajuFacts;
    personalB: CanonicalPersonalSajuFacts;
    pair: CanonicalPairSajuFacts;
  };
  meanings: {
    connectionSpark?: FriendConnectionSparkMeaning;
    guardianRoleA?: FriendGuardianRoleMeaning;
    guardianRoleB?: FriendGuardianRoleMeaning;
    contactDistanceSync?: FriendContactDistanceSyncMeaning;
    counselingTrust?: FriendCounselingTrustMeaning;
    travelPlay?: FriendTravelPlayMeaning;
    jealousyGuard?: FriendJealousyGuardMeaning;
    repairReset?: FriendRepairResetMeaning;
  };
  syntheses?: FriendSyntheses;
  coverage?: FriendCoverageProfiles;
};
