import type { PersonalContextPacket } from "../../../personCore/personalContextEngine/types";
import type { RomanticNarrativeInputContract } from "./fourCeNarrativeInput";
import type { PersonalRelationshipCe } from "./personalRelationshipCe";

export type FourCeSemanticPlan = {
  aRelationshipCe?: PersonalRelationshipCe | null;
  bRelationshipCe?: PersonalRelationshipCe | null;
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
  const relCeA = contract.siblingInputs.individualCeA.relationshipCe ?? null;
  const relCeB = contract.siblingInputs.individualCeB.relationshipCe ?? null;

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

  const directionHint = pairOut?.pairCe.packets.find(
    (p) => p.directionality.polarity === "a_to_b" || p.directionality.polarity === "b_to_a",
  );

  const aMeaning = relCeA?.coreRelationshipNature.text ?? pickPacketText(aPackets);
  const bMeaning = relCeB?.coreRelationshipNature.text ?? pickPacketText(bPackets);

  return {
    aRelationshipCe: relCeA,
    bRelationshipCe: relCeB,
    aRelationshipCharacter: {
      source: relCeA ? "individualCeA.personalRelationshipCe" : "individualCeA.packets(identity/energy)",
      selectedMeaning: aMeaning,
    },
    bRelationshipCharacter: {
      source: relCeB ? "individualCeB.personalRelationshipCe" : "individualCeB.packets(identity/energy)",
      selectedMeaning: bMeaning,
    },
    aExperiencedByB: {
      source: "personalRelationshipCeA.fiveElementStructure",
      selectedMeaning: relCeA?.fiveElementStructure.relationshipTranslation[0]?.text ?? null,
    },
    bExperiencedByA: {
      source: "personalRelationshipCeB.fiveElementStructure",
      selectedMeaning: relCeB?.fiveElementStructure.relationshipTranslation[0]?.text ?? null,
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
      selectedMeaning: null,
    },
    conflictRepairConsequence: {
      source: "romanticCeSpecific.expression_speed+recovery_speed",
      selectedMeaning: null,
    },
  };
}
