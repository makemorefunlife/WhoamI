/**
 * Assemble Canonical Romantic V4 report from live four-CE + fixture/report evidence.
 */
import { buildRomanticExperienceViewModel } from "../experience/buildRomanticExperienceViewModel";
import { buildActualFourCeContract } from "./buildActualFourCeContract";
import { buildCanonicalRelationshipStoryPlan } from "./buildCanonicalRelationshipStoryPlan";
import {
  composeCanonicalSectionNarratives,
  type CanonicalSection,
} from "./composeCanonicalSectionNarratives";
import {
  validateCanonicalRomanticReport,
  type CanonicalValidationIssue,
} from "./validateCanonicalRomanticReport";
import type { CanonicalRelationshipStoryPlan } from "./canonicalStoryPlanTypes";
import {
  stemCombineValueFromDynamicsSnapshot,
  injectRomanticStemCombineClientProjection,
} from "../romanticStemCombineCanonical";
import {
  sixCombineValueFromDynamicsSnapshot,
  injectRomanticSixCombineClientProjection,
} from "../romanticSixCombineCanonical";
import {
  wonjinGuimunValueFromDynamicsSnapshot,
  injectRomanticWonjinGuimunClientProjection,
} from "../romanticWonjinGuimunCanonical";

import {
  generateExpertSynthesesForStoryPlan,
} from "./buildExpertSynthesis";
import type { ExpertSynthesisResult } from "./expertSynthesisTypes";

export type CanonicalRomanticV4Report = {
  schemaVersion: "romantic_canonical_report_v1";
  locale: "ko-KR" | "en-US";
  names: { a: string; b: string };
  storyPlan: CanonicalRelationshipStoryPlan;
  sections: CanonicalSection[];
  expertSyntheses?: Record<string, ExpertSynthesisResult>;
  validation: { ok: boolean; issues: CanonicalValidationIssue[] };
  axisOverview: ReturnType<
    typeof buildRomanticExperienceViewModel
  >["axisComparison"]["axisResults"];
  connectedFromExistingEngine: string[];
  hiddenChapters: Array<{ chapterId: string; reason: string }>;
};

export function buildCanonicalRomanticV4Report(
  locale: "ko-KR" | "en-US" = "ko-KR",
  reportYear?: number,
  options?: {
    enableExpertSynthesis?: boolean;
    customSyntheses?: Record<string, ExpertSynthesisResult | null | undefined>;
  },
): CanonicalRomanticV4Report {
  const actual = buildActualFourCeContract(locale);
  let report = actual.reportWithPair;

  // CONNECT previously unused cross-chart projections into report when dynamics exist
  const dynamics = actual.prepared.dynamicsTyped ?? null;
  if (dynamics) {
    const stem = stemCombineValueFromDynamicsSnapshot(dynamics);
    const six = sixCombineValueFromDynamicsSnapshot(dynamics);
    const won = wonjinGuimunValueFromDynamicsSnapshot(dynamics);
    report = injectRomanticStemCombineClientProjection(report, stem);
    report = injectRomanticSixCombineClientProjection(report, six);
    report = injectRomanticWonjinGuimunClientProjection(report, won);
  }

  const vm = buildRomanticExperienceViewModel({
    report,
    nameA: "지민",
    nameB: "정우",
    myName: "지민",
    partnerName: "정우",
    viewerIsReportA: true,
    locale,
  });

  const storyPlan = buildCanonicalRelationshipStoryPlan({
    contract: actual.contract,
    report,
    axisResults: vm.axisComparison.axisResults,
    locale,
    reportYear,
    dynamicsCrossHits: dynamics?.crossChartHits,
  });

  const expertSyntheses = options?.enableExpertSynthesis !== false
    ? generateExpertSynthesesForStoryPlan(storyPlan, options?.customSyntheses)
    : undefined;

  const sections = composeCanonicalSectionNarratives(storyPlan, expertSyntheses);
  const validation = validateCanonicalRomanticReport({ plan: storyPlan, sections });

  const hiddenChapters = sections
    .filter((s) => !s.visible)
    .map((s) => ({
      chapterId: s.chapterId,
      reason: s.hideReason ?? "evidence insufficient",
    }));

  return {
    schemaVersion: "romantic_canonical_report_v1",
    locale,
    names: { a: "지민", b: "정우" },
    storyPlan,
    sections,
    expertSyntheses,
    validation,
    axisOverview: vm.axisComparison.axisResults,
    connectedFromExistingEngine: storyPlan.connectedEvidenceIds,
    hiddenChapters,
  };
}
