/**
 * Romantic VNext — Final Narrative Architecture. Exactly 2 LLM calls/report:
 *
 *   Call 1: Evidence-Grounded Narrative Editor (romanticNarrativeEditor.ts)
 *           — rewrites deterministic/Cross-Signal chapter prose in place.
 *   Call 2: Expert Saju Discovery ("Mode B", romanticExpertIntelligence.ts)
 *           — raw-chart findings the deterministic engines don't cover.
 *
 * This supersedes the old buildRomanticExpertIntelligence's role in
 * production. That function (Mode A evidence_synthesis + Mode B, 2 calls)
 * is left completely untouched in romanticExpertIntelligence.ts — its own
 * test suite still exercises it — but nothing in this file calls Mode A's
 * prompt/validation path, and nothing wires the old function into
 * production anymore (see buildCanonicalRomanticV4Report.ts's
 * buildCanonicalRomanticV4ReportWithFinalNarrativeArchitecture). Mode B's
 * dedup input previously came from Mode A's findings; here it comes from
 * the deterministic Cross-Signal corpus plus this pass's own Narrative
 * Editor output, so Mode B needs no Mode-A-shaped input at all.
 *
 * Scope decision: Mode B findings are validated and returned for
 * inspection/future use (same as romanticRecognitionSynthesis.ts's
 * computed-but-not-yet-rendered precedent) but are NOT spliced into
 * `sections` in this pass — only Narrative Editor edits touch rendered
 * chapter text. Retrofitting the old Tier A/B/C consumption splicing
 * (designed around Mode A's findings shape) to safely coexist with
 * Narrative Editor's in-place block replacement is a real design problem
 * (write-order conflicts: Tier A recomposes `sections` from scratch, Tier B
 * appends to a block body, both of which would race with/undo the Narrative
 * Editor's replacement of that same block) — out of scope for this pass.
 */
import type OpenAI from "openai";
import { fetchLlmJsonWithParseRetry } from "../../parseLlmJson";
import { callExpertLlmJson, expertLlmModel, validateExpertFindings } from "./romanticExpertIntelligence";
import { buildSajuDiscoveryPrompt, buildNarrativeEditorPrompt } from "./romanticExpertIntelligencePrompt";
import { extractNarrativeEditablePackets, validateNarrativeEdits, applyNarrativeEdits } from "./romanticNarrativeEditor";
import type { CanonicalSection } from "./composeCanonicalSectionNarratives";
import type { CanonicalRelationshipStoryPlan } from "./canonicalStoryPlanTypes";
import type { IndividualSajuChart } from "../../../personCore/individualSaju/types";
import type { RomanticPsychMatchAxisResult } from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import type { RomanticExpertFinding, RomanticExpertFindingRaw } from "./romanticExpertIntelligenceTypes";
import type { RomanticNarrativeEdit, RomanticNarrativeEditRaw } from "./romanticNarrativeEditorTypes";

export type RomanticFinalNarrativeArchitectureMeta = {
  model: string;
  /** Real number of LLM calls actually made this run — 0, 1, or 2 depending
   * on whether there were packets to edit and whether each step failed
   * before or after its call. Never 3. */
  callCount: number;
  narrativeEditor: {
    proposed: number;
    applied: number;
    rejected: number;
    recognitionLinesKept: number;
    failed: boolean;
    failureReason?: string;
  };
  discovery: {
    totalFindingsReturned: number;
    totalFindingsRenderEligible: number;
    failed: boolean;
    failureReason?: string;
  };
  /** True if either step failed — sections still reflects whatever
   * succeeded (partial success is preserved, not discarded). */
  failed: boolean;
  failureReason?: string;
};

export type RomanticFinalNarrativeArchitectureResult = {
  sections: CanonicalSection[];
  narrativeEdits: RomanticNarrativeEdit[];
  /** Mode B only — validated, not yet spliced into `sections` (see file
   * header). Present for inspection and future consumption-policy wiring. */
  expertFindings: RomanticExpertFinding[];
  meta: RomanticFinalNarrativeArchitectureMeta;
};

export async function buildRomanticFinalNarrativeArchitecture(params: {
  openai: OpenAI;
  sections: CanonicalSection[];
  storyPlan: CanonicalRelationshipStoryPlan;
  chartA: IndividualSajuChart;
  chartB: IndividualSajuChart;
  axisResults: RomanticPsychMatchAxisResult[];
  names: { a: string; b: string };
  locale: "ko-KR" | "en-US";
  abortSignal?: AbortSignal;
}): Promise<RomanticFinalNarrativeArchitectureResult> {
  const { openai, sections, storyPlan, chartA, chartB, axisResults, names, locale, abortSignal } = params;
  const model = expertLlmModel();
  let callCount = 0;

  // ── Call 1: Narrative Editor ─────────────────────────────────────────
  let narrativeEdits: RomanticNarrativeEdit[] = [];
  let neFailed = false;
  let neFailureReason: string | undefined;

  const packets = extractNarrativeEditablePackets(sections);
  if (packets.length > 0) {
    try {
      const { system, user } = buildNarrativeEditorPrompt({ packets, names, locale });
      callCount++;
      const raw = await fetchLlmJsonWithParseRetry<{ edits?: RomanticNarrativeEditRaw[] }>(
        () => callExpertLlmJson(openai, system, user, abortSignal),
        { label: "romantic-final-narrative-editor" },
      );
      narrativeEdits = validateNarrativeEdits(Array.isArray(raw.edits) ? raw.edits : [], { packets, names });
    } catch (err) {
      neFailed = true;
      neFailureReason = err instanceof Error ? err.message : String(err);
    }
  }

  const appliedEdits = narrativeEdits.filter((e) => !e.rejected);
  const finalSections = applyNarrativeEdits(sections, narrativeEdits);

  // ── Call 2: Expert Saju Discovery (Mode B) ───────────────────────────
  // Dedup corpus per spec: deterministic report corpus + Cross-Signal
  // findings (crossSignalTexts already carries both — crossSignalInsightsV1
  // is derived from the deterministic engines) + this pass's own Narrative
  // Editor output, in place of the old Mode A findings.
  const crossSignalTexts = (storyPlan.crossSignalInsightsV1 ?? []).map((i) => i.derivedMeaning);
  const narrativeEditorTexts = appliedEdits.flatMap((e) => [e.supportedMeaning, e.recognitionLine].filter((s): s is string => Boolean(s)));
  const dedupCorpus = [...crossSignalTexts, ...narrativeEditorTexts];
  const axisKeys = new Set(axisResults.map((r) => r.axis_key));

  let discoveryFindings: RomanticExpertFinding[] = [];
  let discoveryFailed = false;
  let discoveryFailureReason: string | undefined;

  try {
    const { system, user } = buildSajuDiscoveryPrompt({
      chartA,
      chartB,
      existingFindingsSummary: dedupCorpus,
      axisResults,
      names,
      locale,
    });
    callCount++;
    const raw = await fetchLlmJsonWithParseRetry<{ findings?: RomanticExpertFindingRaw[] }>(
      () => callExpertLlmJson(openai, system, user, abortSignal),
      { label: "romantic-final-discovery" },
    );
    discoveryFindings = validateExpertFindings(Array.isArray(raw.findings) ? raw.findings : [], {
      mode: "saju_discovery",
      existingTexts: dedupCorpus,
      axisKeys,
    });
  } catch (err) {
    discoveryFailed = true;
    discoveryFailureReason = err instanceof Error ? err.message : String(err);
  }

  const failed = neFailed || discoveryFailed;
  const failureReason = [neFailureReason, discoveryFailureReason].filter(Boolean).join("; ") || undefined;

  return {
    sections: finalSections,
    narrativeEdits,
    expertFindings: discoveryFindings,
    meta: {
      model,
      callCount,
      narrativeEditor: {
        proposed: narrativeEdits.length,
        applied: appliedEdits.length,
        rejected: narrativeEdits.length - appliedEdits.length,
        recognitionLinesKept: appliedEdits.filter((e) => e.recognitionLine).length,
        failed: neFailed,
        failureReason: neFailureReason,
      },
      discovery: {
        totalFindingsReturned: discoveryFindings.length,
        totalFindingsRenderEligible: discoveryFindings.filter((f) => f.renderEligible).length,
        failed: discoveryFailed,
        failureReason: discoveryFailureReason,
      },
      failed,
      failureReason,
    },
  };
}

/** Never-throwing entry point — the only one production code should call.
 * On total failure, sections falls back to the untouched deterministic
 * input (report generation never depends on this succeeding). */
export async function buildRomanticFinalNarrativeArchitectureSafe(
  params: Parameters<typeof buildRomanticFinalNarrativeArchitecture>[0],
): Promise<RomanticFinalNarrativeArchitectureResult> {
  try {
    return await buildRomanticFinalNarrativeArchitecture(params);
  } catch (err) {
    const model = expertLlmModel();
    const failureReason = `unexpected_error: ${err instanceof Error ? err.message : String(err)}`;
    return {
      sections: params.sections,
      narrativeEdits: [],
      expertFindings: [],
      meta: {
        model,
        callCount: 0,
        narrativeEditor: { proposed: 0, applied: 0, rejected: 0, recognitionLinesKept: 0, failed: true, failureReason },
        discovery: { totalFindingsReturned: 0, totalFindingsRenderEligible: 0, failed: true, failureReason },
        failed: true,
        failureReason,
      },
    };
  }
}
