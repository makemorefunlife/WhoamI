/**
 * Phase 6-2d2 — Romantic recovery_speed canonical → client projection.
 * Recovery only (residual excluded). LLM prose = explanation only.
 * Run: npx tsx tests/unit/romantic-recovery-speed-canonical.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildRomanticRecoverySpeedCanonical,
  buildRomanticRecoveryClientProjection,
  injectRomanticRecoveryClientProjection,
  recoverySpeedValueFromDominantCategories,
  recoverySpeedJudgmentFields,
  readRomanticRecoveryCanonicalProjection,
  formatRomanticRecoveryCanonicalLabel,
  ROMANTIC_RECOVERY_SPEED_CANONICAL_SOURCE,
  ROMANTIC_RECOVERY_SPEED_CLIENT_PATH,
  ROMANTIC_RECOVERY_SPEED_PERSISTENCE_PATH,
  ROMANTIC_RECOVERY_SPEED_PSYCH_MODE_LEGACY,
  ROMANTIC_RECOVERY_SPEED_PSYCH_MODE_WITH_PSYCH,
} from "../../lib/relationship/romantic/romanticRecoverySpeedCanonical.ts";
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

const finalizedMismatch = {
  recovery_a: "quick_recovery",
  recovery_b: "deep_processing",
  recovery_mismatch: true,
  score_a: 68,
  score_b: 35,
};

const finalizedBalanced = {
  recovery_a: "balanced",
  recovery_b: "balanced",
  recovery_mismatch: false,
};

// ---------------------------------------------------------------------------
section("A) Wrap-only — preserves finalized values exactly");

const canonical = buildRomanticRecoverySpeedCanonical(finalizedMismatch);
assert.ok(canonical);
assert.equal(canonical.source, ROMANTIC_RECOVERY_SPEED_CANONICAL_SOURCE);
assert.equal(
  canonical.persistencePath,
  ROMANTIC_RECOVERY_SPEED_PERSISTENCE_PATH,
);
assert.equal(
  canonical.psychMode,
  ROMANTIC_RECOVERY_SPEED_PSYCH_MODE_WITH_PSYCH,
);
assert.deepEqual(canonical.value, finalizedMismatch);
assert.deepEqual(
  recoverySpeedJudgmentFields(canonical.value),
  recoverySpeedJudgmentFields(finalizedMismatch),
);
assert.equal("residual_a" in canonical.value, false);
assert.equal("residual_b" in canonical.value, false);

const legacyCanonical = buildRomanticRecoverySpeedCanonical(finalizedBalanced);
assert.equal(
  legacyCanonical.psychMode,
  ROMANTIC_RECOVERY_SPEED_PSYCH_MODE_LEGACY,
);
assert.deepEqual(legacyCanonical.value, finalizedBalanced);
assert.equal("score_a" in legacyCanonical.value, false);
assert.equal("score_b" in legacyCanonical.value, false);
ok("wrap preserves fields + psychMode from scores presence; no residual");

// ---------------------------------------------------------------------------
section("B) No resolver / reclassification (source-level)");

const canonicalSrc = readFileSync(
  join(ROOT, "lib/relationship/romantic/romanticRecoverySpeedCanonical.ts"),
  "utf8",
);
assert.equal(
  /resolveRecoverySpeedGap|resolveResidualBand/.test(canonicalSrc),
  false,
  "canonical module must not call recovery/residual resolvers",
);
assert.ok(
  !canonicalSrc.includes("psychMatch") &&
    !canonicalSrc.includes("buildPsych"),
  "must not read psych",
);
assert.ok(
  !canonicalSrc.includes("residual_a") &&
    !canonicalSrc.includes("residual_b") &&
    !canonicalSrc.includes("ResidualBand"),
  "must not include residual fields",
);

const proseOnly = injectRomanticRecoveryClientProjection(
  {
    section_1_relationship_dynamics: {
      recovery_speed: {
        headline: "B가 더 빨리 회복합니다",
        body: "B는 급속 회복, A는 심층 숙성입니다.",
      },
    },
  },
  null,
);
assert.equal(proseOnly.canonical_projections, undefined);
assert.equal(readRomanticRecoveryCanonicalProjection(proseOnly), null);
ok("no resolver/psych/residual; null inject does not invent classification");

// ---------------------------------------------------------------------------
section("C) Server wins over conflicting LLM projection");

const llmLie = {
  recovery_a: "deep_processing",
  recovery_b: "quick_recovery",
  recovery_mismatch: false,
};
const balanceKeep = {
  balance_a: "leader",
  balance_b: "receiver",
  sublead_idea_mood: "A",
  sublead_decision_approval: "A",
  sublead_execution: "B",
};
const llmReport = {
  section_1_summary: {
    relationship_name: "A × B",
    one_line_summary: "x",
    grade: "A",
  },
  section_1_relationship_dynamics: {
    recovery_speed: {
      headline: "B가 더 빠름",
      body: "B가 급속 회복합니다.",
    },
  },
  canonical_projections: {
    balance_of_power: balanceKeep,
    recovery_speed: llmLie,
    future_other: { keep: true },
  },
  meta: { language: "ko" },
};
const serverProjection = buildRomanticRecoveryClientProjection(canonical.value);
const injected = injectRomanticRecoveryClientProjection(
  llmReport,
  serverProjection,
);
assert.deepEqual(
  injected.canonical_projections.recovery_speed,
  finalizedMismatch,
);
assert.deepEqual(
  injected.canonical_projections.balance_of_power,
  balanceKeep,
);
assert.deepEqual(injected.canonical_projections.future_other, { keep: true });
assert.notDeepEqual(
  injected.canonical_projections.recovery_speed,
  llmLie,
);
ok("server recovery replaces LLM lie; balance_of_power preserved");

// ---------------------------------------------------------------------------
section("D) Immutability");

const priorNested = {
  recovery_speed: { ...llmLie },
  balance_of_power: balanceKeep,
  keep_me: 1,
};
const immutableInput = {
  canonical_projections: priorNested,
  section_1_relationship_dynamics: {
    recovery_speed: { headline: "h", body: "b" },
  },
};
const frozenCopy = structuredClone(immutableInput);
const out = injectRomanticRecoveryClientProjection(
  immutableInput,
  serverProjection,
);
assert.deepEqual(immutableInput, frozenCopy, "input report not mutated");
assert.deepEqual(
  immutableInput.canonical_projections.recovery_speed,
  llmLie,
);
assert.notEqual(
  out.canonical_projections,
  immutableInput.canonical_projections,
);
assert.notEqual(out.canonical_projections.recovery_speed, serverProjection);
ok("inject does not mutate report or nested projections");

// ---------------------------------------------------------------------------
section("E) Unrelated fields preserved");

assert.equal(injected.section_1_summary.relationship_name, "A × B");
assert.equal(
  injected.section_1_relationship_dynamics.recovery_speed.headline,
  "B가 더 빠름",
);
assert.equal(
  injected.section_1_relationship_dynamics.recovery_speed.body,
  "B가 급속 회복합니다.",
);
assert.deepEqual(injected.meta, { language: "ko" });
ok("summary / dynamics prose / meta unchanged");

// ---------------------------------------------------------------------------
section("F) Strip survival");

const withContext = {
  format: "romantic_saju_deep_v2",
  report: {
    romantic_context_input: {
      schema_version: "romantic_context_input_v1",
      dominant_categories: {
        recovery_a: { category: "quick_recovery" },
        residual_a: { category: "lingers" },
      },
    },
    canonical_projections: {
      balance_of_power: balanceKeep,
      recovery_speed: finalizedMismatch,
    },
    section_1_relationship_dynamics: {
      recovery_speed: { headline: "h", body: "body text" },
    },
  },
};
const stripped = stripRomanticContextInputForClient(withContext);
assert.equal(stripped.report.romantic_context_input, undefined);
assert.deepEqual(
  stripped.report.canonical_projections.recovery_speed,
  finalizedMismatch,
);
assert.deepEqual(
  stripped.report.canonical_projections.balance_of_power,
  balanceKeep,
);
const omitted = omitRomanticContextInputFromReport(withContext.report);
assert.equal(omitted.romantic_context_input, undefined);
assert.deepEqual(
  omitted.canonical_projections.recovery_speed,
  finalizedMismatch,
);
assert.equal(
  ROMANTIC_RECOVERY_SPEED_CLIENT_PATH,
  "canonical_projections.recovery_speed",
);
ok("strip removes only romantic_context_input; recovery + balance survive");

// ---------------------------------------------------------------------------
section("G) Contradictory LLM prose — typed source unchanged");

const contradictoryProse = {
  section_1_relationship_dynamics: {
    recovery_speed: {
      headline: "Jordan이 더 빨리 회복합니다",
      body: "Alex는 오래 남고 Jordan은 바로 풀립니다. residual도 섞여 서술.",
    },
  },
  canonical_projections: {
    recovery_speed: finalizedMismatch,
  },
};
const readBack = readRomanticRecoveryCanonicalProjection(contradictoryProse);
assert.deepEqual(
  recoverySpeedJudgmentFields(readBack),
  recoverySpeedJudgmentFields(finalizedMismatch),
);
const label = formatRomanticRecoveryCanonicalLabel(readBack, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko-KR",
});
assert.ok(label.includes("Alex"));
assert.ok(label.includes("Jordan") || label.includes("급속") || label.includes("심층"));
assert.ok(label.includes("격차"));
assert.equal(label.includes("잔류"), false);
ok("label from enums only; prose/residual ignored");

// ---------------------------------------------------------------------------
section("H) fromDominantCategories — scores only when stored");

const fromCats = recoverySpeedValueFromDominantCategories({
  recovery_a: { category: "quick_recovery", scores: { score: 68 } },
  recovery_b: { category: "deep_processing", scores: { score: 35 } },
  recovery_mismatch: { category: "mismatch" },
  residual_a: { category: "lingers" },
  residual_b: { category: "clears_fast" },
});
assert.deepEqual(fromCats, finalizedMismatch);
assert.equal("residual_a" in fromCats, false);

const fromCatsNoScore = recoverySpeedValueFromDominantCategories({
  recovery_a: { category: "balanced" },
  recovery_b: { category: "balanced" },
  recovery_mismatch: { category: "aligned" },
});
assert.deepEqual(fromCatsNoScore, finalizedBalanced);
assert.equal("score_a" in fromCatsNoScore, false);

assert.equal(
  recoverySpeedValueFromDominantCategories({
    recovery_a: { category: "quick_recovery" },
  }),
  null,
);
assert.equal(
  recoverySpeedValueFromDominantCategories({
    recovery_a: { category: "quick_recovery" },
    recovery_b: { category: "deep_processing" },
    recovery_mismatch: { category: "maybe" },
  }),
  null,
);

const wrap = buildRomanticRecoverySpeedCanonical(fromCats);
const proj = buildRomanticRecoveryClientProjection(wrap.value);
const afterInject = injectRomanticRecoveryClientProjection(
  { canonical_projections: { balance_of_power: balanceKeep } },
  proj,
);
assert.deepEqual(
  afterInject.canonical_projections.recovery_speed,
  finalizedMismatch,
);
assert.deepEqual(
  afterInject.canonical_projections.balance_of_power,
  balanceKeep,
);
ok("map + wrap + inject; residual categories ignored; scores optional");

// ---------------------------------------------------------------------------
section("I) Null / legacy / malformed");

assert.equal(buildRomanticRecoverySpeedCanonical(null), null);
assert.equal(buildRomanticRecoverySpeedCanonical(undefined), null);
assert.equal(buildRomanticRecoveryClientProjection(null), null);

const legacyReport = {
  section_1_relationship_dynamics: {
    recovery_speed: { headline: "h", body: "legacy body only" },
  },
};
const legacyInjected = injectRomanticRecoveryClientProjection(
  legacyReport,
  null,
);
assert.equal(legacyInjected.canonical_projections, undefined);
assert.equal(readRomanticRecoveryCanonicalProjection(legacyInjected), null);
assert.equal(
  readRomanticRecoveryCanonicalProjection({
    canonical_projections: {
      recovery_speed: { recovery_a: "quick_recovery" },
    },
  }),
  null,
);
assert.equal(
  readRomanticRecoveryCanonicalProjection({
    canonical_projections: {
      recovery_speed: {
        recovery_a: "quick_recovery",
        recovery_b: "deep_processing",
        recovery_mismatch: "yes",
      },
    },
  }),
  null,
);
ok("null/legacy/malformed → null; prose-only fallback");

// ---------------------------------------------------------------------------
section("I2) Null inject preserves balance_of_power + unrelated");

const nullInjectInput = {
  canonical_projections: {
    balance_of_power: balanceKeep,
    recovery_speed: llmLie,
    future_other: { keep: true },
  },
  section_1_relationship_dynamics: {
    recovery_speed: { headline: "h", body: "b" },
  },
};
const nullInjectFrozen = structuredClone(nullInjectInput);
const nullInjected = injectRomanticRecoveryClientProjection(
  nullInjectInput,
  null,
);
assert.deepEqual(nullInjectInput, nullInjectFrozen, "null inject is immutable");
assert.equal(
  nullInjected.canonical_projections.recovery_speed,
  undefined,
  "recovery_speed removed on null inject",
);
assert.deepEqual(
  nullInjected.canonical_projections.balance_of_power,
  balanceKeep,
);
assert.deepEqual(nullInjected.canonical_projections.future_other, {
  keep: true,
});
assert.equal(
  Object.keys(nullInjected.canonical_projections).includes("recovery_speed"),
  false,
);
ok("null inject removes only recovery_speed; balance + unrelated preserved");

// ---------------------------------------------------------------------------
section("J) Locale labels; enums identical");

const koLabel = formatRomanticRecoveryCanonicalLabel(finalizedMismatch, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko",
});
const enLabel = formatRomanticRecoveryCanonicalLabel(finalizedMismatch, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "en",
});
assert.notEqual(koLabel, enLabel);
assert.deepEqual(
  buildRomanticRecoverySpeedCanonical(finalizedMismatch).value,
  finalizedMismatch,
);

const balancedKo = formatRomanticRecoveryCanonicalLabel(finalizedBalanced, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko",
});
const balancedEn = formatRomanticRecoveryCanonicalLabel(finalizedBalanced, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "en",
});
assert.ok(balancedKo);
assert.ok(balancedEn);
assert.notEqual(balancedKo, balancedEn);
assert.equal(balancedKo.includes("격차"), false);
ok("enums identical; display labels may differ by locale");

// ---------------------------------------------------------------------------
section("K) Finalize wiring (source-level)");

const finalizeSrc = readFileSync(
  join(ROOT, "lib/prompts/relationshipPremium/romanticSajuDeep/index.ts"),
  "utf8",
);
assert.ok(
  finalizeSrc.includes("injectRomanticBalanceClientProjection"),
  "finalize must still inject balance",
);
assert.ok(
  finalizeSrc.includes("injectRomanticRecoveryClientProjection"),
  "finalize must inject recovery projection",
);
assert.ok(
  finalizeSrc.includes("recoverySpeedValueFromDominantCategories"),
);
assert.equal(
  /resolveRecoverySpeedGap/.test(
    finalizeSrc.slice(
      finalizeSrc.indexOf("function finalizeRomanticSajuDeepReport"),
      finalizeSrc.indexOf("async function callLlmJson"),
    ),
  ),
  false,
  "finalize must not re-call recovery resolver",
);

const finalizeFn = finalizeSrc.slice(
  finalizeSrc.indexOf("function finalizeRomanticSajuDeepReport"),
  finalizeSrc.indexOf("async function callLlmJson"),
);
const balanceInjectIdx = finalizeFn.indexOf(
  "injectRomanticBalanceClientProjection",
);
const recoveryInjectIdx = finalizeFn.indexOf(
  "injectRomanticRecoveryClientProjection",
);
const returnIdx = finalizeFn.indexOf("return {");
const spreadIdx = finalizeFn.indexOf("...reportWithProjections");
assert.ok(balanceInjectIdx >= 0 && recoveryInjectIdx > balanceInjectIdx);
assert.ok(returnIdx > recoveryInjectIdx);
assert.ok(spreadIdx > returnIdx || spreadIdx > recoveryInjectIdx);
assert.ok(
  finalizeFn.includes("section_1_summary") &&
    finalizeFn.includes("romantic_context_input") &&
    finalizeFn.includes("meta:"),
);
ok("finalize: balance → recovery inject; summary/context/meta server-owned");

// ---------------------------------------------------------------------------
section("L) LLM output schema string must not advertise projections");

const schemaSrc = readFileSync(
  join(ROOT, "lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema.ts"),
  "utf8",
);
const schemaStringMatch = schemaSrc.match(
  /export const ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA = `([\s\S]*?)`;/,
);
assert.ok(schemaStringMatch);
assert.equal(
  schemaStringMatch[1].includes("canonical_projections"),
  false,
  "LLM JSON skeleton must not include canonical_projections",
);
assert.ok(
  schemaSrc.includes("recovery_speed?:"),
  "TS report type may allow server-injected recovery_speed",
);
ok("LLM schema string unchanged; TS result type allows recovery projection");

console.log("\nAll romantic-recovery-speed-canonical tests passed.");
