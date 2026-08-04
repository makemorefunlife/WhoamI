/**
 * Romantic V4 — production adapter.
 *
 * Thin reshaping layer: takes the exact real inputs the production analyze
 * route (app/api/relationship/analyze/premium/route.ts) already loaded for
 * V1 — birth data (incl. birthTimeUnknown), the PersonCore premium bundles
 * (bundlePersonCoreForPremium), survey profiles, display names, locale, and
 * report identity — and produces what buildCanonicalRomanticV4Report needs.
 * No new calculation: Saju master JSON is reused from the already-loaded
 * bundle (bundles.a.blueprint.saju_master_json) whenever it's complete;
 * calculateSajuBundle/mapSajuBundleToMasterJson are only invoked as a
 * fallback for legacy blueprint snapshots predating domain_signals.
 *
 * Never reads a fixture and never depends on the /dev/ route.
 */
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import type { SajuMasterJson } from "@/lib/personCore/types/sajuMaster";
import type { RomanticV4PrecomputedSaju } from "../buildActualFourCeContract";
import type { RomanticV4PairSajuInput } from "../romanticV4SajuInput";
import type { RomanticV4SurveyInput } from "../romanticV4SurveyEvidence";
import {
  computeBirthHourEvidence,
  type BirthHourEvidence,
} from "./romanticV4HourEvidence";

export type RomanticV4ProductionPersonInput = {
  reportId: string;
  name: string;
  birthDate: string;
  /** Raw HH:MM, or null/empty when not supplied — birthTimeUnknown is the authority, not string-emptiness alone. */
  birthTime: string | null;
  birthTimeUnknown: boolean;
  surveyProfile: CurrentSelfProfile | null;
  /** Already-computed master JSON for this person (bundles.X.blueprint.saju_master_json), reused when complete. */
  sajuMaster: SajuMasterJson | null;
};

export type RomanticV4ProductionInput = {
  personA: RomanticV4ProductionPersonInput;
  personB: RomanticV4ProductionPersonInput;
  locale: "ko-KR" | "en-US";
};

export type RomanticV4ProductionAdapterResult = {
  pairSajuInput: RomanticV4PairSajuInput;
  surveyInput: RomanticV4SurveyInput;
  precomputed?: RomanticV4PrecomputedSaju;
  birthHourEvidence: BirthHourEvidence;
  locale: "ko-KR" | "en-US";
};

/** A SajuMasterJson is only safe to reuse as-is when it actually carries the romantic domain signals V4 needs. */
function hasUsableRomanticSignals(master: SajuMasterJson | null): master is SajuMasterJson {
  return Boolean(master?.domain_signals?.romantic_signals);
}

/**
 * Build buildCanonicalRomanticV4Report's real-mode inputs from production
 * data. Pure reshaping — throws nothing, never falls back to fixture/dev
 * data; if a person's Saju master JSON isn't usable (legacy snapshot),
 * `precomputed` simply omits that side and buildActualFourCeContract
 * recomputes it fresh (still real, still not a fixture — just not reusing a
 * stale cached derivation).
 */
export function buildRomanticV4ProductionInput(
  input: RomanticV4ProductionInput,
): RomanticV4ProductionAdapterResult {
  const { personA, personB, locale } = input;

  const pairSajuInput: RomanticV4PairSajuInput = {
    mode: "real",
    birthA: {
      birthDate: personA.birthDate,
      birthTime: personA.birthTime,
      birthTimeUnknown: personA.birthTimeUnknown,
    },
    birthB: {
      birthDate: personB.birthDate,
      birthTime: personB.birthTime,
      birthTimeUnknown: personB.birthTimeUnknown,
    },
    nameA: personA.name,
    nameB: personB.name,
  };

  const surveyInput: RomanticV4SurveyInput = {
    mode: "real",
    profileA: personA.surveyProfile,
    profileB: personB.surveyProfile,
  };

  const precomputed: RomanticV4PrecomputedSaju | undefined =
    hasUsableRomanticSignals(personA.sajuMaster) && hasUsableRomanticSignals(personB.sajuMaster)
      ? { masterA: personA.sajuMaster, masterB: personB.sajuMaster }
      : undefined;

  const birthHourEvidence = computeBirthHourEvidence(
    personA.birthTimeUnknown,
    personB.birthTimeUnknown,
  );

  return { pairSajuInput, surveyInput, precomputed, birthHourEvidence, locale };
}
