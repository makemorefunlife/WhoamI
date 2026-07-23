/**
 * Phase 6-2d3 — Romantic reassurance_signal canonical → client projection.
 * Run: npx tsx tests/unit/romantic-reassurance-canonical.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildRomanticReassuranceCanonical,
  buildRomanticReassuranceClientProjection,
  injectRomanticReassuranceClientProjection,
  reassuranceValueFromDominantCategories,
  reassuranceJudgmentFields,
  readRomanticReassuranceCanonicalProjection,
  formatRomanticReassuranceCanonicalLabel,
  ROMANTIC_REASSURANCE_CANONICAL_SOURCE,
  ROMANTIC_REASSURANCE_CLIENT_PATH,
  ROMANTIC_REASSURANCE_PERSISTENCE_PATH,
  ROMANTIC_REASSURANCE_PSYCH_MODE,
} from "../../lib/relationship/romantic/romanticReassuranceCanonical.ts";
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

const finalized = {
  need_a: "listening",
  need_b: "behavior_proof",
  give_a: "care",
  give_b: "expression",
  match_b_gives_a: true,
  match_a_gives_b: false,
};

const balanceKeep = {
  balance_a: "leader",
  balance_b: "receiver",
  sublead_idea_mood: "A",
  sublead_decision_approval: "A",
  sublead_execution: "B",
};
const recoveryKeep = {
  recovery_a: "quick_recovery",
  recovery_b: "deep_processing",
  recovery_mismatch: true,
};

section("A) Wrap-only");

const canonical = buildRomanticReassuranceCanonical(finalized);
assert.ok(canonical);
assert.equal(canonical.source, ROMANTIC_REASSURANCE_CANONICAL_SOURCE);
assert.equal(canonical.persistencePath, ROMANTIC_REASSURANCE_PERSISTENCE_PATH);
assert.equal(canonical.psychMode, ROMANTIC_REASSURANCE_PSYCH_MODE);
assert.deepEqual(canonical.value, finalized);
assert.equal("residual_a" in canonical.value, false);
assert.equal("expression_speed_direction" in canonical.value, false);
ok("wrap preserves fields; no residual/expression");

section("B) No resolver");

const src = readFileSync(
  join(ROOT, "lib/relationship/romantic/romanticReassuranceCanonical.ts"),
  "utf8",
);
assert.equal(
  /resolveReassuranceBand|resolveGiveStyle|resolveReassuranceMatch/.test(src),
  false,
);
assert.ok(!src.includes("psychMatch"));
ok("no resolver/psych");

section("C) Server wins + preserve balance/recovery");

const llmLie = {
  need_a: "presence",
  need_b: "presence",
  give_a: "solidarity",
  give_b: "solidarity",
  match_b_gives_a: false,
  match_a_gives_b: false,
};
const llmReport = {
  canonical_projections: {
    balance_of_power: balanceKeep,
    recovery_speed: recoveryKeep,
    reassurance_signal: llmLie,
    future_other: { keep: true },
  },
  section_4_relationship_frames: {
    reassurance_signal: { headline: "lie", body: "lie body", a_body: "a", b_body: "b" },
  },
};
const injected = injectRomanticReassuranceClientProjection(
  llmReport,
  buildRomanticReassuranceClientProjection(canonical.value),
);
assert.deepEqual(injected.canonical_projections.reassurance_signal, finalized);
assert.deepEqual(injected.canonical_projections.balance_of_power, balanceKeep);
assert.deepEqual(injected.canonical_projections.recovery_speed, recoveryKeep);
assert.deepEqual(injected.canonical_projections.future_other, { keep: true });
ok("server wins; balance/recovery/unrelated preserved");

section("D) Immutability");

const prior = {
  canonical_projections: {
    reassurance_signal: llmLie,
    balance_of_power: balanceKeep,
  },
};
const frozen = structuredClone(prior);
const out = injectRomanticReassuranceClientProjection(
  prior,
  buildRomanticReassuranceClientProjection(finalized),
);
assert.deepEqual(prior, frozen);
assert.notEqual(out.canonical_projections, prior.canonical_projections);
ok("immutable");

section("E) Null inject preserves others");

const nullIn = {
  canonical_projections: {
    balance_of_power: balanceKeep,
    recovery_speed: recoveryKeep,
    reassurance_signal: llmLie,
    future_other: { keep: true },
  },
};
const nullFrozen = structuredClone(nullIn);
const nullOut = injectRomanticReassuranceClientProjection(nullIn, null);
assert.deepEqual(nullIn, nullFrozen);
assert.equal(nullOut.canonical_projections.reassurance_signal, undefined);
assert.deepEqual(nullOut.canonical_projections.balance_of_power, balanceKeep);
assert.deepEqual(nullOut.canonical_projections.recovery_speed, recoveryKeep);
assert.deepEqual(nullOut.canonical_projections.future_other, { keep: true });
ok("null inject removes only reassurance_signal");

section("F) Strip survival");

const withContext = {
  format: "romantic_saju_deep_v2",
  report: {
    romantic_context_input: { schema_version: "context_output_v1" },
    canonical_projections: {
      balance_of_power: balanceKeep,
      recovery_speed: recoveryKeep,
      reassurance_signal: finalized,
    },
  },
};
const stripped = stripRomanticContextInputForClient(withContext);
assert.equal(stripped.report.romantic_context_input, undefined);
assert.deepEqual(
  stripped.report.canonical_projections.reassurance_signal,
  finalized,
);
const omitted = omitRomanticContextInputFromReport(withContext.report);
assert.deepEqual(omitted.canonical_projections.reassurance_signal, finalized);
assert.equal(
  ROMANTIC_REASSURANCE_CLIENT_PATH,
  "canonical_projections.reassurance_signal",
);
ok("strip survival");

section("G) fromDominantCategories");

const fromCats = reassuranceValueFromDominantCategories({
  reassurance_need_a: { category: "listening" },
  reassurance_need_b: { category: "behavior_proof" },
  reassurance_give_a: { category: "care" },
  reassurance_give_b: { category: "expression" },
  reassurance_match_b_gives_a: { category: "matched" },
  reassurance_match_a_gives_b: { category: "mismatched" },
  residual_a: { category: "lingers" },
  expression_speed_direction: { category: "A" },
});
assert.deepEqual(fromCats, finalized);
assert.equal(
  reassuranceValueFromDominantCategories({
    reassurance_need_a: { category: "listening" },
  }),
  null,
);
ok("map complete; incomplete null; residual/expression ignored");

section("H) Malformed / legacy");

assert.equal(buildRomanticReassuranceCanonical(null), null);
assert.equal(
  readRomanticReassuranceCanonicalProjection({
    canonical_projections: {
      reassurance_signal: { need_a: "listening" },
    },
  }),
  null,
);
assert.equal(
  injectRomanticReassuranceClientProjection(
    { section_4_relationship_frames: { reassurance_signal: { body: "x" } } },
    null,
  ).canonical_projections,
  undefined,
);
ok("malformed/legacy prose-only");

section("I) Locale");

const ko = formatRomanticReassuranceCanonicalLabel(finalized, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko",
});
const en = formatRomanticReassuranceCanonicalLabel(finalized, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "en",
});
assert.notEqual(ko, en);
assert.deepEqual(
  reassuranceJudgmentFields(
    buildRomanticReassuranceCanonical(finalized).value,
  ),
  finalized,
);
ok("locale labels differ; enums identical");

section("J) Finalize order + LLM schema");

const finalizeSrc = readFileSync(
  join(ROOT, "lib/prompts/relationshipPremium/romanticSajuDeep/index.ts"),
  "utf8",
);
const finalizeFn = finalizeSrc.slice(
  finalizeSrc.indexOf("function finalizeRomanticSajuDeepReport"),
  finalizeSrc.indexOf("async function callLlmJson"),
);
const bal = finalizeFn.indexOf("injectRomanticBalanceClientProjection");
const rec = finalizeFn.indexOf("injectRomanticRecoveryClientProjection");
const rea = finalizeFn.indexOf("injectRomanticReassuranceClientProjection");
const role = finalizeFn.indexOf("injectRomanticRolePlayClientProjection");
assert.ok(bal >= 0 && rec > bal && rea > rec && role > rea);
assert.equal(/resolveReassuranceBand/.test(finalizeFn), false);

const schemaSrc = readFileSync(
  join(ROOT, "lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema.ts"),
  "utf8",
);
const schemaStringMatch = schemaSrc.match(
  /export const ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA = `([\s\S]*?)`;/,
);
assert.ok(schemaStringMatch);
assert.equal(schemaStringMatch[1].includes("canonical_projections"), false);
assert.ok(schemaSrc.includes("reassurance_signal?:"));
ok("finalize order + LLM schema string clean");

console.log("\nAll romantic-reassurance-canonical tests passed.");
