import type { RomanticPsychMatchAxisResult } from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import type { RomanticNarrativeInputContract } from "./fourCeNarrativeInput";
import type { FourCeSemanticPlan } from "./fourCeSemanticPlanner";
import type { CanonicalRomanticV4Report } from "./buildCanonicalRomanticV4Report";
import type {
  RomanticAxisOverviewRow,
  RomanticV4SurveyMode,
  SurveyDisclosureCode,
  SurveyPairEvidenceStatus,
} from "./romanticV4SurveyEvidence";
import type { RomanticV4ComparisonRow } from "./romanticV4ComparisonFusion";

export type PrototypeLocale = "ko-KR" | "en-US";
export type PrototypeVariant = "complete" | "tension" | "minimal";
export type ConfidenceLevel = "deterministic" | "high" | "medium" | "low" | "tentative";

export type SourceKind =
  | "canonical_evidence"
  | "ce_derived"
  | "existing_llm_narrative"
  | "prototype_bounded_narrative"
  | "editorial_label";

export type ChapterId =
  | "ch0_opening"
  | "ch1_who_we_are_together"
  | "ch2_you_and_me"
  | "ch3_why_this_works"
  | "ch4_relationship_flow"
  | "ch5_when_we_miss_each_other"
  | "ch6_hidden_heart"
  | "ch7_repair_guide"
  | "ch8_love_in_real_life"
  | "ch9_our_next_chapter"
  | "ch10_closing";

export type InsightOwnershipRow = {
  insightId: string;
  phenomenon: string;
  evidenceIds: string[];
  confidence: ConfidenceLevel;
  primaryChapter: ChapterId;
  supportingChapters: Array<{ chapter: ChapterId; purpose: string }>;
};

export type EvidenceTraceRow = {
  blockId: string;
  chapter: ChapterId;
  sourceKind: SourceKind;
  text: string;
  evidenceIds: string[];
  plannerInstruction: string;
};

export type OmittedContentRow = {
  chapter: ChapterId;
  omittedField: string;
  reason: string;
  missingEvidence: string[];
};

export type SajuComparisonRow = {
  rowId: string;
  relationshipQuestion: string;
  personA: string;
  personB: string;
  relationshipManifestation: string;
  understandingPoint: string;
  confidence: ConfidenceLevel;
  evidenceIds: string[];
};

export type AxisInsightRow = {
  axisKey: string;
  axisLabel: string;
  matchType: RomanticPsychMatchAxisResult["match_type"];
  gap: number;
  personAPattern: string;
  personBPattern: string;
  whyItMatters: string;
  dailyManifestation: string;
  relationshipEffect: string;
  confidence: ConfidenceLevel;
  evidenceIds: string[];
};

export type AxisSelectionRejected = {
  axisKey: string;
  reason: "insufficient_evidence" | "low_distinctiveness" | "ownership_collision";
  detail: string;
  evidenceIds: string[];
};

export type ConflictInterpretationRow = {
  patternId: string;
  trigger: string;
  whatIMeant: string;
  whatYouHeard: string;
  hiddenNeed: string;
  betterWords: string;
  repairTiming: string;
  evidenceIds: string[];
  confidence: ConfidenceLevel;
};

export type RealLifeSceneRow = {
  sceneId: string;
  sceneTitle: string;
 whatHappens: string;
  whyForThisPair: string;
  whatACanDo: string;
  whatBCanDo: string;
  sharedAgreement: string;
  evidenceIds: string[];
};

export type PrototypeChapterPayload = {
  chapter: ChapterId;
  title: string;
  blocks: Array<{
    blockId: string;
    label: string;
    sourceKind: SourceKind;
    content: string;
    evidenceIds: string[];
    confidence?: ConfidenceLevel;
  }>;
};

export type RomanticV4PrototypePayload = {
  locale: PrototypeLocale;
  variant: PrototypeVariant;
  pair: { personA: string; personB: string; perspective: "A" | "B" };
  routeLabel: string;
  preNarrativeContract?: RomanticNarrativeInputContract;
  fourCeInfluenceAudit?: Array<{ evidenceId: string; impact: string }>;
  fourCeSemanticPlan?: FourCeSemanticPlan;
  /** Canonical 12-chapter report (Story Plan → sections → validator). */
  canonicalReport?: CanonicalRomanticV4Report;
  toc: Array<{ chapter: ChapterId; label: string }>;
  chapters: PrototypeChapterPayload[];
  comparisonTable: SajuComparisonRow[];
  /** Evidence-aware mirror of comparisonTable — Saju base + survey correction per row. Present in real mode only. */
  comparisonTableEvidence?: RomanticV4ComparisonRow[];
  axisOverview: RomanticPsychMatchAxisResult[];
  /** Evidence-aware mirror of axisOverview — source/confidence per axis. Present in real mode only. */
  axisOverviewEvidence?: RomanticAxisOverviewRow[];
  selectedAxisInsights: AxisInsightRow[];
  axisSelectionAudit?: {
    selectedReason: string;
    rejected: AxisSelectionRejected[];
  };
  relationshipFlow: {
    title: string;
    steps: string[];
    pivotPoint: string;
    evidenceIds: string[];
  };
  conflicts: ConflictInterpretationRow[];
  hiddenHeart: {
    personA: string;
    personB: string;
    personAOneLineForPartner: string;
    personBOneLineForPartner: string;
    evidenceIds: string[];
  };
  repairGuide: {
    sequence: string[];
    sideBySide: { helpsA: string[]; helpsB: string[]; together: string[] };
    evidenceIds: string[];
  };
  realLifeScenes: RealLifeSceneRow[];
  nextChapterMode: "timing_supported" | "maturity_direction" | "timeline_active" | "unavailable";
  timingModeAudit?: {
    mode: "timing_supported" | "maturity_direction" | "timeline_active" | "unavailable";
    evidenceIds: string[];
    confidence: ConfidenceLevel;
    safetyRulesPassed: string[];
    renderedCopy: string[];
    rationale: string;
  };
  nextChapter: string[];
  closing: {
    concludingStatement: string;
    rememberA: string;
    rememberB: string;
    shareLines: string[];
    reflectionQuestion: string;
  };
  insightOwnership: InsightOwnershipRow[];
  evidenceTrace: EvidenceTraceRow[];
  omittedContent: OmittedContentRow[];
  /**
   * Provenance for axisOverview/comparisonTable — how much of this payload's
   * survey-derived content reflects real CurrentSelfProfile A/B vs sample data.
   */
  surveyEvidence?: {
    mode: RomanticV4SurveyMode;
    evidenceStatus: SurveyPairEvidenceStatus;
    disclosureCode: SurveyDisclosureCode;
    isSampleData: boolean;
    axisOverviewSource: "survey_resolver" | "dev_fixture";
    /**
     * comparisonTable rows are Saju-band + survey fused (see
     * romanticV4ComparisonFusion.ts / compare*Composite.ts) — "saju_fusion_resolver"
     * when real romantic_signals were supplied, "unavailable_pending_saju_wiring"
     * if a real surveyInput was given without Saju signals (never falls back to fixture).
     */
    comparisonTableSource: "dev_fixture" | "saju_fusion_resolver" | "unavailable_pending_saju_wiring";
  };
  antiOverfitCheck?: {
    variant: PrototypeVariant;
    selectedComparisonRows: string[];
    selectedAxisInsights: string[];
    selectedConflictPatterns: string[];
    selectedRealLifeScenes: string[];
    nextChapterMode: "timing_supported" | "maturity_direction" | "timeline_active" | "unavailable";
    omitted: string[];
    evidenceGaps: string[];
    axisRejected: AxisSelectionRejected[];
  };
};
