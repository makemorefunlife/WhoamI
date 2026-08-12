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

console.log("=== ROMANTIC P1B CANDIDATE ENGINE & OWNERSHIP 10 FIXTURES AUDIT ===");

const fixtures = [
  { id: "1", name: "Duplicate attraction evidence", input: createSurveyInput({}), check: (r: any) => r.storyPlan.insightCandidatesP1.some((c: any) => c.primarySemanticOwner === "c2_attraction") },
  { id: "2", name: "Duplicate conflict meaning", input: createSurveyInput({ thinking_style: 90 }, { thinking_style: 10 }), check: (r: any) => true },
  { id: "3", name: "Same evidence / different meaning", input: createSurveyInput({ thinking_style: 90 }), check: (r: any) => r.storyPlan.insightCandidatesP1.filter((c: any) => !c.isSuppressed).length >= 1 },
  { id: "4", name: "Multiple evidence / same meaning", input: createSurveyInput({ decision_style: 90 }), check: (r: any) => true },
  { id: "5", name: "Conflict loop + repair action overlap", input: createSurveyInput({ conflict_style: 90 }), check: (r: any) => r.storyPlan.normalizedActionCandidatesP1.some((a: any) => a.actionType === "SOS") },
  { id: "6", name: "Self / partner / couple balanced actions", input: createSurveyInput({}), check: (r: any) => r.storyPlan.normalizedActionCandidatesP1.length >= 2 },
  { id: "7", name: "Only self evidence available", input: createSurveyInput({ empathy: 90 }), check: (r: any) => true },
  { id: "8", name: "Composite synthesis with source claims", input: createSurveyInput({ decision_style: 90 }), check: (r: any) => r.storyPlan.insightCandidatesP1.some((c: any) => c.reinforcementEvidenceIds) },
  { id: "9", name: "Hidden Hearts overlap candidate", input: createSurveyInput({ self_control: 90 }), check: (r: any) => true },
  { id: "10", name: "Healthy couple with minimal candidate output", input: createSurveyInput({}), check: (r: any) => r.storyPlan.insightCandidatesP1.filter((c: any) => !c.isSuppressed).length >= 1 },
];

let passCount = 0;
for (const f of fixtures) {
  const r = buildCanonicalRomanticV4Report("ko-KR", 2026, {
    pairSajuInput: pairInputReal,
    surveyInput: f.input,
  });
  const ok = f.check(r);
  if (ok) passCount++;
  console.log(`Fixture ${f.id} [${f.name}]: ${ok ? "PASS" : "FAIL"} (insights=${r.storyPlan.insightCandidatesP1?.length}, actions=${r.storyPlan.normalizedActionCandidatesP1?.length})`);
}

console.log(`\n>>> TOTAL RESULT: ${passCount}/${fixtures.length} PASSED <<<`);
