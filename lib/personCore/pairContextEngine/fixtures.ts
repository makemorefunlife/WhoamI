import { buildChartContext } from "@/lib/saju/chartContext";
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { buildIndividualSajuChart } from "../individualSaju/buildIndividualSajuChart";
import type { PairSajuFactsInput } from "../pairSaju";

export type PairCeFixtureId = "known_pair" | "unknown_hour_a";

function pillarsFromBundle(bundle: ReturnType<typeof calculateSajuBundle>) {
  const find = (name: string) =>
    bundle.chart.pillars.find((p) => p.name === name)?.pillar ?? "";
  return {
    yearPillar: find("년주"),
    monthPillar: find("월주"),
    dayPillar: find("일주"),
    hourPillar: find("시주"),
  };
}

export function buildPairCeFixtureInput(id: PairCeFixtureId): PairSajuFactsInput {
  const aUnknown = id === "unknown_hour_a";
  const bundleA = calculateSajuBundle({
    birthDate: "1990-05-15",
    birthTime: aUnknown ? null : "14:30",
    birthTimeUnknown: aUnknown,
  });
  const bundleB = calculateSajuBundle({
    birthDate: "1988-01-01",
    birthTime: "09:00",
    birthTimeUnknown: false,
  });
  const chartA = buildIndividualSajuChart({
    reportId: `pair-ce-a-${id}`,
    birthDate: "1990-05-15",
    birthTime: aUnknown ? null : "14:30",
    birthTimeUnknown: aUnknown,
    bundle: bundleA,
  });
  const chartB = buildIndividualSajuChart({
    reportId: `pair-ce-b-${id}`,
    birthDate: "1988-01-01",
    birthTime: "09:00",
    birthTimeUnknown: false,
    bundle: bundleB,
  });

  return {
    chartA: buildChartContext(pillarsFromBundle(bundleA)),
    chartB: buildChartContext(pillarsFromBundle(bundleB)),
    reportIdA: chartA.birth.report_id,
    reportIdB: chartB.birth.report_id,
    birthTimeUnknownA: aUnknown,
    birthTimeUnknownB: false,
    johuA: {
      temperature_band: chartA.johu.temperature_band,
      moisture_band: chartA.johu.moisture_band,
      heat_score: chartA.johu.heat_score,
      moisture_score: chartA.johu.moisture_score,
    },
    johuB: {
      temperature_band: chartB.johu.temperature_band,
      moisture_band: chartB.johu.moisture_band,
      heat_score: chartB.johu.heat_score,
      moisture_score: chartB.johu.moisture_score,
    },
    yongsinA: chartA.favorable_elements.yongsin,
    yongsinB: chartB.favorable_elements.yongsin,
    yongsinConfidenceA: chartA.favorable_elements.confidence,
    yongsinConfidenceB: chartB.favorable_elements.confidence,
  };
}
