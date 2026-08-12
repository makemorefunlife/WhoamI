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

console.log("=== PHASE 2E FIXTURE 1: Conflict Loop Generation ===");
{
  ctx.canonicalPairFacts.hasClash = true;
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({ conflict_style: 80 }), createMockPsych({ conflict_style: 20 }));
  const loop = buildFamilyConflictLoop(ctx, projs);
  console.log({ loopCreated: !!loop, trigger: loop?.parentTrigger, breakPattern: loop?.breakPattern });
}

console.log("\n=== PHASE 2E FIXTURE 2: Repair Pattern Generation ===");
{
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({ resilience: 90 }), createMockPsych({ resilience: 20 }));
  const repair = buildFamilyRepairPattern(ctx, projs);
  console.log({ coolingTime: repair.coolingTimeMinutes, style: repair.effectiveRepairStyle });
}

console.log("\n=== PHASE 2E FIXTURE 3: Growth Transition Model ===");
{
  const growth = buildFamilyGrowthTransition(ctx);
  console.log({ currentStage: growth.currentStage, nextStage: growth.nextStage, action: growth.transitionAction });
}
