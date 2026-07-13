import { polishRomanticDisplayText } from "@/lib/relationship/romanticEverydayText";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import {
  buildChemistryApproxScores,
  buildStrengthWeaknessLists,
} from "@/lib/relationship/psychMatch";
import {
  applyRomanticDisplayNames,
  applyReportSlotNames,
  buildRomanticNameReplacements,
  pickViewerFirstPair,
} from "@/lib/relationship/viewerFirstDisplay";

export type RomanticDisplayContext = {
  nameA: string;
  nameB: string;
  myName: string;
  partnerName: string;
  viewerIsReportA: boolean;
  nameReplacements: Array<[string, string]>;
  displayText: (raw: string | undefined | null) => string;
};

export function buildRomanticDisplayContext(params: {
  nameA: string;
  nameB: string;
  myName: string;
  partnerName: string;
  viewerIsReportA: boolean;
}): RomanticDisplayContext {
  const { nameA, nameB, myName, partnerName, viewerIsReportA } = params;
  const nameReplacements = buildRomanticNameReplacements({
    myName,
    partnerName,
    personAName: nameA,
    personBName: nameB,
    viewerIsReportA,
  });

  const displayText = (raw: string | undefined | null): string => {
    if (!raw?.trim()) return "";
    const slotted = applyReportSlotNames(raw, nameA, nameB);
    return applyRomanticDisplayNames(
      polishRomanticDisplayText(slotted),
      nameReplacements,
    );
  };

  return {
    nameA,
    nameB,
    myName,
    partnerName,
    viewerIsReportA,
    nameReplacements,
    displayText,
  };
}

export function buildRomanticPsychDerivations(
  psychMatch: RomanticSajuDeepReport["report"]["meta"] extends infer M
    ? M extends { psych_match?: infer P }
      ? P
      : null
    : null,
) {
  if (!psychMatch || typeof psychMatch !== "object") {
    return {
      chemistryApprox: null as ReturnType<typeof buildChemistryApproxScores> | null,
      strengthWeakness: null as ReturnType<
        typeof buildStrengthWeaknessLists
      > | null,
    };
  }
  const axisResults = (psychMatch as { axis_results?: unknown }).axis_results;
  if (!Array.isArray(axisResults)) {
    return { chemistryApprox: null, strengthWeakness: null };
  }
  return {
    chemistryApprox: buildChemistryApproxScores(axisResults),
    strengthWeakness: buildStrengthWeaknessLists(axisResults),
  };
}

export function pickRomanticNaturePair(
  report: RomanticSajuDeepReport["report"],
  viewerIsReportA: boolean,
) {
  const s2 = report.section_2_nature ?? {};
  return pickViewerFirstPair(
    s2.a_nature ?? {},
    s2.b_nature ?? {},
    viewerIsReportA,
  );
}
