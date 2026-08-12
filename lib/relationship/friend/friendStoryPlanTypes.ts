export type FriendClaim = {
  id: string;
  meaningId: string;
  topic: string;
  perspective: "self" | "friend" | "friendship";
  polarity: "strength" | "risk" | "neutral";
  evidenceIds: string[];
  sourceType: string;
  primarySemanticOwner: string;
  confidence: "high" | "medium" | "low";
};

export type FriendshipRole = {
  selfToFriend?: string;
  friendToSelf?: string;
  sharedDynamic?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type FriendContactDistancePattern = {
  contactRhythm?: string;
  replyExpectation?: string;
  meetingPreference?: string;
  distanceTolerance?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type FriendOneOnOneVsGroup = {
  oneOnOneMode?: string;
  groupMode?: string;
  roleShift?: string;
  fatigueRisk?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type FriendJealousyExclusion = {
  recognitionSensitivity?: string;
  exclusionSensitivity?: string;
  comparisonSensitivity?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type FriendshipInitiativePattern = {
  contactInitiator?: "self" | "friend" | "either" | "unclear";
  planningInitiator?: "self" | "friend" | "either" | "unclear";
  repairInitiator?: "self" | "friend" | "either" | "unclear";
  summary?: string;
  evidenceIds: string[];
};

export type LongDistanceSustainability = {
  sustainabilityLevel: "high" | "moderate" | "requires_intentional_contact" | "unclear";
  summary?: string;
  evidenceIds: string[];
};

export type FriendInnateVsCurrentCategory =
  | "ALIGNED"
  | "CURRENTLY_EXPRESSED"
  | "CURRENTLY_SUPPRESSED"
  | "CONTEXT_SHIFT"
  | "INNER_OUTER_GAP"
  | "RELATIONSHIP_ACTIVATED";

export type FriendSynthesisResult = {
  ruleId: string;
  category: "closeness_low_contact" | "chemistry_tempo_mismatch" | "advice_trust_bridge" | "conflict_strong_recovery" | "high_energy_fatigue";
  headline: string;
  narrative: string;
  evidenceIds: string[];
};

export type FriendConflictLoop = {
  trigger?: string;
  selfReaction?: string;
  friendReaction?: string;
  escalationMechanism?: string;
  breakPattern?: string;
  evidenceIds: string[];
};

export type FriendRepairPattern = {
  sosImmediate?: string;
  repairSequence?: string[];
  routineMaintenance?: string;
  boundaryRule?: string;
  evidenceIds: string[];
};

export type FriendActionCandidate = {
  id: string;
  meaningId: string;
  perspective: "self" | "friend" | "friendship";
  actionType: "SOS" | "REPAIR" | "ROUTINE" | "BOUNDARY" | "CONTACT" | "SOCIAL";
  title: string;
  description: string;
  evidenceIds: string[];
  primarySemanticOwner: string;
};

export type FriendGrowthTransition = {
  currentPattern: string;
  recommendedAdjustment: string;
  targetDynamic: string;
  evidenceIds: string[];
};

export type FriendInsightCandidate = {
  id: string;
  meaningId: string;
  topic: string;
  perspective: "self" | "friend" | "friendship";
  headline: string;
  body: string;
  evidenceIds: string[];
  primarySemanticOwner: string;
  confidence: "high" | "medium" | "low";
};

export type CanonicalFriendStoryPlan = {
  schemaVersion: "friend_story_plan_v1";
  locale: "ko-KR" | "en-US";
  names: { a: string; b: string };
  friendshipCore: {
    identityLine: string;
    chemistryLevel: string;
    socialRiskLevel: string;
  };
  mutualRoles: {
    selfRole?: string;
    friendRole?: string;
    sharedDynamic?: string;
  };
  communication: {
    contactTempo?: string;
    conversationRhythm?: string;
    hurtExpression?: string;
  };
  socialEnergy: {
    batteryPattern?: string;
    planningStyle?: string;
  };
  supportStyle: {
    selfSupport?: string;
    friendSupport?: string;
  };
  closenessDistance: {
    distancePattern?: string;
    sustainability?: string;
  };
  conflict: {
    trigger?: string;
  };
  repair: {
    currentResetPattern?: string;
  };
  actions: {
    selfAdvice?: string[];
    friendAdvice?: string[];
    sharedAdvice?: string[];
  };

  // Phase 5B Expanded Domain Models
  friendshipRoleP1?: FriendshipRole;
  contactDistanceP1?: FriendContactDistancePattern;
  oneOnOneVsGroupP1?: FriendOneOnOneVsGroup;
  jealousyExclusionP1?: FriendJealousyExclusion;
  initiativeP1?: FriendshipInitiativePattern;
  longDistanceSustainabilityP1?: LongDistanceSustainability;
  synthesisResultsP1?: FriendSynthesisResult[];
  conflictLoopP0?: FriendConflictLoop;
  repairPatternP0?: FriendRepairPattern;
  normalizedActionCandidatesP1?: FriendActionCandidate[];
  growthTransitionP1?: FriendGrowthTransition;
  insightCandidatesP1?: FriendInsightCandidate[];

  selectedClaims: FriendClaim[];
  suppressedClaims: FriendClaim[];
};
