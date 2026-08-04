/**
 * Romantic V4 — production-adapter parity ("no duplicate calculation").
 *
 * V1 (prepareRomanticSajuDeepRun -> LLM) and V4 (buildActualFourCeContract's
 * resolver pipeline) are not structurally comparable: V1 has no typed Gold
 * Logic output of its own to diff against — it's an LLM narrative pipeline,
 * not a resolver-based one (see romantic-v4-consolidation-boundaries.test.mjs
 * section 5, which only proves V1's module is untouched). What this batch's
 * "V1 vs V4 parity" requirement actually needs proving is the concrete claim
 * made in the plan: the production route's `precomputed` optimization
 * (reusing bundlePersonCoreForPremium's already-computed Saju master JSON,
 * see productionAdapter/buildRomanticV4ProductionInput.ts) must produce
 * BYTE-IDENTICAL output to buildActualFourCeContract computing everything
 * from scratch itself — i.e. supplying `precomputed` is purely an
 * optimization, never a source of divergence from what V1's own
 * mapSajuBundleToMasterJson/calculateSajuBundle already compute for the
 * exact same birth input.
 *
 * Run: npx tsx tests/unit/romantic-v4-v1-parity.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { calculateSajuBundle } = await import("../../lib/v2/saju/calculateSajuBundle.ts");
const { mapSajuBundleToMasterJson } = await import("../../lib/personCore/mappers/mapSajuMasterJson.ts");
const { buildActualFourCeContract } = await import(
  "../../lib/relationship/romantic/prototypeV4/buildActualFourCeContract.ts"
);

/** Strips wall-clock `built_at` provenance timestamps (genuinely non-deterministic — real per-call clock reads, not a calculation divergence) before deep-equal comparison. */
function stripBuiltAt(value) {
  if (Array.isArray(value)) return value.map(stripBuiltAt);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = k === "built_at" ? "<stripped>" : stripBuiltAt(v);
    }
    return out;
  }
  return value;
}

const birthA = { birthDate: "1985-01-10", birthTime: "03:00", birthTimeUnknown: false };
const birthB = { birthDate: "1985-01-10", birthTime: "15:00", birthTimeUnknown: false };
const pairSajuInput = { mode: "real", birthA, birthB, nameA: "Priya", nameB: "Jonas" };

// ---------------------------------------------------------------------------
section("1) Build masterA/masterB exactly as the production route does (via bundlePersonCoreForPremium's underlying functions)");

const bundleA = calculateSajuBundle({
  birthDate: birthA.birthDate,
  birthTime: birthA.birthTime,
  birthTimeUnknown: birthA.birthTimeUnknown,
});
const bundleB = calculateSajuBundle({
  birthDate: birthB.birthDate,
  birthTime: birthB.birthTime,
  birthTimeUnknown: birthB.birthTimeUnknown,
});
const masterA = mapSajuBundleToMasterJson({
  bundle: bundleA,
  birthDate: birthA.birthDate,
  birthTime: birthA.birthTime,
  birthTimeUnknown: birthA.birthTimeUnknown,
});
const masterB = mapSajuBundleToMasterJson({
  bundle: bundleB,
  birthDate: birthB.birthDate,
  birthTime: birthB.birthTime,
  birthTimeUnknown: birthB.birthTimeUnknown,
});
ok("computed masterA/masterB once, exactly as bundlePersonCoreForPremium does in production");

// ---------------------------------------------------------------------------
section("2) buildActualFourCeContract WITH precomputed vs WITHOUT — identical romantic_signals");

const withPrecomputed = buildActualFourCeContract("ko-KR", pairSajuInput, undefined, { masterA, masterB });
const fromScratch = buildActualFourCeContract("ko-KR", pairSajuInput, undefined, undefined);

assert.deepEqual(
  withPrecomputed.romanticSignalsA,
  fromScratch.romanticSignalsA,
  "romanticSignalsA must be byte-identical whether the production adapter's precomputed master is reused or recomputed from scratch",
);
assert.deepEqual(withPrecomputed.romanticSignalsB, fromScratch.romanticSignalsB);
ok("romanticSignalsA/B are byte-identical between the precomputed (production) path and the from-scratch path");

// ---------------------------------------------------------------------------
section("3) Identical canonical_projections (the Gold Logic values a report actually renders)");

assert.deepEqual(
  withPrecomputed.reportWithPair.canonical_projections,
  fromScratch.reportWithPair.canonical_projections,
  "every Gold Logic projection (balance_of_power, recovery_speed, expression_speed, cross_chart_*, etc.) must be identical regardless of whether the adapter's precomputed master JSON is used",
);
ok("canonical_projections (all cross-chart + pair-dynamics Gold Logic values) are byte-identical across both paths");

// ---------------------------------------------------------------------------
section("4) Identical pairCeBondingValue and pairSajuProvenance mode");

assert.deepEqual(withPrecomputed.pairCeBondingValue, fromScratch.pairCeBondingValue);
assert.deepEqual(withPrecomputed.pairSajuProvenance, fromScratch.pairSajuProvenance);
ok("pairCeBondingValue and pairSajuProvenance are unaffected by the precomputed optimization");

// ---------------------------------------------------------------------------
section("5) Identical full narrative input contract (what the Story Planner actually consumes)");

assert.deepEqual(
  stripBuiltAt(withPrecomputed.contract),
  stripBuiltAt(fromScratch.contract),
  "the full RomanticNarrativeInputContract fed to the Story Planner must be identical (modulo wall-clock built_at timestamps) — precomputed is purely a calculation-avoidance optimization with zero observable effect on output",
);
ok("the full narrative input contract is byte-identical — confirms 'no duplicate/divergent calculation' end to end, not just at the master-JSON layer");

// ---------------------------------------------------------------------------
section("6) The optimization actually skips computation when supplied (masterA/masterB reused by reference downstream)");

assert.equal(withPrecomputed.romanticSignalsA, masterA.domain_signals.romantic_signals);
assert.equal(withPrecomputed.romanticSignalsB, masterB.domain_signals.romantic_signals);
ok("when precomputed is supplied, romanticSignalsA/B are the exact same object read off the caller's master JSON — mapSajuBundleToMasterJson was never called a second time");

console.log("\nOK: romantic-v4-v1-parity tests passed");
