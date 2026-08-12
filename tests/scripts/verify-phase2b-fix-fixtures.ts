import { buildFamilyRuleContext } from "@/lib/relationship/familyParent/buildFamilyRuleContext";
import { buildFamilyPsychDynamicsProjections } from "@/lib/relationship/familyParent/buildFamilyPsychDynamicsProjections";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";

const sajuParent1: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" },
};
const sajuChild1: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" },
};

const baseContext = buildFamilyRuleContext({
  nicknameA: "엄마",
  nicknameB: "아들",
  roles: { roleA: "mother", roleB: "child" },
  parentType: "mother",
  sajuJsonA: sajuParent1,
  sajuJsonB: sajuChild1,
});

function createMockPsych(secondaryOverrides: Record<string, number>): PsychMasterJson {
  return {
    schema_version: "2026.1",
    secondary_axes: {
      stimulation: 50,
      self_control: 50,
      practicality: 50,
      structure: 50,
      empathy: 50,
      conflict_style: 50,
      resilience: 50,
      recognition: 50,
      energy_style: 50,
      thinking_style: 50,
      decision_style: 50,
      ...secondaryOverrides,
    },
    survey_source: "v2_10q",
    survey_completed_at: new Date().toISOString(),
    survey_input_fingerprint: "test",
    home_life_dna: {
      lifestyle_title: "Test",
      family_identity_category: "balanced",
      family_identity_line: "Test",
      life_values_line: "Test",
      private_home_self_line: "Test",
      energy_battery_line: "Test",
    },
  };
}

console.log("=== FIXTURE 1: Large structure gap (90 vs 10), No CE ===");
{
  const pA = createMockPsych({ structure: 90 });
  const pB = createMockPsych({ structure: 10 });
  const projs = buildFamilyPsychDynamicsProjections(baseContext, pA, pB);
  const sProj = projs.find((p) => p.axis === "structure");
  const rank = projs.findIndex((p) => p.axis === "structure") + 1;
  console.log({ axis: sProj?.axis, gap: sProj?.gap, rank, evidence: sProj?.evidenceIds, relation: sProj?.relation, needsSynthesis: sProj?.needsSynthesis });
}

console.log("\n=== FIXTURE 2: Small structure gap (55 vs 45), With CE Support ===");
{
  const pA = createMockPsych({ structure: 55 });
  const pB = createMockPsych({ structure: 45 });
  const projs = buildFamilyPsychDynamicsProjections(baseContext, pA, pB);
  const sProj = projs.find((p) => p.axis === "structure");
  const rank = projs.findIndex((p) => p.axis === "structure") + 1;
  console.log({ axis: sProj?.axis, gap: sProj?.gap, rank, evidence: sProj?.evidenceIds, relation: sProj?.relation, needsSynthesis: sProj?.needsSynthesis });
}

console.log("\n=== FIXTURE 3: conflict_style gap (90 vs 10) + related tension CE ===");
{
  const pA = createMockPsych({ conflict_style: 90 });
  const pB = createMockPsych({ conflict_style: 10 });
  const projs = buildFamilyPsychDynamicsProjections(baseContext, pA, pB);
  const cProj = projs.find((p) => p.axis === "conflict_style");
  const rank = projs.findIndex((p) => p.axis === "conflict_style") + 1;
  console.log({ axis: cProj?.axis, gap: cProj?.gap, rank, evidence: cProj?.evidenceIds, relation: cProj?.relation, needsSynthesis: cProj?.needsSynthesis });
}

console.log("\n=== FIXTURE 4: energy_style gap (85 vs 15) in healthy relationship ===");
{
  const pA = createMockPsych({ energy_style: 85 });
  const pB = createMockPsych({ energy_style: 15 });
  const projs = buildFamilyPsychDynamicsProjections(baseContext, pA, pB);
  const eProj = projs.find((p) => p.axis === "energy_style");
  const rank = projs.findIndex((p) => p.axis === "energy_style") + 1;
  console.log({ axis: eProj?.axis, gap: eProj?.gap, rank, evidence: eProj?.evidenceIds, relation: eProj?.relation, needsSynthesis: eProj?.needsSynthesis });
}

console.log("\n=== FIXTURE 5: CE vs 11-axis direct contradiction (similar 11-axis, tension CE) ===");
{
  const pA = createMockPsych({ conflict_style: 50 });
  const pB = createMockPsych({ conflict_style: 52 });
  const projs = buildFamilyPsychDynamicsProjections(baseContext, pA, pB);
  const cProj = projs.find((p) => p.axis === "conflict_style");
  console.log({ axis: cProj?.axis, gap: cProj?.gap, evidence: cProj?.evidenceIds, relation: cProj?.relation, needsSynthesis: cProj?.needsSynthesis });
}
