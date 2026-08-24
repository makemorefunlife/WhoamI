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

export type WorkOverviewCardBundle = {
  score: number;
  qualitativeLabel: string;
  measuresWhat: string;
  whyThisScore: string;
  realWorkScene: string;
};

export type WorkProjectLifecycleNarrative = {
  kickoff: {
    title: string;
    body: string;
  };
  inFlight: {
    title: string;
    body: string;
  };
  synergyMoment: {
    title: string;
    body: string;
  };
  frictionMoment: {
    title: string;
    body: string;
  };
};

export type WorkTeamPortrait = {
  headline: string;
  body: string;
};

export type IndividualWorkStyleItem = {
  situationLabel: string;
  behaviorSummary: string;
  microcopy?: string;
};

export type WorkContributionItem = {
  title: string;
  microcopy: string;
};

export type ConcreteDelegationItem = {
  workTitle: string;
  partnerName: string;
  reason: string;
};

export type IndividualWorkProfile = {
  name: string;
  // Header
  identityLabel: string;
  keyTraits: string[];

  // 01. 일하는 기본 스타일
  workStyleBehaviors: IndividualWorkStyleItem[];

  // 02. 일에 기여하는 방식
  topContributions: WorkContributionItem[];

  // 03. 잘 맞는 업무
  suitableWorkTypes: string[];

  // 04. 잘 맞는 역할 · 직무 · 기능
  suitableRoles: string[];

  // 05. 잘 맞는 팀 · 업무 환경
  thrivingEnvironments: string[];

  // 06. 일을 잘한다고 느끼는 기준
  valueKeywords: string[];
  internalStandardSentence: string;

  // 07. 맡기면 좋은 일
  delegationItems: ConcreteDelegationItem[];

  // 08. 본래의 업무 기질 vs 지금 일하는 방식
  innateVsCurrent: {
    status: "aligned" | "adapted" | "low_confidence";
    innateTraits: string[];
    currentTraits: string[];
    synthesisSentence: string;
  };
};

export type IndividualWorkChapterBundle = {
  personA: IndividualWorkProfile;
  personB: IndividualWorkProfile;
  // 09. 가장 닮은 점 / 가장 다른 점
  mostSimilarInsight: string;
  mostDifferentInsight: string;
};

export type WorkOverviewChapterBundle = {
  workFitCard: WorkOverviewCardBundle;
  synergyCard: WorkOverviewCardBundle;
  officeRiskCard: WorkOverviewCardBundle;
  lifecycleNarrative: WorkProjectLifecycleNarrative;
  teamPortrait: WorkTeamPortrait;
};

import type { WorkCommunicationChapterBundle } from "./workCommunicationChapterEngine";
import type { WorkPressureChapterBundle } from "./workPressureChapterEngine";
import type { WorkConflictChapterBundle } from "./workConflictChapterEngine";
import type { WorkPlaybookChapterBundle } from "./workPlaybookChapterEngine";

export type CanonicalWorkStoryPlan = {
  schemaVersion: "work_story_plan_v1";
  locale: "ko-KR" | "en-US";
  names: { a: string; b: string };
  partnershipCore: {
    identityLine: string;
    fitScore: string;
    riskScore: string;
  };
  overviewChapterBundle?: WorkOverviewChapterBundle;
  individualWorkBundle?: IndividualWorkChapterBundle;
  communicationChapterBundle?: WorkCommunicationChapterBundle;
  pressureChapterBundle?: WorkPressureChapterBundle;
  conflictChapterBundle?: WorkConflictChapterBundle;
  playbookChapterBundle?: WorkPlaybookChapterBundle;
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
