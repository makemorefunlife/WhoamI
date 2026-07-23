/**
 * Phase 5-3 — Romantic compare 「의사결정」 composite.
 * Run: npx tsx tests/unit/romantic-compare-decision-composite.test.mjs
 */
import assert from "node:assert/strict";
import {
  refineCompareDecisionPerson,
  refineCompareDecisionPair,
} from "../../lib/relationship/romantic/compareDecisionComposite.ts";
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

function sampleProfile(decision_style) {
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
  secondary_axes.decision_style = decision_style;
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

/** production-like 신강 — margin 미지정 → lock */
const strongIndependent = {
  strength_label: "신강(혼자서도 잘 버티는 타입)",
  decision_band: "independent",
};
const strongConsultative = {
  strength_label: "신약(주변 지지·공감이 필요한 타입)",
  decision_band: "consultative",
};
/** 약한 경계 soft flip용 — strength_margin 1 */
const weakIndependent = {
  strength_label: "신강(혼자서도 잘 버티는 타입)",
  decision_band: "independent",
  strength_margin: 1,
};
const balancedBand = {
  strength_label: "중화(상황에 따라 유연하게 기운이 오감)",
  decision_band: "balanced",
};

// ---------------------------------------------------------------------------
section("1) psych mid → base + caution/low");

const mid = refineCompareDecisionPerson({
  decision: strongIndependent,
  decisionStyle: 50,
});
assert.equal(mid.lean, "independent");
assert.equal(mid.align, "caution");
assert.equal(mid.confidence, "low");
ok("mid");

// ---------------------------------------------------------------------------
section("2) psych 동의 → confirms/high");

const confirms = refineCompareDecisionPerson({
  decision: strongIndependent,
  decisionStyle: 30,
});
assert.equal(confirms.lean, "independent");
assert.equal(confirms.align, "confirms");
assert.equal(confirms.confidence, "high");
ok("confirms");

// ---------------------------------------------------------------------------
section("3) 강한 신강/신약 + 반대 psych → flip 금지");

const locked = refineCompareDecisionPerson({
  decision: strongIndependent,
  decisionStyle: 75,
});
assert.equal(locked.lean, "independent");
assert.equal(locked.flipped, false);
assert.equal(locked.align, "caution");
assert.equal(locked.confidence, "low");
ok("saju lock");

// ---------------------------------------------------------------------------
section("4) 약한 경계 + 강한 반대 psych → soft flip");

const softFlip = refineCompareDecisionPerson({
  decision: weakIndependent,
  decisionStyle: 70,
});
assert.equal(softFlip.lean, "consultative");
assert.equal(softFlip.base, "independent");
assert.equal(softFlip.flipped, true);
assert.equal(softFlip.confidence, "high");
ok("soft flip");

// ---------------------------------------------------------------------------
section("5) balanced + clear psych → soft fill");

const fill = refineCompareDecisionPerson({
  decision: balancedBand,
  decisionStyle: 25,
});
assert.equal(fill.lean, "independent");
assert.equal(fill.base, "balanced");
assert.equal(fill.flipped, true);
ok("soft fill");

// ---------------------------------------------------------------------------
section("6) pair — decision_style 한쪽 누락 → null");

assert.equal(
  refineCompareDecisionPair({
    decisionA: strongIndependent,
    decisionB: strongConsultative,
    profileA: sampleProfile(30),
    profileB: null,
  }),
  null,
);
ok("legacy null");

// ---------------------------------------------------------------------------
section("7) context_input · balance/sublead 키 비충돌");

const pair = refineCompareDecisionPair({
  decisionA: strongIndependent,
  decisionB: strongConsultative,
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
  decision_making: strongIndependent,
  communication_style: {
    self_count: 1,
    seal_count: 1,
    communication_band: "balanced",
  },
};
const romanticB = { ...romanticA, decision_making: strongConsultative };

const ctx = buildRomanticContextInput({
  grade: "B",
  eventScores,
  romanticSignalsA: romanticA,
  romanticSignalsB: romanticB,
  profileA: sampleProfile(30),
  profileB: sampleProfile(70),
  decisionComposite: pair,
});

assert.equal(ctx.dominant_categories.compare_decision_a.category, "independent");
assert.equal(
  ctx.dominant_categories.compare_decision_b.category,
  "consultative",
);
assert.equal(
  ctx.dominant_categories.compare_decision_align.category,
  "confirms",
);
assert.equal(ctx.dominant_categories.balance_a, undefined);
assert.equal(ctx.dominant_categories.sublead_decision_approval, undefined);
assert.equal(ctx.dominant_categories.compare_decision_lean_a, undefined);
assert.equal(
  ctx.dominant_categories.compare_communication_a.category,
  "balanced",
);
ok("context keys");

// ---------------------------------------------------------------------------
section("8) prepare — compare_decision SSOT · balance 줄 유지");

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

assert.ok(prepared.userPrompt.includes("compare_decision"));
assert.ok(prepared.userPrompt.includes("balance_of_power:"));
assert.ok(
  prepared.romanticContextInput.dominant_categories.compare_decision_align,
);
assert.ok(
  prepared.romanticContextInput.dominant_categories.balance_a,
  "balance dynamics 키 유지",
);
ok("prepare wiring");

console.log("\nAll romantic-compare-decision-composite tests passed.");
