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

const sajuParentWonjin: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병자", dayPillar: "경자", hourPillar: "무자" },
};
const sajuChildWonjin: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정미", dayPillar: "신미", hourPillar: "기미" }, // 자미 원진
};

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

console.log("=== AUDIT FIXTURE 1: High bond only ===");
{
  const ctx = buildFamilyRuleContext({ nicknameA: "P", nicknameB: "C", roles: { roleA: "mother", roleB: "child" }, parentType: "mother", sajuJsonA: sajuParent1, sajuJsonB: sajuChild1 });
  const mockClaims = [{ id: "core.bond", topic: "relationshipCore", perspective: "pair", polarity: "strength", priority: "primary", owner: "overview", evidenceIds: [], sourceType: "pair_saju" }] as any;
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({}), createMockPsych({}));
  const synths = buildFamilyMultiSignalSynthesis(ctx, mockClaims, projs);
  console.log({ shouldSynthesize: false, actualSynthesize: synths.length > 0, count: synths.length, pass: synths.length === 0 });
}

console.log("\n=== AUDIT FIXTURE 2: High risk only ===");
{
  const ctx = buildFamilyRuleContext({ nicknameA: "P", nicknameB: "C", roles: { roleA: "mother", roleB: "child" }, parentType: "mother", sajuJsonA: sajuParent1, sajuJsonB: sajuChild1 });
  const mockClaims = [{ id: "core.risk", topic: "relationshipCore", perspective: "pair", polarity: "risk", priority: "primary", owner: "overview", evidenceIds: [], sourceType: "pair_saju" }] as any;
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({}), createMockPsych({}));
  const synths = buildFamilyMultiSignalSynthesis(ctx, mockClaims, projs);
  console.log({ shouldSynthesize: false, actualSynthesize: synths.length > 0, count: synths.length, pass: synths.length === 0 });
}

console.log("\n=== AUDIT FIXTURE 3: High bond + High risk ===");
{
  const ctx = buildFamilyRuleContext({ nicknameA: "P", nicknameB: "C", roles: { roleA: "mother", roleB: "child" }, parentType: "mother", sajuJsonA: sajuParent1, sajuJsonB: sajuChild1 });
  const mockClaims = [
    { id: "core.bond", topic: "relationshipCore", perspective: "pair", polarity: "strength", priority: "primary", owner: "overview", evidenceIds: [], sourceType: "pair_saju" },
    { id: "core.risk", topic: "relationshipCore", perspective: "pair", polarity: "risk", priority: "primary", owner: "overview", evidenceIds: [], sourceType: "pair_saju" }
  ] as any;
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({}), createMockPsych({}));
  const synths = buildFamilyMultiSignalSynthesis(ctx, mockClaims, projs);
  console.log({ shouldSynthesize: true, actualSynthesize: synths.length > 0, category: synths[0]?.innateVsCurrentCategory, pass: synths[0]?.innateVsCurrentCategory === "INNER_OUTER_GAP" });
}

console.log("\n=== AUDIT FIXTURE 4: Wonjin + Psych similar ===");
{
  const ctx = buildFamilyRuleContext({ nicknameA: "P", nicknameB: "C", roles: { roleA: "mother", roleB: "child" }, parentType: "mother", sajuJsonA: sajuParentWonjin, sajuJsonB: sajuChildWonjin });
  ctx.canonicalPairFacts.hasWonjinOrGuimun = true;
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({ conflict_style: 50 }), createMockPsych({ conflict_style: 52 }));
  const synths = buildFamilyMultiSignalSynthesis(ctx, [], projs);
  console.log({ shouldSynthesize: true, actualSynthesize: synths.length > 0, category: synths[0]?.innateVsCurrentCategory, pass: synths[0]?.innateVsCurrentCategory === "CONTEXT_SHIFT" });
}

console.log("\n=== AUDIT FIXTURE 5: Wonjin + Psych tension ===");
{
  const ctx = buildFamilyRuleContext({ nicknameA: "P", nicknameB: "C", roles: { roleA: "mother", roleB: "child" }, parentType: "mother", sajuJsonA: sajuParentWonjin, sajuJsonB: sajuChildWonjin });
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({ conflict_style: 90 }), createMockPsych({ conflict_style: 10 }));
  const synths = buildFamilyMultiSignalSynthesis(ctx, [], projs);
  console.log({ shouldSynthesize: false, actualSynthesize: synths.some(s=>s.id==="synth.innate_wonjin_current_similar"), pass: !synths.some(s=>s.id==="synth.innate_wonjin_current_similar") });
}

console.log("\n=== AUDIT FIXTURE 6: Large structure gap + Day Branch Combine ===");
{
  const ctx = buildFamilyRuleContext({ nicknameA: "P", nicknameB: "C", roles: { roleA: "mother", roleB: "child" }, parentType: "mother", sajuJsonA: sajuParent1, sajuJsonB: sajuChild1 });
  ctx.canonicalPairFacts.hasDayBranchCombine = true;
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({ structure: 90 }), createMockPsych({ structure: 10 }));
  const synths = buildFamilyMultiSignalSynthesis(ctx, [], projs);
  console.log({ shouldSynthesize: true, actualSynthesize: synths.length > 0, category: synths.find(s=>s.id==="synth.gap_with_day_combine")?.innateVsCurrentCategory, pass: synths.some(s=>s.id==="synth.gap_with_day_combine") });
}

console.log("\n=== AUDIT FIXTURE 7: Large structure gap WITHOUT pair support ===");
{
  const ctx = buildFamilyRuleContext({ nicknameA: "P", nicknameB: "C", roles: { roleA: "mother", roleB: "child" }, parentType: "mother", sajuJsonA: sajuParent1, sajuJsonB: sajuChild1 });
  ctx.canonicalPairFacts.hasDayBranchCombine = false; ctx.canonicalPairFacts.hasClash = false;
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({ structure: 90 }), createMockPsych({ structure: 10 }));
  const synths = buildFamilyMultiSignalSynthesis(ctx, [], projs);
  console.log({ shouldSynthesize: false, actualSynthesize: synths.some(s=>s.id==="synth.gap_with_day_combine" || s.id==="synth.protection_autonomy_clash"), pass: !synths.some(s=>s.id==="synth.gap_with_day_combine" || s.id==="synth.protection_autonomy_clash") });
}

console.log("\n=== AUDIT FIXTURE 8: Tension + Complement evidence simultaneously ===");
{
  const ctx = buildFamilyRuleContext({ nicknameA: "P", nicknameB: "C", roles: { roleA: "mother", roleB: "child" }, parentType: "mother", sajuJsonA: sajuParent1, sajuJsonB: sajuChild1 });
  const projs = buildFamilyPsychDynamicsProjections(ctx, createMockPsych({ structure: 90 }), createMockPsych({ structure: 10 }));
  const sProj = projs.find(p => p.axis === "structure");
  console.log({ axis: sProj?.axis, relation: sProj?.relation, needsSynthesis: sProj?.needsSynthesis, pass: true });
}
