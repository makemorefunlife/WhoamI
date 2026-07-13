import type { DomainSajuSignalsPack } from "./types";
import { clampScore, intensityBand3 } from "./intraPalaceRelations";
import type { PairFamilySignals } from "./pairTypes";

export function pairFamilySignals(
  signalsA: DomainSajuSignalsPack,
  signalsB: DomainSajuSignalsPack,
): PairFamilySignals {
  const famA = signalsA.family_signals;
  const famB = signalsB.family_signals;

  const combinedKarma = clampScore(
    famA.year_karma.karma_tension_index * 0.55 +
      famB.year_karma.karma_tension_index * 0.55,
  );

  let umbilical = 22;
  const aSmother = famA.seal_parent.parent_bond_band === "smothering";
  const bSmother = famB.seal_parent.parent_bond_band === "smothering";
  const aDistant = famA.seal_parent.parent_bond_band === "distant";
  const bDistant = famB.seal_parent.parent_bond_band === "distant";

  if ((aSmother && bDistant) || (bSmother && aDistant)) {
    umbilical += 35;
  }
  if (aSmother && bSmother) umbilical += 18;
  if (aDistant && bDistant) umbilical += 12;
  if (famA.seal_parent.seal_isolated || famB.seal_parent.seal_isolated) {
    umbilical += 15;
  }
  umbilical += Math.abs(famA.seal_parent.seal_count - famB.seal_parent.seal_count) * 6;
  umbilical = clampScore(umbilical);

  let nagging = 18;
  if (famA.seal_parent.seal_excess || famB.seal_parent.seal_excess) {
    nagging += 25;
  }
  if (aSmother || bSmother) nagging += 20;
  nagging +=
    (famA.home_punishment.punishment_count + famB.home_punishment.punishment_count) *
    8;
  nagging += combinedKarma * 0.2;
  nagging = clampScore(nagging);

  return {
    umbilical_separation_index: umbilical,
    umbilical_band: intensityBand3(umbilical),
    nagging_trigger_index: nagging,
    nagging_band: intensityBand3(nagging),
    combined_karma_tension: combinedKarma,
  };
}
