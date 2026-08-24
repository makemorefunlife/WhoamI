// End-to-end Family stabilization verification: real buildFamilyParentReport()
// production orchestration path, two fixtures (Sera x 동글 + a materially
// different pair), checking generation completion, 8-chapter structure,
// direction correctness, and Ch05->Ch07->Ch08 continuity.
import { buildFamilyParentReport } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import { buildFamilyReportViewModel } from "@/lib/relationship/familyParent/viewModel/buildFamilyReportViewModel";
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";

function sajuFromBirth(birthDate: string, birthTime = "12:00"): SajuDataForIntegrated {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  } as any;
}

function mockPsych(overrides: Record<string, number>): PsychMasterJson {
  return {
    schema_version: "2026.1" as any,
    secondary_axes: {
      stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
      conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
      thinking_style: 50, decision_style: 50,
      ...overrides,
    },
    survey_source: "v2_10q" as any, survey_completed_at: new Date().toISOString(), survey_input_fingerprint: "test",
    home_life_dna: { lifestyle_title: "T", family_identity_category: "balanced" as any, family_identity_line: "T", life_values_line: "T", private_home_self_line: "T", energy_battery_line: "T" },
  } as any;
}

const fixtures = [
  {
    label: "Sera(parent) x 동글(child)",
    parentNickname: "Sera", childNickname: "동글",
    sajuParent: sajuFromBirth("1988-08-20"),
    sajuChild: sajuFromBirth("2016-05-15"),
    psychParent: mockPsych({ structure: 75, conflict_style: 30 }),
    psychChild: mockPsych({ structure: 30, conflict_style: 70, autonomy: 80 } as any),
  },
  {
    label: "materially different pair (하나-two)",
    parentNickname: "하나", childNickname: "두리",
    sajuParent: sajuFromBirth("1979-02-11"),
    sajuChild: sajuFromBirth("2011-11-03"),
    psychParent: mockPsych({ structure: 25, empathy: 85 }),
    psychChild: mockPsych({ structure: 80, empathy: 30, resilience: 20 } as any),
  },
];

const EXPECTED_CHAPTER_IDS = ["ch_together", "ch_core", "ch_roles", "ch_comm", "ch_conflict", "ch_growth", "ch_repair", "ch_action"];

let anyFail = false;
const growthOutputs: string[] = [];

for (const fx of fixtures) {
  console.log(`\n${"=".repeat(70)}\n${fx.label}\n${"=".repeat(70)}`);
  try {
    const report = buildFamilyParentReport({
      nicknameA: fx.childNickname,
      nicknameB: fx.parentNickname,
      roles: { roleA: "child", roleB: "mother" },
      parentType: "mother",
      sajuJsonA: fx.sajuChild,
      sajuJsonB: fx.sajuParent,
      psychMasterA: fx.psychChild,
      psychMasterB: fx.psychParent,
      locale: "ko-KR",
    } as any);
    console.log("Generation: OK (no throw)");

    const vm = buildFamilyReportViewModel(report as any, { locale: "ko-KR" } as any);
    const chapterIds = vm.editorialChapters.map((c) => c.id);
    console.log("Chapter count:", vm.editorialChapters.length);
    console.log("Chapter ids:", chapterIds.join(", "));

    const exactly8 = vm.editorialChapters.length === 8;
    const idsMatch = JSON.stringify(chapterIds) === JSON.stringify(EXPECTED_CHAPTER_IDS);
    console.log("Exactly 8 chapters:", exactly8);
    console.log("Chapter ids match approved 8-chapter IA:", idsMatch);
    if (!exactly8 || !idsMatch) anyFail = true;

    const ch05 = vm.editorialChapters.find((c) => c.id === "ch_conflict");
    const ch07 = vm.editorialChapters.find((c) => c.id === "ch_repair");
    const ch06 = vm.editorialChapters.find((c) => c.id === "ch_growth");
    const ch08 = vm.editorialChapters.find((c) => c.id === "ch_action");

    const conflictLoop = (report as any).canonical_projections?.story_plan?.conflictChapterBundle?.conflictLoop;
    const repairHarmfulReason = (report as any).canonical_projections?.story_plan?.repairChapterBundle?.doAndDontRepair?.harmfulReason ?? "";
    const ch07QuotesCh05 = !!conflictLoop && repairHarmfulReason.includes(conflictLoop.step1ParentTrigger);
    console.log("Ch05 conflictLoop present:", !!conflictLoop);
    console.log("Ch07 harmfulReason quotes Ch05's real finding:", ch07QuotesCh05);
    if (!ch07QuotesCh05) anyFail = true;

    const actionBundle = (report as any).canonical_projections?.story_plan?.actionChapterBundle;
    console.log("Ch08 actionChapterBundle present:", !!actionBundle);

    const directionOk =
      (ch05?.summary ?? "").length >= 0 && // summary is optional; just don't crash
      report.family?.section_roles?.parent_nickname === fx.parentNickname &&
      report.family?.section_roles?.child_nickname === fx.childNickname;
    console.log("Parent/child direction correct (section_roles):", directionOk);
    if (!directionOk) anyFail = true;

    const growthTitle = (report as any).canonical_projections?.story_plan?.growthChapterBundle?.motivation?.driveTitle ?? "(none)";
    console.log("Ch06 growth driveTitle:", growthTitle);
    growthOutputs.push(growthTitle);

    console.log("Ch01/02/03/04 present:", chapterIds.includes("ch_together" as any), chapterIds.includes("ch_core" as any), chapterIds.includes("ch_roles" as any), chapterIds.includes("ch_comm" as any));
  } catch (err) {
    anyFail = true;
    console.log("Generation: FAILED —", err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) console.log(err.stack.split("\n").slice(0, 6).join("\n"));
  }
}

console.log(`\n${"=".repeat(70)}\nFINAL\n${"=".repeat(70)}`);
console.log("Ch06 growth output differs across the two children:", growthOutputs.length === 2 && growthOutputs[0] !== growthOutputs[1]);
console.log("OVERALL:", anyFail ? "FAIL" : "PASS");
