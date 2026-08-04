/**
 * Romantic V4 — pair-dynamics Gold Logic (balance of power, recovery-speed
 * gap, expression-speed direction, reassurance signals, residual, and
 * unconscious role play), restored via romanticV4PairDynamicsFusion.ts.
 *
 * Exact-value characterization: cross-checks buildRomanticV4PairDynamicsProjections
 * against directly calling collectRomanticDynamicsTypedSnapshot + the six
 * *Canonical.ts wrap functions V1 already uses, for observed / partial /
 * unobserved survey scenarios. Also verifies buildActualFourCeContract's
 * canonical_projections match the resolver's own output exactly (no
 * duplicate/divergent calculation).
 *
 * Run: npx tsx tests/unit/romantic-v4-pair-dynamics.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { buildRomanticV4PairDynamicsProjections } = await import(
  "../../lib/relationship/romantic/prototypeV4/romanticV4PairDynamicsFusion.ts"
);
const { buildActualFourCeContract } = await import(
  "../../lib/relationship/romantic/prototypeV4/buildActualFourCeContract.ts"
);
const { calculateSajuBundle } = await import("../../lib/v2/saju/calculateSajuBundle.ts");
const { buildChartContext } = await import("../../lib/saju/chartContext.ts");
const { mapSajuBundleToMasterJson } = await import("../../lib/personCore/mappers/mapSajuMasterJson.ts");
const { analyzePairSaju, sajuJsonToPillars } = await import("../../lib/saju/pairChartAnalysis.ts");
const {
  collectRomanticDynamicsTypedSnapshot,
} = await import("../../lib/relationship/romantic/romanticContextInput.ts");
const { resolveExpressionSpeedDirection } = await import(
  "../../lib/relationship/romanticRules/relationshipDynamics.ts"
);
const { balanceOfPowerValueFromDynamicsSnapshot, buildRomanticBalanceOfPowerCanonical } = await import(
  "../../lib/relationship/romantic/romanticBalanceOfPowerCanonical.ts"
);
const { recoverySpeedValueFromDynamicsSnapshot, buildRomanticRecoverySpeedCanonical } = await import(
  "../../lib/relationship/romantic/romanticRecoverySpeedCanonical.ts"
);
const { expressionSpeedValueFromFinalized, buildRomanticExpressionSpeedCanonical } = await import(
  "../../lib/relationship/romantic/romanticExpressionSpeedCanonical.ts"
);
const { reassuranceValueFromDynamicsSnapshot, buildRomanticReassuranceCanonical } = await import(
  "../../lib/relationship/romantic/romanticReassuranceCanonical.ts"
);
const { residualValueFromDynamicsSnapshot, buildRomanticResidualCanonical } = await import(
  "../../lib/relationship/romantic/romanticResidualCanonical.ts"
);
const { rolePlayValueFromDynamicsSnapshot, buildRomanticRolePlayCanonical } = await import(
  "../../lib/relationship/romantic/romanticRolePlayCanonical.ts"
);
const { buildNeutralV2Profile } = await import("../../lib/v2/survey/neutralProfile.ts");

function makeProfile(overrides) {
  const base = buildNeutralV2Profile();
  return { ...base, secondary_axes: { ...base.secondary_axes, ...overrides } };
}

// A: high energy/recognition (leader), high resilience/self_control (quick recovery), high empathy
const profileA = makeProfile({
  energy_style: 90,
  recognition: 85,
  resilience: 88,
  self_control: 80,
  empathy: 75,
  conflict_style: 70,
});
// B: mirror-low on every axis
const profileB = makeProfile({
  energy_style: 10,
  recognition: 15,
  resilience: 12,
  self_control: 20,
  empathy: 25,
  conflict_style: 30,
});

const BIRTH_A = { birthDate: "1985-01-10", birthTime: "03:00", birthTimeUnknown: false };
const BIRTH_B = { birthDate: "1990-06-15", birthTime: "18:00", birthTimeUnknown: false };

function buildRealInputs(birthA, birthB) {
  const bundleA = calculateSajuBundle(birthA);
  const bundleB = calculateSajuBundle(birthB);
  const sajuA = sajuJsonToPillars(bundleA.saju);
  const sajuB = sajuJsonToPillars(bundleB.saju);
  const chartA = buildChartContext(sajuA);
  const chartB = buildChartContext(sajuB);
  const masterA = mapSajuBundleToMasterJson({
    bundle: bundleA,
    birthDate: birthA.birthDate,
    birthTime: birthA.birthTime ?? null,
    birthTimeUnknown: birthA.birthTimeUnknown ?? false,
  });
  const masterB = mapSajuBundleToMasterJson({
    bundle: bundleB,
    birthDate: birthB.birthDate,
    birthTime: birthB.birthTime ?? null,
    birthTimeUnknown: birthB.birthTimeUnknown ?? false,
  });
  return {
    sajuA,
    sajuB,
    chartA,
    chartB,
    romanticSignalsA: masterA.domain_signals.romantic_signals,
    romanticSignalsB: masterB.domain_signals.romantic_signals,
  };
}

const inputs = buildRealInputs(BIRTH_A, BIRTH_B);

/** Reference computation via the raw resolvers, bypassing romanticV4PairDynamicsFusion.ts entirely. */
function referenceProjections(profileA, profileB) {
  const pairAnalysis = analyzePairSaju(inputs.sajuA, inputs.sajuB, {
    chartA: inputs.chartA,
    chartB: inputs.chartB,
  });
  const snapshot = collectRomanticDynamicsTypedSnapshot({
    profileA,
    profileB,
    romanticA: inputs.romanticSignalsA,
    romanticB: inputs.romanticSignalsB,
    chartA: inputs.chartA,
    chartB: inputs.chartB,
    dayStemInteraction: pairAnalysis.dayStemInteraction,
    dayBranchCrossHits: pairAnalysis.dayBranchCrossHits,
  });
  const direction = resolveExpressionSpeedDirection(profileA, profileB);
  return {
    balance_of_power: buildRomanticBalanceOfPowerCanonical(balanceOfPowerValueFromDynamicsSnapshot(snapshot)).value,
    recovery_speed: buildRomanticRecoverySpeedCanonical(recoverySpeedValueFromDynamicsSnapshot(snapshot)).value,
    expression_speed: buildRomanticExpressionSpeedCanonical(expressionSpeedValueFromFinalized({ direction })).value,
    reassurance_signal: buildRomanticReassuranceCanonical(reassuranceValueFromDynamicsSnapshot(snapshot)).value,
    residual: buildRomanticResidualCanonical(residualValueFromDynamicsSnapshot(snapshot)).value,
    unconscious_role_play: buildRomanticRolePlayCanonical(rolePlayValueFromDynamicsSnapshot(snapshot)).value,
  };
}

function callResolver(profileA, profileB) {
  return buildRomanticV4PairDynamicsProjections({
    profileA,
    profileB,
    romanticSignalsA: inputs.romanticSignalsA,
    romanticSignalsB: inputs.romanticSignalsB,
    chartA: inputs.chartA,
    chartB: inputs.chartB,
    sajuA: inputs.sajuA,
    sajuB: inputs.sajuB,
  });
}

// ---------------------------------------------------------------------------
section("1) Observed (both real) — exact match against direct resolver calls");

const observed = callResolver(profileA, profileB);
assert.deepEqual(observed.projections, referenceProjections(profileA, profileB));
assert.equal(observed.evidenceStatus, "observed");
ok("all 6 projections match direct collectRomanticDynamicsTypedSnapshot + *Canonical.ts calls exactly");

// ---------------------------------------------------------------------------
section("2) Crafted asymmetry produces the expected direction, not just any non-neutral band");

assert.equal(observed.projections.balance_of_power.balance_a, "leader");
assert.equal(observed.projections.balance_of_power.balance_b, "receiver");
assert.equal(observed.projections.recovery_speed.recovery_a, "quick_recovery");
assert.equal(observed.projections.recovery_speed.recovery_b, "deep_processing");
assert.equal(observed.projections.recovery_speed.recovery_mismatch, true);
ok("balance/recovery bands reflect the crafted A>B asymmetry in the correct direction");

// ---------------------------------------------------------------------------
section("3) Partial survey (A only) cannot activate strong claims, but keeps A's own real data");

const partial = callResolver(profileA, null);
assert.equal(partial.evidenceStatus, "partial_inference");
assert.equal(partial.projections.balance_of_power.balance_a, "balanced");
assert.equal(partial.projections.balance_of_power.balance_b, "balanced");
assert.equal(partial.projections.balance_of_power.score_a, observed.projections.balance_of_power.score_a);
assert.equal(partial.projections.balance_of_power.score_b, undefined);
assert.equal(partial.projections.recovery_speed.recovery_a, "quick_recovery", "A's own real band is preserved");
assert.equal(partial.projections.recovery_speed.recovery_b, "balanced", "B's band must not be guessed");
assert.equal(partial.projections.recovery_speed.recovery_mismatch, false, "no cross-person gap claim without B's data");
assert.deepEqual(partial.projections, referenceProjections(profileA, null));
ok("missing B never produces a leader/receiver or mismatch claim, but A's own real band/score survives");

// ---------------------------------------------------------------------------
section("4) Unobserved (neither real) — every survey-dependent projection is neutral");

const unobserved = callResolver(null, null);
assert.equal(unobserved.evidenceStatus, "unobserved");
assert.deepEqual(unobserved.projections.balance_of_power, {
  balance_a: "balanced",
  balance_b: "balanced",
  sublead_idea_mood: observed.projections.balance_of_power.sublead_idea_mood,
  sublead_decision_approval: observed.projections.balance_of_power.sublead_decision_approval,
  sublead_execution: observed.projections.balance_of_power.sublead_execution,
});
assert.deepEqual(unobserved.projections.recovery_speed, {
  recovery_a: "balanced",
  recovery_b: "balanced",
  recovery_mismatch: false,
});
assert.equal(unobserved.projections.expression_speed.direction, "balanced");
assert.equal(unobserved.projections.unconscious_role_play.primary_frame, "peer");
assert.deepEqual(unobserved.projections, referenceProjections(null, null));
ok("with no survey at all, every survey-dependent projection reads its safe neutral band, matching the reference exactly");

// ---------------------------------------------------------------------------
section("5) Saju-only projections (residual, role_play.saju_frame) stay identical across all 3 scenarios");

assert.deepEqual(observed.projections.residual, partial.projections.residual);
assert.deepEqual(observed.projections.residual, unobserved.projections.residual);
assert.equal(
  observed.projections.unconscious_role_play.saju_frame,
  unobserved.projections.unconscious_role_play.saju_frame,
);
ok("residual and role_play.saju_frame never change with survey availability — Saju-only confidence stays intact");

// ---------------------------------------------------------------------------
section("6) dayStemInteraction is deterministic and independent of survey");

assert.equal(observed.dayStemInteraction, partial.dayStemInteraction);
assert.equal(observed.dayStemInteraction, unobserved.dayStemInteraction);
assert.equal(typeof observed.dayStemInteraction, "string");
assert.ok(observed.dayStemInteraction.length > 0);
ok("dayStemInteraction (from analyzePairSaju) is identical across all 3 survey scenarios");

// ---------------------------------------------------------------------------
section("7) No duplicate interpretation: buildActualFourCeContract's canonical_projections match the resolver exactly");

const contractResult = buildActualFourCeContract(
  "ko-KR",
  { mode: "real", birthA: BIRTH_A, birthB: BIRTH_B, nameA: "Nova", nameB: "Kai" },
  { mode: "real", profileA, profileB },
);
const projectionsInReport = contractResult.reportWithPair.canonical_projections;
for (const key of [
  "balance_of_power",
  "recovery_speed",
  "expression_speed",
  "reassurance_signal",
  "residual",
  "unconscious_role_play",
]) {
  assert.deepEqual(
    projectionsInReport[key],
    contractResult.pairDynamics.projections[key],
    `canonical_projections.${key} must be the exact same object buildRomanticV4PairDynamicsProjections produced — not recomputed separately`,
  );
}
ok("buildActualFourCeContract injects the resolver's own projections verbatim into canonical_projections — no second calculation");

console.log("\nOK: romantic-v4-pair-dynamics tests passed");
