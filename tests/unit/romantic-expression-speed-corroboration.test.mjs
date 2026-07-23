/**
 * Phase 5-3 — expression_speed confirm-only residual corroboration.
 *
 * 불변식:
 *   1. direction은 입력과 항상 동일 (flip/fill 없음)
 *   2. confirms는 A clears+B lingers / B clears+A lingers만
 *   3. confidence는 항상 low (있을 때)
 *   4. balanced·residual 누락 → align/confidence omit
 *
 * Run: npx tsx tests/unit/romantic-expression-speed-corroboration.test.mjs
 */
import assert from "node:assert/strict";
import { refineExpressionSpeedCorroboration } from "../../lib/relationship/romantic/expressionSpeedCorroboration.ts";
import { buildRomanticContextInput } from "../../lib/relationship/romantic/romanticContextInput.ts";
import { buildRomanticDynamicsDigest } from "../../lib/relationship/romanticSajuPromptDigest.ts";
import { resolveExpressionSpeedDirection } from "../../lib/relationship/romanticRules/relationshipDynamics.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const minimalEventScores = {
  intimacy: { activation: 50, benefit: 50, risk: 50 },
  conflict: { activation: 50, benefit: 50, risk: 50 },
  stability: { activation: 50, benefit: 50, risk: 50 },
  overall: { activation: 50, benefit: 50, risk: 50 },
};

function romanticStub(overrides = {}) {
  return {
    expression_style: {
      expression_band: "expressive",
      food_count: 1,
      self_count: 1,
    },
    conflict_response: {
      conflict_band: "direct",
      officer_count: 1,
      food_count: 1,
      day_branch_tension_hits: [],
    },
    affection_language: {
      affection_band: "action_gift",
      wealth_count: 1,
      seal_count: 0,
    },
    stress_pattern: {
      stress_band: "explosive",
      officer_count: 1,
      food_count: 1,
    },
    decision_style: {
      decision_band: "independent",
      self_count: 1,
      seal_count: 0,
    },
    communication_style: {
      communication_band: "direct",
      self_count: 1,
      seal_count: 0,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
section("1) direction=A + A clears / B lingers → confirms/low · direction 불변");

const aConfirm = refineExpressionSpeedCorroboration({
  direction: "A",
  residualA: "clears_fast",
  residualB: "lingers",
});
assert.equal(aConfirm.direction, "A");
assert.equal(aConfirm.align, "confirms");
assert.equal(aConfirm.confidence, "low");
ok("A confirms/low");

// ---------------------------------------------------------------------------
section("2) direction=A + A lingers / B clears → caution/low");

const aCaution = refineExpressionSpeedCorroboration({
  direction: "A",
  residualA: "lingers",
  residualB: "clears_fast",
});
assert.equal(aCaution.direction, "A");
assert.equal(aCaution.align, "caution");
assert.equal(aCaution.confidence, "low");
ok("A caution/low");

// ---------------------------------------------------------------------------
section("3) direction=B 미러");

const bConfirm = refineExpressionSpeedCorroboration({
  direction: "B",
  residualA: "lingers",
  residualB: "clears_fast",
});
assert.equal(bConfirm.direction, "B");
assert.equal(bConfirm.align, "confirms");
assert.equal(bConfirm.confidence, "low");
ok("B confirms/low");

const bCaution = refineExpressionSpeedCorroboration({
  direction: "B",
  residualA: "clears_fast",
  residualB: "lingers",
});
assert.equal(bCaution.direction, "B");
assert.equal(bCaution.align, "caution");
assert.equal(bCaution.confidence, "low");
ok("B caution/low");

// ---------------------------------------------------------------------------
section("4) balanced → align/confidence omit · direction 유지");

const bal = refineExpressionSpeedCorroboration({
  direction: "balanced",
  residualA: "clears_fast",
  residualB: "lingers",
});
assert.equal(bal.direction, "balanced");
assert.equal(bal.align, null);
assert.equal(bal.confidence, null);
ok("balanced omit");

// ---------------------------------------------------------------------------
section("5) residual 한쪽 누락 → omit");

const missA = refineExpressionSpeedCorroboration({
  direction: "A",
  residualA: null,
  residualB: "lingers",
});
assert.equal(missA.direction, "A");
assert.equal(missA.align, null);
assert.equal(missA.confidence, null);
ok("residualA null omit");

const missB = refineExpressionSpeedCorroboration({
  direction: "A",
  residualA: "clears_fast",
  residualB: undefined,
});
assert.equal(missB.align, null);
ok("residualB undefined omit");

// ---------------------------------------------------------------------------
section("6) 그 외(moderate 등) → caution/low · direction 불변");

const mod = refineExpressionSpeedCorroboration({
  direction: "A",
  residualA: "moderate",
  residualB: "moderate",
});
assert.equal(mod.direction, "A");
assert.equal(mod.align, "caution");
assert.equal(mod.confidence, "low");
ok("both moderate → caution");

// ---------------------------------------------------------------------------
section("7) Context Output — align/confidence 키 · direction 유지");

const ctxConfirm = buildRomanticContextInput({
  grade: "B",
  eventScores: minimalEventScores,
  expressionSpeedDirection: "A",
  expressionSpeedCorroboration: aConfirm,
});
assert.equal(
  ctxConfirm.dominant_categories.expression_speed_direction.category,
  "A",
);
assert.equal(
  ctxConfirm.dominant_categories.expression_speed_align.category,
  "confirms",
);
assert.equal(
  ctxConfirm.dominant_categories.expression_speed_confidence.category,
  "low",
);
ok("CO confirms keys");

const ctxOmit = buildRomanticContextInput({
  grade: "B",
  eventScores: minimalEventScores,
  expressionSpeedDirection: "balanced",
  expressionSpeedCorroboration: bal,
});
assert.equal(
  ctxOmit.dominant_categories.expression_speed_direction.category,
  "balanced",
);
assert.equal(ctxOmit.dominant_categories.expression_speed_align, undefined);
assert.equal(
  ctxOmit.dominant_categories.expression_speed_confidence,
  undefined,
);
ok("CO balanced omit align/confidence");

// ---------------------------------------------------------------------------
section("8) digest SSOT · direction 재분류 금지 · recovery와 분리");

const digest = buildRomanticDynamicsDigest({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  romanticA: romanticStub(),
  romanticB: romanticStub({
    affection_language: {
      affection_band: "emotional_care",
      wealth_count: 0,
      seal_count: 2,
    },
  }),
  dayStemInteraction: "same",
  dynamics: {
    balance: {
      bandA: "balanced",
      bandB: "balanced",
      scoreA: 50,
      scoreB: 50,
    },
    subLeads: {
      ideaMoodLead: "balanced",
      decisionApprovalLead: "balanced",
      executionLead: "balanced",
    },
    recovery: {
      bandA: "balanced",
      bandB: "balanced",
      scoreA: 50,
      scoreB: 50,
      mismatch: false,
    },
    residualA: "clears_fast",
    residualB: "lingers",
    needA: "presence",
    needB: "presence",
    giveA: "care",
    giveB: "care",
    matchBGivesA: true,
    matchAGivesB: true,
    rolePlay: {
      primaryFrame: "peer",
      sajuFrame: "peer",
      agrees: true,
    },
    sajuFrameDirection: "balanced",
  },
  expressionSpeedCorroboration: aConfirm,
});
assert.ok(digest.includes("expression_speed (표현 속도 SSOT): direction=A"));
assert.ok(digest.includes("align=confirms"));
assert.ok(digest.includes("confidence=low"));
assert.ok(digest.includes("재분류하지 마세요"));
assert.ok(digest.includes("faster 슬롯"));
assert.ok(digest.includes("recovery_speed 줄의 잔류도"));
assert.ok(digest.includes("recovery_speed:"));
ok("digest SSOT line + constraints");

// ---------------------------------------------------------------------------
section("9) resolveExpressionSpeedDirection 회귀 · corroboration이 direction 안 바꿈");

const dirA = resolveExpressionSpeedDirection(
  {
    secondary_axes: {
      stimulation: 50,
      self_control: 30,
      practicality: 50,
      structure: 50,
      empathy: 50,
      conflict_style: 85,
      resilience: 50,
      recognition: 50,
      energy_style: 50,
      thinking_style: 50,
      decision_style: 50,
    },
  },
  {
    secondary_axes: {
      stimulation: 50,
      self_control: 60,
      practicality: 50,
      structure: 50,
      empathy: 50,
      conflict_style: 40,
      resilience: 50,
      recognition: 50,
      energy_style: 50,
      thinking_style: 50,
      decision_style: 50,
    },
  },
);
assert.equal(dirA, "A");
const refined = refineExpressionSpeedCorroboration({
  direction: dirA,
  residualA: "lingers",
  residualB: "clears_fast",
});
assert.equal(refined.direction, dirA);
assert.equal(refined.align, "caution");
ok("psych direction unchanged after residual caution");

console.log("\nOK: romantic expression-speed corroboration tests passed");
