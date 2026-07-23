/**
 * Phase 6-2d7 — saju_frame_direction canonical projection.
 * Run: npx tsx tests/unit/romantic-saju-frame-direction-canonical.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildRomanticSajuFrameDirectionCanonical,
  buildRomanticSajuFrameDirectionClientProjection,
  injectRomanticSajuFrameDirectionClientProjection,
  sajuFrameDirectionValueFromDominantCategories,
  sajuFrameDirectionValueFromFinalized,
  sajuFrameDirectionJudgmentFields,
  readRomanticSajuFrameDirectionCanonicalProjection,
  formatRomanticSajuFrameDirectionCanonicalLabel,
  anchorIsAFromSajuFrameDirection,
  ROMANTIC_SAJU_FRAME_DIRECTION_CLIENT_PATH,
} from "../../lib/relationship/romantic/romanticSajuFrameDirectionCanonical.ts";
import { resolveSajuFrameDirection } from "../../lib/relationship/romanticRules/relationshipDynamics.ts";
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

function romanticSignals(overrides = {}) {
  return {
    expression_style: { food_count: 1, expression_band: "balanced" },
    conflict_response: {
      officer_count: 1,
      food_count: 1,
      day_branch_tension_hits: [],
      conflict_band: "balanced",
    },
    affection_language: {
      wealth_count: 1,
      seal_count: 1,
      affection_band: "balanced",
    },
    stress_pattern: {
      heat_score: 50,
      temperature_band: "neutral",
      stress_band: "steady",
    },
    decision_making: { strength_label: "중화", decision_band: "balanced" },
    communication_style: {
      self_count: 1,
      seal_count: 1,
      communication_band: "balanced",
    },
    ...overrides,
  };
}

section("A) Wrap existing direction + anchor_is_a");
assert.deepEqual(sajuFrameDirectionValueFromFinalized("A"), {
  direction: "A",
  anchor_is_a: true,
});
assert.deepEqual(sajuFrameDirectionValueFromFinalized("B"), {
  direction: "B",
  anchor_is_a: false,
});
assert.deepEqual(sajuFrameDirectionValueFromFinalized("balanced"), {
  direction: "balanced",
  anchor_is_a: null,
});
assert.equal(anchorIsAFromSajuFrameDirection("A"), true);
assert.equal(anchorIsAFromSajuFrameDirection("B"), false);
assert.equal(anchorIsAFromSajuFrameDirection("balanced"), null);
ok("anchor derive matches prepare");

section("B) Follows resolveSajuFrameDirection (no new interpretation)");
const aHigh = resolveSajuFrameDirection(
  romanticSignals({
    affection_language: {
      wealth_count: 1,
      seal_count: 3,
      affection_band: "balanced",
    },
  }),
  romanticSignals(),
);
const projected = sajuFrameDirectionValueFromFinalized(aHigh);
assert.equal(projected.direction, "A");
assert.equal(projected.anchor_is_a, true);
const fromCats = sajuFrameDirectionValueFromDominantCategories({
  saju_frame_direction: { category: aHigh },
});
assert.deepEqual(fromCats, projected);
ok("resolver result wrapped");

section("C) No resolver call in canonical module");
const src = readFileSync(
  join(
    ROOT,
    "lib/relationship/romantic/romanticSajuFrameDirectionCanonical.ts",
  ),
  "utf8",
);
assert.equal(/\bresolveSajuFrameDirection\s*\(/.test(src), false);
ok("wrap-only");

section("D) Special-bond UI authority from canonical, not prose");
const report = {
  section_4_special_bond: {
    a_gives_b: "LLM claims B is the only anchor forever",
    only_together: "x",
    relationship_formula: "y",
    why_special: "z",
  },
  canonical_projections: {
    saju_frame_direction: { direction: "A", anchor_is_a: true },
  },
};
const read = readRomanticSajuFrameDirectionCanonicalProjection(report);
assert.equal(read.direction, "A");
assert.equal(read.anchor_is_a, true);
const label = formatRomanticSajuFrameDirectionCanonicalLabel(read, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko",
});
assert.match(label, /Alex/);
assert.equal(label.includes("Jordan 쪽이 안식처"), false);
ok("canonical wins over conflicting prose");

section("E) Malformed projection rejected");
assert.equal(
  readRomanticSajuFrameDirectionCanonicalProjection({
    canonical_projections: {
      saju_frame_direction: { direction: "A", anchor_is_a: false },
    },
  }),
  null,
);
assert.equal(
  readRomanticSajuFrameDirectionCanonicalProjection({
    canonical_projections: {
      saju_frame_direction: { direction: "peer" },
    },
  }),
  null,
);
ok("malformed null");

section("F) Inject + strip + locale");
const kept = { expression_speed: { direction: "B" } };
const injected = injectRomanticSajuFrameDirectionClientProjection(
  { canonical_projections: { ...kept, saju_frame_direction: { direction: "B" } } },
  projected,
);
assert.deepEqual(injected.canonical_projections.saju_frame_direction, projected);
assert.deepEqual(injected.canonical_projections.expression_speed, kept.expression_speed);
const stripped = stripRomanticContextInputForClient({
  format: "romantic_saju_deep_v2",
  report: {
    romantic_context_input: { x: 1 },
    canonical_projections: injected.canonical_projections,
  },
});
assert.equal(stripped.report.romantic_context_input, undefined);
assert.deepEqual(
  stripped.report.canonical_projections.saju_frame_direction,
  projected,
);
assert.equal(
  omitRomanticContextInputFromReport({
    romantic_context_input: {},
    canonical_projections: injected.canonical_projections,
  }).canonical_projections.saju_frame_direction.anchor_is_a,
  true,
);
const ko = formatRomanticSajuFrameDirectionCanonicalLabel(projected, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko-KR",
});
const en = formatRomanticSajuFrameDirectionCanonicalLabel(projected, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "en-US",
});
assert.notEqual(ko, en);
const bal = formatRomanticSajuFrameDirectionCanonicalLabel(
  { direction: "balanced", anchor_is_a: null },
  { nameA: "Alex", nameB: "Jordan", locale: "en" },
);
assert.match(bal, /Balanced/i);
assert.deepEqual(
  sajuFrameDirectionJudgmentFields(
    buildRomanticSajuFrameDirectionCanonical(projected).value,
  ),
  projected,
);
assert.equal(
  ROMANTIC_SAJU_FRAME_DIRECTION_CLIENT_PATH,
  "canonical_projections.saju_frame_direction",
);
assert.deepEqual(
  buildRomanticSajuFrameDirectionClientProjection(projected),
  projected,
);
ok("inject/strip/locale");

console.log("\nOK: romantic saju-frame-direction canonical tests passed");
