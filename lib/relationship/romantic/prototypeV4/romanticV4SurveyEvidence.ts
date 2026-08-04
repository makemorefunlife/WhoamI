/**
 * Romantic V4 — Current Self survey input contract and shared axis resolver.
 *
 * Single source of truth for how real (or missing) A/B `CurrentSelfProfile`
 * data becomes the 11-axis evidence used by axisOverview. Reuses the
 * production survey stack (buildNeutralV2Profile, buildPsychMatchResult) —
 * does not recompute gaps/bands independently and never imports fixtures.
 */
import type { CurrentSelfProfile, SecondaryAxisKey } from "@/lib/v2/survey/types";
import { buildNeutralV2Profile } from "@/lib/v2/survey/neutralProfile";
import {
  buildPsychMatchResult,
  type PsychMatchType,
} from "@/lib/relationship/psychMatch";

export type RomanticV4SurveyMode = "real" | "dev_fixture";

export type RomanticV4SurveyInput = {
  mode: RomanticV4SurveyMode;
  profileA: CurrentSelfProfile | null;
  profileB: CurrentSelfProfile | null;
};

/** Whether an axis score came from an actual answered survey or a filled-in neutral default. */
export type AxisScoreSource = "survey" | "synthetic_neutral" | "dev_fixture";

/** How much real behavioral evidence backs a pair comparison. */
export type SurveyPairEvidenceStatus =
  | "observed"
  | "partial_inference"
  | "unobserved";

/** Structured reason code for UI disclosure copy — never hardcoded prose here. */
export type SurveyDisclosureCode =
  | "none"
  | "partner_profile_missing"
  | "both_profiles_missing";

export type RomanticAxisEvidenceConfidence = "high" | "low" | "insufficient";

export type RomanticAxisOverviewRow = {
  axis_key: SecondaryAxisKey;
  score_a: number;
  score_b: number;
  gap: number;
  /** "insufficient_evidence" overrides the raw match type when both sides are synthetic. */
  match_type: PsychMatchType | "insufficient_evidence";
  person_a_source: AxisScoreSource;
  person_b_source: AxisScoreSource;
  confidence: RomanticAxisEvidenceConfidence;
};

export type RomanticV4SurveyEvidence = {
  mode: RomanticV4SurveyMode;
  rows: RomanticAxisOverviewRow[];
  evidenceStatus: SurveyPairEvidenceStatus;
  disclosureCode: SurveyDisclosureCode;
  isSampleData: boolean;
};

function evidenceStatusFor(
  hasA: boolean,
  hasB: boolean,
): SurveyPairEvidenceStatus {
  if (hasA && hasB) return "observed";
  if (hasA || hasB) return "partial_inference";
  return "unobserved";
}

function disclosureCodeFor(
  status: SurveyPairEvidenceStatus,
): SurveyDisclosureCode {
  if (status === "observed") return "none";
  if (status === "partial_inference") return "partner_profile_missing";
  return "both_profiles_missing";
}

function confidenceFor(
  status: SurveyPairEvidenceStatus,
): RomanticAxisEvidenceConfidence {
  if (status === "observed") return "high";
  if (status === "partial_inference") return "low";
  return "insufficient";
}

/**
 * CurrentSelfProfile A/B -> shared 11-axis evidence for axisOverview.
 * Missing profiles are filled with buildNeutralV2Profile() (score 50, all axes)
 * but tagged "synthetic_neutral" so callers never mistake it for observed behavior.
 */
export function resolveRomanticV4SurveyEvidence(
  input: RomanticV4SurveyInput,
): RomanticV4SurveyEvidence {
  const hasA = input.profileA != null;
  const hasB = input.profileB != null;
  const evidenceStatus = evidenceStatusFor(hasA, hasB);
  const disclosureCode = disclosureCodeFor(evidenceStatus);
  const confidence = confidenceFor(evidenceStatus);

  const filledA = input.profileA ?? buildNeutralV2Profile();
  const filledB = input.profileB ?? buildNeutralV2Profile();
  const matchResult = buildPsychMatchResult({ profileA: filledA, profileB: filledB });

  const rows: RomanticAxisOverviewRow[] = matchResult.axis_results.map((row) => ({
    axis_key: row.axis_key,
    score_a: row.score_a,
    score_b: row.score_b,
    gap: row.gap,
    // Both sides synthetic: a coincidental gap of 0 must never read as "similarity".
    match_type: evidenceStatus === "unobserved" ? "insufficient_evidence" : row.match_type,
    person_a_source: hasA ? "survey" : "synthetic_neutral",
    person_b_source: hasB ? "survey" : "synthetic_neutral",
    confidence,
  }));

  return {
    mode: input.mode,
    rows,
    evidenceStatus,
    disclosureCode,
    isSampleData: input.mode === "dev_fixture",
  };
}
