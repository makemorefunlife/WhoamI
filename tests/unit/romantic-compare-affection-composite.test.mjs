/**
 * Phase 5-3 — Romantic compare 「애정 언어」 composite.
 * Run: npx tsx tests/unit/romantic-compare-affection-composite.test.mjs
 */
import assert from "node:assert/strict";
import {
  refineCompareAffectionPerson,
  refineCompareAffectionPair,
} from "../../lib/relationship/romantic/compareAffectionComposite.ts";
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

function sampleProfile(empathy) {
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
  secondary_axes.empathy = empathy;
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

const strongAction = {
  wealth_count: 2,
  seal_count: 0,
  affection_band: "action_gift",
};
const strongCare = {
  wealth_count: 0,
  seal_count: 2,
  affection_band: "emotional_care",
};
const weakAction = {
  wealth_count: 1,
  seal_count: 0,
  affection_band: "action_gift",
};
const balancedBand = {
  wealth_count: 1,
  seal_count: 1,
  affection_band: "balanced",
};

assert.equal(strongAction.wealth_count - strongAction.seal_count, 2);
assert.equal(weakAction.wealth_count - weakAction.seal_count, 1);

// ---------------------------------------------------------------------------
section("1) psych mid → base + caution/low");

const mid = refineCompareAffectionPerson({
  affection: strongAction,
  empathy: 50,
});
assert.equal(mid.lean, "action_gift");
assert.equal(mid.flipped, false);
assert.equal(mid.align, "caution");
assert.equal(mid.confidence, "low");
ok("mid");

// ---------------------------------------------------------------------------
section("2) psych 동의 → confirms/high");

const confirms = refineCompareAffectionPerson({
  affection: strongAction,
  empathy: 30,
});
assert.equal(confirms.lean, "action_gift");
assert.equal(confirms.align, "confirms");
assert.equal(confirms.confidence, "high");
ok("confirms");

// ---------------------------------------------------------------------------
section("3) 강한 사주 + 반대 psych → flip 금지");

const locked = refineCompareAffectionPerson({
  affection: strongAction,
  empathy: 75,
});
assert.equal(locked.lean, "action_gift");
assert.equal(locked.flipped, false);
assert.equal(locked.align, "caution");
assert.equal(locked.confidence, "low");
ok("saju lock");

// ---------------------------------------------------------------------------
section("4) 약한 사주 + 강한 반대 psych → soft flip");

const softFlip = refineCompareAffectionPerson({
  affection: weakAction,
  empathy: 70,
});
assert.equal(softFlip.lean, "emotional_care");
assert.equal(softFlip.base, "action_gift");
assert.equal(softFlip.flipped, true);
assert.equal(softFlip.align, "caution");
assert.equal(softFlip.confidence, "high");
ok("soft flip");

// ---------------------------------------------------------------------------
section("5) balanced + clear psych → soft fill");

const fill = refineCompareAffectionPerson({
  affection: balancedBand,
  empathy: 65,
});
assert.equal(fill.lean, "emotional_care");
assert.equal(fill.base, "balanced");
assert.equal(fill.flipped, true);
assert.equal(fill.confidence, "high");
ok("soft fill");

// ---------------------------------------------------------------------------
section("6) pair — empathy 한쪽 누락 → null");

assert.equal(
  refineCompareAffectionPair({
    affectionA: strongAction,
    affectionB: strongCare,
    profileA: sampleProfile(80),
    profileB: null,
  }),
  null,
);
ok("legacy null");

// ---------------------------------------------------------------------------
section("7) context_input 키 · reassurance 키와 비충돌");

const pair = refineCompareAffectionPair({
  affectionA: strongAction,
  affectionB: strongCare,
  profileA: sampleProfile(30),
  profileB: sampleProfile(70),
});
assert.ok(pair);
assert.equal(pair.align, "confirms");
assert.equal(pair.confidence, "high");

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
  affection_language: strongAction,
  stress_pattern: {
    heat_score: 0,
    temperature_band: "neutral",
    stress_band: "steady",
  },
  decision_making: { strength_label: "중화", decision_band: "balanced" },
  communication_style: {
    self_count: 1,
    seal_count: 1,
    communication_band: "balanced",
  },
};
const romanticB = { ...romanticA, affection_language: strongCare };

const ctx = buildRomanticContextInput({
  grade: "B",
  eventScores,
  romanticSignalsA: romanticA,
  romanticSignalsB: romanticB,
  profileA: sampleProfile(30),
  profileB: sampleProfile(70),
  affectionComposite: pair,
});

assert.equal(ctx.dominant_categories.compare_affection_a.category, "action_gift");
assert.equal(
  ctx.dominant_categories.compare_affection_b.category,
  "emotional_care",
);
assert.equal(
  ctx.dominant_categories.compare_affection_align.category,
  "confirms",
);
assert.equal(
  ctx.dominant_categories.compare_affection_confidence.category,
  "high",
);
assert.equal(
  ctx.dominant_categories.reassurance_need_a,
  undefined,
  "affection composite가 reassurance 키를 만들지 않음",
);
assert.equal(ctx.dominant_categories.compare_affection_lean_a, undefined);
assert.equal(
  ctx.dominant_categories.compare_stress_a.category,
  "steady",
  "다른 행 불변",
);
ok("context keys");

// ---------------------------------------------------------------------------
section("8) prepare — compare_affection SSOT · reassurance 줄 유지");

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

assert.ok(prepared.userPrompt.includes("compare_affection"));
assert.ok(prepared.userPrompt.includes("reassurance:"));
assert.ok(
  prepared.romanticContextInput.dominant_categories.compare_affection_align,
);
assert.ok(
  prepared.romanticContextInput.dominant_categories.reassurance_need_a,
  "reassurance dynamics 키 유지",
);
ok("prepare wiring");

console.log("\nAll romantic-compare-affection-composite tests passed.");
