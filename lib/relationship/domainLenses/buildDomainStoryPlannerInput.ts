/**
 * Domain Story Planner Input Builder
 *
 * Prepares the strictly typed, filtered input payload for the 7-scene Story Planner.
 * Extracts grounded claims, evidence boundaries, and prohibited claims from 
 * the canonical Domain Lens evaluations.
 */

import type { PairSajuFacts } from "../../personCore/pairSaju/types";
import type {
  DomainLensEvaluation,
  DomainStoryPlannerInput,
} from "./types";
import type { DomainPairLensId } from "../../personCore/pairContextEngine/types";

export function buildDomainStoryPlannerInput(params: {
  domain: DomainPairLensId;
  facts: PairSajuFacts;
  evaluations: DomainLensEvaluation[];
  partyNames?: { a: string; b: string };
  roleLabels?: { a: string; b: string };
}): DomainStoryPlannerInput {
  const { domain, facts, evaluations, partyNames, roleLabels } = params;

  const groundedLenses = evaluations.filter((e) => !e.is_abstaining);
  const abstainedLenses = evaluations.filter((e) => e.is_abstaining);

  // Aggregate all allowed themes and synthesis bullet points
  const allowedSynthesisPoints = groundedLenses.flatMap(
    (e) => e.llm_synthesis_allowance.allowed_themes
  );

  // Deduplicate and aggregate prohibited claims
  const prohibitedClaims = Array.from(
    new Set(evaluations.flatMap((e) => e.llm_synthesis_allowance.prohibited_claims))
  );

  // Calculate overall confidence (lowest of active lenses, or medium fallback)
  const confLevels = groundedLenses.map((e) => e.confidence);
  const overallConfidence =
    confLevels.includes("low") || facts.birth_time_unknown_a || facts.birth_time_unknown_b
      ? "low"
      : confLevels.includes("medium")
      ? "medium"
      : confLevels.length > 0
      ? "high"
      : "insufficient";

  const highConfidenceCount = groundedLenses.filter((e) => e.confidence === "high").length;
  const primaryTension = evaluations.find((e) => e.tension_level === "high" || e.tension_level === "critical");
  const primarySynergy = evaluations.find((e) => e.tension_level === "low" && e.confidence === "high");

  return {
    schema_version: "domain_story_planner_v1",
    domain,
    parties: {
      a_name: partyNames?.a ?? "A",
      b_name: partyNames?.b ?? "B",
      a_role_label: roleLabels?.a,
      b_role_label: roleLabels?.b,
    },
    overall_confidence: overallConfidence,
    birth_time_unknown_a: Boolean(facts.birth_time_unknown_a),
    birth_time_unknown_b: Boolean(facts.birth_time_unknown_b),
    chapters: [],
    grounding_summary: {
      total_lenses_evaluated: evaluations.length,
      high_confidence_count: highConfidenceCount,
      abstaining_count: abstainedLenses.length,
      dominant_element_dynamic: "standard",
      primary_tension_lens_id: primaryTension?.lens_id,
      primary_synergy_lens_id: primarySynergy?.lens_id,
    },
    evidence_boundary: {
      allowed_synthesis_bullet_points: allowedSynthesisPoints,
      strict_prohibitions: prohibitedClaims,
    },
  };
}
