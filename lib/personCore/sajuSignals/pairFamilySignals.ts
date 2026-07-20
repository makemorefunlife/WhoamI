import type { DomainSajuSignalsPack, FamilySajuSignals } from "./types";
import { clampScore, intensityBand3 } from "./intraPalaceRelations";
import type { PairFamilySignals } from "./pairTypes";
import {
  resolveGuidanceFit,
  type GuidanceMode,
} from "./guidanceProfile";

export type BuildPairFamilyGuidanceOpts = {
  /** famA에 대응하는 person guidance mode */
  modeA: GuidanceMode;
  /** famB에 대응하는 person guidance mode */
  modeB: GuidanceMode;
};

/** Person-level FamilySajuSignals 두 개만으로 pair 교차 — pack 전체 불필요. */
export function buildPairFamilySignals(
  famA: FamilySajuSignals,
  famB: FamilySajuSignals,
  guidance?: BuildPairFamilyGuidanceOpts,
): PairFamilySignals {
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
    guidance_fit: guidance
      ? resolveGuidanceFit(guidance.modeA, guidance.modeB)
      : null,
  };
}

export function pairFamilySignals(
  signalsA: DomainSajuSignalsPack,
  signalsB: DomainSajuSignalsPack,
): PairFamilySignals {
  return buildPairFamilySignals(signalsA.family_signals, signalsB.family_signals);
}
