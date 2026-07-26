/**
 * Minimal / partial romantic report fixtures for B1 VM skeleton tests.
 * Not production data.
 */

/** Empty-ish object accepted as report for null-safe skeleton builds. */
export function makeMinimalRomanticReport(overrides = {}) {
  return {
    section_1_summary: {
      relationship_name: "Test Bond",
      one_line_summary: "A short line",
      grade: "A+",
      total_score: 99,
      keywords: ["should-not-appear-on-vm"],
    },
    section_2_nature: {
      a_nature: {
        description: "A desc",
        meeting_b: "meets B",
        together_change: "changes",
      },
      b_nature: {
        description: "B desc",
        meeting_a: "meets A",
        together_change: "changes",
      },
    },
    section_3_conversation_patterns: {},
    section_4_hidden_hearts: {},
    section_5_action: {},
    section_6_timeline: {},
    section_4_special_bond: {
      only_together: "together",
      relationship_formula: "A + B = destiny",
      why_special: "special",
    },
    meta: {
      event_scores: { activation: 80, benefit: 70, risk: 20 },
    },
    ...overrides,
  };
}

/** Partial report missing most sections — builder must not throw. */
export function makePartialRomanticReport() {
  return {
    section_1_summary: {
      relationship_name: "",
      one_line_summary: "",
      grade: "C",
    },
    section_2_nature: {
      a_nature: {
        description: "x",
        meeting_b: "",
        together_change: "",
      },
      b_nature: {
        description: "y",
        meeting_a: "",
        together_change: "",
      },
    },
    section_3_conversation_patterns: {},
    section_4_hidden_hearts: {},
    section_5_action: {},
    section_6_timeline: {},
  };
}
