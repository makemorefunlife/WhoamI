/**
 * Romantic V4 — applies the Final Narrative Architecture (Evidence-Grounded
 * Narrative Editor + Expert Saju Discovery, exactly 2 LLM calls) as a
 * post-processing pass over an already-built, fully deterministic
 * RomanticV4PrototypePayload. Same shape as romanticV4HourEvidence.ts's
 * applyHourEvidenceCapToComparisonTable: takes a finished payload, returns
 * a new one, never touches buildRomanticV4PrototypePayload.ts itself.
 *
 * Non-blocking by construction: buildRomanticFinalNarrativeArchitectureSafe
 * never throws, so on any LLM failure (or when disabled) this returns the
 * input payload's canonicalReport sections completely untouched — the
 * deterministic report never depends on this succeeding.
 */
import type OpenAI from "openai";
import { buildActualFourCeContract, type RomanticV4PrecomputedSaju } from "../buildActualFourCeContract";
import { buildRomanticFinalNarrativeArchitectureSafe } from "../romanticFinalNarrativeArchitecture";
import { validateCanonicalRomanticReport } from "../validateCanonicalRomanticReport";
import type { RomanticV4PairSajuInput } from "../romanticV4SajuInput";
import type { RomanticV4SurveyInput } from "../romanticV4SurveyEvidence";
import type { RomanticV4PrototypePayload } from "../types";

export async function applyRomanticV4FinalNarrativeArchitecture(
  payload: RomanticV4PrototypePayload,
  params: {
    openai: OpenAI;
    locale: "ko-KR" | "en-US";
    pairSajuInput?: RomanticV4PairSajuInput;
    surveyInput?: RomanticV4SurveyInput;
    precomputed?: RomanticV4PrecomputedSaju;
    abortSignal?: AbortSignal;
  },
): Promise<RomanticV4PrototypePayload> {
  const { openai, locale, pairSajuInput, surveyInput, precomputed, abortSignal } = params;
  const canonicalReport = payload.canonicalReport;
  if (!canonicalReport) return payload;

  // Same double-compute precedent already established by
  // buildCanonicalRomanticV4ReportWithExpertIntelligence — chartA/chartB
  // (IndividualSajuChart) aren't carried on CanonicalRomanticV4Report, so
  // this is the cheapest way to get them without changing that type's
  // shape or buildRomanticV4PrototypePayload.ts's return contract.
  const actual = buildActualFourCeContract(locale, pairSajuInput, surveyInput, precomputed);

  const result = await buildRomanticFinalNarrativeArchitectureSafe({
    openai,
    sections: canonicalReport.sections,
    storyPlan: canonicalReport.storyPlan,
    chartA: actual.individualCeA,
    chartB: actual.individualCeB,
    axisResults: canonicalReport.axisOverview,
    names: canonicalReport.names,
    locale,
    abortSignal,
  });

  const finalValidation = validateCanonicalRomanticReport({ plan: canonicalReport.storyPlan, sections: result.sections });
  const finalHiddenChapters = result.sections
    .filter((s) => !s.visible)
    .map((s) => ({ chapterId: s.chapterId, reason: s.hideReason ?? "evidence insufficient" }));

  return {
    ...payload,
    canonicalReport: {
      ...canonicalReport,
      sections: result.sections,
      validation: finalValidation,
      hiddenChapters: finalHiddenChapters,
      expertFindings: result.expertFindings,
      // Mode A no longer runs in this architecture (see romanticFinalNarrativeArchitecture.ts
      // header) — modeACount: 0 is the honest value, not a placeholder.
      expertIntelligenceMeta: {
        model: result.meta.model,
        callCount: result.meta.callCount,
        modeACount: 0,
        modeBCount: result.meta.discovery.totalFindingsReturned,
        totalFindingsReturned: result.meta.discovery.totalFindingsReturned,
        totalFindingsRenderEligible: result.meta.discovery.totalFindingsRenderEligible,
        failed: result.meta.discovery.failed,
        failureReason: result.meta.discovery.failureReason,
      },
      narrativeEditorResult: {
        edits: result.narrativeEdits,
        meta: {
          model: result.meta.model,
          callCount: result.meta.callCount,
          totalProposed: result.meta.narrativeEditor.proposed,
          totalApplied: result.meta.narrativeEditor.applied,
          totalRejected: result.meta.narrativeEditor.rejected,
          recognitionLinesKept: result.meta.narrativeEditor.recognitionLinesKept,
          recognitionLinesDropped: result.narrativeEdits.filter((e) => !e.rejected && !e.recognitionLine).length,
          failed: result.meta.narrativeEditor.failed,
          failureReason: result.meta.narrativeEditor.failureReason,
        },
      },
    },
  };
}
