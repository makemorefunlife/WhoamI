/**
 * Romantic V4 — comparisonTable's real source model.
 *
 * Restores the production 6-row fusion (Saju-derived personal relationship
 * band + matching CurrentSelfProfile axis as correction) for V4, reusing the
 * exact same pure resolvers V1 uses (compare*Composite.ts) instead of
 * inventing a psych-only mapping. Does not call prepareRomanticSajuDeepRun
 * and does not read romanticExperienceCompleteFixture.
 *
 * Row -> Saju signal slice -> survey axis (matches romanticContextInput.ts's
 * ROMANTIC_COMPARE_PSYCH_TWINS, the canonical row/axis pairing):
 *   conflict      <- conflict_response      + conflict_style
 *   affection     <- affection_language     + empathy
 *   stress        <- stress_pattern         + self_control
 *   decision      <- decision_making        + decision_style
 *   expression    <- expression_style       + energy_style
 *   communication <- communication_style    + structure
 */
import type { RomanticSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import { buildNeutralV2Profile } from "@/lib/v2/survey/neutralProfile";
import { refineCompareConflictPair } from "../compareConflictComposite";
import { refineCompareAffectionPair } from "../compareAffectionComposite";
import { refineCompareStressPair } from "../compareStressComposite";
import { refineCompareDecisionPair } from "../compareDecisionComposite";
import { refineCompareExpressionPair } from "../compareExpressionComposite";
import { refineCompareCommunicationPair } from "../compareCommunicationComposite";
import {
  computeSurveyPairEvidence,
  type AxisScoreSource,
  type SurveyPairEvidenceStatus,
} from "./romanticV4SurveyEvidence";

export type RomanticV4ComparisonRowKey =
  | "conflict"
  | "affection"
  | "stress"
  | "decision"
  | "expression"
  | "communication";

/**
 * Provenance of a fused row:
 * - saju_plus_survey: both A and B answered the matching survey axis.
 * - saju_plus_partial_survey: one side is synthetic-neutral (50) —
 *   correction logic still runs (never flips the Saju base for a neutral
 *   "mid" signal) but the pair result is low confidence.
 * - saju_only: neither side answered — no fused correction attempted,
 *   the Saju base band is shown as-is with survey refinement unavailable.
 */
export type RomanticV4ComparisonRowSource =
  | "saju_plus_survey"
  | "saju_plus_partial_survey"
  | "saju_only";

export type RomanticV4ComparisonRow = {
  rowKey: RomanticV4ComparisonRowKey;
  leanA: string;
  leanB: string;
  baseA: string;
  baseB: string;
  flippedA: boolean;
  flippedB: boolean;
  align: "confirms" | "caution" | null;
  confidence: "high" | "low" | "insufficient";
  source: RomanticV4ComparisonRowSource;
  personASource: AxisScoreSource;
  personBSource: AxisScoreSource;
  /** Raw Saju inputs behind the band — preserves the specificity of the existing logic. */
  sajuInputsA: Record<string, unknown>;
  sajuInputsB: Record<string, unknown>;
};

/** Structural shape shared by every RefinedCompare*Pair (see compare*Composite.ts). */
type RefinedComparePairShape = {
  leanA: string;
  leanB: string;
  baseA: string;
  baseB: string;
  flippedA: boolean;
  flippedB: boolean;
  align: "confirms" | "caution";
  confidence: "high" | "low";
  personA: { scores: Record<string, number> };
  personB: { scores: Record<string, number> };
};

function buildFusedRow(
  rowKey: RomanticV4ComparisonRowKey,
  composite: RefinedComparePairShape,
  source: Extract<RomanticV4ComparisonRowSource, "saju_plus_survey" | "saju_plus_partial_survey">,
  personASource: AxisScoreSource,
  personBSource: AxisScoreSource,
): RomanticV4ComparisonRow {
  return {
    rowKey,
    leanA: composite.leanA,
    leanB: composite.leanB,
    baseA: composite.baseA,
    baseB: composite.baseB,
    flippedA: composite.flippedA,
    flippedB: composite.flippedB,
    align: composite.align,
    confidence: composite.confidence,
    source,
    personASource,
    personBSource,
    sajuInputsA: composite.personA.scores,
    sajuInputsB: composite.personB.scores,
  };
}

function buildSajuOnlyRow(
  rowKey: RomanticV4ComparisonRowKey,
  baseA: string,
  baseB: string,
  sajuInputsA: Record<string, unknown>,
  sajuInputsB: Record<string, unknown>,
): RomanticV4ComparisonRow {
  return {
    rowKey,
    leanA: baseA,
    leanB: baseB,
    baseA,
    baseB,
    flippedA: false,
    flippedB: false,
    align: null,
    confidence: "insufficient",
    source: "saju_only",
    personASource: "synthetic_neutral",
    personBSource: "synthetic_neutral",
    sajuInputsA,
    sajuInputsB,
  };
}

export type RomanticV4ComparisonFusionParams = {
  signalsA: RomanticSajuSignals;
  signalsB: RomanticSajuSignals;
  profileA: CurrentSelfProfile | null;
  profileB: CurrentSelfProfile | null;
};

/**
 * CurrentSelfProfile A/B + Saju romantic_signals A/B -> the 6 fused
 * comparisonTable rows, via the same evidence classification axisOverview
 * uses (computeSurveyPairEvidence) so both never disagree on evidence status.
 */
export function buildRomanticV4ComparisonFusion(
  params: RomanticV4ComparisonFusionParams,
): RomanticV4ComparisonRow[] {
  const { hasA, hasB, evidenceStatus } = computeSurveyPairEvidence(
    params.profileA,
    params.profileB,
  );

  if (evidenceStatus === "unobserved") {
    return [
      buildSajuOnlyRow(
        "conflict",
        params.signalsA.conflict_response.conflict_band,
        params.signalsB.conflict_response.conflict_band,
        params.signalsA.conflict_response,
        params.signalsB.conflict_response,
      ),
      buildSajuOnlyRow(
        "affection",
        params.signalsA.affection_language.affection_band,
        params.signalsB.affection_language.affection_band,
        params.signalsA.affection_language,
        params.signalsB.affection_language,
      ),
      buildSajuOnlyRow(
        "stress",
        params.signalsA.stress_pattern.stress_band,
        params.signalsB.stress_pattern.stress_band,
        params.signalsA.stress_pattern,
        params.signalsB.stress_pattern,
      ),
      buildSajuOnlyRow(
        "decision",
        params.signalsA.decision_making.decision_band,
        params.signalsB.decision_making.decision_band,
        params.signalsA.decision_making,
        params.signalsB.decision_making,
      ),
      buildSajuOnlyRow(
        "expression",
        params.signalsA.expression_style.expression_band,
        params.signalsB.expression_style.expression_band,
        params.signalsA.expression_style,
        params.signalsB.expression_style,
      ),
      buildSajuOnlyRow(
        "communication",
        params.signalsA.communication_style.communication_band,
        params.signalsB.communication_style.communication_band,
        params.signalsA.communication_style,
        params.signalsB.communication_style,
      ),
    ];
  }

  // observed or partial_inference: fill the missing side with a neutral (50)
  // profile for pipeline continuity. Every compare*Composite's psych
  // threshold treats 50 as its "mid" band, which resolveCompareCompositeLean
  // always resolves to lean=base/flipped=false — a synthetic 50 can never
  // flip the Saju base — while the pair confidence naturally drops to "low"
  // (resolveCompareCompositePairAlignment requires both sides "confirms"/
  // "high" for the pair to be "confirms"/"high").
  const filledA = params.profileA ?? buildNeutralV2Profile();
  const filledB = params.profileB ?? buildNeutralV2Profile();
  const source = evidenceStatus === "observed" ? "saju_plus_survey" : "saju_plus_partial_survey";
  const personASource: AxisScoreSource = hasA ? "survey" : "synthetic_neutral";
  const personBSource: AxisScoreSource = hasB ? "survey" : "synthetic_neutral";

  const conflict = refineCompareConflictPair({
    conflictA: params.signalsA.conflict_response,
    conflictB: params.signalsB.conflict_response,
    profileA: filledA,
    profileB: filledB,
  });
  const affection = refineCompareAffectionPair({
    affectionA: params.signalsA.affection_language,
    affectionB: params.signalsB.affection_language,
    profileA: filledA,
    profileB: filledB,
  });
  const stress = refineCompareStressPair({
    stressA: params.signalsA.stress_pattern,
    stressB: params.signalsB.stress_pattern,
    profileA: filledA,
    profileB: filledB,
  });
  const decision = refineCompareDecisionPair({
    decisionA: params.signalsA.decision_making,
    decisionB: params.signalsB.decision_making,
    profileA: filledA,
    profileB: filledB,
  });
  const expression = refineCompareExpressionPair({
    expressionA: params.signalsA.expression_style,
    expressionB: params.signalsB.expression_style,
    profileA: filledA,
    profileB: filledB,
  });
  const communication = refineCompareCommunicationPair({
    communicationA: params.signalsA.communication_style,
    communicationB: params.signalsB.communication_style,
    profileA: filledA,
    profileB: filledB,
  });

  // Every axis is filled (real or neutral) so none of these can be null —
  // refineCompare*Pair only returns null when a secondary_axes value is missing.
  if (!conflict || !affection || !stress || !decision || !expression || !communication) {
    throw new Error(
      "romanticV4ComparisonFusion: unexpected null composite with fully-filled profiles",
    );
  }

  return [
    buildFusedRow("conflict", conflict, source, personASource, personBSource),
    buildFusedRow("affection", affection, source, personASource, personBSource),
    buildFusedRow("stress", stress, source, personASource, personBSource),
    buildFusedRow("decision", decision, source, personASource, personBSource),
    buildFusedRow("expression", expression, source, personASource, personBSource),
    buildFusedRow("communication", communication, source, personASource, personBSource),
  ];
}

export type { SurveyPairEvidenceStatus };
