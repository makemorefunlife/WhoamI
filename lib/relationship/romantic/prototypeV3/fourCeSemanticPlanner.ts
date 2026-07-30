import type { PersonalContextPacket } from "@/lib/personCore/personalContextEngine/types";
import type { RomanticNarrativeInputContract } from "./fourCeNarrativeInput";

export type FourCeSemanticPlan = {
  aRelationshipCharacter: { source: string; selectedMeaning: string | null };
  bRelationshipCharacter: { source: string; selectedMeaning: string | null };
  aExperiencedByB: { source: string; selectedMeaning: string | null };
  bExperiencedByA: { source: string; selectedMeaning: string | null };
  directionalAsymmetry: { source: string; selectedMeaning: string | null };
  pairSynthesis: { source: string; selectedMeaning: string | null };
  romanticSpecificConsequence: { source: string; selectedMeaning: string | null };
  conflictRepairConsequence: { source: string; selectedMeaning: string | null };
};

function pickPacketText(packets: PersonalContextPacket[]): string | null {
  const p =
    packets.find((x) => x.group === "identity" && x.tier <= 2) ??
    packets.find((x) => x.group === "energy" && x.tier <= 2) ??
    packets[0];
  if (!p) return null;
  return p.base_meanings[0]?.text_ko ?? null;
}

export function buildFourCeSemanticPlan(
  contract: RomanticNarrativeInputContract,
): FourCeSemanticPlan {
  const aPackets =
    contract.siblingInputs.individualCeA.output.status === "available"
      ? contract.siblingInputs.individualCeA.output.value.packets
      : [];
  const bPackets =
    contract.siblingInputs.individualCeB.output.status === "available"
      ? contract.siblingInputs.individualCeB.output.value.packets
      : [];

  const pairOut =
    contract.siblingInputs.pairCeCommon.output.status === "available"
      ? contract.siblingInputs.pairCeCommon.output.value
      : null;
  const romanticOut =
    contract.siblingInputs.romanticCeSpecific.output.status === "available"
      ? contract.siblingInputs.romanticCeSpecific.output.value
      : null;

  const comparison = romanticOut?.canonicalProjections?.comparison_table;
  const expression = romanticOut?.canonicalProjections?.expression_speed;
  const reassurance = romanticOut?.canonicalProjections?.reassurance_signal;
  const recovery = romanticOut?.canonicalProjections?.recovery_speed;

  const directionHint = pairOut?.pairCe.packets.find(
    (p) => p.directionality.polarity === "a_to_b" || p.directionality.polarity === "b_to_a",
  );

  return {
    aRelationshipCharacter: {
      source: "individualCeA.packets(identity/energy)",
      selectedMeaning: pickPacketText(aPackets),
    },
    bRelationshipCharacter: {
      source: "individualCeB.packets(identity/energy)",
      selectedMeaning: pickPacketText(bPackets),
    },
    aExperiencedByB: {
      source: "romanticCeSpecific.canonicalProjections.comparison_table.expression/communication",
      selectedMeaning: comparison?.expression?.a_to_b ?? null,
    },
    bExperiencedByA: {
      source: "romanticCeSpecific.canonicalProjections.comparison_table.affection/reassurance",
      selectedMeaning: comparison?.affection?.b_to_a ?? null,
    },
    directionalAsymmetry: {
      source: "pairCeCommon.directionality + romanticCeSpecific.expression_speed",
      selectedMeaning: directionHint?.directionality.polarity ?? null,
    },
    pairSynthesis: {
      source: "pairCeCommon.groups(bonding/friction)",
      selectedMeaning:
        pairOut?.pairCe.packets.find((p) => p.group === "bonding")
          ?.base_meanings?.[0]?.text_ko ??
        pairOut?.pairCe.packets.find((p) => p.group === "friction")
          ?.base_meanings?.[0]?.text_ko ??
        null,
    },
    romanticSpecificConsequence: {
      source: "romanticCeSpecific.reassurance_signal+balance_of_power",
      selectedMeaning: reassurance?.match_note ?? null,
    },
    conflictRepairConsequence: {
      source: "romanticCeSpecific.expression_speed+recovery_speed",
      selectedMeaning: expression?.direction_note ?? recovery?.pace_note ?? null,
    },
  };
}
