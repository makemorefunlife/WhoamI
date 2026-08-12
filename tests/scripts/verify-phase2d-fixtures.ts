import { buildFamilyRuleContext } from "@/lib/relationship/familyParent/buildFamilyRuleContext";
import { buildFamilyPsychDynamicsProjections } from "@/lib/relationship/familyParent/buildFamilyPsychDynamicsProjections";
import { buildFamilyMultiSignalSynthesis } from "@/lib/relationship/familyParent/buildFamilyMultiSignalSynthesis";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";

const sajuParent1: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" },
};
const sajuChild1: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" },
};

// Saju pair with Wonjin
const sajuParentWonjin: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병자", dayPillar: "경자", hourPillar: "무자" },
};
const sajuChildWonjin: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "신묘", hourPillar: "기묘" },
};

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

console.log("=== FIXTURE 1: No synthesis needed (Healthy, balanced) ===");
{
  const ctx = buildFamilyRuleContext({
    nicknameA: "엄마", nicknameB: "아들", roles: { roleA: "mother", roleB: "child" },
    parentType: "mother", sajuJsonA: sajuParent1, sajuJsonB: sajuChild1,
  });
  const pA = createMockPsych({}); const pB = createMockPsych({});
  const projs = buildFamilyPsychDynamicsProjections(ctx, pA, pB);
  const synths = buildFamilyMultiSignalSynthesis(ctx, [], projs);
  console.log({ synthesisCount: synths.length, results: synths });
}

console.log("\n=== FIXTURE 2: Resolver only (Simple priority handling) ===");
{
  const ctx = buildFamilyRuleContext({
    nicknameA: "엄마", nicknameB: "아들", roles: { roleA: "mother", roleB: "child" },
    parentType: "mother", sajuJsonA: sajuParent1, sajuJsonB: sajuChild1,
  });
  const pA = createMockPsych({ structure: 80 }); const pB = createMockPsych({ structure: 20 });
  const projs = buildFamilyPsychDynamicsProjections(ctx, pA, pB);
  const synths = buildFamilyMultiSignalSynthesis(ctx, [], projs);
  console.log({ projsRelation: projs.find(p=>p.axis==='structure')?.relation, synthesisCount: synths.length });
}

console.log("\n=== FIXTURE 3: Bond high + discipline high ===");
{
  const ctx = buildFamilyRuleContext({
    nicknameA: "엄마", nicknameB: "아들", roles: { roleA: "mother", roleB: "child" },
    parentType: "mother", sajuJsonA: sajuParent1, sajuJsonB: sajuChild1,
  });
  ctx.masterScores.bond = 85; ctx.masterScores.risk = 85;
  const mockClaims = [
    { id: "core.bond", topic: "relationshipCore", perspective: "pair", polarity: "strength", priority: "primary", owner: "overview", evidenceIds: [], sourceType: "pair_saju" },
    { id: "core.risk", topic: "relationshipCore", perspective: "pair", polarity: "risk", priority: "primary", owner: "overview", evidenceIds: [], sourceType: "pair_saju" }
  ] as any;
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({}), createMockPsych({}));
  const synths = buildFamilyMultiSignalSynthesis(ctx, mockClaims, projs);
  console.log({ synthesisId: synths[0]?.id, narrative: synths[0]?.narrative, category: synths[0]?.innateVsCurrentCategory });
}

console.log("\n=== FIXTURE 4: Innate vs current conflict (Saju clash vs structure gap) ===");
{
  const ctx = buildFamilyRuleContext({
    nicknameA: "엄마", nicknameB: "아들", roles: { roleA: "mother", roleB: "child" },
    parentType: "mother", sajuJsonA: sajuParentWonjin, sajuJsonB: sajuChildWonjin,
  });
  const pA = createMockPsych({ structure: 90 }); const pB = createMockPsych({ structure: 10 });
  const projs = buildFamilyPsychDynamicsProjections(ctx, pA, pB);
  const synths = buildFamilyMultiSignalSynthesis(ctx, [], projs);
  console.log({ synths: synths.map(s => ({ id: s.id, cat: s.innateVsCurrentCategory, narrative: s.narrative })) });
}

console.log("\n=== FIXTURE 5: Tension + complement simultaneous ===");
{
  const ctx = buildFamilyRuleContext({
    nicknameA: "엄마", nicknameB: "아들", roles: { roleA: "mother", roleB: "child" },
    parentType: "mother", sajuJsonA: sajuParent1, sajuJsonB: sajuChild1,
  });
  const pA = createMockPsych({ structure: 90 }); const pB = createMockPsych({ structure: 10 });
  const projs = buildFamilyPsychDynamicsProjections(ctx, pA, pB);
  const synths = buildFamilyMultiSignalSynthesis(ctx, [], projs);
  console.log({ synths: synths.map(s => ({ id: s.id, cat: s.innateVsCurrentCategory })) });
}

console.log("\n=== FIXTURE 6: Wonjin + psych similarity ===");
{
  const ctx = buildFamilyRuleContext({
    nicknameA: "엄마", nicknameB: "아들", roles: { roleA: "mother", roleB: "child" },
    parentType: "mother", sajuJsonA: sajuParentWonjin, sajuJsonB: sajuChildWonjin,
  });
  const pA = createMockPsych({ conflict_style: 50 }); const pB = createMockPsych({ conflict_style: 52 });
  const projs = buildFamilyPsychDynamicsProjections(ctx, pA, pB);
  const synths = buildFamilyMultiSignalSynthesis(ctx, [], projs);
  console.log({ synths: synths.map(s => ({ id: s.id, cat: s.innateVsCurrentCategory, narrative: s.narrative })) });
}
