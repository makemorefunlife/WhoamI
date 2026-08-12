/**
 * buildRomanticExperienceViewModel — Experience V2 (feature-flag path).
 * Scope: M1..M10 + Horizon + Reflection/SaveShare. Daily Life suppressed.
 * deepRead stays null. Does not mutate the source report.
 * No grade/formula on VM. Sprint 5 restores event_scores gauges + the
 * shared 11-axis comparison via premiumOverview/axisComparison.
 */

import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { projectActionAdvice } from "./projectors/projectActionAdvice";
import { projectAxisComparison } from "./projectors/projectAxisComparison";
import { projectDifferenceMap } from "./projectors/projectDifferenceMap";
import { projectEssence } from "./projectors/projectEssence";
import { projectPremiumOverview } from "./projectors/projectPremiumOverview";
import { projectHiddenDynamic } from "./projectors/projectHiddenDynamic";
import { projectConflictPattern } from "./projectors/projectConflictPattern";
import { projectDoDont } from "./projectors/projectDoDont";
import { projectHorizon } from "./projectors/projectHorizon";
import { projectNextStep } from "./projectors/projectNextStep";
import { projectOpening } from "./projectors/projectOpening";
import { projectReflection } from "./projectors/projectReflection";
import { projectRepairGuide } from "./projectors/projectRepairGuide";
import { projectRelationshipFlow } from "./projectors/projectRelationshipFlow";
import { projectRelationshipSnapshot } from "./projectors/projectRelationshipSnapshot";
import { projectSaveShare } from "./projectors/projectSaveShare";
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
  const locale = typeof input.locale === "string" ? input.locale.trim() : "ko-KR";
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
  const opening = projectOpening({ report, myName, partnerName });
  const horizon = projectHorizon({ report });
  const reflection = projectReflection({ repairGuide, partnerName });
  const saveShare = projectSaveShare({
    opening,
    reflection,
    repairGuide,
    myName,
    partnerName,
  });
  const essence = projectEssence({ report, myName, partnerName, viewerIsReportA });
  const actionAdvice = projectActionAdvice({
    report,
    myName,
    partnerName,
    viewerIsReportA,
  });
  const premiumOverview = projectPremiumOverview({ report });
  const axisComparison = projectAxisComparison({ report, viewerIsReportA });

  return {
    meta: {
      viewerIsReportA,
      myName,
      partnerName,
      nameA,
      nameB,
      locale,
      accentToken: "#E2C4A8",
      buildId: "b7-v2-production",
    },
    premiumOverview,
    axisComparison,
    opening,
    essence,
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
    actionAdvice,
    nextStep,
    horizon,
    reflection,
    deepRead: null,
    saveShare,
  };
}
