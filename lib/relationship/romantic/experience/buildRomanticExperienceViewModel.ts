/**
 * buildRomanticExperienceViewModel — B3 content projectors for
 * M1–M10 (M7 Daily Life, M8 Do/Don't, M9 Repair). Next Step deferred.
 * deepRead stays null. Does not mutate the source report.
 * No grade/ScoreBoard/formula on VM.
 */

import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { emptyNextStep } from "./projectors/_empty";
import { projectConflictPattern } from "./projectors/projectConflictPattern";
import { projectDailyLife } from "./projectors/projectDailyLife";
import { projectDifferenceMap } from "./projectors/projectDifferenceMap";
import { projectDoDont } from "./projectors/projectDoDont";
import { projectHiddenDynamic } from "./projectors/projectHiddenDynamic";
import { projectHorizon } from "./projectors/projectHorizon";
import { projectOpening } from "./projectors/projectOpening";
import { projectRelationshipFlow } from "./projectors/projectRelationshipFlow";
import { projectRepairGuide } from "./projectors/projectRepairGuide";
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

function collectDialoguePhrases(
  conflict: RomanticExperienceViewModel["conflict"],
): string[] {
  const out: string[] = [];
  for (const row of conflict.rows) {
    if (row.said) out.push(row.said);
    if (row.better) out.push(row.better);
  }
  return out;
}

function collectPreventiveTexts(
  doDont: RomanticExperienceViewModel["doDont"],
): string[] {
  const out: string[] = [];
  for (const item of doDont.pack?.items ?? []) {
    out.push(item.headline);
    out.push(...item.do_list);
    out.push(...item.dont_list);
  }
  return out;
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

  const conflict = projectConflictPattern({
    report,
    nameA,
    nameB,
    myName,
    partnerName,
    viewerIsReportA,
  });
  const forbiddenPhrases = collectDialoguePhrases(conflict);

  const doDont = projectDoDont({
    report,
    nameA,
    nameB,
    myName,
    partnerName,
    viewerIsReportA,
    forbiddenPhrases,
  });
  const preventiveTexts = collectPreventiveTexts(doDont);

  return {
    meta: {
      viewerIsReportA,
      myName,
      partnerName,
      nameA,
      nameB,
      locale,
      accentToken: "#E2C4A8",
      buildId: "b3-content-projectors",
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
    differenceMap: projectDifferenceMap({
      report,
      viewerIsReportA,
      locale,
    }),
    flow: projectRelationshipFlow({
      report,
      nameA,
      nameB,
      myName,
      partnerName,
      viewerIsReportA,
    }),
    conflict,
    dailyLife: projectDailyLife({
      report,
      viewerIsReportA,
      myName,
      partnerName,
      locale,
    }),
    doDont,
    repair: projectRepairGuide({
      report,
      nameA,
      nameB,
      myName,
      partnerName,
      viewerIsReportA,
      locale,
      preventiveTexts,
    }),
    nextStep: emptyNextStep(),
    horizon: projectHorizon({ report }),
    deepRead: null,
    saveShare: null,
  };
}
