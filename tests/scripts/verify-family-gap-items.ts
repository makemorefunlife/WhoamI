/**
 * One-off verification for the Family "6 gap items" batch. Not wired into
 * any CI/test runner — run manually with tsx. Synthetic PsychMasterJson +
 * ChartContext construction (bypasses fixture-corpus coverage gaps), same
 * pattern already used for Work's final-cleanup verification.
 */
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";
import type { PairFamilySignals } from "../../lib/personCore/sajuSignals/pairTypes";

const sajuParent: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "경오", hourPillar: "무신" },
};
const sajuChild: SajuDataForIntegrated = {
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

const pairFamilyHighUmbilical: PairFamilySignals = {
  umbilical_separation_index: 80,
  umbilical_band: "high",
  nagging_trigger_index: 40,
  nagging_band: "medium",
  combined_karma_tension: 30,
  guidance_fit: null,
} as unknown as PairFamilySignals;

function run(locale: "ko-KR" | "en-US") {
  const report = buildFamilyParentReport({
    nicknameA: "동글",
    nicknameB: "Sera",
    roles: { roleA: "mother", roleB: "child" },
    sajuJsonA: sajuParent,
    sajuJsonB: sajuChild,
    psychMasterA: psych({ structure: 80, stimulation: 30 }), // parent: high structure
    psychMasterB: psych({ stimulation: 85, resilience: 80, empathy: 85, energy_style: 20 }), // child: high stimulation/resilience/empathy, low energy
    pairFamily: pairFamilyHighUmbilical,
    locale,
  });

  console.log(`\n=== ${locale} ===`);
  console.log("item1 parent_lens_summary:", report.family.parent_lens_summary);
  console.log("item2 current_challenge:", report.family.section_growth_tunnel.current_challenge);
  console.log("item3 harmony_one_liner:", report.family.section_destiny.harmony_one_liner);
  console.log("item4 safe_distance_note:", report.family.section_relationship_index?.safe_distance_note);
  console.log("item5 sos_line:", report.family.section_sos_script?.sos_line);
  console.log("item6 complement:", report.family.section_household_roles?.complement);
  console.log("genius_archetype:", report.family.section_child_dna.genius_archetype);
  console.log("family_role:", report.family.section_family_role?.child_role, "|", report.family.section_family_role?.role_label);
}

run("ko-KR");
run("en-US");
