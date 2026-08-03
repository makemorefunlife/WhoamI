/**
 * Romantic V4 Engine Consolidation — Batch A2 (current-output characterization).
 *
 * Locks in the CURRENT actual output of buildRomanticV4PrototypePayload /
 * buildActualFourCeContract for the fields named in the consolidation plan,
 * with each assertion's message stating whether the value is fixture-sourced
 * or really computed from bundleA/bundleB — determined by direct code
 * tracing, not guessed. This is a pre-Batch-C snapshot: several of these
 * assertions intentionally document a DEFECT (a static fixture value where a
 * real computation should be), not a desired end state. Batch C's job is to
 * make those specific assertions fail (by fixing the source), at which point
 * this file must be updated, not treated as a regression.
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
section("FIXTURE-SOURCED (defect: not derived from bundleA/bundleB) — will change under Batch C");

assert.equal(
  contract.reportWithPair?.section_1_summary?.relationship_name,
  "깊어지는 계절",
  "[source: romanticExperienceCompleteFixture, NOT bundleA/B] relationship identity text",
);
assert.equal(
  contract.reportWithPair?.section_4_special_bond?.only_together,
  "두 사람이 함께할 때 비로소 긴장을 풀 수 있는 여유가 생겨요.",
  "[source: fixture] special_bond.only_together",
);
assert.deepEqual(
  proj.balance_of_power,
  {
    balance_a: "leader",
    balance_b: "receiver",
    sublead_idea_mood: "A",
    sublead_decision_approval: "balanced",
    sublead_execution: "B",
  },
  "[source: fixture, NOT computed via resolveBalanceOfPower against real profiles] balance_of_power",
);
assert.deepEqual(
  proj.recovery_speed,
  { recovery_a: "quick_recovery", recovery_b: "deep_processing", recovery_mismatch: true },
  "[source: fixture, NOT computed via resolveRecoverySpeedGap] recovery_speed",
);
assert.deepEqual(
  proj.reassurance_signal,
  {
    need_a: "listening",
    need_b: "behavior_proof",
    give_a: "expression",
    give_b: "action",
    match_a_gives_b: false,
    match_b_gives_a: false,
  },
  "[source: fixture, NOT computed via resolveReassuranceBand/resolveGiveStyle] reassurance_signal",
);
assert.deepEqual(
  proj.expression_speed,
  { direction: "A", align: "confirms", confidence: "high" },
  "[source: fixture, NOT computed via resolveExpressionSpeedDirection] expression_speed",
);
ok("6 fixture-sourced fields match their current static values exactly (documented defect)");

// ---------------------------------------------------------------------------
section("PRESENT IN FIXTURE BUT NOT computed against bundleA/B either (cross_chart_tension)");

assert.equal(proj.cross_chart_tension?.dominant_type, "충");
assert.equal(proj.cross_chart_tension?.hits?.[0]?.detail, "자오충");
ok(
  "[source: fixture example, NOT resolveCrossChartTension(analyzeCrossChartRelations(bundleA,bundleB))] " +
    "cross_chart_tension currently shows a fixed example (자오충), unrelated to 지민/정우's real charts",
);

// ---------------------------------------------------------------------------
section("MISSING (not even in the fixture) — Story Planner reads these, gets undefined");

for (const key of [
  "cross_chart_stem_combine",
  "cross_chart_six_combine",
  "cross_chart_trio",
  "cross_chart_wonjin_guimun",
  "cross_chart_gongmang",
]) {
  assert.equal(proj[key], undefined, `[MISSING] canonical_projections.${key} is absent from the fixture`);
}
ok("5 cross-chart fields are absent from the only available fixture (UNDERWIRED, not just fixture-first)");

// ---------------------------------------------------------------------------
section("REAL COMPUTATION (source: pair_ce_bonding, the one field buildActualFourCeContract overrides)");

assert.ok(Array.isArray(proj.pair_ce_bonding?.packets), "pair_ce_bonding.packets must be an array");
assert.ok(
  proj.pair_ce_bonding.packets.length > 0,
  "[source: buildRomanticPairCeBondingValue(pairCe/romanticPairLens packets) — genuinely computed] pair_ce_bonding has real packets",
);
ok("pair_ce_bonding is the one canonical_projections field that is genuinely computed, not fixture-copied");

// ---------------------------------------------------------------------------
section("CE-FIRST, CORRECT PRECEDENCE (source: personalRelationshipCe, fixture only as fallback)");

const plan = buildRomanticV4PrototypePayload("complete", "ko-KR").canonicalReport?.storyPlan;
assert.ok(plan, "complete variant must produce a canonicalReport.storyPlan");

assert.equal(
  plan.personalRelationshipCeA?.spousePalaceProfile?.tenGodName,
  "편인",
  "[source: spousePalaceMatcher.ts, computed from individualCeA's day-branch ten-god] spouse palace",
);
assert.ok(
  typeof plan.personalRelationshipCeA?.dominantTenGodProfile?.datingVibe === "string" &&
    plan.personalRelationshipCeA.dominantTenGodProfile.datingVibe.length > 0,
  "[source: personalRelationshipCe.ts dominant-Ten-God extraction + tenGodRomanticProfiles.ts] dating vibe",
);
assert.ok(
  plan.hiddenHearts?.[0]?.visibleReaction?.includes("지민"),
  "[source: resolveHiddenHeartsLens(relCeA, relCeB) — CE-first, fixture is fallback-only] hidden heart",
);
assert.ok(
  typeof plan.attraction?.units?.aToB?.recognition === "string" &&
    plan.attraction.units.aToB.recognition.length > 0,
  "[source: attraction narrative units built from personalRelationshipCe] attraction",
);
ok("spouse palace, dating vibe, hidden heart, attraction are genuinely CE-computed (not fixture)");

// ---------------------------------------------------------------------------
section("Variant coverage gap — tension/minimal never build a canonicalReport at all");

const tensionPayload = buildRomanticV4PrototypePayload("tension", "ko-KR");
const minimalPayload = buildRomanticV4PrototypePayload("minimal", "ko-KR");
assert.equal(
  tensionPayload.canonicalReport,
  undefined,
  "[characterization, not a regression to fix in this batch] tension variant has no canonicalReport/storyPlan at all — " +
    "buildCanonicalRomanticV4Report is only called from createCompletePayload",
);
assert.equal(minimalPayload.canonicalReport, undefined, "minimal variant likewise has no canonicalReport");
ok("confirmed: the Story Planner pipeline only runs for the 'complete' fixture variant today");

console.log("\nOK: romantic-v4-consolidation-characterization tests passed (documenting current state, including defects)");
