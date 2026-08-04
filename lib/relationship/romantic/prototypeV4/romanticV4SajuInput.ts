/**
 * Romantic V4 — real A/B birth input contract for Saju/CE wiring.
 *
 * Mirrors romanticV4SurveyEvidence.ts's mode pattern (real | dev_fixture) but
 * for the Saju/PersonCore side: birthA/birthB reuse SajuBirthInput (the same
 * type calculateSajuBundle/mapSajuBundleToMasterJson/buildIndividualSajuChart
 * already take) rather than inventing a parallel birth type.
 */
import type { SajuBirthInput } from "@/lib/v2/saju/calculateSajuBundle";

export type RomanticV4PairSajuMode = "real" | "dev_fixture";

export type RomanticV4PairSajuInput = {
  mode: RomanticV4PairSajuMode;
  /** Required (non-null) when mode is "real" — buildActualFourCeContract throws otherwise. */
  birthA: SajuBirthInput | null;
  birthB: SajuBirthInput | null;
  nameA?: string;
  nameB?: string;
};

export type RomanticV4PairSajuProvenance = {
  source: RomanticV4PairSajuMode;
  isSampleData: boolean;
};

export function pairSajuProvenance(mode: RomanticV4PairSajuMode): RomanticV4PairSajuProvenance {
  return { source: mode, isSampleData: mode === "dev_fixture" };
}

export type { SajuBirthInput };
