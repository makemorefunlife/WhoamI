/**
 * buildRomanticExperienceViewModel — Experience V2 shell (feature-flag path).
 * Current implementation scope: M1..M10 (without Daily Life / Horizon / SaveShare rollout).
 * deepRead stays null. Does not mutate the source report.
 * No grade/ScoreBoard/formula on VM.
 */

import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { projectDifferenceMap } from "./projectors/projectDifferenceMap";
import { projectHiddenDynamic } from "./projectors/projectHiddenDynamic";
import { projectConflictPattern } from "./projectors/projectConflictPattern";
import { projectDoDont } from "./projectors/projectDoDont";
import { projectNextStep } from "./projectors/projectNextStep";
import { projectOpening } from "./projectors/projectOpening";
import { projectRepairGuide } from "./projectors/projectRepairGuide";
import { projectRelationshipFlow } from "./projectors/projectRelationshipFlow";
import { projectRelationshipSnapshot } from "./projectors/projectRelationshipSnapshot";
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
  const conflictTranslation = projectConflictPattern({
    report,
    nameA,
    nameB,
    myName,
    partnerName,
    viewerIsReportA,
  });
  const conflictTexts = conflictTranslation.rows
    .flatMap((row) => [row.said, row.better])
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const repairGuide = projectRepairGuide({
    report,
    nameA,
    nameB,
    myName,
    partnerName,
    viewerIsReportA,
    locale,
  });
  const repairTexts = repairGuide.stages.flatMap((stage) =>
    [stage.body, stage.speakable].filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    ),
  );
  const doDontInput = {
    report,
    nameA,
    nameB,
    myName,
    partnerName,
    viewerIsReportA,
    forbiddenPhrases: conflictTexts,
    repairTexts,
  };
  const doDont = projectDoDont(doDontInput);
  const nextStep = projectNextStep({ doDont });

  return {
    meta: {
      viewerIsReportA,
      myName,
      partnerName,
      nameA,
      nameB,
      locale,
      accentToken: "#E2C4A8",
      buildId: "b6-v2-ch3-m1-m10",
    },
    opening: projectOpening({ report, myName, partnerName }),
    snapshot: projectRelationshipSnapshot({
      report,
      nameA,
      nameB,
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
    hiddenHeart: projectHiddenDynamic({
      report,
      myName,
      partnerName,
      viewerIsReportA,
    }),
    specialDynamics: projectWhatsSpecial({
      report,
      myName,
      partnerName,
      nameA,
      nameB,
      viewerIsReportA,
      locale,
    }),
    conflictTranslation,
    repairGuide,
    doDont,
    nextStep,
    deepRead: null,
    saveShare: null,
  };
}
