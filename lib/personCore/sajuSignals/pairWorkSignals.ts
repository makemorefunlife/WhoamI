import type { DomainSajuSignalsPack } from "./types";
import { clampScore, intensityBand3 } from "./intraPalaceRelations";
import type { PairWorkSignals } from "./pairTypes";

function bandRank(band: "low" | "balanced" | "high" | "flexible" | "stubborn"): number {
  if (band === "low" || band === "flexible") return 0;
  if (band === "balanced") return 1;
  return 2;
}

export function pairWorkSignals(
  signalsA: DomainSajuSignalsPack,
  signalsB: DomainSajuSignalsPack,
): PairWorkSignals {
  const workA = signalsA.work_signals.drive_stubborn;
  const workB = signalsB.work_signals.drive_stubborn;

  const notes: string[] = [];

  let micromanaging = 18;
  const aManagerish =
    workA.food_intensity >= 60 && workA.stubborn_band !== "flexible";
  const bManagerish =
    workB.food_intensity >= 60 && workB.stubborn_band !== "flexible";

  if (aManagerish && workB.self_intensity <= 40) {
    micromanaging += 38;
    notes.push("a_food_high_vs_b_self_low");
  }
  if (bManagerish && workA.self_intensity <= 40) {
    micromanaging += 38;
    notes.push("b_food_high_vs_a_self_low");
  }
  if (aManagerish && bManagerish) {
    micromanaging += 15;
    notes.push("both_managerish");
  }
  micromanaging += Math.abs(workA.food_intensity - workB.food_intensity) * 0.2;
  micromanaging = clampScore(micromanaging);

  let leadershipConflict = 22;
  if (workA.stubborn_band === "stubborn" && workB.stubborn_band === "stubborn") {
    leadershipConflict += 40;
    notes.push("dual_stubborn");
  }
  if (workA.self_intensity >= 55 && workB.self_intensity >= 55) {
    leadershipConflict += 28;
    notes.push("dual_high_self");
  }
  leadershipConflict +=
    Math.abs(workA.self_intensity - workB.self_intensity) < 8 &&
    workA.self_intensity >= 50
      ? 12
      : 0;
  leadershipConflict += Math.abs(
    bandRank(workA.drive_band) - bandRank(workB.drive_band),
  ) * 8;
  leadershipConflict = clampScore(leadershipConflict);

  return {
    micromanaging_poison_index: micromanaging,
    micromanaging_band: intensityBand3(micromanaging),
    leadership_conflict_index: leadershipConflict,
    leadership_conflict_band: intensityBand3(leadershipConflict),
    drive_clash_notes: notes,
  };
}
