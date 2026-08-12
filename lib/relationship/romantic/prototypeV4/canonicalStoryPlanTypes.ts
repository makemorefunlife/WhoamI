/**
 * Canonical Relationship Story Plan — typed couple-level narrative spine.
 * Sections consume this plan; they must not re-interpret the relationship.
 */

import type { PartnerPreferenceMatch } from "./spousePalaceMatcher";

export type EvidencePriority = "primary" | "supporting" | "contextual" | "suppressed";

export type ClaimBoundary =
  | "direct_evidence"
  | "combination_judgment"
  | "likely_behavior"
  | "limited_inference"
  | "intervention"
  | "observation";

export type ProvenanceRef = {
  evidenceId: string;
  source: string;
  sourcePath: string;
  appliesTo: "a" | "b" | "pair" | "relationship";
  confidence: "deterministic" | "high" | "medium" | "low" | "tentative";
  claimBoundary: ClaimBoundary;
  priority: EvidencePriority;
  supportingEvidenceIds?: string[];
  suppressionReason?: string;
};

export type CanonicalMeaningEvidence = {
  evidenceId: string;
  signalType: string;
  signalFamily: string;
  exactIdentity: string;
  sourcePath: string[];
  owner: "person_a" | "person_b" | "pair";
  position?: "year" | "month" | "day" | "hour" | "cross_chart" | "overall";
  direction?: "a_to_b" | "b_to_a" | "mutual";
  spousePalaceStatus?: "spouse_palace" | "non_spouse_palace" | "not_applicable";
  canonicalMeaning: {
    core: string[];
    relationalPotential: string[];
    requiredContext: string[];
    cautions: string[];
    forbiddenExtensions: string[];
  };
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  confidence: "deterministic" | "high" | "medium" | "low" | "tentative";
  provenance: ProvenanceRef[];
};

export type CanonicalDomainLensInterpretation = {
  evidenceId: string;
  romanticMeaning: string;
  direction: "a_to_b" | "b_to_a" | "mutual";
  chapterRelevance:
    | "c1_hero"
    | "c2_attraction"
    | "c3_dynamics"
    | "c4_conflict"
    | "c5_misunderstanding"
    | "c6_hidden_hearts"
    | "c7_repair"
    | "c8_strength_vulnerability"
    | "c9_daily_life"
    | "c10_future_timing"
    | "c11_reflection"
    | "c12_choice";
  editorialRole: "primary" | "supporting" | "confirmation" | "modifier";
  allowedScenes: string[];
  allowedInference: string[];
  forbiddenInference: string[];
  confidence: "deterministic" | "high" | "medium" | "low" | "tentative";
  evidenceIds: string[];
  tensionCounterpart?: string;
};

export type StoryFace = {
  situation: "private" | "responsibility" | "stress";
  appearance: string;
  mechanism: string;
  benefit: string;
  riskWhenExcess: string;
  observableSignal: string;
  provenance: ProvenanceRef[];
};

export type AttractionNarrativeUnit = {
  subject: "a_to_b" | "b_to_a" | "mutual";
  recognition: string;
  emotionalMeaning: string;
  partnerEvidence: string[];
  scene: string | null;
  pairSpecificEffect: string | null;
  tensionBridge: string | null;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low" | "tentative";
  usedClaims: string[];
};

export type AttractionDirection = {
  seeker: "a" | "b";
  seeksInPartner: string;
  partnerMatchPoint: string;
  supportingReasons?: string[];
  cautionReasons?: string[];
  preferenceMatch?: PartnerPreferenceMatch;
  narrativeUnit?: AttractionNarrativeUnit;
  provenance: ProvenanceRef[];
};

export type StructuredInsight = {
  id: string;
  sourceType: "psych" | "ce" | "timing";
  confidence: "high" | "medium" | "low";
  userQuestion: string;
  plainLanguageDefinition: string;
  personATendency: string;
  personBTendency: string;
  pairDynamic: string;
  observableScene: string;
  likelyMisreadingA: string | null;
  likelyMisreadingB: string | null;
  relationshipStrength: string;
  relationshipRisk: string;
  practicalTranslation: string;
  evidenceRefs: ProvenanceRef[];
  technicalNoteOptional?: string;
  limitations?: string;
};

export type AxisPriorityRow = StructuredInsight & {
  axisKey: string;
  axisLabel: string;
  role: "top_difference" | "stabilizing_similarity" | "contextual";
  scoreA: number;
  scoreB: number;
  gap: number;
  matchType: string;
};

export type BilateralChange = {
  from: "a" | "b";
  to: "a" | "b";
  change: string;
  excessVulnerability: string;
  provenance: ProvenanceRef[];
};

export type DirectionalMisread = {
  direction: "a_observes_b" | "b_observes_a";
  observedBehavior: string;
  observerFelt: string;
  commonNegativeReading: string;
  actorPossibleNeed: string;
  meaningGap: string;
  betterExpression: string;
  helpfulResponse: string;
  provenance: ProvenanceRef[];
  confidence: "high" | "medium" | "low" | "tentative";
};

export type HiddenHeartBits = {
  person: "a" | "b";
  visibleReaction: string;
  innerFeeling: string;
  reason: string;
  fear: string;
  whatHelps: string;
  unspokenNeed: string;
  provenance: ProvenanceRef[];
};

import type { PersonalRelationshipCe } from "./personalRelationshipCe";
import type { RomanticPairNeedsOutput } from "./romanticRelationshipNeedsEngine";

export type CanonicalRomanticPairMeanings = {
  dependencyProtection?: {
    provider: string;
    reliance: string;
    roleReversalRisk: boolean;
    summary: string;
  };
  loveExpressionVsReception?: {
    expressesA: string;
    receivesB: string;
    alignment: "matched" | "misaligned" | "partially_matched";
    summary: string;
  };
  expectationVsPressure?: {
    expectationA: string;
    pressureB: string;
    gapLevel: "high" | "moderate" | "low";
    summary: string;
  };
  pairNeedsDetailed?: RomanticPairNeedsOutput;
};

export type CanonicalRelationshipStoryPlan = {
  schemaVersion: "romantic_story_plan_v1";
  locale: "ko-KR" | "en-US";
  reportYear: number;
  names: { a: string; b: string };
  personalRelationshipCeA?: PersonalRelationshipCe | null;
  personalRelationshipCeB?: PersonalRelationshipCe | null;
  relationshipDefinition: string;
  bondMode: string;
  growthOrStability: string;

  /** Extended Romantic Pair-Level Core Meanings & Need x Supply x Gap Engine */
  pairMeanings?: CanonicalRomanticPairMeanings;
  primaryTension: string;
  specialCodePreview: string;
  faces: StoryFace[];
  attraction: {
    aSeeks: AttractionDirection;
    bSeeks: AttractionDirection;
    uniqueCombination: string;
    flipsToConflictWhen: string;
    units?: {
      aToB: AttractionNarrativeUnit;
      bToA: AttractionNarrativeUnit;
      mutual: AttractionNarrativeUnit;
    };
    bilateralMatches?: { aToB: PartnerPreferenceMatch; bToA: PartnerPreferenceMatch };
    provenance: ProvenanceRef[];
  };
  topDifferences: AxisPriorityRow[];
  stabilizingSimilarities: AxisPriorityRow[];
  allAxes: AxisPriorityRow[];
  recurringLoop: {
    triggerScene: string;
    steps: string[];
    residue: string;
    provenance: ProvenanceRef[];
  };
  bilateralChanges: BilateralChange[];
  sharedStrength: string;
  sharedVulnerability: string;
  pairChemistry: {
    combinationLabel: string;
    intimacyFeel: string;
    socialOrPracticalFeel: string;
    flipsWhenExcess: string;
    healthyCondition: string;
    provenance: ProvenanceRef[];
    available: boolean;
  };
  misreads: DirectionalMisread[];
  hiddenHearts: HiddenHeartBits[];
  repair: {
    sequence: string[];
    helpsA: string[];
    helpsB: string[];
    avoid: string[];
    sharedCommitments: string[];
    observationSignals: string[];
    warningIfRepeats: string[];
    provenance: ProvenanceRef[];
  };
  realLifeDomains: Array<{
    domainId: string;
    title: string;
    difference: string;
    riskCondition: string;
    agreement: string;
    usableLine: string;
    checkSignal: string;
    provenance: ProvenanceRef[];
  }>;
  timing: {
    available: boolean;
    year: number;
    theme: string | null;
    favorableWindows: string[];
    cautionWindows: string[];
    observationSignals: string[];
    hideReason: string | null;
    provenance: ProvenanceRef[];
  };
  closing: {
    presentPossibility: string;
    rememberA: string;
    rememberB: string;
    watchSignals: string[];
    improvingSignals: string[];
    cautionSignals: string[];
    decisionQuestions: string[];
    provenance: ProvenanceRef[];
  };
  connectedEvidenceIds: string[];
  suppressedEvidence: Array<{ evidenceId: string; reason: string }>;
  conflictLoopP0?: RomanticConflictLoop;
  repairPatternP0?: RomanticRepairPattern;
  actionCandidatesP0?: RomanticActionCandidate[];
  synthesisResultsP1?: RomanticSynthesisResult[];
  insightCandidatesP1?: RomanticInsightCandidate[];
  normalizedActionCandidatesP1?: RomanticActionCandidate[];
  growthTransitionP1?: RomanticGrowthTransition;
};

export type RomanticGrowthTransition = {
  currentPattern: string;
  recommendedShift: string;
  longTermGoal: string;
  evidenceIds: string[];
  confidence: "high" | "medium";
};

export type RomanticInsightCandidate = {
  id: string;
  topic: string;
  perspective: "self" | "partner" | "couple";
  meaningId: string;
  evidenceIds: string[];
  reinforcementEvidenceIds?: string[];
  primarySemanticOwner: string;
  confidence: "high" | "medium" | "low";
  priority: number;
  currentCopy?: string;
  recommendedActionIds?: string[];
  isSuppressed?: boolean;
  suppressionReason?: string;
};

export type RomanticInnateVsCurrentCategory =
  | "ALIGNED"
  | "CURRENTLY_EXPRESSED"
  | "CURRENTLY_SUPPRESSED"
  | "CONTEXT_SHIFT"
  | "INNER_OUTER_GAP"
  | "RELATIONSHIP_ACTIVATED";

export type RomanticSynthesisResult = {
  id: string;
  sourceClaimIds: string[];
  evidenceIds: string[];
  topic: string;
  perspective: "self" | "partner" | "couple";
  canonicalMeaningId: string;
  interactionCategory?: RomanticInnateVsCurrentCategory;
  confidence: "high" | "medium";
  narrative?: string;
};

export type RomanticConflictLoop = {
  triggerEvidenceIds: string[];
  trigger?: string;
  selfResponse?: string;
  partnerResponse?: string;
  escalationMechanism?: string;
  breakPattern?: string;
  confidence: "high" | "medium" | "low";
};

export type RomanticRepairPattern = {
  coolingNeed: "none" | "short" | "moderate" | "extended";
  initiatorRole: "self" | "partner" | "either" | "unclear";
  effectiveRepairStyle?: string;
  ineffectiveRepairStyle?: string;
  reconnectionAction?: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low";
};

export type RomanticActionCandidate = {
  id: string;
  perspective: "self" | "partner" | "couple";
  actionType: "SOS" | "REPAIR" | "ROUTINE" | "BOUNDARY";
  evidenceIds: string[];
  targetTopic: string;
  priority: number;
  copy: string;
  confidence: "high" | "medium";
};
