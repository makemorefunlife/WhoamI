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
import { buildRomanticOverviewSnapshot } from "./buildRomanticOverviewSnapshot";
import type { OverviewCardData } from "../../../relationship/shared/overview/overviewTypes";
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
import type { RomanticExpertFinding, RomanticExpertIntelligenceMeta } from "./romanticExpertIntelligenceTypes";
import type { ExpertConsumptionMeta } from "./romanticExpertConsumptionPolicy";
import type { RomanticNarrativeEditorResult } from "./romanticNarrativeEditorTypes";

export type CanonicalRomanticV4Report = {
  schemaVersion: "romantic_canonical_report_v1";
  locale: "ko-KR" | "en-US";
  names: { a: string; b: string };
  storyPlan: CanonicalRelationshipStoryPlan;
  sections: CanonicalSection[];
  expertSyntheses?: Record<string, ExpertSynthesisResult>;
  /** Phase 4A — LLM-derived, structurally separate trust tier from everything
   * else on this type. Not consumed by composeCanonicalSectionNarratives.ts —
   * see buildCanonicalRomanticV4ReportWithExpertIntelligence for how this
   * gets attached. Absent entirely unless that async wrapper was used. */
  expertFindings?: RomanticExpertFinding[];
  expertIntelligenceMeta?: RomanticExpertIntelligenceMeta;
  /** Phase 4B — audit trail for which findings became user-visible and why.
   * Present only when the async wrapper's consumption step ran. */
  expertConsumptionMeta?: ExpertConsumptionMeta;
  /** Evidence-Grounded Narrative Editor — audit trail (edits + meta), present
   * only when buildCanonicalRomanticV4ReportWithNarrativeEditor ran. sections
   * already reflects any applied edits by the time this is populated. */
  narrativeEditorResult?: RomanticNarrativeEditorResult;
  validation: { ok: boolean; issues: CanonicalValidationIssue[] };
  axisOverview: ReturnType<
    typeof buildRomanticExperienceViewModel
  >["axisComparison"]["axisResults"];
  overviewCards: OverviewCardData[];
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

  const overviewCards = buildRomanticOverviewSnapshot({
    pairSajuAnalysis: actual.pairSajuAnalysis,
    locale: locale === "en-US" ? "en" : "ko",
  });

  const storyPlan = buildCanonicalRelationshipStoryPlan({
    contract: actual.contract,
    report,
    axisResults: vm.axisComparison.axisResults,
    locale,
    reportYear,
    fortuneFlow: actual.fortuneFlow,
    surveyInput: options?.surveyInput,
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
    overviewCards,
    connectedFromExistingEngine: storyPlan.connectedEvidenceIds,
    hiddenChapters,
  };
}

/**
 * Phase 4A — additive async wrapper. Builds the exact same deterministic
 * report as buildCanonicalRomanticV4Report (unchanged, still synchronous,
 * still the function every existing caller keeps using), then — only if
 * `openai` + `enableExpertIntelligence` are supplied — separately awaits the
 * Expert Intelligence layer and attaches its output.
 *
 * Deliberately NOT wired into composeCanonicalSectionNarratives.ts or any
 * chapter render path in this phase (spec §13) — expertFindings/
 * expertIntelligenceMeta exist on the returned object for inspection/testing
 * only. If the expert call fails for any reason, buildRomanticExpertIntelligenceSafe
 * already guarantees a non-throwing empty result, so this function's own
 * return value is always the same shape whether or not the expert step
 * succeeded — see romanticExpertIntelligence.ts's failure-mode contract.
 */
export async function buildCanonicalRomanticV4ReportWithExpertIntelligence(
  locale: "ko-KR" | "en-US" = "ko-KR",
  reportYear?: number,
  options?: Parameters<typeof buildCanonicalRomanticV4Report>[2] & {
    openai?: import("openai").default;
    enableExpertIntelligence?: boolean;
    expertAbortSignal?: AbortSignal;
  },
): Promise<CanonicalRomanticV4Report> {
  const base = buildCanonicalRomanticV4Report(locale, reportYear, options);

  if (!options?.enableExpertIntelligence || !options?.openai) {
    return base;
  }

  const actual = buildActualFourCeContract(
    locale,
    options?.pairSajuInput,
    options?.surveyInput,
    options?.precomputed,
  );

  const { buildRomanticExpertIntelligenceSafe } = await import("./romanticExpertIntelligence");
  const result = await buildRomanticExpertIntelligenceSafe({
    openai: options.openai,
    storyPlan: base.storyPlan,
    chartA: actual.individualCeA,
    chartB: actual.individualCeB,
    axisResults: base.axisOverview,
    names: base.names,
    locale,
    abortSignal: options.expertAbortSignal,
  });

  // Phase 4B — decide which (if any) findings are safe/valuable enough to
  // become user-visible, and re-compose sections with them spliced in.
  // If the LLM step failed above, result.findings is already [] (guaranteed
  // by buildRomanticExpertIntelligenceSafe's non-throwing contract), so
  // selection is empty and finalSections is byte-identical to base.sections.
  const { selectUserVisibleExpertBlocks, applyTierBEnrichment } = await import("./romanticExpertConsumptionPolicy");
  const selection = selectUserVisibleExpertBlocks(result.findings, base.storyPlan, base.sections, locale);

  const sectionsWithTierA = composeCanonicalSectionNarratives(base.storyPlan, base.expertSyntheses, selection.blocksByChapter);
  // Phase 5B Part 3 — Tier B enrichment is a separate post-processing pass
  // over the already-composed sections (it needs real block bodies/evidenceIds
  // to match against, which only exist after composition), not another
  // composeCanonicalSectionNarratives param. Matched findings' claims are
  // appended to their target block's body; unmatched ones are already
  // correctly excluded (targetBlockId===null) and this is a no-op for them.
  const finalSections = applyTierBEnrichment(sectionsWithTierA, selection.meta.tierBTargetMappings, locale);
  const finalValidation = validateCanonicalRomanticReport({ plan: base.storyPlan, sections: finalSections });
  const finalHiddenChapters = finalSections
    .filter((s) => !s.visible)
    .map((s) => ({
      chapterId: s.chapterId,
      reason: s.hideReason ?? "evidence insufficient",
    }));

  return {
    ...base,
    sections: finalSections,
    validation: finalValidation,
    hiddenChapters: finalHiddenChapters,
    expertFindings: result.findings,
    expertIntelligenceMeta: result.meta,
    expertConsumptionMeta: selection.meta,
  };
}

/**
 * Evidence-Grounded Narrative Editor — additive async wrapper, same shape
 * as buildCanonicalRomanticV4ReportWithExpertIntelligence above: builds the
 * exact same deterministic report first, then — only if `openai` +
 * `enableNarrativeEditor` are supplied — separately awaits the editor and
 * splices in only the edits that survive validateNarrativeEdits. Independent
 * of the Expert Intelligence wrapper (does not call Mode A/B) — see the
 * architecture-decision note in romanticNarrativeEditorTypes.ts for why this
 * is a separate optional call rather than a literal in-place repurposing of
 * Mode A's slot inside buildRomanticExpertIntelligence.
 */
export async function buildCanonicalRomanticV4ReportWithNarrativeEditor(
  locale: "ko-KR" | "en-US" = "ko-KR",
  reportYear?: number,
  options?: Parameters<typeof buildCanonicalRomanticV4Report>[2] & {
    openai?: import("openai").default;
    enableNarrativeEditor?: boolean;
    narrativeEditorAbortSignal?: AbortSignal;
  },
): Promise<CanonicalRomanticV4Report> {
  const base = buildCanonicalRomanticV4Report(locale, reportYear, options);

  if (!options?.enableNarrativeEditor || !options?.openai) {
    return base;
  }

  const { extractNarrativeEditablePackets, buildRomanticNarrativeEditorSafe, applyNarrativeEdits } = await import(
    "./romanticNarrativeEditor"
  );

  const packets = extractNarrativeEditablePackets(base.sections);
  const result = await buildRomanticNarrativeEditorSafe({
    openai: options.openai,
    packets,
    names: base.names,
    locale,
    abortSignal: options.narrativeEditorAbortSignal,
  });

  const finalSections = applyNarrativeEdits(base.sections, result.edits);
  const finalValidation = validateCanonicalRomanticReport({ plan: base.storyPlan, sections: finalSections });
  const finalHiddenChapters = finalSections
    .filter((s) => !s.visible)
    .map((s) => ({
      chapterId: s.chapterId,
      reason: s.hideReason ?? "evidence insufficient",
    }));

  return {
    ...base,
    sections: finalSections,
    validation: finalValidation,
    hiddenChapters: finalHiddenChapters,
    narrativeEditorResult: result,
  };
}
