/**
 * Human checklists for pilot review packages (not automated pass/fail of prose).
 */
import type { WorkPilotBindingTruth } from "./types";
import type { DeterministicBaselineArtifact } from "./types";
import { WORK_NARRATIVE_SECTION_IDS } from "./types";

export function canonicalBindingChecklist(
  binding: WorkPilotBindingTruth | null,
  baseline: DeterministicBaselineArtifact,
): Record<string, unknown> {
  return {
    purpose:
      "Human checklist — verify Variant C narrative does not contradict these",
    ab_identity: binding?.ab_identity ?? {
      nickname_a: baseline.nickname_a,
      nickname_b: baseline.nickname_b,
    },
    comparison_table_bands:
      binding?.comparison_table ??
      baseline.canonical_projections.comparison_table ??
      {},
    leadership_split:
      binding?.leadership_split ??
      baseline.canonical_projections.leadership_split ??
      null,
    checks: [
      {
        id: "no_ab_reversal",
        prompt: "Nicknames/roles for A and B never swapped?",
        result: null,
      },
      {
        id: "compare_bands_intact",
        prompt: "No reclassification of comparison_table bands?",
        result: null,
      },
      {
        id: "leadership_intact",
        prompt: "external_lead / internal_qa_lead not reassigned?",
        result: null,
      },
      {
        id: "leadership_scope",
        prompt:
          "Leadership not equated with initiative / total authority / execution ownership?",
        result: null,
      },
      {
        id: "not_mere_paraphrase",
        prompt: "C adds synthesis beyond paraphrasing canonical fields?",
        result: null,
      },
    ],
  };
}

export function psychSajuContradictionChecklist(
  baseline: DeterministicBaselineArtifact,
): Record<string, unknown> {
  const axes = (baseline.psych_match as { axis_results?: unknown[] } | null)
    ?.axis_results;
  return {
    purpose: "Human checklist — flag contradictions with supplied evidence",
    psych_axis_count: Array.isArray(axes) ? axes.length : 0,
    checks: [
      {
        id: "psych_not_inverted",
        prompt: "Large psych gaps not described as similarity?",
        result: null,
      },
      {
        id: "saju_not_invented",
        prompt: "No pillars/relations/ten-gods beyond context?",
        result: null,
      },
      {
        id: "conflicts_acknowledged",
        prompt: "Conflicting signals explained as tension, not silently dropped?",
        result: null,
      },
      {
        id: "no_fate_language",
        prompt: "No guaranteed fate / destiny claims?",
        result: null,
      },
    ],
  };
}

export function duplicationChecklist(): Record<string, unknown> {
  return {
    purpose: "Human checklist — section ownership",
    sections: [...WORK_NARRATIVE_SECTION_IDS],
    checks: [
      {
        id: "unique_question_per_section",
        prompt: "Each section answers a distinct question?",
        result: null,
      },
      {
        id: "no_cross_section_repeat",
        prompt: "Same core insight not restated across sections?",
        result: null,
      },
      {
        id: "prescriptions_no_new_personality",
        prompt: "practical_prescriptions avoids new personality claims?",
        result: null,
      },
      {
        id: "styles_no_leadership_restatement",
        prompt: "individual_work_styles does not restate leadership_split?",
        result: null,
      },
    ],
  };
}
