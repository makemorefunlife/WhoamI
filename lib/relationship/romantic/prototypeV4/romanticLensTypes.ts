/**
 * Consolidation Batch B3 — role-revealing type aliases.
 *
 * Purely additive: these are `type` aliases (zero runtime cost) over the
 * existing PersonCore/Pair CE and Romantic-domain types, so that new code
 * can reference the role a value plays (Personal Lens vs Pair Lens, input
 * vs output) without a disruptive rename of the underlying types or their
 * many existing consumers. Adopt gradually — nothing is required to import
 * from this file today; PersonalRelationshipCe, applyRomanticPairLens's
 * return type, etc. keep their current names and locations.
 *
 * Does NOT modify anything under lib/personCore/ — read-only references.
 */
import type { IndividualSajuChart } from "../../../personCore/individualSaju/types";
import type { RomanticSajuSignals } from "../../../personCore/sajuSignals/types";
import type { PersonalRelationalProfile } from "../../../personCore/personalContextEngine/types";
import type { PairContextEngineOutput } from "../../../personCore/pairContextEngine/types";
import type { applyRomanticPairLens } from "../../../personCore/pairContextEngine/lenses";
import type { PersonalRelationshipCe } from "./personalRelationshipCe";

/** What buildPersonalRelationshipCe actually consumes: chart + saju signals + (optionally) Personal CE's relational_profile. */
export type RomanticPersonalLensInput = {
  chart: IndividualSajuChart;
  signals?: RomanticSajuSignals | null;
  relationalProfile?: PersonalRelationalProfile | null;
};

/** buildPersonalRelationshipCe's output — the Romantic Personal Lens's translation of Personal CE + individual saju facts into dating-context interpretation. */
export type RomanticPersonalLensOutput = PersonalRelationshipCe;

/** What applyRomanticPairLens consumes: Pair CE's real output, unmodified. */
export type RomanticPairLensInput = PairContextEngineOutput;

/** applyRomanticPairLens's output — Pair CE's shared relational facts translated into romantic-specific pair dynamics. */
export type RomanticPairLensOutput = ReturnType<typeof applyRomanticPairLens>;
