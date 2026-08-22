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
import type { RomanticGapBatchOutput } from "./romanticV4GapBatchEngine";

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

  /** Romantic V4 Final Gap Batch Engine */
  romanticGapBatch?: RomanticGapBatchOutput;
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
  /** Phase 3 — Cross-Signal Intelligence V1. Deterministic only; see
   * romanticCrossSignalIntelligence.ts. */
  crossSignalInsightsV1?: RomanticCrossSignalInsight[];
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

// ── Phase 3 — Cross-Signal Intelligence V1 ──────────────────────────────────
// Deterministic-only. Each insight crosses 2+ already-validated signals into a
// pair-level meaning that neither signal alone states. Structured for a later
// (Phase 4) Expert LLM layer to know exactly what it may/may not say — never
// consumed by an LLM in Phase 3 itself. claimBoundary.notSupported exists so a
// future prompt has an explicit "do not say this" list, not just a
// "supported" claim to embellish from.

export type RomanticCrossSignalConfidence = "high" | "medium" | "low";

/** Chapters this phase is actually allowed to route into — the engine's own
 * chapterId vocabulary (composeCanonicalSectionNarratives.ts's
 * CanonicalChapterId), NOT the user-facing 01-10 numbering (those don't map
 * 1:1: c1_hero is an unnumbered cover, c9_daily_life/c11_reflection aren't
 * their own numbered chapters). */
export type RomanticCrossSignalChapterId =
  | "c2_attraction"
  | "c3_dynamics"
  | "c4_conflict"
  | "c5_misunderstanding"
  | "c6_hidden_hearts"
  | "c7_repair"
  | "c8_strength_vulnerability";

export type RomanticCrossSignalClaimBoundary = {
  /** What this insight IS grounded enough to state. */
  supported: string;
  /** What it must NOT extend to — the guardrail for Phase 4's LLM layer. */
  notSupported: string;
};

type RomanticCrossSignalBase = {
  id: string;
  /** Concrete evidenceId strings, same provenance vocabulary as the rest of
   * the story plan (e.g. "canonical_projections.pair_ce_bonding"). */
  evidenceRefs: string[];
  /** Human-readable names of the 2+ signals this insight crossed — for
   * debugging/audit, not rendered. */
  sourceSignals: string[];
  /** The new pair-level meaning — must not be a restatement of either input
   * signal alone. */
  derivedMeaning: string;
  confidence: RomanticCrossSignalConfidence;
  claimBoundary: RomanticCrossSignalClaimBoundary;
  suggestedChapter: RomanticCrossSignalChapterId;
};

/** §3.1 — Saju-derived innate tendency vs current behavioral psychology,
 * for one person, one domain. Reads PersonalRelationshipCe.personalCeAlignment
 * (already computed, never previously consumed by any chapter). */
export type RomanticInnateCurrentInsight = RomanticCrossSignalBase & {
  insightType: "innate_current";
  subject: "a" | "b";
  domain: "stress_response" | "care_expression";
  innateSignal: string;
  currentSignal: string;
  category: RomanticInnateVsCurrentCategory;
};

/** §3.2 — A psych axis where both people match on "similarity/resonance",
 * for an axis whose semantics make sameness itself collision-prone. */
export type RomanticHiddenCollisionInsight = RomanticCrossSignalBase & {
  insightType: "hidden_collision";
  axisKey: string;
  axisLabel: string;
  similarityEvidence: string;
  collisionMechanism: string;
  likelyRelationshipEffect: string;
};

/** §3.3 — Formalizes the existing bilateralChanges structure; does not
 * recompute it. partnerEffect is null (never invented) when the source
 * BilateralChange doesn't itself state an effect on the partner. */
export type RomanticStrengthShadowInsight = RomanticCrossSignalBase & {
  insightType: "strength_shadow";
  from: "a" | "b";
  to: "a" | "b";
  strength: string;
  overuseCondition: string;
  shadow: string;
  partnerEffect: string | null;
};

/** §3.4 — Links the attraction mechanism to the friction mechanism it can
 * flip into. Pair-level, not "your strength is also your weakness." */
export type RomanticParadoxInsight = RomanticCrossSignalBase & {
  insightType: "paradox";
  whyItWorks: string;
  contextShift: string;
  whyItBecomesFriction: string;
};

/** §3.5 — A specific complementary/tension difference that also functions as
 * a resource under a named recovery/decision context. */
export type RomanticDifferenceRescueInsight = RomanticCrossSignalBase & {
  insightType: "difference_rescue";
  difference: string;
  normalFriction: string;
  rescueContext: string;
  whyItHelps: string;
};

/** §3.6 — Crosses BOTH directions of misread evidence into one pair-level
 * conclusion. Requires both a_observes_b and b_observes_a to exist. */
export type RomanticBlindSpotInsight = RomanticCrossSignalBase & {
  insightType: "blind_spot";
  aDoes: string;
  bReadsAsA: string;
  bDoes: string;
  aReadsAsB: string;
  crossSignalResult: string;
};

/** §4 — "A × B creates C", never "A does X, B does Y." Requires 2+
 * independent pair-level (not per-person) evidence points. */
export type RomanticSuperpowerInsight = RomanticCrossSignalBase & {
  insightType: "superpower";
  emergentCapability: string;
  supportingSignalCount: number;
};

export type RomanticCrossSignalInsight =
  | RomanticInnateCurrentInsight
  | RomanticHiddenCollisionInsight
  | RomanticStrengthShadowInsight
  | RomanticParadoxInsight
  | RomanticDifferenceRescueInsight
  | RomanticBlindSpotInsight
  | RomanticSuperpowerInsight;
