/**
 * Phase 6-2d4 — Romantic unconscious_role_play canonical → client projection.
 * Run: npx tsx tests/unit/romantic-role-play-canonical.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildRomanticRolePlayCanonical,
  buildRomanticRolePlayClientProjection,
  injectRomanticRolePlayClientProjection,
  rolePlayValueFromDominantCategories,
  rolePlayJudgmentFields,
  readRomanticRolePlayCanonicalProjection,
  formatRomanticRolePlayCanonicalLabel,
  ROMANTIC_ROLE_PLAY_CANONICAL_SOURCE,
  ROMANTIC_ROLE_PLAY_CLIENT_PATH,
  ROMANTIC_ROLE_PLAY_PERSISTENCE_PATH,
  ROMANTIC_ROLE_PLAY_PSYCH_MODE,
} from "../../lib/relationship/romantic/romanticRolePlayCanonical.ts";
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
  primary_frame: "savior_dependent",
  saju_frame: "mentor_student",
  agrees: false,
};

const aligned = {
  primary_frame: "peer",
  saju_frame: "peer",
  agrees: true,
};

const balanceKeep = {
  balance_a: "leader",
  balance_b: "receiver",
  sublead_idea_mood: "A",
  sublead_decision_approval: "A",
  sublead_execution: "B",
};
const recoveryKeep = {
  recovery_a: "balanced",
  recovery_b: "balanced",
  recovery_mismatch: false,
};
const reassuranceKeep = {
  need_a: "listening",
  need_b: "presence",
  give_a: "care",
  give_b: "solidarity",
  match_b_gives_a: false,
  match_a_gives_b: true,
};

section("A) Wrap-only");

const canonical = buildRomanticRolePlayCanonical(finalized);
assert.ok(canonical);
assert.equal(canonical.source, ROMANTIC_ROLE_PLAY_CANONICAL_SOURCE);
assert.equal(canonical.persistencePath, ROMANTIC_ROLE_PLAY_PERSISTENCE_PATH);
assert.equal(canonical.psychMode, ROMANTIC_ROLE_PLAY_PSYCH_MODE);
assert.deepEqual(canonical.value, finalized);
assert.equal("saju_frame_direction" in canonical.value, false);
assert.equal("anchor" in canonical.value, false);
ok("wrap preserves; no saju_frame_direction");

section("B) No resolver");

const src = readFileSync(
  join(ROOT, "lib/relationship/romantic/romanticRolePlayCanonical.ts"),
  "utf8",
);
assert.equal(
  /resolveRolePlayWithSajuFrame|resolveUnconsciousRolePlay|resolveSajuFrame|resolveSajuFrameDirection/.test(
    src,
  ),
  false,
);
ok("no role/saju resolvers");

section("C) Server wins + preserve prior projections");

const llmLie = {
  primary_frame: "peer",
  saju_frame: "peer",
  agrees: true,
};
const llmReport = {
  canonical_projections: {
    balance_of_power: balanceKeep,
    recovery_speed: recoveryKeep,
    reassurance_signal: reassuranceKeep,
    unconscious_role_play: llmLie,
    future_other: { keep: true },
  },
  section_4_relationship_frames: {
    unconscious_role_play: { headline: "lie", body: "lie body" },
  },
};
const injected = injectRomanticRolePlayClientProjection(
  llmReport,
  buildRomanticRolePlayClientProjection(canonical.value),
);
assert.deepEqual(
  injected.canonical_projections.unconscious_role_play,
  finalized,
);
assert.deepEqual(injected.canonical_projections.balance_of_power, balanceKeep);
assert.deepEqual(injected.canonical_projections.recovery_speed, recoveryKeep);
assert.deepEqual(
  injected.canonical_projections.reassurance_signal,
  reassuranceKeep,
);
assert.deepEqual(injected.canonical_projections.future_other, { keep: true });
ok("server wins; prior projections preserved");

section("D) Immutability");

const prior = {
  canonical_projections: {
    unconscious_role_play: llmLie,
    reassurance_signal: reassuranceKeep,
  },
};
const frozen = structuredClone(prior);
injectRomanticRolePlayClientProjection(
  prior,
  buildRomanticRolePlayClientProjection(finalized),
);
assert.deepEqual(prior, frozen);
ok("immutable");

section("E) Null inject preserves others");

const nullIn = {
  canonical_projections: {
    balance_of_power: balanceKeep,
    recovery_speed: recoveryKeep,
    reassurance_signal: reassuranceKeep,
    unconscious_role_play: llmLie,
    future_other: { keep: true },
  },
};
const nullFrozen = structuredClone(nullIn);
const nullOut = injectRomanticRolePlayClientProjection(nullIn, null);
assert.deepEqual(nullIn, nullFrozen);
assert.equal(nullOut.canonical_projections.unconscious_role_play, undefined);
assert.deepEqual(nullOut.canonical_projections.reassurance_signal, reassuranceKeep);
assert.deepEqual(nullOut.canonical_projections.balance_of_power, balanceKeep);
ok("null inject removes only unconscious_role_play");

section("F) Strip survival");

const withContext = {
  format: "romantic_saju_deep_v2",
  report: {
    romantic_context_input: { schema_version: "context_output_v1" },
    canonical_projections: {
      reassurance_signal: reassuranceKeep,
      unconscious_role_play: finalized,
    },
  },
};
const stripped = stripRomanticContextInputForClient(withContext);
assert.equal(stripped.report.romantic_context_input, undefined);
assert.deepEqual(
  stripped.report.canonical_projections.unconscious_role_play,
  finalized,
);
const omitted = omitRomanticContextInputFromReport(withContext.report);
assert.deepEqual(
  omitted.canonical_projections.unconscious_role_play,
  finalized,
);
assert.equal(
  ROMANTIC_ROLE_PLAY_CLIENT_PATH,
  "canonical_projections.unconscious_role_play",
);
ok("strip survival");

section("G) fromDominantCategories");

const fromCats = rolePlayValueFromDominantCategories({
  role_primary: { category: "savior_dependent" },
  role_saju: { category: "mentor_student" },
  role_agrees: { category: "differs" },
  saju_frame_direction: { category: "A" },
});
assert.deepEqual(fromCats, finalized);
assert.equal("saju_frame_direction" in fromCats, false);
assert.equal(
  rolePlayValueFromDominantCategories({
    role_primary: { category: "peer" },
  }),
  null,
);
const fromAligned = rolePlayValueFromDominantCategories({
  role_primary: { category: "peer" },
  role_saju: { category: "peer" },
  role_agrees: { category: "agrees" },
});
assert.deepEqual(fromAligned, aligned);
ok("map; incomplete null; direction ignored");

section("H) Malformed / legacy");

assert.equal(buildRomanticRolePlayCanonical(null), null);
assert.equal(
  readRomanticRolePlayCanonicalProjection({
    canonical_projections: {
      unconscious_role_play: { primary_frame: "peer" },
    },
  }),
  null,
);
assert.equal(
  injectRomanticRolePlayClientProjection(
    { section_4_relationship_frames: { unconscious_role_play: { body: "x" } } },
    null,
  ).canonical_projections,
  undefined,
);
ok("malformed/legacy prose-only");

section("I) Locale");

const ko = formatRomanticRolePlayCanonicalLabel(finalized, { locale: "ko" });
const en = formatRomanticRolePlayCanonicalLabel(finalized, { locale: "en" });
assert.notEqual(ko, en);
assert.ok(!ko.includes("A") || ko.includes("심리"));
assert.equal(ko.includes("anchor"), false);
assert.deepEqual(
  rolePlayJudgmentFields(buildRomanticRolePlayCanonical(finalized).value),
  finalized,
);
ok("locale labels differ; enums identical; no direction");

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
const ret = finalizeFn.indexOf("return {");
assert.ok(bal >= 0 && rec > bal && rea > rec && role > rea && ret > role);
assert.equal(/resolveRolePlayWithSajuFrame|resolveSajuFrameDirection/.test(finalizeFn), false);

const schemaSrc = readFileSync(
  join(ROOT, "lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema.ts"),
  "utf8",
);
const schemaStringMatch = schemaSrc.match(
  /export const ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA = `([\s\S]*?)`;/,
);
assert.ok(schemaStringMatch);
assert.equal(schemaStringMatch[1].includes("canonical_projections"), false);
assert.ok(schemaSrc.includes("unconscious_role_play?:"));
ok("finalize order + LLM schema string clean");

console.log("\nAll romantic-role-play-canonical tests passed.");
