/**
 * One-off verification for the Work current_enriched final cleanup round.
 * Not wired into any CI/test runner — run manually with tsx. Synthetic
 * PsychMasterJson/pairWork construction (bypasses fixture-corpus gaps),
 * mirroring the pattern already used for Friend/Work axis coverage checks.
 */
import { buildWorkColleagueReportEnriched } from "../../lib/relationship/enrichment/buildWorkColleagueReportEnriched";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";
import type { PairWorkSignals } from "../../lib/personCore/sajuSignals/pairTypes";

const sajuA: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "경오", hourPillar: "무신" },
};
const sajuB: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "신유", hourPillar: "기사" },
};

function psych(overrides: Partial<PsychMasterJson["secondary_axes"]>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return { secondary_axes: { ...base, ...overrides } } as unknown as PsychMasterJson;
}

const pairWorkTriggeringBaseline: PairWorkSignals = {
  micromanaging_poison_index: 10,
  micromanaging_band: "low",
  leadership_conflict_index: 10,
  leadership_conflict_band: "low",
  drive_clash_notes: [],
} as unknown as PairWorkSignals;

function run(locale: "ko-KR" | "en-US", nameA: string, nameB: string) {
  const report = buildWorkColleagueReportEnriched({
    nicknameA: nameA,
    nicknameB: nameB,
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: psych({ self_control: 75, resilience: 30, thinking_style: 75, empathy: 30, energy_style: 25 }),
    psychMasterB: psych({ self_control: 30, resilience: 75, thinking_style: 30, empathy: 75, energy_style: 75 }),
    pairWork: pairWorkTriggeringBaseline,
    locale,
  });

  console.log(`\n=== ${locale} :: ${nameA} / ${nameB} ===`);
  console.log("grade_reason (report.meta):", report.meta.grade_reason);
  console.log("snapshot_panel.narrative.topics.length:", report.snapshot_panel.narrative?.topics?.length ?? "n/a");
  console.log("situational_relationship_topics titles:", (report.meta.situational_relationship_topics ?? []).map((t) => t.title));
  console.log("reporting_style_fit.summary:", report.office.section_mix_fit.reporting_style_fit?.summary);
  console.log("break_boundary_fit.summary:", report.office.section_respect.break_boundary_fit?.summary);
  console.log("synergy_one_liner:", report.office.section_roles.synergy_one_liner);
  console.log("weapons A/B:", report.office.section_roles.person_a.weapons, report.office.section_roles.person_b.weapons);
  console.log("prescription_work items topics:", (report.meta.prescription_work?.items ?? []).map((i) => i.topic));
  console.log("prescription_work do_list sample:", report.meta.prescription_work?.items?.[0]?.do_list);

  const vm = buildWorkReportViewModel(report, {
    viewerIsReportA: true,
    myName: nameA,
    partnerName: nameB,
    locale,
  });
  const loop = vm.sections.find((s) => s.type === "relationship_loop") as any;
  const warning = vm.sections.find((s) => s.type === "warning") as any;
  const prescription = vm.sections.find((s) => s.type === "prescription") as any;
  console.log("opening.headline === opening.subtitle ?", vm.opening.headline === vm.opening.subtitle, "| subtitle:", vm.opening.subtitle);
  console.log("loop.frictionLoop titles:", (loop?.frictionLoop ?? []).map((x: any) => x.title));
  console.log("warning.conflictTrigger:", warning?.conflictTrigger?.slice(0, 50));
  console.log("prescription.items topics:", (prescription?.items ?? []).map((i: any) => i.topic), "| weeklyCheckIn:", prescription?.weeklyCheckIn?.topic);
}

run("ko-KR", "동글", "Sera");
run("en-US", "Alex", "Jordan");
