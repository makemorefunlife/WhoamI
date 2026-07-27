/**
 * Human-review rubric — fields only; no automated quality scores.
 */

export const RUBRIC_DIMENSIONS = [
  {
    id: "exact_pair_specificity",
    label: "Exact-pair specificity",
    question: "Does the prose clearly belong to THIS pair, not a generic duo?",
  },
  {
    id: "evidence_grounding",
    label: "Evidence grounding",
    question: "Are important claims traceable to supplied psych/saju/evidence?",
  },
  {
    id: "cross_signal_depth",
    label: "Cross-signal depth",
    question: "Does it combine psych axes and/or psych×saju meaningfully?",
  },
  {
    id: "unexpected_but_logical",
    label: "Unexpected but logical insight",
    question: "Any non-obvious synthesis that still follows from evidence?",
  },
  {
    id: "work_situation_realism",
    label: "Work-situation realism",
    question: "Meetings, handoffs, feedback, deadlines feel concrete?",
  },
  {
    id: "psychological_usefulness",
    label: "Psychological usefulness",
    question: "Would a colleague pair act differently after reading this?",
  },
  {
    id: "naturalness",
    label: "Naturalness",
    question: "Readable, non-templated voice?",
  },
  {
    id: "repetition",
    label: "Repetition (within section)",
    question: "Low = good. Same idea restated with synonyms?",
  },
  {
    id: "section_duplication",
    label: "Section duplication",
    question: "Low = good. Same core insight across multiple sections?",
  },
  {
    id: "canonical_consistency",
    label: "Canonical consistency",
    question: "Variant C: no A/B flip, band flip, or leadership reassignment?",
  },
  {
    id: "psych_consistency",
    label: "Psych consistency",
    question: "No claims opposite strong psych gaps/scores?",
  },
  {
    id: "saju_consistency",
    label: "Saju consistency",
    question: "No invented pillars/relations; tensions acknowledged?",
  },
  {
    id: "unsupported_certainty",
    label: "Unsupported certainty",
    question: "Low = good. Overconfident claims without evidence?",
  },
  {
    id: "how_did_it_know",
    label: "Overall “how did it know?” value",
    question: "Surprising specificity that feels earned?",
  },
] as const;

export type RubricScoreSheet = {
  pair_id: string;
  variant: "A" | "B" | "C";
  reviewer: string;
  scores: Record<
    (typeof RUBRIC_DIMENSIONS)[number]["id"],
    { score_1_to_5: number | null; notes: string }
  >;
  overall_notes: string;
};

export function emptyRubricScoreSheet(
  pair_id: string,
  variant: "A" | "B" | "C",
): RubricScoreSheet {
  const scores = Object.fromEntries(
    RUBRIC_DIMENSIONS.map((d) => [
      d.id,
      { score_1_to_5: null, notes: "" },
    ]),
  ) as RubricScoreSheet["scores"];
  return {
    pair_id,
    variant,
    reviewer: "",
    scores,
    overall_notes: "",
  };
}

export function rubricMarkdownTemplate(pair_id: string): string {
  const lines = [
    `# Rubric scoring sheet — ${pair_id}`,
    "",
    "Score each dimension 1–5 for variants A / B / C. Leave blank until human review.",
    "Do not invent automated scores.",
    "",
    "| Dimension | A | B | C | Notes |",
    "|---|---|---|---|---|",
  ];
  for (const d of RUBRIC_DIMENSIONS) {
    lines.push(`| ${d.label} |  |  |  |  |`);
  }
  lines.push("", "## Questions", "");
  for (const d of RUBRIC_DIMENSIONS) {
    lines.push(`- **${d.label}:** ${d.question}`);
  }
  lines.push("", "## Overall notes", "", "_Write freeform comparison here._", "");
  return lines.join("\n");
}
