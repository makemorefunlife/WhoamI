/**
 * buildRomanticExperienceViewModel — Batch B1 skeleton.
 *
 * Maps display meta only. All M1–M10 slots are unavailable placeholders.
 * Legacy Part 1–5 / grade / formula knowledge stays inside later projectors —
 * this file must not copy those fields onto the VM surface.
 *
 * Does not mutate the source report.
 */

import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import {
  emptyConflictTranslation,
  emptyDifferenceMap,
  emptyDoDont,
  emptyHiddenHeart,
  emptyHorizon,
  emptyNextStep,
  emptyOpeningScene,
  emptyRelationshipFlow,
  emptyRepairGuide,
  emptyWhySpecial,
} from "./projectors/_empty";
import type { RomanticExperienceViewModel } from "./romanticExperienceTypes";

export type BuildRomanticExperienceViewModelInput = {
  /** Source report — read-only; never mutated. */
  report: RomanticSajuDeepReport["report"];
  viewerIsReportA: boolean;
  myName: string;
  partnerName: string;
  nameA: string;
  nameB: string;
  locale?: string;
};

function normalizeName(value: string | undefined | null, fallback: string): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || fallback;
}

/**
 * Null-safe skeleton builder. Survives empty/partial reports because it does
 * not walk section_* payloads yet (B2+ projectors will).
 */
export function buildRomanticExperienceViewModel(
  input: BuildRomanticExperienceViewModelInput,
): RomanticExperienceViewModel {
  // Touch report only to prove presence for future projectors / fail closed.
  // Do not read grade, formula, or event scores onto the VM.
  void input.report;

  const myName = normalizeName(input.myName, "A");
  const partnerName = normalizeName(input.partnerName, "B");
  const nameA = normalizeName(input.nameA, "A");
  const nameB = normalizeName(input.nameB, "B");

  return {
    meta: {
      viewerIsReportA: Boolean(input.viewerIsReportA),
      myName,
      partnerName,
      nameA,
      nameB,
      locale: input.locale?.trim() || "ko-KR",
      accentToken: "#E2C4A8",
      buildId: "b1-skeleton",
    },
    opening: emptyOpeningScene({ myName, partnerName }),
    differenceMap: emptyDifferenceMap(),
    flow: emptyRelationshipFlow(),
    hiddenHeart: emptyHiddenHeart(),
    whySpecial: emptyWhySpecial(),
    conflict: emptyConflictTranslation(),
    doDont: emptyDoDont(),
    repair: emptyRepairGuide(),
    nextStep: emptyNextStep(),
    horizon: emptyHorizon(),
    deepRead: null,
    saveShare: null,
  };
}
