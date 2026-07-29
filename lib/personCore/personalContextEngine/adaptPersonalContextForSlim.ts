/**
 * Slim integration adapter — prepares CE output for future Slim wiring.
 * Does NOT call Slim LLM or mutate runSlimIntegratedReport.
 */

import type { PersonalContextEngineOutput } from "./types";
import type { PersonalContextGroupId } from "./constants";
import type { EvidenceRef } from "../individualSaju/types";

export const SLIM_PERSONAL_CONTEXT_ADAPTER_VERSION =
  "slim_personal_context_adapter_v1" as const;

/** Documented insertion points inside Slim (not wired yet). */
export const SLIM_INSERTION_POINTS = {
  after_saju_facts:
    "lib/v1/slim/runSlimIntegratedReport.ts:calculateSajuBundle",
  llm_essence_summary:
    "formatEssenceAnalysisForIntegrated → sajuSummary / essenceAnalysisSummary",
  structured_llm: "runDeepEssenceStructuredLlm({ essenceAnalysisSummary })",
  integrated_llm: "runIntegratedPremiumLlm({ sajuSummary })",
} as const;

/**
 * Slim handoff shape. `selection_priority` is ordering-only — strip or ignore
 * before any user-facing or LLM “score” presentation.
 */
export type SlimPersonalContextPackage = {
  adapter_version: typeof SLIM_PERSONAL_CONTEXT_ADAPTER_VERSION;
  lens: string;
  schema_version: string;
  context: {
    groups: Record<
      PersonalContextGroupId,
      Array<{
        packet_id: string;
        fact_path: string;
        role_in_lens: string;
        tier: number;
        codes: string[];
        reference_ids: string[];
        base_meanings_ko: string[];
        /**
         * Deterministic ordering only — not a score/confidence/%/UI metric.
         */
        selection_priority: number;
        confidence: string;
        evidence: EvidenceRef[];
      }>
    >;
    aggregates: PersonalContextEngineOutput["aggregates"];
    unresolved_reference_ids: string[];
    exclusions: Array<{
      fact_path: string;
      reason: string;
      detail?: string;
    }>;
    provenance: PersonalContextEngineOutput["provenance"];
  };
  insertion_points: typeof SLIM_INSERTION_POINTS;
  wired_into_slim: false;
};

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
      tier: p.tier,
      codes: p.codes,
      reference_ids: p.reference_ids,
      base_meanings_ko: p.base_meanings.map((m) => m.text_ko),
      selection_priority: p.selection_priority,
      confidence: p.confidence,
      evidence: p.evidence,
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
        ...(e.detail ? { detail: e.detail } : {}),
      })),
      provenance: output.provenance,
    },
    insertion_points: SLIM_INSERTION_POINTS,
    wired_into_slim: false,
  };
}
