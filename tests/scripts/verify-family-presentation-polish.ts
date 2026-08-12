import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

function makePsych(overrides: Record<string, number>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
  } as unknown as PsychMasterJson;
}

const sajuSera: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "경오", hourPillar: "무신" },
  tenGods: [{ pillar: "년주", godCode: "정관" }],
};

const sajuDonggeul: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" },
  tenGods: [{ pillar: "년주", godCode: "식신" }],
};

// 1. Sera (Mom) x Donggeul (Child) Report
const reportSeraDonggeul = buildFamilyParentReport({
  nicknameA: "Sera", nicknameB: "동글",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuSera, sajuJsonB: sajuDonggeul,
  psychMasterA: makePsych({ structure: 75, empathy: 60 }),
  psychMasterB: makePsych({ recognition: 80, stimulation: 70 }),
  locale: "ko-KR",
});

const vmSeraDonggeul = buildFamilyReportViewModel(reportSeraDonggeul, { locale: "ko-KR" });

console.log("=== 1. 11축 그래프 (Psych Radar) 복구 검증 ===");
const ch3 = vmSeraDonggeul.editorialChapters.find(c => c.id === "ch_comm");
const hasPsychRadar = ch3?.legacySections.some(s => s.type === "psych_radar");
console.log("Chapter 03 has psych_radar section:", hasPsychRadar ? "YES (PASS)" : "NO (FAIL)");

console.log("\n=== 2. Coverage Block 필드 바인딩 검증 ===");
console.log("ConflictLoop parentTrigger:", storyPlanText(reportSeraDonggeul.canonical_projections?.story_plan?.conflictLoop?.parentTrigger));
console.log("RepairPattern effectiveRepairStyle:", storyPlanText(reportSeraDonggeul.canonical_projections?.story_plan?.repairPattern?.effectiveRepairStyle));
console.log("GrowthTransition currentRolePattern:", storyPlanText(reportSeraDonggeul.canonical_projections?.story_plan?.growthTransition?.currentRolePattern));

console.log("\n=== 3. Child Core Needs 3단 구조 검증 ===");
const needs = reportSeraDonggeul.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed;
console.log("Innate Needs:", needs?.innateParentingNeeds.map(n => n.label));
console.log("Well Supplied Needs:", needs?.wellSuppliedNeeds.map(n => n.label));
console.log("Primary Gapped Needs:", needs?.primaryNeeds.map(n => `${n.label} (${n.gapStatus})`));

console.log("\n=== 4. 조사 & 오타 Cleanup 검증 ===");
const pairMeaningsStr = JSON.stringify(reportSeraDonggeul.canonical_projections?.story_plan?.pairMeanings);
console.log("Contains typo '정달'?:", pairMeaningsStr.includes("정달") ? "YES (FAIL)" : "NO (PASS)");
console.log("Contains double particle '동글이가'?:", pairMeaningsStr.includes("동글이가") ? "YES (PASS)" : "NO");

console.log("\n=== 5. Chapter 08 제목 검토 ===");
const ch8 = vmSeraDonggeul.editorialChapters.find(c => c.id === "ch_action");
console.log("Chapter 08 Title:", ch8?.title);

function storyPlanText(val?: string) {
  return val ? `EXIST: "${val}"` : "NONE";
}
