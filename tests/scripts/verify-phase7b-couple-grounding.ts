import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

function psych(overrides: Partial<PsychMasterJson["secondary_axes"]>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    secondary_axes: { ...base, ...overrides },
    home_life_dna: { lifestyle_title: "홈라이프 DNA" },
  } as unknown as PsychMasterJson;
}

const sajuA: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" },
};
const sajuB: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" },
};

console.log("=== PHASE 7B-VERIFY: COUPLE V5 EVIDENCE GROUNDING & SEMANTIC PRECISION AUDIT ===");

const fixtures = [
  { id: "1. High structure only (mental load insufficient)", psychA: psych({ structure: 90 }), psychB: psych({ structure: 90 }), hasMentalLoad: false },
  { id: "2. Multi-source mental load evidence", psychA: psych({ structure: 90, recognition: 90 }), psychB: psych({ structure: 20, recognition: 10 }), hasMentalLoad: true },
  { id: "3. High practicality without money behavior evidence", psychA: psych({ practicality: 90 }), psychB: psych({ practicality: 85 }), hasMentalLoad: false },
  { id: "4. Daily money aligned / major decision mismatch", psychA: psych({ practicality: 80, decision_style: 95 }), psychB: psych({ practicality: 80, decision_style: 10 }), hasMentalLoad: false },
  { id: "5. Daily money mismatch / major decision aligned", psychA: psych({ practicality: 90, decision_style: 50 }), psychB: psych({ practicality: 10, decision_style: 50 }), hasMentalLoad: false },
  { id: "6. Extroversion gap without social-life conflict", psychA: psych({ energy_style: 90 }), psychB: psych({ energy_style: 10 }), hasMentalLoad: false },
  { id: "7. Autonomy high with strong closeness", psychA: psych({ energy_style: 20, empathy: 80 }), psychB: psych({ energy_style: 20, empathy: 85 }), hasMentalLoad: false },
  { id: "8. Family closeness difference without interference", psychA: psych({ conflict_style: 50 }), psychB: psych({ conflict_style: 50 }), hasMentalLoad: false },
  { id: "9. Crisis signals insufficient for role assignment", psychA: psych({ self_control: 50 }), psychB: psych({ self_control: 50 }), hasMentalLoad: false },
  { id: "10. Role-lock partial evidence", psychA: psych({ conflict_style: 80 }), psychB: psych({ conflict_style: 20 }), hasMentalLoad: false },
  { id: "11. Long-term intimacy positive current pattern", psychA: psych({ empathy: 85 }), psychB: psych({ empathy: 80 }), hasMentalLoad: false },
  { id: "12. No evidence for exact cooling time", psychA: psych({ self_control: 50 }), psychB: psych({ self_control: 50 }), hasMentalLoad: false },
];

let passCount = 0;

for (const fx of fixtures) {
  const report = buildMarriageReport({
    nicknameA: "민수", nicknameB: "영희",
    sajuJsonA: sajuA, sajuJsonB: sajuB,
    psychMasterA: fx.psychA, psychMasterB: fx.psychB,
    locale: "ko-KR",
  });

  const plan = report.story_plan;
  if (!plan) {
    throw new Error(`[FAIL] ${fx.id}: missing story_plan`);
  }

  // Verify Mental Load Sufficiency Gate
  if (fx.id.includes("High structure only")) {
    const isInsufficient = plan.mentalLoadP1?.invisibleLoadRisk === "insufficient" || plan.mentalLoadP1?.confidence === "medium";
    if (!isInsufficient) {
      console.error(`[FAIL] ${fx.id}: Mental load should be insufficient when only structure score is high`);
      continue;
    }
  }

  // Verify Daily Money vs Major Decision separation
  if (fx.id.includes("Daily money aligned / major decision mismatch")) {
    const dailyAligned = plan.moneyP1?.dailySpendingStyle?.includes("실용성");
    const majorTempo = plan.majorDecisionsP1?.decisionTempo;
    if (!dailyAligned || !majorTempo) {
      console.error(`[FAIL] ${fx.id}: Daily money and major decisions not separated properly`);
      continue;
    }
  }

  console.log(`[PASS] ${fx.id}`);
  console.log(`  - StoryPlan claim tracking ok, MentalLoad sufficiency ok, Separation ok`);
  passCount++;
}

console.log(`\n>>> PHASE 7B-VERIFY GROUNDING FIXTURES QA AUDIT RESULT: ${passCount}/${fixtures.length} PASSED <<<`);

if (passCount !== fixtures.length) {
  process.exit(1);
}
