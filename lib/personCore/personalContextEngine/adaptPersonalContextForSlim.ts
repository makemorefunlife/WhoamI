/**
 * Slim integration adapter — prepares CE output for future Slim wiring.
 * Does NOT call Slim LLM or mutate runSlimIntegratedReport (Sprint 2: adapter only).
 */

import type { PersonalContextEngineOutput } from "./types";
import type { PersonalContextGroupId } from "./constants";

export const SLIM_PERSONAL_CONTEXT_ADAPTER_VERSION =
  "slim_personal_context_adapter_v1" as const;

/** Documented insertion points inside Slim (not wired yet). */
export const SLIM_INSERTION_POINTS = {
  /**
   * After Individual chart is available (today: calculateSajuBundle).
   * Replace bundle→formatEssenceAnalysisForIntegrated with CE packets.
   */
  after_saju_facts: "lib/v1/slim/runSlimIntegratedReport.ts:calculateSajuBundle",
  /**
   * Input currently passed as essenceAnalysisSummary string to both LLMs.
   */
  llm_essence_summary: "formatEssenceAnalysisForIntegrated → sajuSummary / essenceAnalysisSummary",
  /**
   * Structured deep essence LLM parallel path.
   */
  structured_llm: "runDeepEssenceStructuredLlm({ essenceAnalysisSummary })",
  /**
   * Integrated premium prose LLM path.
   */
  integrated_llm: "runIntegratedPremiumLlm({ sajuSummary })",
} as const;

export type SlimPersonalContextPackage = {
  adapter_version: typeof SLIM_PERSONAL_CONTEXT_ADAPTER_VERSION;
  lens: string;
  schema_version: string;
  /** Deterministic JSON-safe payload for future prompt assembly. */
  context: {
    groups: Record<
      PersonalContextGroupId,
      Array<{
        packet_id: string;
        fact_path: string;
        role_in_lens: string;
        codes: string[];
        reference_ids: string[];
        base_meanings_ko: string[];
        weight: number;
        confidence: string;
        evidence_detail: string[];
      }>
    >;
    aggregates: PersonalContextEngineOutput["aggregates"];
    unresolved_reference_ids: string[];
    exclusions: Array<{
      fact_path: string;
      reason: string;
    }>;
    provenance: PersonalContextEngineOutput["provenance"];
  };
  insertion_points: typeof SLIM_INSERTION_POINTS;
  /** Explicit: not yet consumed by Slim runner. */
  wired_into_slim: false;
};

/**
 * Convert Personal CE output into a Slim-ready package (no LLM, no narrative).
 */
export function adaptPersonalContextForSlim(
  output: PersonalContextEngineOutput,
): SlimPersonalContextPackage {
  const groups = {
    identity: [] as SlimPersonalContextPackage["context"]["groups"]["identity"],
    energy: [] as SlimPersonalContextPackage["context"]["groups"]["energy"],
    strengths: [] as SlimPersonalContextPackage["context"]["groups"]["strengths"],
    cautions: [] as SlimPersonalContextPackage["context"]["groups"]["cautions"],
    growth: [] as SlimPersonalContextPackage["context"]["groups"]["growth"],
  };

  for (const g of Object.keys(groups) as PersonalContextGroupId[]) {
    groups[g] = output.groups[g].map((p) => ({
      packet_id: p.packet_id,
      fact_path: p.fact_path,
      role_in_lens: p.role_in_lens,
      codes: p.codes,
      reference_ids: p.reference_ids,
      base_meanings_ko: p.base_meanings.map((m) => m.text_ko),
      weight: p.weight,
      confidence: p.confidence,
      evidence_detail: p.evidence.map((e) => e.detail),
    }));
  }

  const unresolvedIds = [
    ...new Set(output.unresolved_references.map((u) => u.reference_id)),
  ].sort();

  return {
    adapter_version: SLIM_PERSONAL_CONTEXT_ADAPTER_VERSION,
    lens: output.lens,
    schema_version: output.schema_version,
    context: {
      groups,
      aggregates: output.aggregates,
      unresolved_reference_ids: unresolvedIds,
      exclusions: output.exclusions.map((e) => ({
        fact_path: e.fact_path,
        reason: e.reason,
      })),
      provenance: output.provenance,
    },
    insertion_points: SLIM_INSERTION_POINTS,
    wired_into_slim: false,
  };
}
