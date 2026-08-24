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

export type FamilyChildGrowthChapterBundle = {
  /** ◤ 01. 이 아이를 움직이게 하는 힘 */
  motivation: {
    driveTitle: string;
    driveDesc: string;
    primaryMotivator: string;
  };

  /** ◤ 02. 배우고 몰입하는 방식 */
  learning: {
    oneLineStudyType: string;
    focusEnvironment: string;
    understandingStyle: string;
    planningStyle: string;
    socialMode: string;
  };

  /** ◤ 03. 칭찬과 기대가 동기가 되는 방식 */
  motivationAndExpectation: {
    praiseGuidanceTitle: string;
    praiseGuidanceDesc: string;
    expectationTitle: string;
    expectationDesc: string;
  };

  /** ◤ 04. 새로운 도전과 실패를 다루는 방식 */
  challenge: {
    challengeTitle: string;
    challengeDesc: string;
    resiliencePattern: string;
  };

  /** ◤ 05. 밖에 나가면 어떤 모습이 될까요 */
  socialOperating: {
    socialOperatingTitle: string;
    socialOperatingDesc: string;
    recommendedActivities: string[];
  };

  /** ◤ 06. 능력이 잘 살아나는 환경 */
  environmentFit: {
    envConditions: Array<{
      label: string;
      value: string;
      left: string;
      right: string;
      positionPct: number;
    }>;
    envSummary: string;
  };

  /** ◤ 07. 잠재력이 자라는 방식 */
  potentialPace?: {
    potentialTitle: string;
    potentialDesc: string;
  } | null;

  /** ◤ 08. 올해 특히 키우게 될 힘 */
  yearlyGrowth?: {
    yearlyTheme: string;
    yearlyBehavior: string;
    parentSupportRole: string;
    reassuranceNote: string;
  } | null;

  /** ◤ 09. 이 아이를 키울 때 기억하면 좋은 것 */
  parentGuidance: {
    pushForward: string;
    scaffold: string;
    lessOf: string;
  };
};

export type FamilyRepairChapterBundle = {
  /** 01. 감정이 올라온 뒤 각자는 어떻게 풀릴까요 */
  recoveryRhythms: {
    parentHeadline: string;
    parentDesc: string;
    childHeadline: string;
    childDesc: string;
  };

  /** 02. 언제 다시 말을 거는 게 좋을까요 */
  timingAnalysis: {
    timingHeadline: string;
    timingDesc: string;
    sequencingRule: string;
  };

  /** 03. 다시 마음이 열리려면 무엇이 먼저 필요할까요 */
  prerequisites: {
    parentNeed: string;
    childNeed: string;
    repairSequence: string[];
  };

  /** 04. 잘 풀리는 화해 / 다시 꼬이는 화해 */
  doAndDontRepair: {
    effectiveTitle: string;
    effectiveReason: string;
    harmfulTitle: string;
    harmfulReason: string;
  };

  /** 05. 이 관계에 잘 맞는 회복 스위치 */
  recoverySwitches: Array<{
    title: string;
    desc: string;
    speechTip?: string;
  }>;

  /** 06. 이럴 때는 오히려 역효과예요 */
  antiPatterns: Array<{
    title: string;
    whyItFails: string;
  }>;

  /** 07. 다음번에는 조금 덜 오래 끌기 위해 */
  synthesisPrinciple: {
    corePrinciple: string;
    summaryDesc: string;
  };
};

export type FamilyActionChapterBundle = {
  /** 01. 이 관계에서 가장 기억해야 할 것 */
  finalTakeaway: {
    childNeedTitle: string;
    childNeedDesc: string;
    parentStrengthTitle: string;
    parentStrengthDesc: string;
    cautionPointTitle: string;
    cautionPointDesc: string;
  };

  /** 02. 부모와 자녀를 위한 맞춤 실천 제안 */
  customActions: {
    parentActions: Array<{
      title: string;
      whyItMatters: string;
      practicalExample: string;
    }>;
    childActions: Array<{
      title: string;
      whyItMatters: string;
      practicalExample: string;
    }>;
    togetherActions: Array<{
      title: string;
      whyItMatters: string;
      practicalExample: string;
    }>;
  };

  /** 03. 이 관계에서는 이것만은 줄여보세요 */
  finalDonts: Array<{
    title: string;
    whyHarmful: string;
    dontExample?: string;
  }>;
  doAndDontPairs?: Array<{
    doTitle: string;
    doExample: string;
    dontTitle: string;
    dontExample: string;
    whyHarmful: string;
  }>;

  /** 04. 관계를 오래 지켜주는 작은 루틴 */
  relationshipRoutines: Array<{
    title: string;
    desc: string;
    frequencyTip: string;
  }>;

  /** 05. 부모의 마음이 유독 더 움직이기 쉬운 지점 */
  affinitySignal: {
    title: string;
    desc: string;
    disclaimer: string;
  };

  /** 06. 미래의 패밀리 리워드 */
  futureReward: {
    subtitle: string;
    themes: Array<{
      title: string;
      desc: string;
    }>;
  };

  /** 07. 이 관계가 잘 자라면 */
  futurePortrait: {
    title: string;
    narrative: string;
  };
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

  /** Part 06 Canonical Child Growth Intelligence Bundle */
  growthChapterBundle?: FamilyChildGrowthChapterBundle;

  /** Part 07 Canonical Emotional Repair Bundle */
  repairChapterBundle?: FamilyRepairChapterBundle;

  /** Part 08 Canonical Action & Synthesis Bundle */
  actionChapterBundle?: FamilyActionChapterBundle;

  selectedClaims: FamilyClaim[];
  suppressedClaims: FamilyClaim[];
  insightCandidates?: FamilyInsightCandidate[];
  actionCandidates?: FamilyActionCandidate[];
  synthesisResults?: FamilySynthesisResult[];
  evidenceMap: Record<string, any>;
};
