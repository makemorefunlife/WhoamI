export type WorkClaim = {
  id: string;
  meaningId: string;
  topic: string;
  perspective: "self" | "colleague" | "team";
  polarity: "strength" | "risk" | "neutral";
  evidenceIds: string[];
  sourceType: string;
  primarySemanticOwner: string;
  confidence: "high" | "medium" | "low";
};

export type WorkRoleAuthorityPattern = {
  directionOwner?: "self" | "colleague" | "shared" | "unclear";
  executionOwner?: "self" | "colleague" | "shared" | "unclear";
  coordinationOwner?: "self" | "colleague" | "shared" | "unclear";
  qualityOwner?: "self" | "colleague" | "shared" | "unclear";
  externalOwner?: "self" | "colleague" | "shared" | "unclear";
  overlapRisk?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type WorkDecisionRightsPattern = {
  proposer?: "self" | "colleague" | "team";
  decisionOwner?: "self" | "colleague" | "team";
  validator?: "self" | "colleague" | "team";
  decisionTempo?: string;
  jointDecisionRisk?: string;
  escalationRule?: string;
  evidenceIds: string[];
};

export type WorkFeedbackPattern = {
  selfReceiveStyle?: string;
  colleagueReceiveStyle?: string;
  preferredDelivery?: string;
  publicVsPrivate?: "private_only" | "public_ok" | "buffered";
  evidenceIds: string[];
};

export type SoloVsCollaborativeThinking = {
  thinkingStyle?: string;
  preparationPreference?: string;
  brainstormingFit?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type WorkCrisisPattern = {
  pressureModeSelf?: string;
  pressureModeColleague?: string;
  realityStabilizer?: "self" | "colleague" | "team";
  decisionPusher?: "self" | "colleague" | "team";
  riskChecker?: "self" | "colleague" | "team";
  externalCommunicator?: "self" | "colleague" | "team";
  operationalRisk?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type WorkErrorResponse = {
  selfMistakeResponse?: string;
  colleagueMistakeResponse?: string;
  recoveryMode?: string;
  accountabilityNeed?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type WorkConflictLoop = {
  trigger?: string;
  selfResponse?: string;
  colleagueResponse?: string;
  escalationMechanism?: string;
  operationalConsequence?: string;
  breakPattern?: string;
  evidenceIds: string[];
};

export type WorkRepairPattern = {
  deEscalateSos?: string;
  repairSequence?: string[];
  routineProcess?: string;
  boundaryRule?: string;
  evidenceIds: string[];
};

export type WorkProjectFit = {
  bestConditions: string[];
  strongestPairContribution: string[];
  watchConditions: string[];
  evidenceIds: string[];
};

export type WorkAvoidCombination = {
  operatingModelRisks: string[];
  riskMitigation: string;
  evidenceIds: string[];
};

export type WorkSynthesisResult = {
  ruleId: string;
  category: "complementary_authority_clash" | "high_fit_feedback_mismatch" | "fast_decision_high_risk" | "strong_performers_weak_handoff" | "high_synergy_high_burnout";
  headline: string;
  narrative: string;
  evidenceIds: string[];
};

export type WorkActionCandidate = {
  id: string;
  meaningId: string;
  perspective: "self" | "colleague" | "team";
  actionType: "DO" | "DONT" | "DE_ESCALATE" | "REPAIR" | "ROUTINE" | "BOUNDARY" | "HANDOFF" | "DECISION" | "FEEDBACK";
  title: string;
  description: string;
  evidenceIds: string[];
  primarySemanticOwner: string;
};

export type WorkGrowthTransition = {
  currentPattern: string;
  recommendedAdjustment: string;
  targetOperatingModel: string;
  evidenceIds: string[];
};

export type WorkInsightCandidate = {
  id: string;
  meaningId: string;
  topic: string;
  perspective: "self" | "colleague" | "team";
  headline: string;
  body: string;
  evidenceIds: string[];
  primarySemanticOwner: string;
  confidence: "high" | "medium" | "low";
};

export type CanonicalWorkStoryPlan = {
  schemaVersion: "work_story_plan_v1";
  locale: "ko-KR" | "en-US";
  names: { a: string; b: string };
  partnershipCore: {
    identityLine: string;
    fitScore: string;
    riskScore: string;
  };
  workRoles: {
    selfRole?: string;
    colleagueRole?: string;
    sharedSynergy?: string;
  };
  decisionDynamics: {
    decisionSpeed?: string;
    authorityDivision?: string;
  };
  communication: {
    workTempo?: string;
    feedbackStyle?: string;
  };
  stressCrisis: {
    pressurePattern?: string;
    crisisRole?: string;
  };
  conflict: {
    meetingConflictTrigger?: string;
  };
  repair: {
    operatingReset?: string;
  };
  actions: {
    selfAdvice?: string[];
    colleagueAdvice?: string[];
    sharedRoutine?: string[];
  };

  // Phase 6B Domain Models
  roleAuthorityP1?: WorkRoleAuthorityPattern;
  decisionRightsP1?: WorkDecisionRightsPattern;
  feedbackP1?: WorkFeedbackPattern;
  thinkingModeP1?: SoloVsCollaborativeThinking;
  crisisP1?: WorkCrisisPattern;
  errorResponseP1?: WorkErrorResponse;
  projectFitP1?: WorkProjectFit;
  avoidCombinationP1?: WorkAvoidCombination;
  synthesisResultsP1?: WorkSynthesisResult[];
  conflictLoopP0?: WorkConflictLoop;
  repairPatternP0?: WorkRepairPattern;
  normalizedActionCandidatesP1?: WorkActionCandidate[];
  growthTransitionP1?: WorkGrowthTransition;
  insightCandidatesP1?: WorkInsightCandidate[];

  selectedClaims: WorkClaim[];
  suppressedClaims: WorkClaim[];
};
