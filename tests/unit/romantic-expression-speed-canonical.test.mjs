/**
 * Phase 6-2d6 — Romantic expression_speed canonical → client projection.
 * Run: npx tsx tests/unit/romantic-expression-speed-canonical.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildRomanticExpressionSpeedCanonical,
  buildRomanticExpressionSpeedClientProjection,
  injectRomanticExpressionSpeedClientProjection,
  expressionSpeedValueFromDominantCategories,
  expressionSpeedValueFromFinalized,
  expressionSpeedJudgmentFields,
  readRomanticExpressionSpeedCanonicalProjection,
  formatRomanticExpressionSpeedCanonicalLabel,
  ROMANTIC_EXPRESSION_SPEED_CANONICAL_SOURCE,
  ROMANTIC_EXPRESSION_SPEED_CLIENT_PATH,
  ROMANTIC_EXPRESSION_SPEED_PSYCH_MODE,
} from "../../lib/relationship/romantic/romanticExpressionSpeedCanonical.ts";
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

const withMeta = {
  direction: "A",
  align: "confirms",
  confidence: "low",
};
const directionOnly = { direction: "B" };
const priorKeep = {
  balance_of_power: {
    balance_a: "leader",
    balance_b: "receiver",
    sublead_idea_mood: "A",
    sublead_decision_approval: "A",
    sublead_execution: "B",
  },
  recovery_speed: {
    recovery_a: "balanced",
    recovery_b: "balanced",
    recovery_mismatch: false,
  },
  reassurance_signal: {
    need_a: "listening",
    need_b: "presence",
    give_a: "care",
    give_b: "solidarity",
    match_b_gives_a: false,
    match_a_gives_b: true,
  },
  unconscious_role_play: {
    primary_frame: "peer",
    saju_frame: "peer",
    agrees: true,
  },
  residual: { residual_a: "lingers", residual_b: "clears_fast" },
};

section("A) Wrap-only + optional meta");
const canonical = buildRomanticExpressionSpeedCanonical(withMeta);
assert.ok(canonical);
assert.equal(canonical.source, ROMANTIC_EXPRESSION_SPEED_CANONICAL_SOURCE);
assert.equal(canonical.psychMode, ROMANTIC_EXPRESSION_SPEED_PSYCH_MODE);
assert.deepEqual(canonical.value, withMeta);
const dirOnlyCanon = buildRomanticExpressionSpeedCanonical(directionOnly);
assert.deepEqual(dirOnlyCanon.value, directionOnly);
assert.equal("align" in dirOnlyCanon.value, false);
assert.equal("residual_a" in canonical.value, false);
assert.equal("compare_expression_a" in canonical.value, false);
ok("wrap; optional meta; no residual/compare fields");

section("B) No resolver / refine");
const src = readFileSync(
  join(ROOT, "lib/relationship/romantic/romanticExpressionSpeedCanonical.ts"),
  "utf8",
);
assert.equal(/\bresolveExpressionSpeedDirection\s*\(/.test(src), false);
assert.equal(/\brefineExpressionSpeedCorroboration\s*\(/.test(src), false);
assert.equal(/\bresolveResidualBand\s*\(/.test(src), false);
ok("no resolver/refine/residual recompute");

section("C) Corroboration optional — direction kept");
assert.deepEqual(
  expressionSpeedValueFromDominantCategories({
    expression_speed_direction: { category: "A" },
  }),
  { direction: "A" },
);
assert.deepEqual(
  expressionSpeedValueFromDominantCategories({
    expression_speed_direction: { category: "A" },
    expression_speed_align: { category: "caution" },
    expression_speed_confidence: { category: "low" },
  }),
  { direction: "A", align: "caution", confidence: "low" },
);
assert.equal(
  expressionSpeedValueFromDominantCategories({
    expression_speed_align: { category: "confirms" },
  }),
  null,
);
assert.deepEqual(
  expressionSpeedValueFromFinalized({ direction: "balanced" }),
  { direction: "balanced" },
);
ok("missing corroboration keeps direction; missing direction → null");

section("D) Server wins + preserve residual + 4 prior");
const injected = injectRomanticExpressionSpeedClientProjection(
  {
    canonical_projections: {
      ...priorKeep,
      expression_speed: { direction: "B", align: "caution", confidence: "low" },
      future_other: { keep: true },
    },
  },
  buildRomanticExpressionSpeedClientProjection(withMeta),
);
assert.deepEqual(injected.canonical_projections.expression_speed, withMeta);
assert.deepEqual(injected.canonical_projections.residual, priorKeep.residual);
assert.deepEqual(injected.canonical_projections.balance_of_power, priorKeep.balance_of_power);
assert.deepEqual(injected.canonical_projections.future_other, { keep: true });
ok("server wins; residual preserved; unrelated preserved");

section("E) Immutability + null inject");
const prior = {
  canonical_projections: { ...priorKeep, expression_speed: directionOnly },
};
const frozen = structuredClone(prior);
injectRomanticExpressionSpeedClientProjection(prior, withMeta);
assert.deepEqual(prior, frozen);
const nullOut = injectRomanticExpressionSpeedClientProjection(
  {
    canonical_projections: {
      ...priorKeep,
      expression_speed: withMeta,
      future_other: { k: 1 },
    },
  },
  null,
);
assert.equal(nullOut.canonical_projections.expression_speed, undefined);
assert.deepEqual(nullOut.canonical_projections.residual, priorKeep.residual);
ok("immutable; null removes only expression_speed");

section("F) Strip + malformed");
const withCtx = {
  report: {
    romantic_context_input: { x: 1 },
    canonical_projections: {
      expression_speed: withMeta,
      residual: priorKeep.residual,
    },
  },
};
const stripped = stripRomanticContextInputForClient(withCtx);
assert.equal(stripped.report.romantic_context_input, undefined);
assert.deepEqual(stripped.report.canonical_projections.expression_speed, withMeta);
assert.equal(omitRomanticContextInputFromReport(withCtx.report).romantic_context_input, undefined);
assert.equal(
  readRomanticExpressionSpeedCanonicalProjection({
    canonical_projections: { expression_speed: { direction: "Z" } },
  }),
  null,
);
assert.equal(
  readRomanticExpressionSpeedCanonicalProjection({
    canonical_projections: {
      expression_speed: { direction: "A", align: "nope" },
    },
  }),
  null,
);
assert.equal(ROMANTIC_EXPRESSION_SPEED_CLIENT_PATH, "canonical_projections.expression_speed");
ok("strip survival; malformed null");

section("G) Locale + no prose parse");
const ko = formatRomanticExpressionSpeedCanonicalLabel(withMeta, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko",
});
const en = formatRomanticExpressionSpeedCanonicalLabel(withMeta, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "en",
});
assert.notEqual(ko, en);
assert.ok(ko.includes("Alex"));
assert.deepEqual(expressionSpeedJudgmentFields(canonical.value), withMeta);
ok("locale labels; enums identical");

section("H) Finalize order + LLM schema");
const full = readFileSync(
  join(ROOT, "lib/prompts/relationshipPremium/romanticSajuDeep/index.ts"),
  "utf8",
);
const finalizeFn = full.slice(
  full.indexOf("function finalizeRomanticSajuDeepReport"),
  full.indexOf("async function callLlmJson"),
);
const res = finalizeFn.indexOf("injectRomanticResidualClientProjection");
const esc = finalizeFn.indexOf("injectRomanticExpressionSpeedClientProjection");
const ret = finalizeFn.indexOf("return {");
assert.ok(res >= 0 && esc > res && ret > esc);
assert.equal(
  /resolveExpressionSpeedDirection|refineExpressionSpeedCorroboration/.test(
    finalizeFn,
  ),
  false,
);
const schemaSrc = readFileSync(
  join(ROOT, "lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema.ts"),
  "utf8",
);
const m = schemaSrc.match(/export const ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA = `([\s\S]*?)`;/);
assert.ok(m && !m[1].includes("canonical_projections"));
assert.ok(schemaSrc.includes("expression_speed?:"));
ok("finalize residual→expression; schema string clean");

console.log("\nAll romantic-expression-speed-canonical tests passed.");
