import type { JohuClimateSnapshot } from "@/lib/personCore/types/sajuMaster";
import type { SajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import type { SajuPillars } from "@/lib/saju/chartContext";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { estimateStrengthBalance } from "@/lib/saju/romanticSajuDerivations";
import { collectBranchPalaceRelations } from "./intraPalaceRelations";
import type {
  AffectionBand,
  CommunicationBand,
  ConflictBand,
  DecisionBand,
  ExpressionBand,
  RomanticSajuSignals,
  StressReactionBand,
} from "./types";

function countTenGods(bundle: SajuBundle): TenGodCounts {
  const counts: TenGodCounts = {};
  for (const t of bundle.tenGods) {
    // 일주(day pillar)는 일간 자기비교라 정의상 항상 비견(self)이 됨 — 제외.
    if (t.pillar === "일주") continue;
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function chartToSajuPillars(bundle: SajuBundle): SajuPillars {
  const chart = bundle.chart;
  const find = (name: string) =>
    chart.pillars.find((p) => p.name === name)?.pillar ?? "";
  return {
    yearPillar: find("년주"),
    monthPillar: find("월주"),
    dayPillar: find("일주"),
    hourPillar: find("시주"),
  };
}

function expressionBand(foodCount: number): ExpressionBand {
  if (foodCount >= 2) return "expressive";
  if (foodCount === 0) return "reserved";
  return "balanced";
}

function conflictBand(officerCount: number, foodCount: number): ConflictBand {
  if (officerCount > foodCount) return "principled";
  if (foodCount > officerCount) return "direct";
  return "balanced";
}

function affectionBand(wealthCount: number, sealCount: number): AffectionBand {
  if (wealthCount > sealCount) return "action_gift";
  if (sealCount > wealthCount) return "emotional_care";
  return "balanced";
}

function stressBand(
  temperatureBand: JohuClimateSnapshot["temperature_band"],
): StressReactionBand {
  if (temperatureBand === "hot") return "explosive";
  if (temperatureBand === "cold") return "withdrawn";
  return "steady";
}

function decisionBand(strengthLabel: string): DecisionBand {
  if (strengthLabel.includes("신강")) return "independent";
  if (strengthLabel.includes("신약")) return "consultative";
  return "balanced";
}

function communicationBand(
  selfCount: number,
  sealCount: number,
): CommunicationBand {
  if (selfCount > sealCount) return "direct";
  if (sealCount > selfCount) return "considerate";
  return "balanced";
}

export function extractRomanticSignals(
  bundle: SajuBundle,
  johuClimate: JohuClimateSnapshot,
): RomanticSajuSignals {
  const chart = bundle.chart;
  const counts = countTenGods(bundle);
  const profile = profileTenGods(counts);

  const dayBranchTension = collectBranchPalaceRelations(chart, "일주").tension;

  const strength = estimateStrengthBalance(chartToSajuPillars(bundle));

  return {
    expression_style: {
      food_count: profile.food,
      expression_band: expressionBand(profile.food),
    },
    conflict_response: {
      officer_count: profile.officer,
      food_count: profile.food,
      day_branch_tension_hits: dayBranchTension,
      conflict_band: conflictBand(profile.officer, profile.food),
    },
    affection_language: {
      wealth_count: profile.wealth,
      seal_count: profile.seal,
      affection_band: affectionBand(profile.wealth, profile.seal),
    },
    stress_pattern: {
      heat_score: johuClimate.heat_score,
      temperature_band: johuClimate.temperature_band,
      stress_band: stressBand(johuClimate.temperature_band),
    },
    decision_making: {
      strength_label: strength.label,
      decision_band: decisionBand(strength.label),
    },
    communication_style: {
      self_count: profile.self,
      seal_count: profile.seal,
      communication_band: communicationBand(profile.self, profile.seal),
    },
  };
}
