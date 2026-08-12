export type CoupleClaim = {
  id: string;
  meaningId: string;
  topic: string;
  perspective: "self" | "partner" | "couple";
  polarity: "strength" | "risk" | "neutral";
  evidenceIds: string[];
  sourceType: string;
  primarySemanticOwner: string;
  confidence: "high" | "medium" | "low";
};

export type CoupleLifePartnerRole = {
  selfRole?: string;
  partnerRole?: string;
  coupleSynergy?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type CoupleHouseholdOperatingPattern = {
  noticingOwner?: "self" | "partner" | "shared" | "unclear";
  planningOwner?: "self" | "partner" | "shared" | "unclear";
  executionOwner?: "self" | "partner" | "shared" | "unclear";
  followUpOwner?: "self" | "partner" | "shared" | "unclear";
  coordinationPattern?: string;
  overloadRisk?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type CoupleMentalLoadPattern = {
  primaryCoordinator?: "self" | "partner" | "shared" | "unclear";
  invisibleLoadRisk?: "low" | "medium" | "high" | "insufficient";
  recognitionNeed?: string;
  redistributionNeed?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type CoupleMoneyPattern = {
  dailySpendingStyle?: string;
  savingOrientation?: string;
  sharedExpenseHandling?: string;
  financialRiskSensitivity?: string;
  evidenceIds: string[];
};

export type CoupleMajorDecisionPattern = {
  proposer?: "self" | "partner" | "couple";
  evaluator?: "self" | "partner" | "couple";
  riskChecker?: "self" | "partner" | "couple";
  decisionTempo?: string;
  jointDecisionRule?: string;
  vetoBoundary?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type CoupleChorePattern = {
  cleanlinessStandardGap?: string;
  taskVisibility?: string;
  timingPreference?: string;
  choreDivisionStyle?: string;
  evidenceIds: string[];
};

export type CoupleSpaceTogethernessPattern = {
  closenessStyle?: string;
  personalSpaceNeed?: string;
  rechargeRhythmMatch?: string;
  weekendTogethernessPattern?: string;
  evidenceIds: string[];
};

export type CoupleExtendedFamilyBoundary = {
  familyInvolvementStyle?: string;
  privacyBoundary?: string;
  holidayEventHandling?: string;
  loyaltyBalanceRule?: string;
  evidenceIds: string[];
};

export type CoupleCrisisPattern = {
  logisticsHandler?: "self" | "partner" | "couple";
  emotionalStabilizer?: "self" | "partner" | "couple";
  decisionPusher?: "self" | "partner" | "couple";
  riskChecker?: "self" | "partner" | "couple";
  externalCommunicator?: "self" | "partner" | "couple";
  operationalRiskUnderStress?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type CoupleRoleLockPattern = {
  repeatingConflictRole?: string;
  triggerContext?: string;
  lockMechanism?: string;
  deEscalationBreakPattern?: string;
  evidenceIds: string[];
};

export type CoupleLongTermIntimacyPattern = {
  sustainingFactors: string[];
  erosionRisks: string[];
  intimacyMaintenanceNeed?: string;
  evidenceIds: string[];
};

export type CoupleFutureOperatingPattern = {
  informationStage?: string;
  independentReflectionRule?: string;
  jointDiscussionStyle?: string;
  riskReviewGate?: string;
  finalAgreementRule?: string;
  evidenceIds: string[];
};

export type CoupleSynthesisResult = {
  ruleId: string;
  category: "strong_love_weak_household" | "strong_household_low_expression" | "high_closeness_high_autonomy" | "financial_align_major_decision_clash" | "career_support_uneven_mental_load" | "strong_chemistry_chronic_role_lock";
  headline: string;
  narrative: string;
  evidenceIds: string[];
};

export type CoupleConflictLoop = {
  trigger?: string;
  selfResponse?: string;
  partnerResponse?: string;
  roleLockMechanism?: string;
  operationalConsequence?: string;
  breakPattern?: string;
  evidenceIds: string[];
};

export type CoupleRepairPattern = {
  deEscalateSos?: string;
  repairSequence?: string[];
  routineProcess?: string;
  boundaryRule?: string;
  householdResetRule?: string;
  evidenceIds: string[];
};

export type CoupleActionCandidate = {
  id: string;
  meaningId: string;
  perspective: "self" | "partner" | "couple";
  actionType: "DO" | "DONT" | "DE_ESCALATE" | "REPAIR" | "ROUTINE" | "BOUNDARY" | "MONEY" | "HOUSEHOLD" | "DECISION" | "INTIMACY" | "FAMILY";
  title: string;
  description: string;
  evidenceIds: string[];
  primarySemanticOwner: string;
};

export type CoupleGrowthTransition = {
  currentPattern: string;
  recommendedAdjustment: string;
  targetOperatingModel: string;
  evidenceIds: string[];
};

export type CoupleInsightCandidate = {
  id: string;
  meaningId: string;
  topic: string;
  perspective: "self" | "partner" | "couple";
  headline: string;
  body: string;
  evidenceIds: string[];
  primarySemanticOwner: string;
  confidence: "high" | "medium" | "low";
};

export type CanonicalCoupleStoryPlan = {
  schemaVersion: "couple_story_plan_v1";
  locale: "ko-KR" | "en-US";
  names: { a: string; b: string };
  coupleCore: {
    identityLine: string;
    homeFitScore: string;
    riskScore: string;
  };
  lifePartnerRoles?: CoupleLifePartnerRole;
  householdOperatingP1?: CoupleHouseholdOperatingPattern;
  mentalLoadP1?: CoupleMentalLoadPattern;
  moneyP1?: CoupleMoneyPattern;
  majorDecisionsP1?: CoupleMajorDecisionPattern;
  choresP1?: CoupleChorePattern;
  spaceTogethernessP1?: CoupleSpaceTogethernessPattern;
  extendedFamilyP1?: CoupleExtendedFamilyBoundary;
  crisisP1?: CoupleCrisisPattern;
  roleLockP1?: CoupleRoleLockPattern;
  longTermIntimacyP1?: CoupleLongTermIntimacyPattern;
  futureOperatingP1?: CoupleFutureOperatingPattern;
  synthesisResultsP1?: CoupleSynthesisResult[];
  conflictLoopP0?: CoupleConflictLoop;
  repairPatternP0?: CoupleRepairPattern;
  normalizedActionCandidatesP1?: CoupleActionCandidate[];
  growthTransitionP1?: CoupleGrowthTransition;
  insightCandidatesP1?: CoupleInsightCandidate[];

  selectedClaims: CoupleClaim[];
  suppressedClaims: CoupleClaim[];
};
