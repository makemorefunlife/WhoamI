/**
 * Prompt contract — Batch IV markers (synthesis + package gates).
 * Run: npx tsx tests/scripts/work-narrative-pilot/prompt-contract.test.mjs
 */
import assert from "node:assert/strict";
import {
  buildVariantCSystemPrompt,
  buildVariantUserPrompt,
  PROMPT_CONTRACT_MARKERS,
} from "./prompts.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

const sys = buildVariantCSystemPrompt("ko-KR");
for (const [key, marker] of Object.entries(PROMPT_CONTRACT_MARKERS)) {
  assert.ok(sys.includes(marker), `missing [${key}]: ${marker}`);
  ok(`marker:${key}`);
}

const fakePkg = {
  schema_version: "work_narrative_pilot_context_v2",
  pair_id: "conflict-heavy-01",
  category: "conflict_heavy",
  locale: "ko-KR",
  variant: "C",
  binding_truth: {
    ab_identity: {
      person_a_key: "A",
      person_b_key: "B",
      nickname_a: "River",
      nickname_b: "Sky",
    },
    comparison_table: {},
    leadership_split: {
      external_lead: "a",
      internal_qa_lead: "b",
      confidence: "low",
      align: "caution",
    },
    leadership_scope_note: "test",
  },
  evidence_sources: {
    grade: "C",
    scores: { activation: 55, benefit: 70, risk: 10 },
    scoring_signals: { hasStemClashOrOvercome: true },
    ten_god_complement: {
      person_a: { strong: [], lacking: [] },
      person_b: { strong: [], lacking: [] },
      complements: [],
    },
    work_signals_a: null,
    work_signals_b: null,
    communication_signals: {
      a: { reporting_preference: "headline_first", confidence: "medium" },
      b: { reporting_preference: "headline_first", confidence: "medium" },
      contrast_supported: false,
      contrast_means: null,
      stock_fast_vs_detail_allowed: false,
      note: "similar",
    },
    dna_signals: {
      a: {
        contribution_style: "outcome_gain",
        drive_band: "high",
        stubborn_band: "stubborn",
        supporting_axes: [],
      },
      b: {
        contribution_style: "outcome_gain",
        drive_band: "high",
        stubborn_band: "stubborn",
        supporting_axes: [],
      },
    },
    structured_evidence: [],
  },
  psych_context: {
    axes: [],
    meaningful_gaps: [],
    conflict_triggers: [],
    pair_patterns: [
      {
        axis_key: "recognition",
        pattern: "similar_high",
        score_a: 80,
        score_b: 78,
        gap: 2,
        match_type: "complementary",
        priority: "high",
        source_family: "psych",
        supports_contrast: false,
        supports_similarity: true,
        narrative_relevance: "same_drive_clash",
      },
    ],
  },
  saju_context: {
    strength_a: { label: "", note: "" },
    strength_b: { label: "", note: "" },
    metaphor_a: "",
    metaphor_b: "",
    ten_gods_a: {},
    ten_gods_b: {},
    month_branch_summary: null,
    pairwise_hit_briefs: [],
  },
  evidence_relationships: [
    {
      sources: ["psych_both_high"],
      relationship: "convergent",
      interpretation_prompt: "same-drive clash",
    },
  ],
  narrative_routing: {
    identity: {
      use_exact_nicknames: true,
      nickname_a: "River",
      nickname_b: "Sky",
      do_not_translate_or_localize_nicknames: true,
    },
    leadership_split: {
      home_section: "decision_and_execution_dynamics",
      forbidden_sections: ["pair_snapshot"],
      provisional: true,
    },
  },
  ambiguities: ["contrast_supported=false"],
  semantic_boundaries: [],
  reference_copy: {
    allowed_for_fact_check: true,
    allowed_as_narrative_source: false,
    items: [{ key: "communication_fit", text: "한쪽은 빠른 결론" }],
  },
};

const user = buildVariantUserPrompt(fakePkg);
assert.ok(user.includes("contrast_supported=false"));
assert.ok(user.includes("reference_copy.allowed_as_narrative_source=false"));
assert.ok(user.includes("pair_patterns both-high"));
assert.ok(user.includes('"[withheld]"') || user.includes("[withheld]"));
assert.ok(
  !user.includes("한쪽은 빠른 결론"),
  "reference_copy prose must be withheld from LLM payload",
);
assert.ok(user.includes("items_withheld"));
assert.ok(user.includes("stock_fast_vs_detail_allowed=false"));
assert.ok(user.includes("exact nicknames"));
assert.ok(user.includes("leadership home="));
assert.ok(user.includes("recognition LOUD"));
assert.ok(user.includes("Do not invent opposite traits"));
ok("preflight reads package v2 gates; reference_copy text withheld");

console.log("\nAll prompt-contract checks passed.");
