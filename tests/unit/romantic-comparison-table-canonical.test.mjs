/**
 * Phase 6-2d7 — Romantic comparison_table ×6 canonical.
 * Run: npx tsx tests/unit/romantic-comparison-table-canonical.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildRomanticComparisonTableCanonical,
  buildRomanticComparisonTableClientProjection,
  injectRomanticComparisonTableClientProjection,
  comparisonTableValueFromDominantCategories,
  comparisonTableJudgmentFields,
  readRomanticComparisonTableCanonicalProjection,
  formatRomanticCompareLeanLabel,
  romanticComparisonRowKeyForAspect,
  romanticCompareLeanForViewerColumn,
  ROMANTIC_COMPARISON_ASPECT_TO_ROW,
  ROMANTIC_COMPARISON_TABLE_CLIENT_PATH,
} from "../../lib/relationship/romantic/romanticComparisonTableCanonical.ts";
import { refineCompareConflictPair } from "../../lib/relationship/romantic/compareConflictComposite.ts";
import { refineCompareAffectionPair } from "../../lib/relationship/romantic/compareAffectionComposite.ts";
import { refineCompareStressPair } from "../../lib/relationship/romantic/compareStressComposite.ts";
import { refineCompareExpressionPair } from "../../lib/relationship/romantic/compareExpressionComposite.ts";
import { refineCompareDecisionPair } from "../../lib/relationship/romantic/compareDecisionComposite.ts";
import { refineCompareCommunicationPair } from "../../lib/relationship/romantic/compareCommunicationComposite.ts";
import {
  omitRomanticContextInputFromReport,
  stripRomanticContextInputForClient,
} from "../../lib/relationship/romantic/stripRomanticContextInputForClient.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function sampleProfile(overrides = {}) {
  const keys = [
    "stimulation",
    "self_control",
    "practicality",
    "structure",
    "empathy",
    "conflict_style",
    "resilience",
    "recognition",
    "energy_style",
    "thinking_style",
    "decision_style",
  ];
  const secondary_axes = Object.fromEntries(keys.map((k) => [k, 50]));
  Object.assign(secondary_axes, overrides);
  return {
    profile_type: "current_self",
    primary_axes: {
      autonomy: 50,
      connection: 50,
      stability: 50,
      growth: 50,
      structure: 50,
      adaptability: 50,
    },
    secondary_axes,
    personalization: { primary_concern: null },
    meta: {
      survey_version: "v2",
      completed_at: "2026-01-01T00:00:00.000Z",
      completion_time_seconds: null,
    },
  };
}

const fullCats = {
  compare_conflict_a: { category: "direct" },
  compare_conflict_b: { category: "principled" },
  compare_conflict_align: { category: "confirms" },
  compare_conflict_confidence: { category: "high" },
  compare_affection_a: { category: "action_gift" },
  compare_affection_b: { category: "emotional_care" },
  compare_affection_align: { category: "caution" },
  compare_affection_confidence: { category: "low" },
  compare_stress_a: { category: "explosive" },
  compare_stress_b: { category: "withdrawn" },
  compare_stress_align: { category: "confirms" },
  compare_stress_confidence: { category: "high" },
  compare_expression_a: { category: "expressive" },
  compare_expression_b: { category: "reserved" },
  compare_expression_align: { category: "caution" },
  compare_expression_confidence: { category: "low" },
  compare_decision_a: { category: "independent" },
  compare_decision_b: { category: "consultative" },
  compare_decision_align: { category: "confirms" },
  compare_decision_confidence: { category: "high" },
  compare_communication_a: { category: "direct" },
  compare_communication_b: { category: "considerate" },
  compare_communication_align: { category: "caution" },
  compare_communication_confidence: { category: "low" },
};

section("A) All six rows project");
const finalized = comparisonTableValueFromDominantCategories(fullCats);
assert.ok(finalized);
assert.deepEqual(Object.keys(finalized).sort(), [
  "affection",
  "communication",
  "conflict",
  "decision",
  "expression",
  "stress",
]);
assert.deepEqual(finalized.conflict, {
  lean_a: "direct",
  lean_b: "principled",
  align: "confirms",
  confidence: "high",
});
assert.deepEqual(finalized.communication, {
  lean_a: "direct",
  lean_b: "considerate",
  align: "caution",
  confidence: "low",
});
const canonical = buildRomanticComparisonTableCanonical(finalized);
assert.ok(canonical);
const projection = buildRomanticComparisonTableClientProjection(canonical.value);
assert.deepEqual(projection, finalized);
ok("six independent rows");

section("B) No refine re-call in canonical module");
const src = readFileSync(
  join(ROOT, "lib/relationship/romantic/romanticComparisonTableCanonical.ts"),
  "utf8",
);
assert.equal(/\brefineCompare\w+Pair\s*\(/.test(src), false);
assert.equal(/\bresolveCompareCompositeLean\s*\(/.test(src), false);
ok("wrap-only");

section("C) A/B reverse preserves lean swap (composites → cats)");
function toCats(key, pair) {
  return {
    [`compare_${key}_a`]: { category: pair.leanA },
    [`compare_${key}_b`]: { category: pair.leanB },
    [`compare_${key}_align`]: { category: pair.align },
    [`compare_${key}_confidence`]: { category: pair.confidence },
  };
}

const conflictFwd = refineCompareConflictPair({
  conflictA: { officer_count: 0, food_count: 2, conflict_band: "direct" },
  conflictB: { officer_count: 2, food_count: 0, conflict_band: "principled" },
  profileA: sampleProfile({ conflict_style: 70 }),
  profileB: sampleProfile({ conflict_style: 30 }),
});
const conflictRev = refineCompareConflictPair({
  conflictA: { officer_count: 2, food_count: 0, conflict_band: "principled" },
  conflictB: { officer_count: 0, food_count: 2, conflict_band: "direct" },
  profileA: sampleProfile({ conflict_style: 30 }),
  profileB: sampleProfile({ conflict_style: 70 }),
});
assert.ok(conflictFwd && conflictRev);
assert.equal(conflictFwd.leanA, conflictRev.leanB);
assert.equal(conflictFwd.leanB, conflictRev.leanA);
assert.equal(conflictFwd.align, conflictRev.align);
assert.equal(conflictFwd.confidence, conflictRev.confidence);

const affFwd = refineCompareAffectionPair({
  affectionA: { wealth_count: 2, seal_count: 0, affection_band: "action_gift" },
  affectionB: { wealth_count: 0, seal_count: 2, affection_band: "emotional_care" },
  profileA: sampleProfile({ empathy: 30 }),
  profileB: sampleProfile({ empathy: 70 }),
});
const affRev = refineCompareAffectionPair({
  affectionA: { wealth_count: 0, seal_count: 2, affection_band: "emotional_care" },
  affectionB: { wealth_count: 2, seal_count: 0, affection_band: "action_gift" },
  profileA: sampleProfile({ empathy: 70 }),
  profileB: sampleProfile({ empathy: 30 }),
});
assert.equal(affFwd.leanA, affRev.leanB);
assert.equal(affFwd.leanB, affRev.leanA);

const stressFwd = refineCompareStressPair({
  stressA: {
    heat_score: 80,
    temperature_band: "hot",
    stress_band: "explosive",
  },
  stressB: {
    heat_score: 20,
    temperature_band: "cold",
    stress_band: "withdrawn",
  },
  profileA: sampleProfile({ self_control: 30 }),
  profileB: sampleProfile({ self_control: 70 }),
});
const stressRev = refineCompareStressPair({
  stressA: {
    heat_score: 20,
    temperature_band: "cold",
    stress_band: "withdrawn",
  },
  stressB: {
    heat_score: 80,
    temperature_band: "hot",
    stress_band: "explosive",
  },
  profileA: sampleProfile({ self_control: 70 }),
  profileB: sampleProfile({ self_control: 30 }),
});
assert.equal(stressFwd.leanA, stressRev.leanB);
assert.equal(stressFwd.leanB, stressRev.leanA);

const exprFwd = refineCompareExpressionPair({
  expressionA: { food_count: 2, expression_band: "expressive" },
  expressionB: { food_count: 0, expression_band: "reserved" },
  profileA: sampleProfile({ energy_style: 70 }),
  profileB: sampleProfile({ energy_style: 30 }),
});
const exprRev = refineCompareExpressionPair({
  expressionA: { food_count: 0, expression_band: "reserved" },
  expressionB: { food_count: 2, expression_band: "expressive" },
  profileA: sampleProfile({ energy_style: 30 }),
  profileB: sampleProfile({ energy_style: 70 }),
});
assert.equal(exprFwd.leanA, exprRev.leanB);
assert.equal(exprFwd.leanB, exprRev.leanA);

const decFwd = refineCompareDecisionPair({
  decisionA: { strength_label: "신강", decision_band: "independent" },
  decisionB: { strength_label: "신약", decision_band: "consultative" },
  profileA: sampleProfile({ decision_style: 70 }),
  profileB: sampleProfile({ decision_style: 30 }),
});
const decRev = refineCompareDecisionPair({
  decisionA: { strength_label: "신약", decision_band: "consultative" },
  decisionB: { strength_label: "신강", decision_band: "independent" },
  profileA: sampleProfile({ decision_style: 30 }),
  profileB: sampleProfile({ decision_style: 70 }),
});
assert.equal(decFwd.leanA, decRev.leanB);
assert.equal(decFwd.leanB, decRev.leanA);

const commFwd = refineCompareCommunicationPair({
  communicationA: { self_count: 2, seal_count: 0, communication_band: "direct" },
  communicationB: {
    self_count: 0,
    seal_count: 2,
    communication_band: "considerate",
  },
  profileA: sampleProfile({ structure: 70 }),
  profileB: sampleProfile({ structure: 30 }),
});
const commRev = refineCompareCommunicationPair({
  communicationA: {
    self_count: 0,
    seal_count: 2,
    communication_band: "considerate",
  },
  communicationB: { self_count: 2, seal_count: 0, communication_band: "direct" },
  profileA: sampleProfile({ structure: 30 }),
  profileB: sampleProfile({ structure: 70 }),
});
assert.equal(commFwd.leanA, commRev.leanB);
assert.equal(commFwd.leanB, commRev.leanA);

const projectedFwd = comparisonTableValueFromDominantCategories({
  ...toCats("conflict", conflictFwd),
  ...toCats("affection", affFwd),
  ...toCats("stress", stressFwd),
  ...toCats("expression", exprFwd),
  ...toCats("decision", decFwd),
  ...toCats("communication", commFwd),
});
const projectedRev = comparisonTableValueFromDominantCategories({
  ...toCats("conflict", conflictRev),
  ...toCats("affection", affRev),
  ...toCats("stress", stressRev),
  ...toCats("expression", exprRev),
  ...toCats("decision", decRev),
  ...toCats("communication", commRev),
});
for (const key of Object.keys(projectedFwd)) {
  assert.equal(projectedFwd[key].lean_a, projectedRev[key].lean_b);
  assert.equal(projectedFwd[key].lean_b, projectedRev[key].lean_a);
}
ok("A/B reverse swaps leans; align/confidence order-independent");

section("D) UI authority from canonical — not LLM prose");
const report = {
  section_2_nature: {
    comparison_table: [
      {
        aspect: "갈등 반응",
        a: "LLM says reserved soft person",
        b: "LLM says explosive fighter",
      },
    ],
  },
  canonical_projections: {
    comparison_table: injectRomanticComparisonTableClientProjection(
      {},
      finalized,
    ).canonical_projections.comparison_table,
  },
};
const read = readRomanticComparisonTableCanonicalProjection(report);
assert.equal(read.conflict.lean_a, "direct");
assert.equal(read.conflict.lean_b, "principled");
const rowKey = romanticComparisonRowKeyForAspect("갈등 반응");
assert.equal(rowKey, "conflict");
const meLean = romanticCompareLeanForViewerColumn(
  read.conflict,
  true,
  "me",
);
assert.equal(meLean, "direct");
assert.equal(
  formatRomanticCompareLeanLabel(meLean, "ko", rowKey),
  "직면형",
);
assert.equal(
  report.section_2_nature.comparison_table[0].a.includes("reserved"),
  true,
);
assert.notEqual(meLean, "reserved");
ok("typed lean ignores conflicting LLM prose");

section("E) Malformed LLM projection cannot invent authority");
assert.equal(
  readRomanticComparisonTableCanonicalProjection({
    canonical_projections: {
      comparison_table: {
        conflict: {
          lean_a: "from_llm_prose",
          lean_b: "principled",
          align: "confirms",
          confidence: "high",
        },
      },
    },
  }),
  null,
);
const partial = readRomanticComparisonTableCanonicalProjection({
  canonical_projections: {
    comparison_table: {
      conflict: {
        lean_a: "direct",
        lean_b: "principled",
        align: "confirms",
        confidence: "high",
      },
      affection: { lean_a: "bogus" },
    },
  },
});
assert.deepEqual(Object.keys(partial), ["conflict"]);
ok("malformed rows dropped; valid rows kept");

section("F) Inject server-wins + strip survival");
const priorKeep = {
  expression_speed: { direction: "A" },
  residual: { residual_a: "lingers", residual_b: "moderate" },
};
const lied = {
  canonical_projections: {
    ...priorKeep,
    comparison_table: {
      conflict: {
        lean_a: "balanced",
        lean_b: "balanced",
        align: "caution",
        confidence: "low",
      },
    },
  },
};
const injected = injectRomanticComparisonTableClientProjection(lied, finalized);
assert.deepEqual(injected.canonical_projections.comparison_table, finalized);
assert.deepEqual(injected.canonical_projections.expression_speed, priorKeep.expression_speed);
const stripped = stripRomanticContextInputForClient({
  format: "romantic_saju_deep_v2",
  report: {
    romantic_context_input: { schema_version: "x" },
    canonical_projections: injected.canonical_projections,
  },
});
assert.equal(stripped.report.romantic_context_input, undefined);
assert.deepEqual(
  stripped.report.canonical_projections.comparison_table,
  finalized,
);
assert.equal(
  omitRomanticContextInputFromReport({
    romantic_context_input: {},
    canonical_projections: injected.canonical_projections,
  }).canonical_projections.comparison_table.conflict.lean_a,
  "direct",
);
assert.equal(
  ROMANTIC_COMPARISON_TABLE_CLIENT_PATH,
  "canonical_projections.comparison_table",
);
ok("inject + strip");

section("G) ko / en labels + aspect map");
assert.equal(Object.keys(ROMANTIC_COMPARISON_ASPECT_TO_ROW).length, 6);
assert.notEqual(
  formatRomanticCompareLeanLabel("direct", "ko", "conflict"),
  formatRomanticCompareLeanLabel("direct", "ko", "communication"),
);
assert.equal(
  formatRomanticCompareLeanLabel("direct", "en", "conflict"),
  "Direct",
);
assert.equal(
  formatRomanticCompareLeanLabel("direct", "en-US", "communication"),
  "Direct",
);
assert.equal(
  formatRomanticCompareLeanLabel("emotional_care", "ko", "affection"),
  "정서 돌봄형",
);
assert.equal(
  formatRomanticCompareLeanLabel("emotional_care", "en", "affection"),
  "Emotional care",
);
assert.deepEqual(
  comparisonTableJudgmentFields(finalized),
  finalized,
);
assert.equal(comparisonTableValueFromDominantCategories(null), null);
assert.equal(
  comparisonTableValueFromDominantCategories({
    compare_conflict_a: { category: "direct" },
  }),
  null,
);
ok("locale + incomplete null");

console.log("\nOK: romantic comparison-table canonical tests passed");
