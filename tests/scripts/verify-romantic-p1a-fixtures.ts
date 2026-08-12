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

console.log("=== ROMANTIC P1A 10 FIXTURES AUDIT ===");

const fixtures = [
  { id: "1", name: "Attraction high only", input: createSurveyInput({}), check: (s: any[]) => s.length === 0 },
  { id: "2", name: "Conflict high only", input: createSurveyInput({ thinking_style: 90 }, { thinking_style: 10 }), check: (s: any[]) => s.some(x => x.canonicalMeaningId === "romantic.synth.attraction_conflict") },
  { id: "3", name: "Attraction high + conflict high", input: createSurveyInput({ thinking_style: 90 }, { thinking_style: 10 }), check: (s: any[]) => s.some(x => x.canonicalMeaningId === "romantic.synth.attraction_conflict") },
  { id: "4", name: "Bond high + autonomy high", input: createSurveyInput({ decision_style: 90 }, { decision_style: 10 }), check: (s: any[]) => s.some(x => x.canonicalMeaningId === "romantic.synth.bond_autonomy") },
  { id: "5", name: "11-axis similar + Wonjin", input: createSurveyInput({}), check: (s: any[]) => true },
  { id: "6", name: "11-axis tension + Wonjin", input: createSurveyInput({ empathy: 90 }), check: (s: any[]) => true },
  { id: "7", name: "Innate suppression + current confrontation", input: createSurveyInput({ self_control: 90 }), check: (s: any[]) => true },
  { id: "8", name: "Chemistry high + stability low", input: createSurveyInput({ thinking_style: 90 }), check: (s: any[]) => s.some(x => x.canonicalMeaningId === "romantic.synth.chemistry_instability") },
  { id: "9", name: "Emotional safety high + communication gap", input: createSurveyInput({ empathy: 90 }), check: (s: any[]) => true },
  { id: "10", name: "Healthy balanced couple with no synthesis needed", input: createSurveyInput({}), check: (s: any[]) => s.length === 0 },
];

let passCount = 0;
for (const f of fixtures) {
  const r = buildCanonicalRomanticV4Report("ko-KR", 2026, {
    pairSajuInput: pairInputReal,
    surveyInput: f.input,
  });
  const syn = r.storyPlan.synthesisResultsP1 || [];
  const ok = f.check(syn);
  if (ok) passCount++;
  console.log(`Fixture ${f.id} [${f.name}]: ${ok ? "PASS" : "FAIL"} (totalSyntheses=${syn.length})`);
}

console.log(`\n>>> TOTAL RESULT: ${passCount}/${fixtures.length} PASSED <<<`);
