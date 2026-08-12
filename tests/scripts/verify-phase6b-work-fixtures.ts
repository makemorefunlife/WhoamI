import { buildWorkColleagueReportEnriched } from "../../lib/relationship/enrichment/buildWorkColleagueReportEnriched";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

function psych(overrides: Partial<PsychMasterJson["secondary_axes"]>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return { secondary_axes: { ...base, ...overrides } } as unknown as PsychMasterJson;
}

const sajuA: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" },
};
const sajuB: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" },
};

console.log("=== PHASE 6B: WORK V5 DOMAIN MODELS & FIXTURES QA ===");

const fixtures = [
  { id: "1. High fit / low risk", psychA: psych({ structure: 85, decision_style: 80 }), psychB: psych({ structure: 80, decision_style: 75 }) },
  { id: "2. Complementary direction + execution", psychA: psych({ thinking_style: 90, structure: 20 }), psychB: psych({ thinking_style: 10, structure: 90 }) },
  { id: "3. Overlapping authority", psychA: psych({ decision_style: 90 }), psychB: psych({ decision_style: 85 }) },
  { id: "4. Fast decision + cautious validation", psychA: psych({ decision_style: 95 }), psychB: psych({ structure: 95 }) },
  { id: "5. Feedback mismatch", psychA: psych({ empathy: 10, practicality: 90 }), psychB: psych({ empathy: 90, practicality: 10 }) },
  { id: "6. Detail vs big-picture difference", psychA: psych({ thinking_style: 90 }), psychB: psych({ thinking_style: 10 }) },
  { id: "7. Solo-think vs live-discuss", psychA: psych({ energy_style: 20 }), psychB: psych({ energy_style: 85 }) },
  { id: "8. Deadline pressure", psychA: psych({ self_control: 85 }), psychB: psych({ self_control: 25 }) },
  { id: "9. External crisis", psychA: psych({ resilience: 85 }), psychB: psych({ resilience: 80 }) },
  { id: "10. Mistake / accountability case", psychA: psych({ conflict_style: 90 }), psychB: psych({ conflict_style: 20 }) },
  { id: "11. Strong project-fit case", psychA: psych({ stimulation: 90 }), psychB: psych({ structure: 85 }) },
  { id: "12. Bad shared-ownership configuration", psychA: psych({ decision_style: 90 }), psychB: psych({ decision_style: 90 }) },
  { id: "13. High synergy / high burnout", psychA: psych({ self_control: 15 }), psychB: psych({ self_control: 15 }) },
  { id: "14. Healthy balanced collaborators", psychA: psych({ structure: 50, resilience: 75 }), psychB: psych({ structure: 50, resilience: 75 }) },
];

let passCount = 0;

for (const fx of fixtures) {
  const report = buildWorkColleagueReportEnriched({
    nicknameA: "김팀장", nicknameB: "이매니저",
    sajuJsonA: sajuA, sajuJsonB: sajuB,
    psychMasterA: fx.psychA, psychMasterB: fx.psychB,
    locale: "ko-KR",
  });

  const plan = report.story_plan;
  if (!plan) {
    throw new Error(`[FAIL] ${fx.id}: missing story_plan`);
  }

  const role = Boolean(plan.roleAuthorityP1?.directionOwner);
  const decision = Boolean(plan.decisionRightsP1?.decisionTempo);
  const feedback = Boolean(plan.feedbackP1?.preferredDelivery);
  const thinking = Boolean(plan.thinkingModeP1?.thinkingStyle);
  const crisis = Boolean(plan.crisisP1?.decisionPusher);
  const error = Boolean(plan.errorResponseP1?.recoveryMode);
  const project = (plan.projectFitP1?.bestConditions.length ?? 0) >= 1;
  const avoid = (plan.avoidCombinationP1?.operatingModelRisks.length ?? 0) >= 1;
  const synth = (plan.synthesisResultsP1?.length ?? 0) >= 1;
  const conflict = Boolean(plan.conflictLoopP0?.trigger && plan.conflictLoopP0?.breakPattern);
  const repair = Boolean(plan.repairPatternP0?.deEscalateSos && plan.repairPatternP0?.repairSequence);
  const actions = (plan.normalizedActionCandidatesP1?.length ?? 0) >= 4;
  const growth = Boolean(plan.growthTransitionP1?.recommendedAdjustment);

  if (
    role && decision && feedback && thinking && crisis &&
    error && project && avoid && synth && conflict &&
    repair && actions && growth
  ) {
    console.log(`[PASS] ${fx.id}`);
    console.log(`  - Role: ok, Decision: ok, Feedback: ok, Thinking: ok, Crisis: ok`);
    console.log(`  - Error: ok, ProjectFit: ok, AvoidCombo: ok, Syntheses: ${plan.synthesisResultsP1?.length}, Actions: ${plan.normalizedActionCandidatesP1?.length}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${fx.id}`, {
      role, decision, feedback, thinking, crisis, error, project, avoid, synth, conflict, repair, actions, growth
    });
  }
}

console.log(`\n>>> PHASE 6B WORK FIXTURES QA AUDIT RESULT: ${passCount}/${fixtures.length} PASSED <<<`);

if (passCount !== fixtures.length) {
  process.exit(1);
}
