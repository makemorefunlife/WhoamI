import { buildFamilyParentReport } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import { buildFamilyReportViewModel } from "@/lib/relationship/familyParent/viewModel/buildFamilyReportViewModel";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PairFamilySignals } from "@/lib/personCore/sajuSignals/pairTypes";

const sajuParent1: SajuDataForIntegrated = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" } };
const sajuChild1: SajuDataForIntegrated = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" } };
const sajuParentClash: SajuDataForIntegrated = { saju: { yearPillar: "갑자", monthPillar: "병자", dayPillar: "경자", hourPillar: "무자" } };
const sajuChildClash: SajuDataForIntegrated = { saju: { yearPillar: "을축", monthPillar: "정미", dayPillar: "신미", hourPillar: "기미" } };

function createPsych(overrides: Record<string, number>): PsychMasterJson {
  return {
    schema_version: "2026.1",
    secondary_axes: {
      stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
      conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
      thinking_style: 50, decision_style: 50,
      ...overrides,
    },
    survey_source: "v2_10q", survey_completed_at: new Date().toISOString(), survey_input_fingerprint: "test",
    home_life_dna: { lifestyle_title: "T", family_identity_category: "balanced", family_identity_line: "T", life_values_line: "T", private_home_self_line: "T", energy_battery_line: "T" }
  };
}

const pf: PairFamilySignals = {
  umbilical_separation_index: 50, umbilical_band: "medium",
  nagging_trigger_index: 50, nagging_band: "medium",
  combined_karma_tension: 50, guidance_fit: null,
};

// Fixture 1: High bond / low risk
const r1 = buildFamilyParentReport({
  nicknameA: "엄마", nicknameB: "아들", roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent1, sajuJsonB: sajuChild1,
  psychMasterA: createPsych({ empathy: 80 }), psychMasterB: createPsych({ empathy: 75 }), pairFamily: pf, locale: "ko-KR",
});

// Fixture 2: High bond / high discipline friction
const r2 = buildFamilyParentReport({
  nicknameA: "엄마", nicknameB: "아들", roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParentClash, sajuJsonB: sajuChildClash,
  psychMasterA: createPsych({ structure: 90 }), psychMasterB: createPsych({ structure: 10 }), pairFamily: pf, locale: "ko-KR",
});

// Fixture 3: High autonomy conflict
const r3 = buildFamilyParentReport({
  nicknameA: "엄마", nicknameB: "아들", roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent1, sajuJsonB: sajuChild1,
  psychMasterA: createPsych({ decision_style: 90 }), psychMasterB: createPsych({ decision_style: 10 }), pairFamily: pf, locale: "ko-KR",
});

// Fixture 4: Large 11-axis gaps
const r4 = buildFamilyParentReport({
  nicknameA: "엄마", nicknameB: "아들", roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent1, sajuJsonB: sajuChild1,
  psychMasterA: createPsych({ conflict_style: 90, energy_style: 90 }), psychMasterB: createPsych({ conflict_style: 10, energy_style: 10 }), pairFamily: pf, locale: "ko-KR",
});

// Fixture 5: Healthy / low-conflict pair
const r5 = buildFamilyParentReport({
  nicknameA: "엄마", nicknameB: "아들", roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent1, sajuJsonB: sajuChild1,
  psychMasterA: createPsych({}), psychMasterB: createPsych({}), pairFamily: pf, locale: "ko-KR",
});

console.log("=== INTEGRATION QA: StoryPlan & Models Presence ===");
[r1, r2, r3, r4, r5].forEach((r, idx) => {
  const sp = r.canonical_projections?.story_plan;
  const vm = buildFamilyReportViewModel(r, { locale: "ko-KR" });
  console.log(`\n--- Fixture ${idx + 1} ---`);
  console.log({
    bond: sp?.relationshipCore.bondLevel,
    risk: sp?.relationshipCore.riskLevel,
    claimsCount: sp?.selectedClaims.length,
    insightsCount: sp?.insightCandidates?.length,
    actionsCount: sp?.actionCandidates?.length,
    synthesisCount: sp?.synthesisResults?.length,
    conflictLoop: !!sp?.conflictChapterBundle?.conflictLoop,
    repairChapterBundle: !!sp?.repairChapterBundle,
    growthChapterBundle: !!sp?.growthChapterBundle,
    vmSectionsCount: vm.sections.length,
  });
});
