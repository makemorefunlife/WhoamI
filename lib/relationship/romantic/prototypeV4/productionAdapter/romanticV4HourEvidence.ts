/**
 * Romantic V4 — birth-hour evidence classification for the production path.
 *
 * Finding (see plan/freeze research): the existing Saju pipeline does NOT
 * exclude hour-pillar-derived facts or cap confidence when birth time is
 * unknown — resolveBirthTimeForCharts (lib/v2/onboarding/resolveBirthChartInput.ts)
 * defaults to "12:00", and that fallback hour pillar still contributes to
 * ten-god counts (officer/food/wealth/seal/self, via countTenGods over all 4
 * pillars) and day-branch tension hits (collectBranchPalaceRelations, hour
 * included as a counterpart palace) — the only existing behavior anywhere is
 * a text disclosure (buildSajuUncertainItems / validateSajuPillars).
 *
 * Actually excluding the hour pillar from those counts would mean editing
 * shared signal-extraction code (extractRomanticSignals / countTenGods /
 * collectBranchPalaceRelations) used by every relationship domain (Family/
 * Friend/Work/Marriage), which is out of scope here. So this module adds a
 * V4-integration-layer discipline instead: classify whether each person's
 * chart hour is real evidence or a 12:00 placeholder, and cap the confidence
 * V4 already reports (comparisonTable rows) by one tier when it isn't fully
 * observed — the same "cannot activate strong claims from missing evidence"
 * discipline already applied to missing survey data
 * (romanticV4SurveyEvidence.ts), now applied to missing birth-hour data too.
 * The 12:00 fallback stays purely an internal chart-construction input; it is
 * never treated as "observed hour evidence" here.
 */
import type { RomanticAxisEvidenceConfidence } from "../romanticV4SurveyEvidence";
import type { ConfidenceLevel, RomanticV4PrototypePayload } from "../types";

export type BirthHourEvidenceStatus = "observed" | "partial" | "unobserved";

export type BirthHourDisclosureCode =
  | "none"
  | "partner_hour_unknown"
  | "both_hours_unknown";

export type BirthHourEvidence = {
  status: BirthHourEvidenceStatus;
  disclosureCode: BirthHourDisclosureCode;
  hourUnknownA: boolean;
  hourUnknownB: boolean;
};

/**
 * Classify A/B birth-hour evidence from each person's birthTimeUnknown flag.
 * "observed" only when BOTH people supplied a real hour — a single unknown
 * hour is enough to downgrade the pair to "partial", exactly mirroring
 * computeSurveyPairEvidence's hasA/hasB -> observed/partial_inference/unobserved.
 */
export function computeBirthHourEvidence(
  hourUnknownA: boolean,
  hourUnknownB: boolean,
): BirthHourEvidence {
  const knownA = !hourUnknownA;
  const knownB = !hourUnknownB;
  const status: BirthHourEvidenceStatus =
    knownA && knownB ? "observed" : knownA || knownB ? "partial" : "unobserved";
  const disclosureCode: BirthHourDisclosureCode =
    status === "observed" ? "none" : status === "partial" ? "partner_hour_unknown" : "both_hours_unknown";
  return { status, disclosureCode, hourUnknownA, hourUnknownB };
}

/**
 * Caps a confidence tier by one step when birth-hour evidence is not fully
 * observed — "high" -> "low" (never invents a stronger claim than the
 * underlying evidence supports); "low"/"insufficient" are already at or
 * below the cap and are left unchanged. A fully-observed pair never has its
 * confidence altered by this function.
 */
export function capConfidenceForHourEvidence(
  confidence: RomanticAxisEvidenceConfidence,
  hourStatus: BirthHourEvidenceStatus,
): RomanticAxisEvidenceConfidence {
  if (hourStatus === "observed") return confidence;
  if (confidence === "high") return "low";
  return confidence;
}

const CONFIDENCE_LEVEL_DOWNGRADE: Record<ConfidenceLevel, ConfidenceLevel> = {
  deterministic: "high",
  high: "medium",
  medium: "low",
  low: "tentative",
  tentative: "tentative",
};

/**
 * Same one-tier cap as capConfidenceForHourEvidence, but for the 5-tier
 * ConfidenceLevel scale used on payload.comparisonTable rows (the values a
 * production user actually sees), rather than the 3-tier
 * RomanticAxisEvidenceConfidence scale used inside the survey-evidence layer.
 */
export function capConfidenceLevelForHourEvidence(
  confidence: ConfidenceLevel,
  hourStatus: BirthHourEvidenceStatus,
): ConfidenceLevel {
  if (hourStatus === "observed") return confidence;
  return CONFIDENCE_LEVEL_DOWNGRADE[confidence];
}

/**
 * Applies the one-tier confidence cap to every comparisonTable row of an
 * already-built payload when birth-hour evidence isn't fully observed — pure
 * post-processing, no recomputation of the rows themselves. A fully-observed
 * pair's payload is returned unchanged (same reference, no copy needed).
 */
export function applyHourEvidenceCapToComparisonTable(
  payload: RomanticV4PrototypePayload,
  hourEvidence: BirthHourEvidence,
): RomanticV4PrototypePayload {
  if (hourEvidence.status === "observed") return payload;
  return {
    ...payload,
    comparisonTable: payload.comparisonTable.map((row) => ({
      ...row,
      confidence: capConfidenceLevelForHourEvidence(row.confidence, hourEvidence.status),
    })),
  };
}
