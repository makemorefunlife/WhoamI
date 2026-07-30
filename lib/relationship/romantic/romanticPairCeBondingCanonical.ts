/**
 * Romantic Pair CE bonding projection — non-tension packets for Special Dynamics.
 * Facts come from shared Pair CE; this only projects selected packet ids/kinds.
 */
import type { PairContextPacket } from "@/lib/personCore/pairContextEngine";
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";

export const ROMANTIC_PAIR_CE_BONDING_SOURCE =
  "collectRomanticDynamicsTypedSnapshot.pairNonTensionPackets" as const;

export const ROMANTIC_PAIR_CE_BONDING_CLIENT_PATH =
  "canonical_projections.pair_ce_bonding" as const;

export type RomanticPairCeBondingValue = {
  packets: Array<{
    packet_id: string;
    fact_kind: string;
    group: string;
    codes: string[];
    selection_priority: number;
    directionality: PairContextPacket["directionality"];
    evidence: PairContextPacket["evidence"];
  }>;
  count: number;
};

export type RomanticPairCeBondingCanonical =
  CanonicalJudgment<RomanticPairCeBondingValue>;

export function buildRomanticPairCeBondingValue(
  packets: PairContextPacket[] | null | undefined,
): RomanticPairCeBondingValue | null {
  if (!packets?.length) return null;
  // Cap for projector — primary bonding/energy only
  const selected = packets
    .filter((p) => p.group === "bonding" || p.group === "energy")
    .slice(0, 6)
    .map((p) => ({
      packet_id: p.packet_id,
      fact_kind: p.fact_kind,
      group: p.group,
      codes: [...p.codes],
      selection_priority: p.selection_priority,
      directionality: { ...p.directionality },
      evidence: p.evidence.map((e) => ({ ...e })),
    }));
  if (!selected.length) return null;
  return { packets: selected, count: selected.length };
}

export function buildRomanticPairCeBondingCanonical(
  value: RomanticPairCeBondingValue | null | undefined,
): RomanticPairCeBondingCanonical | null {
  if (!value) return null;
  return {
    value,
    source: ROMANTIC_PAIR_CE_BONDING_SOURCE,
    psychMode: "none",
    persistencePath: "romantic_context_input.dynamics_typed_snapshot",
  };
}

export function injectRomanticPairCeBondingClientProjection<
  T extends { canonical_projections?: Record<string, unknown>; [k: string]: unknown },
>(report: T, projection: RomanticPairCeBondingValue | null | undefined): T {
  const { canonical_projections: prior, ...rest } = report;
  const next = { ...(prior ?? {}) };
  delete next.pair_ce_bonding;
  if (!projection) {
    return {
      ...rest,
      ...(Object.keys(next).length
        ? { canonical_projections: next }
        : {}),
    } as T;
  }
  return {
    ...rest,
    canonical_projections: {
      ...next,
      pair_ce_bonding: projection,
    },
  } as T;
}

export function readRomanticPairCeBondingProjection(
  report: { canonical_projections?: { pair_ce_bonding?: unknown } } | null | undefined,
): RomanticPairCeBondingValue | null {
  const raw = report?.canonical_projections?.pair_ce_bonding;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as RomanticPairCeBondingValue;
  if (!Array.isArray(o.packets) || typeof o.count !== "number") return null;
  return o;
}
