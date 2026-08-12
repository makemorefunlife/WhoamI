import { buildCanonicalRomanticV4Report } from "@/lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report";
import type { RomanticV4PairSajuInput } from "@/lib/relationship/romantic/prototypeV4/romanticV4SajuInput";
import type { RomanticV4SurveyInput } from "@/lib/relationship/romantic/prototypeV4/romanticV4SurveyEvidence";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";

const pairInputReal: RomanticV4PairSajuInput = {
  mode: "real",
  nameA: "지민", nameB: "정우",
  birthA: { birthDate: "1995-05-15", birthTime: "12:00", birthTimeUnknown: false },
  birthB: { birthDate: "1993-08-20", birthTime: "14:00", birthTimeUnknown: false },
};

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

function createSurveyInput(overridesA: Record<string, number>, overridesB: Record<string, number> = {}): RomanticV4SurveyInput {
  return {
    profileA: createPsych(overridesA),
    profileB: createPsych(overridesB),
  };
}

console.log("=== PHASE 3C: ROMANTIC V5 INTEGRATION QA & 6 FULL REPORTS AUDIT ===");

const fixtures = [
  { id: "1", name: "High attraction / low conflict", input: createSurveyInput({}) },
  { id: "2", name: "High attraction / high conflict", input: createSurveyInput({ thinking_style: 90 }, { thinking_style: 10 }) },
  { id: "3", name: "Pursue / withdraw pattern", input: createSurveyInput({ conflict_style: 90 }, { conflict_style: 10 }) },
  { id: "4", name: "High bond + high autonomy need", input: createSurveyInput({ decision_style: 90 }, { decision_style: 10 }) },
  { id: "5", name: "Large 11-axis behavioral gaps", input: createSurveyInput({ empathy: 90, structure: 90 }, { empathy: 10, structure: 10 }) },
  { id: "6", name: "Healthy balanced low-conflict couple", input: createSurveyInput({}) },
];

let passCount = 0;
for (const f of fixtures) {
  const r = buildCanonicalRomanticV4Report("ko-KR", 2026, {
    pairSajuInput: pairInputReal,
    surveyInput: f.input,
  });

  const sp = r.storyPlan;
  const hasAttraction = Boolean(sp.attraction);
  const hasConflictP0 = Boolean(sp.conflictLoopP0);
  const hasRepairP0 = Boolean(sp.repairPatternP0);
  const hasActionsP0 = Boolean(sp.actionCandidatesP0 && sp.actionCandidatesP0.length > 0);
  const hasSyntheses = Boolean(sp.synthesisResultsP1);
  const hasGrowth = Boolean(sp.growthTransitionP1);

  const ok = hasAttraction && hasConflictP0 && hasRepairP0 && hasActionsP0 && hasSyntheses && hasGrowth;
  if (ok) passCount++;

  console.log(`Fixture ${f.id} [${f.name}]: ${ok ? "PASS" : "FAIL"}`);
  console.log(`  - attraction: ${hasAttraction}, conflictLoopP0: ${hasConflictP0}, repairPatternP0: ${hasRepairP0}`);
  console.log(`  - actions: ${sp.actionCandidatesP0?.length}, syntheses: ${sp.synthesisResultsP1?.length}, growthTransition: ${hasGrowth}`);
}

console.log(`\n>>> INTEGRATION QA AUDIT RESULT: ${passCount}/${fixtures.length} PASSED <<<`);
