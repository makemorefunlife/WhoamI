/**
 * buildRomanticExperienceViewModel — B2 content projectors for
 * M1 Opening, M2 Hidden Dynamic, M3 What's Special, M6 Conflict, M10 Horizon.
 * M4/M5/M7/M8/M9 remain unavailable. deepRead stays null.
 * Does not mutate the source report. No grade/ScoreBoard/formula on VM.
 */

import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import {
  emptyDifferenceMap,
  emptyDoDont,
  emptyNextStep,
  emptyRelationshipFlow,
  emptyRepairGuide,
} from "./projectors/_empty";
import { projectConflictPattern } from "./projectors/projectConflictPattern";
import { projectHiddenDynamic } from "./projectors/projectHiddenDynamic";
import { projectHorizon } from "./projectors/projectHorizon";
import { projectOpening } from "./projectors/projectOpening";
import { projectWhatsSpecial } from "./projectors/projectWhatsSpecial";
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

export function buildRomanticExperienceViewModel(
  input: BuildRomanticExperienceViewModelInput,
): RomanticExperienceViewModel {
  const myName = normalizeName(input.myName, "A");
  const partnerName = normalizeName(input.partnerName, "B");
  const nameA = normalizeName(input.nameA, "A");
  const nameB = normalizeName(input.nameB, "B");
  const locale = input.locale?.trim() || "ko-KR";
  const viewerIsReportA = Boolean(input.viewerIsReportA);
  const report = input.report;

  return {
    meta: {
      viewerIsReportA,
      myName,
      partnerName,
      nameA,
      nameB,
      locale,
      accentToken: "#E2C4A8",
      buildId: "b2-content-projectors",
    },
    opening: projectOpening({ report, myName, partnerName }),
    hiddenHeart: projectHiddenDynamic({
      report,
      myName,
      partnerName,
      viewerIsReportA,
    }),
    whySpecial: projectWhatsSpecial({
      report,
      myName,
      partnerName,
      nameA,
      nameB,
      viewerIsReportA,
      locale,
    }),
    differenceMap: emptyDifferenceMap(),
    flow: emptyRelationshipFlow(),
    conflict: projectConflictPattern({
      report,
      nameA,
      nameB,
      myName,
      partnerName,
      viewerIsReportA,
    }),
    doDont: emptyDoDont(),
    repair: emptyRepairGuide(),
    nextStep: emptyNextStep(),
    horizon: projectHorizon({ report }),
    deepRead: null,
    saveShare: null,
  };
}
