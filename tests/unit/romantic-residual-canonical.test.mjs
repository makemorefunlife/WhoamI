/**
 * Phase 6-2d5 — Romantic residual canonical → client projection.
 * Run: npx tsx tests/unit/romantic-residual-canonical.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildRomanticResidualCanonical,
  buildRomanticResidualClientProjection,
  injectRomanticResidualClientProjection,
  residualValueFromDominantCategories,
  residualJudgmentFields,
  readRomanticResidualCanonicalProjection,
  formatRomanticResidualCanonicalLabel,
  ROMANTIC_RESIDUAL_CANONICAL_SOURCE,
  ROMANTIC_RESIDUAL_CLIENT_PATH,
  ROMANTIC_RESIDUAL_PERSISTENCE_PATH,
} from "../../lib/relationship/romantic/romanticResidualCanonical.ts";
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

const finalized = { residual_a: "lingers", residual_b: "clears_fast" };
const priorKeep = {
  balance_of_power: {
    balance_a: "leader",
    balance_b: "receiver",
    sublead_idea_mood: "A",
    sublead_decision_approval: "A",
    sublead_execution: "B",
  },
  recovery_speed: {
    recovery_a: "quick_recovery",
    recovery_b: "deep_processing",
    recovery_mismatch: true,
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
};

section("A) Wrap-only");
const canonical = buildRomanticResidualCanonical(finalized);
assert.ok(canonical);
assert.equal(canonical.source, ROMANTIC_RESIDUAL_CANONICAL_SOURCE);
assert.equal(canonical.persistencePath, ROMANTIC_RESIDUAL_PERSISTENCE_PATH);
assert.deepEqual(canonical.value, finalized);
assert.equal("recovery_a" in canonical.value, false);
assert.equal("direction" in canonical.value, false);
ok("wrap; not inside recovery/expression");

section("B) No resolver");
const src = readFileSync(
  join(ROOT, "lib/relationship/romantic/romanticResidualCanonical.ts"),
  "utf8",
);
assert.equal(/resolveResidualBand|seal_count|day_branch_tension/.test(src), false);
ok("no resolver/threshold");

section("C) Server wins + preserve 4 prior");
const injected = injectRomanticResidualClientProjection(
  {
    canonical_projections: {
      ...priorKeep,
      residual: { residual_a: "moderate", residual_b: "moderate" },
      future_other: { keep: true },
    },
  },
  buildRomanticResidualClientProjection(finalized),
);
assert.deepEqual(injected.canonical_projections.residual, finalized);
assert.deepEqual(injected.canonical_projections.balance_of_power, priorKeep.balance_of_power);
assert.deepEqual(injected.canonical_projections.recovery_speed, priorKeep.recovery_speed);
assert.deepEqual(injected.canonical_projections.reassurance_signal, priorKeep.reassurance_signal);
assert.deepEqual(injected.canonical_projections.unconscious_role_play, priorKeep.unconscious_role_play);
assert.deepEqual(injected.canonical_projections.future_other, { keep: true });
assert.equal("expression_speed" in injected.canonical_projections, false);
ok("server wins; prior preserved; expression not owned");

section("D) Immutability + null inject");
const prior = {
  canonical_projections: { ...priorKeep, residual: { residual_a: "moderate", residual_b: "moderate" } },
};
const frozen = structuredClone(prior);
injectRomanticResidualClientProjection(prior, finalized);
assert.deepEqual(prior, frozen);
const nullOut = injectRomanticResidualClientProjection(
  { canonical_projections: { ...priorKeep, residual: finalized, future_other: { k: 1 } } },
  null,
);
assert.equal(nullOut.canonical_projections.residual, undefined);
assert.deepEqual(nullOut.canonical_projections.recovery_speed, priorKeep.recovery_speed);
ok("immutable; null removes only residual");

section("E) Strip + fromDominantCategories");
const withCtx = {
  report: {
    romantic_context_input: { x: 1 },
    canonical_projections: { residual: finalized, recovery_speed: priorKeep.recovery_speed },
  },
};
const stripped = stripRomanticContextInputForClient(withCtx);
assert.equal(stripped.report.romantic_context_input, undefined);
assert.deepEqual(stripped.report.canonical_projections.residual, finalized);
assert.equal(omitRomanticContextInputFromReport(withCtx.report).romantic_context_input, undefined);
assert.deepEqual(
  residualValueFromDominantCategories({
    residual_a: { category: "lingers" },
    residual_b: { category: "clears_fast" },
    recovery_a: { category: "quick_recovery" },
  }),
  finalized,
);
assert.equal(residualValueFromDominantCategories({ residual_a: { category: "lingers" } }), null);
assert.equal(ROMANTIC_RESIDUAL_CLIENT_PATH, "canonical_projections.residual");
ok("strip survival; incomplete null");

section("F) Malformed / locale");
assert.equal(buildRomanticResidualCanonical(null), null);
assert.equal(
  readRomanticResidualCanonicalProjection({
    canonical_projections: { residual: { residual_a: "lingers" } },
  }),
  null,
);
const ko = formatRomanticResidualCanonicalLabel(finalized, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko",
});
const en = formatRomanticResidualCanonicalLabel(finalized, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "en",
});
assert.notEqual(ko, en);
assert.deepEqual(residualJudgmentFields(canonical.value), finalized);
ok("malformed null; locale labels differ");

section("G) Finalize order + LLM schema");
const finalizeFn = readFileSync(
  join(ROOT, "lib/prompts/relationshipPremium/romanticSajuDeep/index.ts"),
  "utf8",
).slice(
  readFileSync(join(ROOT, "lib/prompts/relationshipPremium/romanticSajuDeep/index.ts"), "utf8").indexOf(
    "function finalizeRomanticSajuDeepReport",
  ),
  readFileSync(join(ROOT, "lib/prompts/relationshipPremium/romanticSajuDeep/index.ts"), "utf8").indexOf(
    "async function callLlmJson",
  ),
);
const role = finalizeFn.indexOf("injectRomanticRolePlayClientProjection");
const res = finalizeFn.indexOf("injectRomanticResidualClientProjection");
const esc = finalizeFn.indexOf("injectRomanticExpressionSpeedClientProjection");
assert.ok(role >= 0 && res > role && esc > res);
assert.equal(/resolveResidualBand/.test(finalizeFn), false);
const schemaSrc = readFileSync(
  join(ROOT, "lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema.ts"),
  "utf8",
);
const m = schemaSrc.match(/export const ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA = `([\s\S]*?)`;/);
assert.ok(m && !m[1].includes("canonical_projections"));
ok("finalize residual before expression; schema string clean");

console.log("\nAll romantic-residual-canonical tests passed.");
