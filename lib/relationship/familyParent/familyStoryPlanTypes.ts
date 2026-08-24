export type FamilyTopic =
  | "relationshipCore"
  | "familyRoles"
  | "childProfile"
  | "discipline"
  | "conflict"
  | "growth"
  | "deepRead"
  | "actions";

export type FamilyPerspective = "parent" | "child" | "pair" | "shared";

export type FamilyPolarity = "strength" | "risk" | "neutral";

export type FamilyClaimPriority = "primary" | "secondary" | "fallback";

export type FamilySourceType =
  | "personal_ce"
  | "pair_ce"
  | "pair_saju"
  | "ten_god"
  | "element"
  | "psych_axis"
  | "family_rule";

export type FamilyClaim = {
  /** Unique identifier for the claim (e.g. 'bond.high', 'talent.empathy') */
  id: string;
  topic: FamilyTopic;
  perspective: FamilyPerspective;
  polarity: FamilyPolarity;
  priority: FamilyClaimPriority;
  /** Primary semantic owner of this claim (e.g. 'overview', 'deepRead', 'action') */
  owner: string;
  evidenceIds: string[];
  sourceType: FamilySourceType;
  /** Optional text or key representing the meaning of this claim */
  meaning?: string;
  /** Flag to indicate if this claim needs synthesis in a later phase */
  needsSynthesis?: boolean;
};

export type FamilyInsightCandidate = {
  id: string;
  topic: FamilyTopic;
  perspective: FamilyPerspective;
  meaningId: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
  priority: number;
  currentCopy?: string;
  recommendedActionIds?: string[];
  sourceType: FamilySourceType;
};

export type FamilyActionCandidate = {
  id: string;
  type: "do" | "dont" | "sos" | "routine" | "repair" | "boundary";
  perspective: FamilyPerspective;
  triggerEvidenceIds: string[];
  targetTopic: FamilyTopic;
  priority: number;
  copy: string;
  meaningId?: string;
};

export type FamilyInnateVsCurrentCategory =
  | "ALIGNED"
  | "CURRENTLY_AMPLIFIED"
  | "CURRENTLY_SUPPRESSED"
  | "CONTEXT_SHIFT"
  | "INNER_OUTER_GAP"
  | "RELATIONSHIP_ACTIVATED";

export type FamilySynthesisResult = {
  id: string;
  sourceClaimIds: string[];
  evidenceIds: string[];
  synthesisType: "deterministic" | "llm";
  topic: FamilyTopic;
  perspective: FamilyPerspective;
  canonicalMeaningId: string;
  confidence: "high" | "medium";
  narrative?: string;
  innateVsCurrentCategory?: FamilyInnateVsCurrentCategory;
};

export type FamilyConflictLoop = {
  triggerEvidenceIds: string[];
  parentTrigger?: string;
  childReaction?: string;
  parentEscalation?: string;
  breakPattern?: string;
  confidence: "high" | "medium";
};

export type FamilyRepairPattern = {
  coolingNeed: "none" | "short" | "moderate" | "extended";
  initiatorRole: "parent" | "child" | "either";
  effectiveRepairStyle: string;
  ineffectiveRepairStyle: string;
  reconnectionAction: string;
};

export type FamilyGrowthTransition = {
  currentRolePattern: string;
  recommendedShift: string;
  evidenceIds: string[];
  transitionReason: string;
  boundaryRule?: string;
  confidence: "high" | "medium" | "low";
};

import type { ChildParentingNeedsOutput } from "./familyChildParentingNeedsEngine";

export type CanonicalFamilyPairMeanings = {
  dependencyProtection?: {
    provider: string;
    reliance: string;
    roleReversalRisk: boolean;
    summary: string;
  };
  loveExpressionVsReception?: {
    parentExpresses: string;
    childReceives: string;
    alignment: "matched" | "misaligned" | "partially_matched";
    summary: string;
  };
  expectationVsPressure?: {
    parentExpectation: string;
    childPressureReception: string;
    gapLevel: "high" | "moderate" | "low";
    summary: string;
  };
  childCoreNeeds?: {
    primaryNeeds: string[];
    currentSupplyStatus: string;
    summary: string;
  };
  /** Extended Child Desired Parenting Style x Parent Supply x Pair Gap Structure */
  childCoreNeedsDetailed?: ChildParentingNeedsOutput;
};

export type FamilyLoveExpressionAnalysis = {
  parentExpressionTitle: string;
  parentExpressionDesc: string;
  childReceptionTitle: string;
  childReceptionDesc: string;
  pairSynthesisTitle: string;
  pairSynthesisDesc: string;
  keyInsightLine: string;
};

export type FamilyConflictCategoryKey =
  | "rules_standards"
  | "autonomy_control"
  | "emotional_speed"
  | "expectations_pressure"
  | "expression_style"
  | "authority_justification";

export type FamilyConflictCardItem = {
  id: string;
  category: FamilyConflictCategoryKey;
  numLabel: string;
  title: string;
  subhead: string;
  parentLogic: string;
  childLogic: string;
  realSituationScene: string;
  contrastBar: {
    left: string;
    right: string;
  };
  evidenceScore: number;
};

export type FamilyConflictLoopV2 = {
  step1ParentTrigger: string;
  step2ChildReaction: string;
  step3ParentEscalation: string;
  step4ChildNextReaction: string;
  parentResidualFeeling: string;
  childResidualFeeling: string;
};

export type FamilyConflictChapterBundle = {
  loveAnalysis: FamilyLoveExpressionAnalysis;
  conflictCards: FamilyConflictCardItem[];
  conflictLoop: FamilyConflictLoopV2;
  conflictSynthesisLine: string;
};

export type CanonicalFamilyStoryPlan = {
  relationshipCore: {
    bondLevel: "high" | "medium" | "low";
    riskLevel: "high" | "medium" | "low";
    identityLine: string;
  };
  familyRoles: {
    householdParentRole: string;
    householdChildRole: string;
    psychologicalChildRole: string | null;
  };
  childProfile: {
    talentType: string;
    guidanceMode: string;
  };
  discipline: {
    risk: "high" | "medium" | "low";
    trigger: string;
  };
  conflict: {
    safeDistance: string;
  };
  growth: {
    synergy: string;
  };
  deepRead: {
    parentAdvice: string;
    childAdvice: string;
    sharedAction: string;
  };
  actions: {
    doAction: string;
    dontAction: string;
    sosScript: string;
    maintenanceRoutine: string;
  };

  /** 4 Pair-Level Core Meanings */
  pairMeanings?: CanonicalFamilyPairMeanings;

  /** Part 05 Canonical Conflict Analysis Bundle */
  conflictChapterBundle?: FamilyConflictChapterBundle;

  selectedClaims: FamilyClaim[];
  suppressedClaims: FamilyClaim[];
  insightCandidates?: FamilyInsightCandidate[];
  actionCandidates?: FamilyActionCandidate[];
  synthesisResults?: FamilySynthesisResult[];
  conflictLoop?: FamilyConflictLoop;
  repairPattern?: FamilyRepairPattern;
  growthTransition?: FamilyGrowthTransition;
  evidenceMap: Record<string, any>;
};
