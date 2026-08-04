/**
 * Assemble Canonical Romantic V4 report from live four-CE + fixture/report evidence.
 */
import { buildRomanticExperienceViewModel } from "../experience/buildRomanticExperienceViewModel";
import { buildActualFourCeContract, type RomanticV4PrecomputedSaju } from "./buildActualFourCeContract";
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
import type { RomanticV4PairSajuInput } from "./romanticV4SajuInput";
import type { RomanticV4SurveyInput } from "./romanticV4SurveyEvidence";

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
    /** mode "real" wires this report's Saju/CE to actual A/B birth data; omitted = dev-fixture demo pair. */
    pairSajuInput?: RomanticV4PairSajuInput;
    /** mode "real" wires balance/recovery/reassurance/role-play/comparison to actual survey profiles; omitted = no survey evidence. */
    surveyInput?: RomanticV4SurveyInput;
    /** Already-computed Saju bundle/master JSON for A/B — avoids recomputing calculateSajuBundle/mapSajuBundleToMasterJson when the caller (e.g. the production route) already has them. */
    precomputed?: RomanticV4PrecomputedSaju;
  },
): CanonicalRomanticV4Report {
  const actual = buildActualFourCeContract(
    locale,
    options?.pairSajuInput,
    options?.surveyInput,
    options?.precomputed,
  );
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
    nameA: actual.nameA,
    nameB: actual.nameB,
    myName: actual.nameA,
    partnerName: actual.nameB,
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
    names: { a: actual.nameA, b: actual.nameB },
    storyPlan,
    sections,
    expertSyntheses,
    validation,
    axisOverview: vm.axisComparison.axisResults,
    connectedFromExistingEngine: storyPlan.connectedEvidenceIds,
    hiddenChapters,
  };
}
