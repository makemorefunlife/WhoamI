/**
 * Assemble Canonical Romantic V4 report from live four-CE + fixture/report evidence.
 */
import { buildRomanticExperienceViewModel } from "../experience/buildRomanticExperienceViewModel";
import { buildActualFourCeContract } from "./buildActualFourCeContract";
import type { RomanticSajuDeepReport } from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";
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
  // Consolidation Batch C: cross_chart_stem_combine/six_combine/wonjin_guimun (and
  // trio/gongmang/tension) are now computed directly in buildActualFourCeContract.ts
  // from chartA/chartB, so reportWithPair already carries them — no V1-routed
  // re-injection needed here anymore (previously sourced from actual.prepared.dynamicsTyped,
  // which came from V1's prepareRomanticSajuDeepRun; that call has been removed).
  // See buildActualFourCeContract.ts's CanonicalOnlyReport comment: the full
  // Report type declares several section_* fields as required (V1's LLM always
  // produced them); V4's canonical-only report deliberately omits them, and every
  // downstream consumer already reads them defensively as possibly-absent.
  const report = actual.reportWithPair as RomanticSajuDeepReport["report"];

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
    // dynamicsCrossHits was a fallback for when canonical_projections.cross_chart_*
    // was empty (previously sourced from V1's prepareRomanticSajuDeepRun). That call
    // is gone; canonical_projections is now populated directly from real chartA/chartB
    // computation in buildActualFourCeContract.ts, so this fallback is no longer needed.
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
