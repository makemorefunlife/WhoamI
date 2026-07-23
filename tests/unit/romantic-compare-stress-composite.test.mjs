/**
 * Phase 5-3 — Romantic compare 「스트레스 패턴」 composite.
 * Run: npx tsx tests/unit/romantic-compare-stress-composite.test.mjs
 */
import assert from "node:assert/strict";
import {
  refineCompareStressPerson,
  refineCompareStressPair,
} from "../../lib/relationship/romantic/compareStressComposite.ts";
import { buildRomanticContextInput } from "../../lib/relationship/romantic/romanticContextInput.ts";
import { prepareRomanticSajuDeepRun } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/index.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { mapSajuBundleToMasterJson } from "../../lib/personCore/mappers/mapSajuMasterJson.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function sampleProfile(self_control) {
  const keys = [
    "stimulation",
    "self_control",
    "practicality",
    "structure",
    "empathy",
    "conflict_style",
    "resilience",
    "recognition",
    "energy_style",
    "thinking_style",
    "decision_style",
  ];
  const secondary_axes = Object.fromEntries(keys.map((k) => [k, 50]));
  secondary_axes.self_control = self_control;
  return {
    profile_type: "current_self",
    primary_axes: {
      autonomy: 50,
      connection: 50,
      stability: 50,
      growth: 50,
      structure: 50,
      adaptability: 50,
    },
    secondary_axes,
    personalization: { primary_concern: null },
    meta: {
      survey_version: "v2",
      completed_at: "2026-01-01T00:00:00.000Z",
      completion_time_seconds: null,
    },
  };
}

/** 강한 explosive — heat 극단 */
const strongExplosive = {
  heat_score: 80,
  temperature_band: "hot",
  stress_band: "explosive",
};
/** 강한 withdrawn */
const strongWithdrawn = {
  heat_score: 20,
  temperature_band: "cold",
  stress_band: "withdrawn",
};
/** 약한 explosive — hot이지만 |heat−50|<20 */
const weakExplosive = {
  heat_score: 60,
  temperature_band: "hot",
  stress_band: "explosive",
};
const steadyBand = {
  heat_score: 50,
  temperature_band: "neutral",
  stress_band: "steady",
};

assert.ok(Math.abs(strongExplosive.heat_score - 50) >= 20);
assert.ok(Math.abs(weakExplosive.heat_score - 50) < 20);

// ---------------------------------------------------------------------------
section("1) psych mid → base + caution/low");

const mid = refineCompareStressPerson({
  stress: strongExplosive,
  selfControl: 50,
});
assert.equal(mid.lean, "explosive");
assert.equal(mid.align, "caution");
assert.equal(mid.confidence, "low");
ok("mid");

// ---------------------------------------------------------------------------
section("2) psych 동의 → confirms/high");

const confirms = refineCompareStressPerson({
  stress: strongExplosive,
  selfControl: 30,
});
assert.equal(confirms.lean, "explosive");
assert.equal(confirms.align, "confirms");
assert.equal(confirms.confidence, "high");
ok("confirms");

// ---------------------------------------------------------------------------
section("3) 강한 조후 + 반대 psych → flip 금지");

const locked = refineCompareStressPerson({
  stress: strongExplosive,
  selfControl: 75,
});
assert.equal(locked.lean, "explosive");
assert.equal(locked.flipped, false);
assert.equal(locked.align, "caution");
assert.equal(locked.confidence, "low");
ok("saju lock");

// ---------------------------------------------------------------------------
section("4) 약한 조후 + 강한 반대 psych → soft flip");

const softFlip = refineCompareStressPerson({
  stress: weakExplosive,
  selfControl: 70,
});
assert.equal(softFlip.lean, "withdrawn");
assert.equal(softFlip.base, "explosive");
assert.equal(softFlip.flipped, true);
assert.equal(softFlip.confidence, "high");
ok("soft flip");

// ---------------------------------------------------------------------------
section("5) steady + clear psych → soft fill");

const fill = refineCompareStressPerson({
  stress: steadyBand,
  selfControl: 25,
});
assert.equal(fill.lean, "explosive");
assert.equal(fill.base, "steady");
assert.equal(fill.flipped, true);
ok("soft fill");

// ---------------------------------------------------------------------------
section("6) pair — self_control 한쪽 누락 → null");

assert.equal(
  refineCompareStressPair({
    stressA: strongExplosive,
    stressB: strongWithdrawn,
    profileA: sampleProfile(30),
    profileB: null,
  }),
  null,
);
ok("legacy null");

// ---------------------------------------------------------------------------
section("7) context_input · recovery/residual 키 비충돌");

const pair = refineCompareStressPair({
  stressA: strongExplosive,
  stressB: strongWithdrawn,
  profileA: sampleProfile(30),
  profileB: sampleProfile(70),
});
assert.ok(pair);
assert.equal(pair.align, "confirms");

const eventScores = {
  intimacy: { activation: 1, benefit: 1, risk: 1 },
  conflict: { activation: 1, benefit: 1, risk: 1 },
  stability: { activation: 1, benefit: 1, risk: 1 },
  overall: { activation: 1, benefit: 1, risk: 1 },
};
const romanticA = {
  expression_style: { food_count: 1, expression_band: "balanced" },
  conflict_response: {
    officer_count: 1,
    food_count: 1,
    day_branch_tension_hits: [],
    conflict_band: "balanced",
  },
  affection_language: {
    wealth_count: 1,
    seal_count: 1,
    affection_band: "balanced",
  },
  stress_pattern: strongExplosive,
  decision_making: { strength_label: "중화", decision_band: "balanced" },
  communication_style: {
    self_count: 1,
    seal_count: 1,
    communication_band: "balanced",
  },
};
const romanticB = { ...romanticA, stress_pattern: strongWithdrawn };

const ctx = buildRomanticContextInput({
  grade: "B",
  eventScores,
  romanticSignalsA: romanticA,
  romanticSignalsB: romanticB,
  profileA: sampleProfile(30),
  profileB: sampleProfile(70),
  stressComposite: pair,
});

assert.equal(ctx.dominant_categories.compare_stress_a.category, "explosive");
assert.equal(ctx.dominant_categories.compare_stress_b.category, "withdrawn");
assert.equal(ctx.dominant_categories.compare_stress_align.category, "confirms");
assert.equal(ctx.dominant_categories.recovery_a, undefined);
assert.equal(ctx.dominant_categories.residual_a, undefined);
assert.equal(ctx.dominant_categories.compare_stress_lean_a, undefined);
assert.equal(
  ctx.dominant_categories.compare_decision_a.category,
  "balanced",
);
ok("context keys");

// ---------------------------------------------------------------------------
section("8) prepare — compare_stress SSOT · recovery 줄 유지");

const birthA = { date: "1990-05-15", time: "14:30", place: "서울" };
const birthB = { date: "1992-08-20", time: "09:00", place: "부산" };
const b1 = calculateSajuBundle({
  birthDate: birthA.date,
  birthTime: birthA.time,
});
const b2 = calculateSajuBundle({
  birthDate: birthB.date,
  birthTime: birthB.time,
});
function toSajuJson(bundle) {
  return {
    saju: bundle.saju,
    dayStemData: bundle.dayStemData,
    dayBranchData: bundle.dayBranchData,
    hiddenStemsData: bundle.hiddenStemsData,
    tenGods: bundle.tenGods,
    relations: bundle.relations,
    shinsals: bundle.shinsals,
  };
}
const masterA = mapSajuBundleToMasterJson({
  bundle: b1,
  birthDate: birthA.date,
  birthTime: birthA.time,
  birthTimeUnknown: false,
});
const masterB = mapSajuBundleToMasterJson({
  bundle: b2,
  birthDate: birthB.date,
  birthTime: birthB.time,
  birthTimeUnknown: false,
});

const prepared = prepareRomanticSajuDeepRun({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  birthA,
  birthB,
  sajuJsonA: toSajuJson(b1),
  sajuJsonB: toSajuJson(b2),
  sajuMasterA: masterA,
  sajuMasterB: masterB,
  surveyProfileA: sampleProfile(70),
  surveyProfileB: sampleProfile(30),
  locale: "ko",
});

assert.ok(prepared.userPrompt.includes("compare_stress"));
assert.ok(prepared.userPrompt.includes("recovery_speed:"));
assert.ok(
  prepared.romanticContextInput.dominant_categories.compare_stress_align,
);
assert.ok(
  prepared.romanticContextInput.dominant_categories.recovery_a,
  "recovery dynamics 키 유지",
);
ok("prepare wiring");

console.log("\nAll romantic-compare-stress-composite tests passed.");
