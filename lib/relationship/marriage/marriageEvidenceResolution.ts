import { mapPsychMasterToSnapshotAxes } from "@/lib/personCore/mappers/mapPsychMasterToSnapshotAxes";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";

/**
 * Shared, minimal helpers for Marriage/cohabitation intelligence builders —
 * added to stop personality/role text from being assigned by argument slot
 * (nameA vs nameB / report_id_a vs report_id_b, which sortReportPair.ts
 * assigns purely by UUID lexical order and which therefore carries zero
 * personality meaning) instead of by each person's own evidence.
 *
 * Reuses the existing gap-gated pattern already proven safe in
 * enrichment/marriageSajuGapInsights.ts, enrichment/marriagePsychGapInsights.ts,
 * and marriageEconomicPartnership.ts — compare the two people's REAL values,
 * assign a role to whichever value actually supports it, and fall back to a
 * shared/neutral result when the gap is too small to mean anything.
 */

export type MarriageEvidenceSource = "SAJU" | "PSYCH" | "BOTH";

export type DirectionalRoleResolution<TRole extends string> = {
  /** "a" | "b" | "shared" — who the evidence actually supports, never a fixed slot. */
  actor: "a" | "b" | "shared";
  role: TRole;
  source: MarriageEvidenceSource;
  gap: number;
  /** "low" when the gap is inside the neutral band — callers should prefer softer/generic phrasing. */
  confidence: "high" | "low";
};

/**
 * Compares person A's and person B's real scores for one capability/trait
 * and assigns `roleForHigher`/`roleForLower` to whichever person's score
 * actually earns it. Below `gapGate`, returns `sharedRole` with
 * confidence "low" instead of forcing an arbitrary split — the same
 * abstention behavior already used by the Saju/Psych gap-insight modules.
 */
export function resolveDirectionalMarriageRole<TRole extends string>(params: {
  scoreA: number;
  scoreB: number;
  gapGate: number;
  roleForHigher: TRole;
  roleForLower: TRole;
  sharedRole: TRole;
  source: MarriageEvidenceSource;
}): DirectionalRoleResolution<TRole> {
  const { scoreA, scoreB, gapGate, roleForHigher, roleForLower, sharedRole, source } = params;
  const gap = scoreA - scoreB;
  if (Math.abs(gap) < gapGate) {
    return { actor: "shared", role: sharedRole, source, gap, confidence: "low" };
  }
  return gap > 0
    ? { actor: "a", role: roleForHigher, source, gap, confidence: "high" }
    : { actor: "b", role: roleForLower, source, gap, confidence: "high" };
}

/**
 * Approximated primary-axis value (connection/stability/growth/structure/
 * adaptability), derived from the real secondary-axis SSOT
 * (lib/v2/framework/primarySecondaryAxisMap.ts) via the shared
 * mapPsychMasterToSnapshotAxes utility. Use this instead of ever reading
 * `psych.secondary_axes.growth` / `.stability` / `.adaptability` directly —
 * those are PRIMARY-axis names and do not exist as keys on
 * PsychSecondaryAxesScores; a raw lookup silently returns `undefined` and
 * masks itself behind `?? 50` (the exact bug this helper replaces).
 *
 * `autonomy` has no entry in PRIMARY_TO_SECONDARY_AXIS_KEYS anywhere in the
 * product (see that file's own note) and is intentionally NOT covered here.
 * Callers that want an autonomy-shaped signal must rely on real Saju
 * evidence only — do not fabricate a Psych value for it.
 */
export function resolvePrimaryAxisValue(
  psych: PsychMasterJson | null | undefined,
  key: "connection" | "stability" | "growth" | "structure" | "adaptability",
): number | null {
  if (!psych) return null;
  const bar = mapPsychMasterToSnapshotAxes(psych).find((b) => b.key === key);
  return bar ? bar.value : null;
}
