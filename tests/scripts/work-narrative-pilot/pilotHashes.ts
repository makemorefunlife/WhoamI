/**
 * Stable hashes for bilingual parity (same package → same hashes).
 */
import { createHash } from "node:crypto";
import type { WorkPilotContextPackage } from "./types";

export function stableJsonHash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 16);
}

/** Canonical binding only — must match across locales. */
export function canonicalHash(pkg: WorkPilotContextPackage): string {
  return stableJsonHash(pkg.binding_truth);
}

/**
 * Evidence surface used for narrative (excludes reference_copy prose bodies
 * so withheld vs full artifact storage does not diverge).
 */
export function contextHash(pkg: WorkPilotContextPackage): string {
  return stableJsonHash({
    schema_version: pkg.schema_version,
    pair_id: pkg.pair_id,
    category: pkg.category,
    binding_truth: pkg.binding_truth,
    evidence_sources: {
      ...pkg.evidence_sources,
    },
    psych_context: pkg.psych_context,
    saju_context: pkg.saju_context,
    evidence_relationships: pkg.evidence_relationships,
    narrative_routing: pkg.narrative_routing,
    ambiguities: pkg.ambiguities,
    semantic_boundaries: pkg.semantic_boundaries,
    reference_copy: {
      allowed_for_fact_check: pkg.reference_copy.allowed_for_fact_check,
      allowed_as_narrative_source: pkg.reference_copy.allowed_as_narrative_source,
      item_keys: pkg.reference_copy.items.map((i) => i.key),
    },
  });
}
