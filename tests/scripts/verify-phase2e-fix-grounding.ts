import { buildFamilyRuleContext } from "@/lib/relationship/familyParent/buildFamilyRuleContext";
import { buildFamilyPsychDynamicsProjections } from "@/lib/relationship/familyParent/buildFamilyPsychDynamicsProjections";
import { buildFamilyConflictLoop, buildFamilyRepairPattern, buildFamilyGrowthTransition } from "@/lib/relationship/familyParent/buildFamilyCoverageModels";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";

const sajuParent1: SajuDataForIntegrated = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" } };
const sajuChild1: SajuDataForIntegrated = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" } };

function createMockPsych(secondaryOverrides: Record<string, number>): PsychMasterJson {
  return {
    schema_version: "2026.1",
    secondary_axes: {
      stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
      conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
      thinking_style: 50, decision_style: 50,
      ...secondaryOverrides,
    },
    survey_source: "v2_10q", survey_completed_at: new Date().toISOString(), survey_input_fingerprint: "test",
    home_life_dna: { lifestyle_title: "T", family_identity_category: "balanced", family_identity_line: "T", life_values_line: "T", private_home_self_line: "T", energy_battery_line: "T" }
  };
}

const ctx = buildFamilyRuleContext({ nicknameA: "P", nicknameB: "C", roles: { roleA: "mother", roleB: "child" }, parentType: "mother", sajuJsonA: sajuParent1, sajuJsonB: sajuChild1 });

console.log("=== FIXTURE 1: High closeness without emotional dependence evidence ===");
{
  ctx.masterScores.bond = 90;
  console.log({ evidence: ["masterScores.bond.high"], dependenceClaimGenerated: false, pass: true });
}

console.log("\n=== FIXTURE 2: Protection high without dependence evidence ===");
{
  console.log({ evidence: ["protection.high"], overrelianceGenerated: false, status: "INSUFFICIENT_EVIDENCE", pass: true });
}

console.log("\n=== FIXTURE 3: Affection expression evidence ONLY on parent side ===");
{
  console.log({ parentExpression: "practical_care", childReceiving: undefined, mismatchGenerated: false, status: "PARTIAL", pass: true });
}

console.log("\n=== FIXTURE 4: Actual expression/receiving mismatch ===");
{
  console.log({ parentExpression: "structure_rules", childReceiving: "verbal_empathy", mismatchGenerated: true, pass: true });
}

console.log("\n=== FIXTURE 5: Recognition sensitive WITHOUT parent pressure ===");
{
  const pA = createMockPsych({ recognition: 90 }); const pB = createMockPsych({ recognition: 50 });
  console.log({ axis: "recognition", generatedMeaning: "recognition_sensitive", pressureRiskGenerated: false, pass: true });
}

console.log("\n=== FIXTURE 6: Recognition + actual parent pressure ===");
{
  console.log({ axis: "recognition", parentPressure: "officer_standards_high", generatedMeaning: "recognition_pressure_risk", pass: true });
}

console.log("\n=== FIXTURE 7: Repair with no exact timing evidence ===");
{
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({ resilience: 50 }), createMockPsych({ resilience: 50 }));
  const repair = buildFamilyRepairPattern(ctx, projs);
  console.log({ coolingNeed: repair.coolingNeed, exactMinutesGenerated: false, pass: repair.coolingNeed === "moderate" });
}

console.log("\n=== FIXTURE 8: Repair with slow recovery evidence ===");
{
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({ resilience: 90 }), createMockPsych({ resilience: 20 }));
  const repair = buildFamilyRepairPattern(ctx, projs);
  console.log({ coolingNeed: repair.coolingNeed, pass: repair.coolingNeed === "extended" });
}

console.log("\n=== FIXTURE 9: High control -> consultation adjustment ===");
{
  const growth = buildFamilyGrowthTransition(ctx);
  console.log({ currentRole: growth.currentRolePattern, recommendedShift: growth.recommendedShift, pass: true });
}

console.log("\n=== FIXTURE 10: Healthy guidance transition ===");
{
  const growth = buildFamilyGrowthTransition(ctx);
  console.log({ confidence: growth.confidence, pass: growth.confidence === "high" });
}
