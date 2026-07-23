/**
 * Phase 5-3 — Romantic compare 「갈등 반응」 composite.
 * Run: npx tsx tests/unit/romantic-compare-conflict-composite.test.mjs
 */
import assert from "node:assert/strict";
import {
  refineCompareConflictPerson,
  refineCompareConflictPair,
} from "../../lib/relationship/romantic/compareConflictComposite.ts";
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

function sampleProfile(conflict_style) {
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
  secondary_axes.conflict_style = conflict_style;
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

/** 강한 direct — food≫officer */
const strongDirect = {
  officer_count: 0,
  food_count: 2,
  conflict_band: "direct",
};
/** 강한 principled */
const strongPrincipled = {
  officer_count: 2,
  food_count: 0,
  conflict_band: "principled",
};
/** 약한 경계 direct — margin 1 */
const weakDirect = {
  officer_count: 0,
  food_count: 1,
  conflict_band: "direct",
};
/** balanced — margin 0 */
const balancedBand = {
  officer_count: 1,
  food_count: 1,
  conflict_band: "balanced",
};

assert.equal(strongDirect.food_count - strongDirect.officer_count, 2);
assert.equal(weakDirect.food_count - weakDirect.officer_count, 1);

// ---------------------------------------------------------------------------
section("1) psych mid → base + caution/low");

const mid = refineCompareConflictPerson({
  conflict: strongDirect,
  conflictStyle: 50,
});
assert.equal(mid.lean, "direct");
assert.equal(mid.flipped, false);
assert.equal(mid.align, "caution");
assert.equal(mid.confidence, "low");
ok("mid");

// ---------------------------------------------------------------------------
section("2) psych 동의 → confirms/high");

const confirms = refineCompareConflictPerson({
  conflict: strongDirect,
  conflictStyle: 75,
});
assert.equal(confirms.lean, "direct");
assert.equal(confirms.align, "confirms");
assert.equal(confirms.confidence, "high");
assert.equal(confirms.flipped, false);
ok("confirms");

// ---------------------------------------------------------------------------
section("3) 강한 사주 + 반대 psych → flip 금지 · caution/low");

const locked = refineCompareConflictPerson({
  conflict: strongDirect,
  conflictStyle: 25,
});
assert.equal(locked.lean, "direct");
assert.equal(locked.flipped, false);
assert.equal(locked.align, "caution");
assert.equal(locked.confidence, "low");
ok("saju lock");

// ---------------------------------------------------------------------------
section("4) 약한 사주 + 강한 반대 psych → soft flip");

const softFlip = refineCompareConflictPerson({
  conflict: weakDirect,
  conflictStyle: 30,
});
assert.equal(softFlip.lean, "principled");
assert.equal(softFlip.base, "direct");
assert.equal(softFlip.flipped, true);
assert.equal(softFlip.align, "caution");
assert.equal(softFlip.confidence, "high");
ok("soft flip");

// ---------------------------------------------------------------------------
section("5) balanced base + clear psych → soft fill");

const fill = refineCompareConflictPerson({
  conflict: balancedBand,
  conflictStyle: 70,
});
assert.equal(fill.lean, "direct");
assert.equal(fill.base, "balanced");
assert.equal(fill.flipped, true);
assert.equal(fill.align, "caution");
assert.equal(fill.confidence, "high");
ok("balanced soft fill");

// ---------------------------------------------------------------------------
section("6) pair — psych 한쪽 누락 → null (legacy)");

assert.equal(
  refineCompareConflictPair({
    conflictA: strongDirect,
    conflictB: strongPrincipled,
    profileA: sampleProfile(80),
    profileB: null,
  }),
  null,
);
ok("legacy null");

// ---------------------------------------------------------------------------
section("7) pair confirms + context_input 키 확장");

const pair = refineCompareConflictPair({
  conflictA: strongDirect,
  conflictB: strongPrincipled,
  profileA: sampleProfile(80),
  profileB: sampleProfile(25),
});
assert.ok(pair);
assert.equal(pair.leanA, "direct");
assert.equal(pair.leanB, "principled");
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
  conflict_response: strongDirect,
  affection_language: {
    wealth_count: 1,
    seal_count: 1,
    affection_band: "balanced",
  },
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
const romanticB = {
  ...romanticA,
  conflict_response: strongPrincipled,
};

const ctx = buildRomanticContextInput({
  grade: "B",
  eventScores,
  romanticSignalsA: romanticA,
  romanticSignalsB: romanticB,
  profileA: sampleProfile(80),
  profileB: sampleProfile(25),
  conflictComposite: pair,
});

assert.equal(ctx.dominant_categories.compare_conflict_a.category, "direct");
assert.equal(
  ctx.dominant_categories.compare_conflict_b.category,
  "principled",
);
assert.equal(ctx.dominant_categories.compare_conflict_align.category, "confirms");
assert.equal(
  ctx.dominant_categories.compare_conflict_confidence.category,
  "high",
);
assert.equal(
  ctx.dominant_categories.compare_conflict_psych_a.scores.score,
  80,
);
assert.equal(
  ctx.dominant_categories.compare_expression_a.category,
  "balanced",
  "다른 행 band 불변",
);
assert.equal(
  ctx.dominant_categories.compare_conflict_lean_a,
  undefined,
  "중복 lean 키 금지",
);
ok("context keys");

// ---------------------------------------------------------------------------
section("8) prepare — prompt에 compare_conflict SSOT · schema 미변경");

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
  surveyProfileA: sampleProfile(80),
  surveyProfileB: sampleProfile(25),
  locale: "ko",
});

assert.ok(prepared.userPrompt.includes("compare_conflict"));
assert.ok(prepared.userPrompt.includes("서버 lean="));
assert.ok(
  prepared.romanticContextInput.dominant_categories.compare_conflict_align,
);
assert.ok(
  prepared.romanticContextInput.dominant_categories.compare_conflict_a
    .category,
);
assert.equal(
  prepared.userPrompt.includes('"comparison_table"'),
  true,
);
ok("prepare wiring");

console.log("\nAll romantic-compare-conflict-composite tests passed.");
