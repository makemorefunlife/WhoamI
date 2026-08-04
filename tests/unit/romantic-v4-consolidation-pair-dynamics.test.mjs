/**
 * Romantic V4 Engine Consolidation — Batch A1 (pair-dynamics calculation lock).
 *
 * Locks in exact-value behavior for the relationshipDynamics.ts functions
 * named in the consolidation plan (balance of power, expression speed,
 * reassurance, recovery speed, unconscious role play) BEFORE Batch B
 * relocates them. No exact-value test for these functions existed anywhere
 * in the repo before this file — the only prior coverage was the
 * *-canonical.test.mjs wrap/inject tests, which never call the resolvers
 * themselves (see romantic-balance-of-power-canonical.test.mjs etc.).
 *
 * RESOLVED (Restore Romantic 11-axis Gold Logic batch): the blocker described
 * below — no real CurrentSelfProfile reaching these functions anywhere in
 * prototypeV4 — is now closed. romanticV4PairDynamicsFusion.ts calls these
 * exact functions (via collectRomanticDynamicsTypedSnapshot) with the real
 * profileA/profileB threaded from RomanticV4SurveyInput, and
 * buildActualFourCeContract.ts injects the result into canonical_projections.
 * See romantic-v4-pair-dynamics.test.mjs for the wiring-level exact-value
 * characterization (including the "cannot activate strong claims when
 * synthetic" safety property). This file still stands as-is: it tests the
 * FUNCTIONS in isolation, which is valid and unaffected by the wiring fix.
 *
 * Original blocker note (kept for history): resolveBalanceOfPower,
 * resolveRecoverySpeedGap, resolveExpressionSpeedDirection,
 * resolveUnconsciousRolePlay, and resolveReassuranceBand all require
 * CurrentSelfProfile (lib/v2/survey/types — an 11-axis SURVEY-derived psych
 * profile), not saju facts. Neither Personal CE (personalContextEngine,
 * chart-only) nor Pair CE (pairContextEngine) currently carry or compute a
 * CurrentSelfProfile anywhere in the prototypeV4 pipeline — a real person's
 * survey answers are never constructed for the fixture people ("지민"/"정우").
 * This is exactly the stop condition "Pair CE가 relationshipDynamics 계산에
 * 필요한 input을 제공하지 않음". This file tests the FUNCTIONS in isolation
 * (proving the calculation rule survives relocation) but does NOT resolve
 * how V4 obtains a real CurrentSelfProfile per person — that was the Batch C
 * blocker, now resolved (see above).
 *
 * resolveReassuranceMatch, resolveGiveStyle, resolveSajuFrame,
 * resolveSajuFrameDirection, and resolveCrossChartTension (tested in the
 * companion cross-chart file) are saju-fact-based only and are NOT affected
 * by this gap.
 *
 * Run: npx tsx tests/unit/romantic-v4-consolidation-pair-dynamics.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveBalanceOfPower,
  resolveRecoverySpeedGap,
  resolveExpressionSpeedDirection,
  resolveUnconsciousRolePlay,
  resolveReassuranceBand,
  resolveReassuranceMatch,
  resolveGiveStyle,
  resolveSajuFrameDirection,
} from "../../lib/relationship/romanticRules/relationshipDynamics.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function profile(overrides = {}) {
  const base = {
    stimulation: 50,
    self_control: 50,
    practicality: 50,
    structure: 50,
    empathy: 50,
    conflict_style: 50,
    resilience: 50,
    recognition: 50,
    energy_style: 50,
    thinking_style: 50,
    decision_style: 50,
  };
  return { secondary_axes: { ...base, ...overrides } };
}

function romanticSignals(overrides = {}) {
  return {
    expression_style: { food_count: 1, expression_band: "steady" },
    conflict_response: {
      officer_count: 1,
      food_count: 1,
      day_branch_tension_hits: [],
      conflict_band: "steady",
    },
    affection_language: { wealth_count: 1, seal_count: 1, affection_band: "steady" },
    stress_pattern: { heat_score: 50, temperature_band: "neutral", stress_band: "steady" },
    decision_making: { strength_label: "중화", decision_band: "steady" },
    communication_style: { self_count: 1, seal_count: 1, communication_band: "steady" },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
section("1) resolveBalanceOfPower — (외향에너지+인정욕구)/2 gap>=15");

assert.deepEqual(resolveBalanceOfPower(null, profile()), {
  scoreA: null,
  scoreB: 50,
  bandA: "balanced",
  bandB: "balanced",
});
ok("null profileA -> scoreA null, scoreB still computed independently, bands balanced");

const leaderA = resolveBalanceOfPower(
  profile({ energy_style: 80, recognition: 80 }),
  profile({ energy_style: 50, recognition: 50 }),
);
assert.equal(leaderA.bandA, "leader");
assert.equal(leaderA.bandB, "receiver");
assert.equal(leaderA.scoreA, 80);
assert.equal(leaderA.scoreB, 50);
ok("A's (energy+recognition)/2 exceeds B's by >=15 -> A=leader, B=receiver");

const balanced = resolveBalanceOfPower(profile(), profile());
assert.equal(balanced.bandA, "balanced");
assert.equal(balanced.bandB, "balanced");
ok("equal scores -> balanced/balanced");

// ---------------------------------------------------------------------------
section("2) resolveRecoverySpeedGap — (회복탄력성+자기통제)/2, >=60 quick / <=40 deep");

const quickA = resolveRecoverySpeedGap(
  profile({ resilience: 70, self_control: 70 }),
  profile({ resilience: 30, self_control: 30 }),
);
assert.equal(quickA.bandA, "quick_recovery");
assert.equal(quickA.bandB, "deep_processing");
assert.equal(quickA.mismatch, true);
ok("score>=60 -> quick_recovery, score<=40 -> deep_processing, gap>=15 -> mismatch=true");

const midBand = resolveRecoverySpeedGap(profile({ resilience: 50, self_control: 50 }), profile());
assert.equal(midBand.bandA, "balanced");
ok("score strictly between 40 and 60 -> balanced");

// ---------------------------------------------------------------------------
section("3) resolveExpressionSpeedDirection — (갈등직면성-자기통제) gap>=15");

assert.equal(resolveExpressionSpeedDirection(null, profile()), "balanced");
ok("null profile -> balanced");

assert.equal(
  resolveExpressionSpeedDirection(
    profile({ conflict_style: 85, self_control: 30 }),
    profile({ conflict_style: 40, self_control: 60 }),
  ),
  "A",
);
ok("A's (conflict_style-self_control) exceeds B's by >=15 -> 'A'");

assert.equal(resolveExpressionSpeedDirection(profile(), profile()), "balanced");
ok("equal profiles -> balanced");

// ---------------------------------------------------------------------------
section("4) resolveUnconsciousRolePlay — (empathy+self_control) gap, contribution margin=5");

assert.equal(resolveUnconsciousRolePlay(profile(), profile()), "peer");
ok("equal profiles -> peer");

const saviorDependent = resolveUnconsciousRolePlay(
  profile({ empathy: 90, self_control: 50 }),
  profile({ empathy: 50, self_control: 50 }),
);
assert.equal(saviorDependent, "savior_dependent");
ok("gap driven mostly by empathy difference -> savior_dependent");

const mentorStudent = resolveUnconsciousRolePlay(
  profile({ empathy: 50, self_control: 90 }),
  profile({ empathy: 50, self_control: 50 }),
);
assert.equal(mentorStudent, "mentor_student");
ok("gap driven mostly by self_control difference -> mentor_student");

// ---------------------------------------------------------------------------
section("5) resolveReassuranceBand — empathy>=60 + day-stem-rooted");

assert.equal(resolveReassuranceBand(profile({ empathy: 70 }), true), "both");
assert.equal(resolveReassuranceBand(profile({ empathy: 30 }), true), "behavior_proof");
assert.equal(resolveReassuranceBand(profile({ empathy: 70 }), false), "listening");
assert.equal(resolveReassuranceBand(profile({ empathy: 30 }), false), "presence");
ok("all 4 empathy x rootedness combinations produce the documented band");

// ---------------------------------------------------------------------------
section("6) resolveGiveStyle — dominant count among 5 categories, fixed tie-break order");

assert.equal(
  resolveGiveStyle(
    romanticSignals({ affection_language: { wealth_count: 1, seal_count: 3, affection_band: "steady" } }),
  ),
  "care",
  "seal_count dominates -> care",
);
assert.equal(
  resolveGiveStyle(romanticSignals()),
  "care",
  "all counts tied at 1 -> fixed tie-break order picks 'care' first",
);
ok("dominant count wins; ties resolve to the documented fixed order");

// ---------------------------------------------------------------------------
section("7) resolveReassuranceMatch — need band vs partner give style compatibility table");

assert.equal(resolveReassuranceMatch("listening", "expression"), true);
assert.equal(resolveReassuranceMatch("listening", "action"), false);
assert.equal(resolveReassuranceMatch("behavior_proof", "action"), true);
assert.equal(resolveReassuranceMatch("presence", "solidarity"), true);
assert.equal(resolveReassuranceMatch("presence", "care"), false);
ok("compatibility table matches documented GIVE_STYLE_COMPATIBLE_WITH_NEED exactly");

// ---------------------------------------------------------------------------
section("8) resolveSajuFrameDirection — 인성+관성 gap>=2 (saju-fact-based, not blocked)");

const aHigh = resolveSajuFrameDirection(
  romanticSignals({ affection_language: { wealth_count: 1, seal_count: 3, affection_band: "steady" } }),
  romanticSignals(),
);
assert.equal(aHigh, "A");
ok("A's seal+officer sum exceeds B's by >=2 -> 'A'");

const saBalanced = resolveSajuFrameDirection(romanticSignals(), romanticSignals());
assert.equal(saBalanced, "balanced");
ok("equal sums -> balanced");

console.log("\nOK: romantic-v4-consolidation-pair-dynamics tests passed");
console.log(
  "\nBLOCKER RESOLVED (Restore Romantic 11-axis Gold Logic batch): resolveBalanceOfPower/" +
    "RecoverySpeedGap/ExpressionSpeedDirection/UnconsciousRolePlay/ReassuranceBand now receive " +
    "real CurrentSelfProfile via romanticV4PairDynamicsFusion.ts — see romantic-v4-pair-dynamics.test.mjs.",
);
