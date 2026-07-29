/**
 * Build IndividualSajuChart fixtures for Personal CE tests.
 */

import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { buildIndividualSajuChart } from "../individualSaju/buildIndividualSajuChart";
import type { IndividualSajuChart } from "../individualSaju/types";

export type PersonalCeFixtureId = "known_time" | "unknown_time";

export const PERSONAL_CE_FIXTURE_SPECS: Record<
  PersonalCeFixtureId,
  { birthDate: string; birthTime: string | null; birthTimeUnknown: boolean }
> = {
  known_time: {
    birthDate: "1990-05-15",
    birthTime: "14:30",
    birthTimeUnknown: false,
  },
  unknown_time: {
    birthDate: "1988-01-01",
    birthTime: null,
    birthTimeUnknown: true,
  },
};

export function buildPersonalCeFixtureChart(
  id: PersonalCeFixtureId,
): IndividualSajuChart {
  const spec = PERSONAL_CE_FIXTURE_SPECS[id];
  const bundle = calculateSajuBundle({
    birthDate: spec.birthDate,
    birthTime: spec.birthTime,
    birthTimeUnknown: spec.birthTimeUnknown,
  });
  return buildIndividualSajuChart({
    reportId: `personal-ce-fixture-${id}`,
    birthDate: spec.birthDate,
    birthTime: spec.birthTime,
    birthTimeUnknown: spec.birthTimeUnknown,
    bundle,
  });
}
