import type { PrimaryAxisKey, SecondaryAxisKey } from "@/lib/v2/survey/types";

/**
 * Which Secondary-11 axes explain/approximate a given Primary-6 axis.
 * Product-wide SSOT — do not duplicate this association elsewhere.
 *
 * Consumers:
 * - lib/personCore/mappers/mapPsychMasterToSnapshotAxes.ts averages these
 *   secondary scores into an *approximated replacement* primary value for
 *   relationship-domain snapshot UIs (family/friend/marriage/work panels).
 * - lib/v2/analysis/axisComparison.ts uses the same association to select
 *   which secondary scores serve as "why does Current look like this"
 *   evidence, reporting the real secondary scores as-is (never averaged
 *   into a replacement Current Primary value — scorer.ts already owns that).
 *
 * `autonomy` intentionally has no entry: no existing mapping covers it.
 * Consumers fall back to their own neutral default for this axis; do not
 * add a mapping here without a product decision, since that would change
 * mapping semantics for every consumer at once.
 */
export const PRIMARY_TO_SECONDARY_AXIS_KEYS: Partial<
  Record<PrimaryAxisKey, SecondaryAxisKey[]>
> = {
  connection: ["empathy", "energy_style"],
  stability: ["self_control", "practicality"],
  growth: ["stimulation", "resilience"],
  structure: ["structure", "thinking_style", "decision_style"],
  adaptability: ["conflict_style", "recognition"],
};
