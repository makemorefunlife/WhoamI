/**
 * Romantic V4 Engine Consolidation — Batch A2 characterization, updated post-Batch-C.
 *
 * Originally locked in the PRE-Batch-C state (several fields were static V2
 * fixture values unrelated to bundleA/bundleB's real charts — see git history
 * of this file for the exact pre-Batch-C assertions and values). Batch C
 * removed the prepareRomanticSajuDeepRun call and the romanticExperienceCompleteFixture
 * spread from buildActualFourCeContract.ts; this file now documents the
 * resulting real-computation state, per the project convention that a test
 * update (not a deletion) is the correct response when the fact it documents
 * legitimately changes. The one exception: balance_of_power/expression_speed/
 * reassurance_signal/recovery_speed/unconscious_role_play remain intentionally
 * absent — a documented blocker (CurrentSelfProfile survey data unavailable),
 * not fixed by Batch C, see romantic-v4-consolidation-pair-dynamics.test.mjs.
 *
 * Run: npx tsx tests/unit/romantic-v4-consolidation-characterization.test.mjs
 */
import assert from "node:assert/strict";
import { buildActualFourCeContract } from "../../lib/relationship/romantic/prototypeV4/buildActualFourCeContract.ts";
import { buildRomanticV4PrototypePayload } from "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const contract = buildActualFourCeContract("ko-KR");
const proj = contract.reportWithPair?.canonical_projections ?? {};

// ---------------------------------------------------------------------------
section("Batch C: fixture-first fields are gone, no longer populated at all");

assert.equal(
  contract.reportWithPair?.section_1_summary,
  undefined,
  "section_1_summary no longer exists — Batch C removed the fixture spread entirely",
);
assert.equal(contract.reportWithPair?.section_4_special_bond, undefined, "section_4_special_bond likewise gone");
ok("no more static fixture text masquerading as computed report sections");

// ---------------------------------------------------------------------------
section("STILL BLOCKED (documented, not fixed by Batch C) — CurrentSelfProfile unavailable");

for (const key of [
  "balance_of_power",
  "expression_speed",
  "reassurance_signal",
  "recovery_speed",
  "unconscious_role_play",
]) {
  assert.equal(
    proj[key],
    undefined,
    `[BLOCKED, not a regression] canonical_projections.${key} intentionally absent — ` +
      "requires CurrentSelfProfile survey data that Personal CE/Pair CE do not provide in this pipeline",
  );
}
ok("5 signals remain in the explicit 'unavailable' state rather than a fabricated or stale fixture value");

// ---------------------------------------------------------------------------
section("NOW REAL COMPUTATION (Batch C) — cross-chart projections from chartA/chartB");

assert.equal(proj.cross_chart_tension?.dominant_type, "형");
assert.equal(proj.cross_chart_tension?.hits?.[0]?.detail, "진진 자형");
assert.equal(proj.cross_chart_stem_combine?.dominantCombineName, "무계합화");
assert.equal(proj.cross_chart_stem_combine?.hitCount, 3);
assert.equal(proj.cross_chart_six_combine?.hitCount, 2);
assert.equal(proj.cross_chart_wonjin_guimun?.wonjinCount, 2);
// cross_chart_trio and cross_chart_gongmang legitimately have zero hits for this
// specific fixture pair (1990-05-15 / 1992-08-20) — absent is the correct real
// computed result here, not a gap (verified: the canonicalProjections assignment
// in buildActualFourCeContract.ts only sets the key when a value exists).
assert.equal(proj.cross_chart_trio, undefined);
assert.equal(proj.cross_chart_gongmang, undefined);
ok(
  "cross_chart_tension/stem_combine/six_combine/wonjin_guimun now show exact values computed from " +
    "지민/정우's actual bundleA/bundleB charts, not a disconnected fixture example",
);

// ---------------------------------------------------------------------------
section("REAL COMPUTATION (unchanged by Batch C) — pair_ce_bonding");

assert.ok(Array.isArray(proj.pair_ce_bonding?.packets), "pair_ce_bonding.packets must be an array");
assert.ok(proj.pair_ce_bonding.packets.length > 0, "pair_ce_bonding has real packets");
ok("pair_ce_bonding was already genuinely computed pre-Batch-C and remains so");

// ---------------------------------------------------------------------------
section("Precedence fix confirmed — relationshipDefinition/sharedStrength now CE-derived, no fixture to prefer");

const plan = buildRomanticV4PrototypePayload("complete", "ko-KR").canonicalReport?.storyPlan;
assert.ok(plan, "complete variant must still produce a canonicalReport.storyPlan");

assert.ok(
  plan.relationshipDefinition.includes("지민") && plan.relationshipDefinition.includes("정우"),
  "relationshipDefinition is now built from personalRelationshipCeA/B's coreRelationshipNature " +
    "(previously would have been the static '깊어지는 계절' fixture string)",
);
assert.ok(
  plan.sharedStrength.includes("지민의 명확한 기준"),
  "sharedStrength text unchanged in content (it was already CE-sourced with fixture only as a further fallback)",
);

assert.equal(
  plan.personalRelationshipCeA?.spousePalaceProfile?.tenGodName,
  "편인",
  "[source: spousePalaceMatcher.ts] spouse palace — unaffected by Batch C",
);
assert.ok(
  typeof plan.personalRelationshipCeA?.dominantTenGodProfile?.datingVibe === "string" &&
    plan.personalRelationshipCeA.dominantTenGodProfile.datingVibe.length > 0,
  "dating vibe — unaffected by Batch C",
);
assert.ok(
  plan.hiddenHearts?.[0]?.visibleReaction?.includes("지민"),
  "hidden heart — unaffected by Batch C (was already CE-first)",
);
assert.ok(
  typeof plan.attraction?.units?.aToB?.recognition === "string" &&
    plan.attraction.units.aToB.recognition.length > 0,
  "attraction — unaffected by Batch C",
);
ok("relationship identity is now genuinely computed; the other already-correct CE-first sections are unaffected");

// ---------------------------------------------------------------------------
section("Variant coverage gap — unchanged by Batch C (out of scope for this batch)");

const tensionPayload = buildRomanticV4PrototypePayload("tension", "ko-KR");
const minimalPayload = buildRomanticV4PrototypePayload("minimal", "ko-KR");
assert.equal(
  tensionPayload.canonicalReport,
  undefined,
  "tension variant still has no canonicalReport/storyPlan — buildCanonicalRomanticV4Report " +
    "is only called from createCompletePayload; not addressed by this batch",
);
assert.equal(minimalPayload.canonicalReport, undefined, "minimal variant likewise has no canonicalReport");
ok("confirmed: still only the 'complete' fixture variant builds a canonicalReport (unchanged, out of scope)");

console.log("\nOK: romantic-v4-consolidation-characterization tests passed (post-Batch-C state)");
