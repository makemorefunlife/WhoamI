/**
 * Phase 5-3 — Romantic compare 「소통 방식」 composite.
 * Run: npx tsx tests/unit/romantic-compare-communication-composite.test.mjs
 */
import assert from "node:assert/strict";
import {
  refineCompareCommunicationPerson,
  refineCompareCommunicationPair,
} from "../../lib/relationship/romantic/compareCommunicationComposite.ts";
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

function sampleProfile(structure) {
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
  secondary_axes.structure = structure;
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

const strongDirect = {
  self_count: 2,
  seal_count: 0,
  communication_band: "direct",
};
const strongConsiderate = {
  self_count: 0,
  seal_count: 2,
  communication_band: "considerate",
};
const weakDirect = {
  self_count: 1,
  seal_count: 0,
  communication_band: "direct",
};
const balancedBand = {
  self_count: 1,
  seal_count: 1,
  communication_band: "balanced",
};

assert.equal(strongDirect.self_count - strongDirect.seal_count, 2);
assert.equal(weakDirect.self_count - weakDirect.seal_count, 1);

// ---------------------------------------------------------------------------
section("1) psych mid → base + caution/low");

const mid = refineCompareCommunicationPerson({
  communication: strongDirect,
  structure: 50,
});
assert.equal(mid.lean, "direct");
assert.equal(mid.align, "caution");
assert.equal(mid.confidence, "low");
ok("mid");

// ---------------------------------------------------------------------------
section("2) psych 동의 → confirms/high");

const confirms = refineCompareCommunicationPerson({
  communication: strongDirect,
  structure: 30,
});
assert.equal(confirms.lean, "direct");
assert.equal(confirms.align, "confirms");
assert.equal(confirms.confidence, "high");
ok("confirms");

// ---------------------------------------------------------------------------
section("3) 강한 사주 + 반대 psych → flip 금지");

const locked = refineCompareCommunicationPerson({
  communication: strongDirect,
  structure: 75,
});
assert.equal(locked.lean, "direct");
assert.equal(locked.flipped, false);
assert.equal(locked.align, "caution");
assert.equal(locked.confidence, "low");
ok("saju lock");

// ---------------------------------------------------------------------------
section("4) 약한 경계 + 강한 반대 psych → soft flip");

const softFlip = refineCompareCommunicationPerson({
  communication: weakDirect,
  structure: 70,
});
assert.equal(softFlip.lean, "considerate");
assert.equal(softFlip.base, "direct");
assert.equal(softFlip.flipped, true);
assert.equal(softFlip.confidence, "high");
ok("soft flip");

// ---------------------------------------------------------------------------
section("5) balanced + clear psych → soft fill");

const fill = refineCompareCommunicationPerson({
  communication: balancedBand,
  structure: 25,
});
assert.equal(fill.lean, "direct");
assert.equal(fill.base, "balanced");
assert.equal(fill.flipped, true);
ok("soft fill");

// ---------------------------------------------------------------------------
section("6) pair — structure 한쪽 누락 → null");

assert.equal(
  refineCompareCommunicationPair({
    communicationA: strongDirect,
    communicationB: strongConsiderate,
    profileA: sampleProfile(30),
    profileB: null,
  }),
  null,
);
ok("legacy null");

// ---------------------------------------------------------------------------
section("7) context_input 키 확장");

const pair = refineCompareCommunicationPair({
  communicationA: strongDirect,
  communicationB: strongConsiderate,
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
  stress_pattern: {
    heat_score: 50,
    temperature_band: "neutral",
    stress_band: "steady",
  },
  decision_making: { strength_label: "중화", decision_band: "balanced" },
  communication_style: strongDirect,
};
const romanticB = { ...romanticA, communication_style: strongConsiderate };

const ctx = buildRomanticContextInput({
  grade: "B",
  eventScores,
  romanticSignalsA: romanticA,
  romanticSignalsB: romanticB,
  profileA: sampleProfile(30),
  profileB: sampleProfile(70),
  communicationComposite: pair,
});

assert.equal(ctx.dominant_categories.compare_communication_a.category, "direct");
assert.equal(
  ctx.dominant_categories.compare_communication_b.category,
  "considerate",
);
assert.equal(
  ctx.dominant_categories.compare_communication_align.category,
  "confirms",
);
assert.equal(ctx.dominant_categories.compare_communication_lean_a, undefined);
ok("context keys");

// ---------------------------------------------------------------------------
section("8) prepare — compare_communication SSOT · 6행 완료");

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

assert.ok(prepared.userPrompt.includes("compare_communication"));
assert.ok(
  prepared.romanticContextInput.dominant_categories.compare_communication_align,
);
assert.ok(
  prepared.romanticContextInput.dominant_categories.compare_expression_align,
);
assert.ok(
  prepared.romanticContextInput.dominant_categories.compare_conflict_align,
);
ok("prepare wiring");

console.log("\nAll romantic-compare-communication-composite tests passed.");
