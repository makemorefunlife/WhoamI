import assert from "node:assert/strict";
import { localizeComparisonRowProse } from "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { buildPersonalRelationshipCe } from "../../lib/relationship/romantic/prototypeV4/personalRelationshipCe";
import type { RomanticV4ComparisonRow } from "../../lib/relationship/romantic/prototypeV4/romanticV4ComparisonFusion";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle";
import { buildIndividualSajuChart } from "../../lib/personCore/individualSaju/buildIndividualSajuChart";

async function testMissingSurveyNoticeFix() {
  const rowWithBothSurveys: RomanticV4ComparisonRow = {
    rowKey: "conflict",
    leanA: "expressing",
    leanB: "withdrawing",
    baseA: "expressing",
    baseB: "withdrawing",
    flippedA: false,
    flippedB: false,
    align: "caution",
    confidence: "low", // Neutral band score caused confidence: low
    source: "saju_plus_survey", // BUT BOTH surveys are present!
    personASource: "survey",
    personBSource: "survey",
    sajuInputsA: {},
    sajuInputsB: {},
  };

  const prose = localizeComparisonRowProse({
    row: rowWithBothSurveys,
    locale: "ko-KR",
    nameA: "Sera",
    nameB: "동글",
  });

  assert.equal(
    prose.understanding.includes("한쪽의 설문 응답이 없어"),
    false,
    "Must NOT say missing survey when both survey profiles are present",
  );
  assert.equal(
    prose.understanding.includes("아직은 확정적이라기보다 잠정적인 신호"),
    true,
    "Must show tentative signal message instead",
  );
  console.log("✓ testMissingSurveyNoticeFix passed");
}

async function testRecoveryPatternFix() {
  // Donggle's chart (1987-10-26 12:00)
  const bundleB = calculateSajuBundle({
    birthDate: "1987-10-26",
    birthTime: null,
    birthTimeUnknown: true,
  });

  const chartB = buildIndividualSajuChart({
    reportId: "test_b",
    bundle: bundleB,
    birthDate: "1987-10-26",
    birthTime: null,
    birthTimeUnknown: true,
  });

  const ceB = buildPersonalRelationshipCe({
    personId: "b",
    name: "동글",
    chart: chartB,
    locale: "ko-KR",
    signals: {
      conflict_response: { conflict_band: "withdrawing", officer_count: 1, food_count: 0 },
      affection_language: { affection_band: "action_gift" },
      stress_pattern: { stress_band: "avoidant" },
      decision_making: { decision_band: "deliberate" },
      expression_style: { expression_band: "subtle" },
      communication_style: { communication_band: "listener" },
    } as any,
  });

  assert.equal(
    ceB.recoveryPattern.text.includes("혼자만의 시간"),
    true,
    "Withdrawing partner (동글) must receive withdrawing recovery text, not expressive recovery text",
  );
  assert.equal(
    ceB.recoveryPattern.text.includes("명확한 사과나 확답"),
    false,
    "Withdrawing partner must NOT receive immediate expressive apology requirement",
  );
  console.log("✓ testRecoveryPatternFix passed");
}

async function runAll() {
  await testMissingSurveyNoticeFix();
  await testRecoveryPatternFix();
  console.log("ALL P0 REGRESSION TESTS PASSED.");
}

runAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
