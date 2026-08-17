/**
 * Marriage V2 — P0 consistency regression.
 *
 * Guards against the same couple getting incompatible conclusions from
 * different Marriage modules:
 *  1. CFO / financial ownership: Economic Decision Flow's cash-flow-tracker
 *     and executor must always match the canonical household CFO (previously
 *     an independent psych-axis-only heuristic in marriageEconomicPartnership.ts
 *     could name a different person).
 *  2. Conflict response: the 4-stage conflict narrative (psych conflict_style)
 *     and the Pursue-Withdraw block (previously saju ten-god-only) must never
 *     name opposite people as pursuer/withdrawer for the same couple.
 *  3. Crisis role: the free-text narrative must always name the same person
 *     as practicalLead that the structured field says (previously the
 *     narrative's saju-null fallback always said "person A leads" regardless
 *     of what practicalLead computed).
 *
 * Run: npx tsx --test tests/unit/marriage-p0-consistency.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport.ts";
import { buildMarriageEconomicPartnership } from "../../lib/relationship/marriage/marriageEconomicPartnership.ts";
import {
  buildConflictCommunicationSection,
  classifyConflictStyleLean,
} from "../../lib/relationship/marriage/marriageConflictCommunication.ts";

function makePsych(overrides) {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
    home_life_dna: { lifestyle_title: "체계적인 정리자", life_values_line: "안정된 공간" },
  };
}

const sajuA = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" } };
const sajuB = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" } };

function buildGoldenReport(psychA, psychB, locale = "ko-KR") {
  return buildMarriageReport({
    nicknameA: "Sera",
    nicknameB: "동글",
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: psychA,
    psychMasterB: psychB,
    locale,
  });
}

describe("P0 — CFO / financial ownership authority", () => {
  it("decisionFlow.cashFlowTracker matches cfoSide='a' when supplied", () => {
    const bundle = buildMarriageEconomicPartnership(
      makePsych({ recognition: 80, decision_style: 20 }), // A leans OPPORTUNITY_EXPANDER-ish
      makePsych({ self_control: 80, practicality: 80 }), // B leans SAVER_ACCUMULATOR-ish
      sajuA,
      sajuB,
      "Sera",
      "동글",
      "ko-KR",
      "a",
    );
    assert.equal(bundle.decisionFlow.cashFlowTracker, "Sera");
    assert.equal(bundle.decisionFlow.executor, "Sera");
    assert.equal(bundle.decisionFlow.riskReviewer, "동글");
  });

  it("decisionFlow.cashFlowTracker matches cfoSide='b' when supplied (asymmetric A/B roles)", () => {
    // Deliberately asymmetric: A's own psych profile would otherwise win
    // cashFlowTracker/executor under the pre-fix independent heuristic
    // (SAVER_ACCUMULATOR-leaning A), but canonical CFO says B.
    const bundle = buildMarriageEconomicPartnership(
      makePsych({ self_control: 80, practicality: 80 }), // A leans SAVER_ACCUMULATOR
      makePsych({ recognition: 80, decision_style: 20 }), // B leans OPPORTUNITY_EXPANDER
      sajuA,
      sajuB,
      "Sera",
      "동글",
      "ko-KR",
      "b",
    );
    assert.equal(bundle.decisionFlow.cashFlowTracker, "동글");
    assert.equal(bundle.decisionFlow.executor, "동글");
    assert.equal(bundle.decisionFlow.riskReviewer, "Sera");
  });

  it("golden report: real canonical CFO always equals cashFlowTracker and executor", () => {
    const report = buildGoldenReport(
      makePsych({ self_control: 80, practicality: 70, structure: 85, conflict_style: 20 }),
      makePsych({ practicality: 30, self_control: 35, recognition: 75, conflict_style: 80 }),
    );
    const cfoName = report.household.section_money_chores.cfo_nickname;
    const flow = report.canonical_projections.marriage_canonical_bundle.economicPartnership.decisionFlow;
    assert.equal(flow.cashFlowTracker, cfoName, "cashFlowTracker must equal canonical CFO");
    assert.equal(flow.executor, cfoName, "executor must equal canonical CFO");
  });

  it("golden report: reversed psych profile still keeps cashFlowTracker/executor aligned to CFO", () => {
    // Swap which side has the "stronger" CFO-affinity psych signals.
    const report = buildGoldenReport(
      makePsych({ practicality: 30, self_control: 35, recognition: 75, conflict_style: 20 }),
      makePsych({ self_control: 80, practicality: 70, structure: 85, conflict_style: 80 }),
    );
    const cfoName = report.household.section_money_chores.cfo_nickname;
    const flow = report.canonical_projections.marriage_canonical_bundle.economicPartnership.decisionFlow;
    assert.equal(flow.cashFlowTracker, cfoName);
    assert.equal(flow.executor, cfoName);
  });
});

describe("P0 — conflict response authority (4-stage vs Pursue-Withdraw)", () => {
  it("classifyConflictStyleLean: higher conflict_style is the pursuer, lower is the withdrawer", () => {
    assert.deepEqual(classifyConflictStyleLean(80, 20), {
      explosiveIsA: true,
      stonewallIsA: false,
      isNeutral: false,
    });
    assert.deepEqual(classifyConflictStyleLean(20, 80), {
      explosiveIsA: false,
      stonewallIsA: true,
      isNeutral: false,
    });
  });

  it("classifyConflictStyleLean: a near-tie is neutral, not a forced split", () => {
    const lean = classifyConflictStyleLean(52, 48);
    assert.equal(lean.isNeutral, true);
  });

  it("buildConflictCommunicationSection with psych conflict_style never contradicts a direct A/direct-B-avoidant reading", () => {
    const section = buildConflictCommunicationSection({
      nicknameA: "Sera",
      nicknameB: "동글",
      countsA: {},
      countsB: {},
      conflictStyleA: 20,
      conflictStyleB: 80,
      locale: "ko-KR",
    });
    assert.equal(section.explosive_nickname, "동글");
    assert.equal(section.stonewall_nickname, "Sera");
  });

  it("golden report: 4-stage and Pursue-Withdraw agree on who pursues / who withdraws (A avoidant, B direct)", () => {
    const report = buildGoldenReport(
      makePsych({ conflict_style: 20 }),
      makePsych({ conflict_style: 80 }),
    );
    const bundle = report.canonical_projections.marriage_canonical_bundle;
    const cc = report.household.section_warning.conflict_communication;

    // 4-stage: Sera (A, conflict_style=20 -> isAvoidant) must show avoidant
    // externalBehavior at TENSION_RISING; 동글 (B, =80 -> isDirect) direct.
    const seraTension = bundle.conflict4Stage.stageA[1].externalBehavior;
    const dongulTension = bundle.conflict4Stage.stageB[1].externalBehavior;
    assert.notEqual(seraTension, dongulTension, "A/B must diverge under a real conflict_style gap");

    // Pursue-Withdraw must name the SAME direction: B (동글, direct) pursues,
    // A (Sera, avoidant) withdraws — never the reverse.
    assert.equal(cc.explosive_nickname, "동글");
    assert.equal(cc.stonewall_nickname, "Sera");
  });

  it("golden report: 4-stage and Pursue-Withdraw agree when the direction is reversed (A direct, B avoidant)", () => {
    const report = buildGoldenReport(
      makePsych({ conflict_style: 80 }),
      makePsych({ conflict_style: 20 }),
    );
    const cc = report.household.section_warning.conflict_communication;
    assert.equal(cc.explosive_nickname, "Sera");
    assert.equal(cc.stonewall_nickname, "동글");
  });

  it("golden report: near-identical conflict_style never forces a fake pursue/withdraw split", () => {
    const report = buildGoldenReport(
      makePsych({ conflict_style: 50 }),
      makePsych({ conflict_style: 50 }),
    );
    const cc = report.household.section_warning.conflict_communication;
    assert.equal(cc.pattern_label, "완만한 조율형 (Slow Harmonizers)");
  });
});

describe("P0 — crisis role narrative vs structured practicalLead", () => {
  it("golden report: narrative names the same person as practicalLead, not always A", () => {
    // Psych signals push practicalLead to B (동글) via practicality/thinking_style.
    const report = buildGoldenReport(
      makePsych({ practicality: 30, thinking_style: 30 }), // A -> EMOTIONAL_ANCHOR
      makePsych({ practicality: 80, thinking_style: 80 }), // B -> PROBLEM_SOLVER
    );
    const crisis = report.canonical_projections.marriage_canonical_bundle.crisisRole;
    assert.equal(crisis.practicalLead, "b");
    const leadName = "동글";
    const otherName = "Sera";
    const leadIdx = crisis.narrative.indexOf(leadName);
    const otherIdx = crisis.narrative.indexOf(otherName);
    assert.ok(leadIdx >= 0, "narrative must mention the practical lead by name");
    assert.ok(
      leadIdx < otherIdx || otherIdx === -1,
      "narrative must introduce the practical lead first, not fall back to always naming A",
    );
  });

  it("golden report: practicalLead='a' case also has a consistent narrative", () => {
    const report = buildGoldenReport(
      makePsych({ practicality: 80, thinking_style: 80 }),
      makePsych({ practicality: 30, thinking_style: 30 }),
    );
    const crisis = report.canonical_projections.marriage_canonical_bundle.crisisRole;
    assert.equal(crisis.practicalLead, "a");
    const leadIdx = crisis.narrative.indexOf("Sera");
    const otherIdx = crisis.narrative.indexOf("동글");
    assert.ok(leadIdx >= 0 && (leadIdx < otherIdx || otherIdx === -1));
  });
});

describe("P0 — canonical A/B identity never reverses", () => {
  it("canonicalNames stays [Sera, 동글] regardless of which psych profile is stronger", () => {
    const reportOne = buildGoldenReport(
      makePsych({ conflict_style: 20 }),
      makePsych({ conflict_style: 80 }),
    );
    const reportTwo = buildGoldenReport(
      makePsych({ conflict_style: 80 }),
      makePsych({ conflict_style: 20 }),
    );
    assert.equal(reportOne.household.section_dna.person_a.nickname, "Sera");
    assert.equal(reportOne.household.section_dna.person_b.nickname, "동글");
    assert.equal(reportTwo.household.section_dna.person_a.nickname, "Sera");
    assert.equal(reportTwo.household.section_dna.person_b.nickname, "동글");
  });
});

console.log("marriage-p0-consistency: describe blocks registered");
