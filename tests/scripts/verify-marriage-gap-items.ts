/**
 * One-off verification for the Marriage/Cohabitation "8 gap items" batch.
 * Not wired into CI — run manually with tsx. Synthetic PsychMasterJson
 * construction (bypasses fixture-corpus coverage gaps), same pattern used
 * for Work/Family final verification.
 */
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

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
  return {
    secondary_axes: { ...base, ...overrides },
    home_life_dna: { lifestyle_title: "Home DNA", life_values_line: "Balanced." },
  } as unknown as PsychMasterJson;
}

function run(locale: "ko-KR" | "en-US", nameA: string, nameB: string) {
  const report = buildMarriageReport({
    nicknameA: nameA,
    nicknameB: nameB,
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: psych({ energy_style: 85, recognition: 80, structure: 80 }),
    psychMasterB: psych({ energy_style: 20, recognition: 30, structure: 30, empathy: 90 }),
    locale,
  });

  const h = report.household;
  console.log(`\n=== ${locale} :: ${nameA} / ${nameB} ===`);
  console.log("item1 chores_guideline:", h.section_money_chores.chores_guideline);
  console.log("item2 upset.person_a:", h.section_upset.person_a.upset_signals);
  console.log("item3 conflict_trigger:", h.section_warning.conflict_trigger);
  console.log("item4 mental_load_note:", h.section_money_chores.mental_load_note);
  console.log("item5 privacy A:", h.section_privacy.person_a_private_line);
  console.log("item5 privacy B:", h.section_privacy.person_b_private_line);
  console.log("item6 upset.person_b:", h.section_upset.person_b.upset_signals);
  console.log("item7 inlaw_stress:", h.section_family_boundary.inlaw_stress_summary);
  console.log("item8 why_us:", h.section_origin_story.why_us);
}

run("ko-KR", "동글", "Sera");
run("en-US", "Alex", "Jordan");
