/**
 * Phase 6-2d1 — Romantic balance_of_power canonical → client projection.
 * Server-authoritative classification; LLM prose = explanation only.
 * Run: npx tsx tests/unit/romantic-balance-of-power-canonical.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildRomanticBalanceOfPowerCanonical,
  buildRomanticBalanceClientProjection,
  injectRomanticBalanceClientProjection,
  balanceOfPowerValueFromDominantCategories,
  balanceOfPowerJudgmentFields,
  readRomanticBalanceCanonicalProjection,
  formatRomanticBalanceCanonicalLabel,
  ROMANTIC_BALANCE_OF_POWER_CANONICAL_SOURCE,
  ROMANTIC_BALANCE_OF_POWER_CLIENT_PATH,
  ROMANTIC_BALANCE_OF_POWER_PERSISTENCE_PATH,
  ROMANTIC_BALANCE_OF_POWER_PSYCH_MODE_LEGACY,
  ROMANTIC_BALANCE_OF_POWER_PSYCH_MODE_WITH_PSYCH,
} from "../../lib/relationship/romantic/romanticBalanceOfPowerCanonical.ts";
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

const finalizedALeads = {
  balance_a: "leader",
  balance_b: "receiver",
  sublead_idea_mood: "A",
  sublead_decision_approval: "A",
  sublead_execution: "B",
  score_a: 72,
  score_b: 41,
};

const finalizedBalanced = {
  balance_a: "balanced",
  balance_b: "balanced",
  sublead_idea_mood: "balanced",
  sublead_decision_approval: "balanced",
  sublead_execution: "balanced",
};

// ---------------------------------------------------------------------------
section("A) Wrap-only — preserves finalized values exactly");

const canonical = buildRomanticBalanceOfPowerCanonical(finalizedALeads);
assert.ok(canonical);
assert.equal(canonical.source, ROMANTIC_BALANCE_OF_POWER_CANONICAL_SOURCE);
assert.equal(
  canonical.persistencePath,
  ROMANTIC_BALANCE_OF_POWER_PERSISTENCE_PATH,
);
assert.equal(
  canonical.psychMode,
  ROMANTIC_BALANCE_OF_POWER_PSYCH_MODE_WITH_PSYCH,
);
assert.deepEqual(canonical.value, finalizedALeads);
assert.deepEqual(
  balanceOfPowerJudgmentFields(canonical.value),
  balanceOfPowerJudgmentFields(finalizedALeads),
);

const legacyCanonical = buildRomanticBalanceOfPowerCanonical(finalizedBalanced);
assert.equal(
  legacyCanonical.psychMode,
  ROMANTIC_BALANCE_OF_POWER_PSYCH_MODE_LEGACY,
);
assert.deepEqual(legacyCanonical.value, finalizedBalanced);
ok("wrap preserves fields + psychMode from scores presence");

// ---------------------------------------------------------------------------
section("B) No resolver / reclassification (source-level)");

const canonicalSrc = readFileSync(
  join(ROOT, "lib/relationship/romantic/romanticBalanceOfPowerCanonical.ts"),
  "utf8",
);
assert.equal(
  /resolveBalanceOfPower|resolveSubLeads/.test(canonicalSrc),
  false,
  "canonical module must not call balance/sublead resolvers",
);
assert.equal(
  /from\s+["'].*relationshipDynamics["']/.test(canonicalSrc) &&
    /resolveBalanceOfPower|resolveSubLeads/.test(canonicalSrc),
  false,
);
assert.ok(
  !canonicalSrc.includes("psychMatch") &&
    !canonicalSrc.includes("buildPsych"),
  "must not read psych",
);
assert.equal(
  /resolveBalanceOfPower|resolveSubLeads/.test(canonicalSrc),
  false,
);
// Helpers do not invent A/B from prose — inject/read ignore string prose fields
const proseOnly = injectRomanticBalanceClientProjection(
  {
    section_1_relationship_dynamics: {
      balance_of_power: {
        headline: "B가 주도합니다",
        body: "B가 리드하고 A는 따릅니다.",
      },
    },
  },
  null,
);
assert.equal(proseOnly.canonical_projections, undefined);
assert.equal(
  readRomanticBalanceCanonicalProjection(proseOnly),
  null,
);
ok("no resolver/psych; null inject does not invent classification");

// ---------------------------------------------------------------------------
section("C) Server wins over conflicting LLM projection");

const llmLie = {
  balance_a: "receiver",
  balance_b: "leader",
  sublead_idea_mood: "B",
  sublead_decision_approval: "B",
  sublead_execution: "A",
};
const llmReport = {
  section_1_summary: { relationship_name: "A × B", one_line_summary: "x", grade: "A" },
  section_1_relationship_dynamics: {
    balance_of_power: {
      headline: "B가 주도",
      body: "B가 리드합니다.",
    },
  },
  canonical_projections: {
    balance_of_power: llmLie,
    future_other: { keep: true },
  },
  meta: { language: "ko" },
};
const serverProjection = buildRomanticBalanceClientProjection(
  canonical.value,
);
const injected = injectRomanticBalanceClientProjection(
  llmReport,
  serverProjection,
);
assert.deepEqual(
  injected.canonical_projections.balance_of_power,
  finalizedALeads,
);
assert.deepEqual(injected.canonical_projections.future_other, { keep: true });
assert.notDeepEqual(
  injected.canonical_projections.balance_of_power,
  llmLie,
);
ok("server projection replaces LLM lie; other keys preserved");

// ---------------------------------------------------------------------------
section("D) Immutability");

const priorNested = { balance_of_power: { ...llmLie }, keep_me: 1 };
const immutableInput = {
  canonical_projections: priorNested,
  section_1_relationship_dynamics: {
    balance_of_power: { headline: "h", body: "b" },
  },
};
const frozenCopy = structuredClone(immutableInput);
const out = injectRomanticBalanceClientProjection(
  immutableInput,
  serverProjection,
);
assert.deepEqual(immutableInput, frozenCopy, "input report not mutated");
assert.deepEqual(
  immutableInput.canonical_projections.balance_of_power,
  llmLie,
);
assert.notEqual(
  out.canonical_projections,
  immutableInput.canonical_projections,
);
assert.notEqual(
  out.canonical_projections.balance_of_power,
  serverProjection,
);
ok("inject does not mutate report or nested projections");

// ---------------------------------------------------------------------------
section("E) Unrelated fields preserved");

assert.equal(
  injected.section_1_summary.relationship_name,
  "A × B",
);
assert.equal(
  injected.section_1_relationship_dynamics.balance_of_power.headline,
  "B가 주도",
);
assert.equal(
  injected.section_1_relationship_dynamics.balance_of_power.body,
  "B가 리드합니다.",
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
        balance_a: { category: "leader" },
      },
    },
    canonical_projections: {
      balance_of_power: finalizedALeads,
    },
    section_1_relationship_dynamics: {
      balance_of_power: { headline: "h", body: "body text" },
    },
  },
};
const stripped = stripRomanticContextInputForClient(withContext);
assert.equal(stripped.report.romantic_context_input, undefined);
assert.deepEqual(
  stripped.report.canonical_projections.balance_of_power,
  finalizedALeads,
);
const omitted = omitRomanticContextInputFromReport(withContext.report);
assert.equal(omitted.romantic_context_input, undefined);
assert.deepEqual(
  omitted.canonical_projections.balance_of_power,
  finalizedALeads,
);
assert.equal(ROMANTIC_BALANCE_OF_POWER_CLIENT_PATH, "canonical_projections.balance_of_power");
ok("strip removes only romantic_context_input; projection survives");

// ---------------------------------------------------------------------------
section("G) Contradictory LLM prose — typed source unchanged");

const contradictoryProse = {
  section_1_relationship_dynamics: {
    balance_of_power: {
      headline: "Jordan이 모든 데이트를 주도합니다",
      body: "Alex는 따르고 Jordan이 리드합니다. A는 수동적입니다.",
    },
  },
  canonical_projections: {
    balance_of_power: finalizedALeads,
  },
};
const readBack = readRomanticBalanceCanonicalProjection(contradictoryProse);
assert.deepEqual(
  balanceOfPowerJudgmentFields(readBack),
  balanceOfPowerJudgmentFields(finalizedALeads),
);
const label = formatRomanticBalanceCanonicalLabel(readBack, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko-KR",
});
assert.ok(label.includes("Alex"));
assert.ok(!label.includes("Jordan이 모든"), "label must not come from prose");
assert.equal(
  /Jordan이 모든|수동적/.test(label),
  false,
);
ok("prose contradiction ignored; typed Alex-leads retained");

// ---------------------------------------------------------------------------
section("H) Sublead preservation through chain");

const fromCats = balanceOfPowerValueFromDominantCategories({
  balance_a: { category: "leader", scores: { score: 72 } },
  balance_b: { category: "receiver", scores: { score: 41 } },
  sublead_idea_mood: { category: "A" },
  sublead_decision_approval: { category: "A" },
  sublead_execution: { category: "B" },
});
assert.deepEqual(fromCats, finalizedALeads);
const wrap = buildRomanticBalanceOfPowerCanonical(fromCats);
const proj = buildRomanticBalanceClientProjection(wrap.value);
const afterInject = injectRomanticBalanceClientProjection(
  {
    romantic_context_input: { dominant_categories: {} },
    section_1_relationship_dynamics: {
      balance_of_power: { headline: "x", body: "y" },
    },
  },
  proj,
);
const afterStrip = omitRomanticContextInputFromReport(afterInject);
assert.equal(afterStrip.canonical_projections.balance_of_power.sublead_idea_mood, "A");
assert.equal(
  afterStrip.canonical_projections.balance_of_power.sublead_decision_approval,
  "A",
);
assert.equal(
  afterStrip.canonical_projections.balance_of_power.sublead_execution,
  "B",
);
assert.equal(afterStrip.romantic_context_input, undefined);
ok("all three subleads survive wrap → projection → inject → strip");

// ---------------------------------------------------------------------------
section("I) Null / legacy — no invented projection");

assert.equal(buildRomanticBalanceOfPowerCanonical(null), null);
assert.equal(buildRomanticBalanceOfPowerCanonical(undefined), null);
assert.equal(buildRomanticBalanceClientProjection(null), null);
assert.equal(
  balanceOfPowerValueFromDominantCategories({
    balance_a: { category: "leader" },
  }),
  null,
);

const legacyReport = {
  section_1_relationship_dynamics: {
    balance_of_power: {
      headline: "레거시 헤드라인",
      body: "레거시 본문만 있음",
    },
  },
};
const legacyInjected = injectRomanticBalanceClientProjection(legacyReport, null);
assert.equal(legacyInjected.canonical_projections, undefined);
assert.equal(
  legacyInjected.section_1_relationship_dynamics.balance_of_power.body,
  "레거시 본문만 있음",
);
assert.equal(readRomanticBalanceCanonicalProjection(legacyInjected), null);
assert.equal(
  readRomanticBalanceCanonicalProjection({
    canonical_projections: { balance_of_power: { balance_a: "leader" } },
  }),
  null,
  "malformed projection ignored",
);
ok("null/legacy/malformed → no invent; prose preserved");

// ---------------------------------------------------------------------------
section("J) Locale independence of enum / label localization");

const koLabel = formatRomanticBalanceCanonicalLabel(finalizedALeads, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko-KR",
});
const enLabel = formatRomanticBalanceCanonicalLabel(finalizedALeads, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "en-US",
});
assert.notEqual(koLabel, enLabel);
assert.deepEqual(
  balanceOfPowerJudgmentFields(
    buildRomanticBalanceOfPowerCanonical(finalizedALeads).value,
  ),
  balanceOfPowerJudgmentFields(finalizedALeads),
);
const balancedKo = formatRomanticBalanceCanonicalLabel(finalizedBalanced, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko",
});
const balancedEn = formatRomanticBalanceCanonicalLabel(finalizedBalanced, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "en",
});
assert.ok(balancedKo);
assert.ok(balancedEn);
assert.notEqual(balancedKo, balancedEn);
ok("enums identical; display labels may differ by locale");

// ---------------------------------------------------------------------------
section("Finalize wiring (source-level)");

const finalizeSrc = readFileSync(
  join(ROOT, "lib/prompts/relationshipPremium/romanticSajuDeep/index.ts"),
  "utf8",
);
assert.ok(
  finalizeSrc.includes("injectRomanticBalanceClientProjection"),
  "finalize must inject balance projection",
);
assert.ok(
  finalizeSrc.includes("balanceOfPowerValueFromDominantCategories"),
);
const finalizeFn = finalizeSrc.slice(
  finalizeSrc.indexOf("function finalizeRomanticSajuDeepReport"),
  finalizeSrc.indexOf("async function callLlmJson"),
);
const injectIdx = finalizeFn.indexOf("injectRomanticBalanceClientProjection");
const returnIdx = finalizeFn.indexOf("return {");
const spreadIdx = finalizeFn.indexOf("...reportWithBalanceProjection");
assert.ok(injectIdx >= 0 && returnIdx > injectIdx);
assert.ok(spreadIdx > returnIdx || spreadIdx > injectIdx);
assert.ok(
  finalizeFn.includes("section_1_summary") &&
    finalizeFn.includes("romantic_context_input") &&
    finalizeFn.includes("meta:"),
);
ok("finalize injects after LLM spread; summary/context/meta still server-owned");

console.log("\nAll romantic-balance-of-power-canonical tests passed.");
