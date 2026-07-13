import type { DomainSajuSignalsPack } from "./types";
import { clampScore, intensityBand3 } from "./intraPalaceRelations";
import type { PairFriendshipSignals } from "./pairTypes";

export function pairFriendshipSignals(
  signalsA: DomainSajuSignalsPack,
  signalsB: DomainSajuSignalsPack,
): PairFriendshipSignals {
  const johuA = signalsA.friendship_signals.johu_profile;
  const johuB = signalsB.friendship_signals.johu_profile;

  const heatGap = Math.abs(johuA.heat_score - johuB.heat_score);
  const moistureGap = Math.abs(johuA.moisture_score - johuB.moisture_score);
  const temperatureMismatch =
    (johuA.temperature_band === "cold" && johuB.temperature_band === "hot") ||
    (johuA.temperature_band === "hot" && johuB.temperature_band === "cold");

  let energyDrain = 20;
  energyDrain += heatGap * 0.35;
  energyDrain += moistureGap * 0.25;
  if (temperatureMismatch) energyDrain += 22;
  if (johuA.dominant_element !== johuB.dominant_element) {
    energyDrain += 10;
  }
  energyDrain +=
    signalsA.friendship_signals.bijie_isolation.isolation_band === "lone_wolf" ||
    signalsB.friendship_signals.bijie_isolation.isolation_band === "lone_wolf"
      ? 8
      : 0;
  energyDrain = clampScore(energyDrain);

  return {
    johu_gap: {
      heat_gap: heatGap,
      moisture_gap: moistureGap,
      temperature_mismatch: temperatureMismatch,
      band_a: johuA.temperature_band,
      band_b: johuB.temperature_band,
    },
    energy_drain_index: energyDrain,
    energy_drain_band: intensityBand3(energyDrain),
  };
}
