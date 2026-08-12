import { buildFriendReportEnriched } from "../../lib/relationship/enrichment/buildFriendReportEnriched";
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

console.log("=== PHASE 5C: FRIEND V5 FINAL INTEGRATION & COVERAGE QA ===");

const fixtures = [
  { id: "1. High chemistry / low risk", psychA: psych({ stimulation: 85, energy_style: 80 }), psychB: psych({ stimulation: 80, energy_style: 75 }) },
  { id: "2. High closeness / low contact", psychA: psych({ energy_style: 30 }), psychB: psych({ energy_style: 25 }) },
  { id: "3. Large social-energy difference", psychA: psych({ energy_style: 95, stimulation: 90 }), psychB: psych({ energy_style: 15, stimulation: 10 }) },
  { id: "4. Advice-style mismatch / strong trust", psychA: psych({ empathy: 90, practicality: 10 }), psychB: psych({ empathy: 10, practicality: 90 }) },
  { id: "5. Conflict-sensitive friendship", psychA: psych({ conflict_style: 90, resilience: 15 }), psychB: psych({ conflict_style: 85, resilience: 20 }) },
  { id: "6. Healthy balanced low-maintenance friendship", psychA: psych({ energy_style: 50, resilience: 80 }), psychB: psych({ energy_style: 50, resilience: 80 }) },
];

let passCount = 0;

for (const fx of fixtures) {
  const report = buildFriendReportEnriched({
    nicknameA: "민준", nicknameB: "서준",
    sajuJsonA: sajuA, sajuJsonB: sajuB,
    psychMasterA: fx.psychA, psychMasterB: fx.psychB,
    locale: "ko-KR",
  });

  const plan = report.story_plan;
  if (!plan) {
    throw new Error(`[FAIL] ${fx.id}: missing story_plan`);
  }

  const role = Boolean(plan.friendshipRoleP1?.selfToFriend && plan.friendshipRoleP1?.friendToSelf);
  const contact = Boolean(plan.contactDistanceP1?.contactRhythm && plan.contactDistanceP1?.distanceTolerance);
  const oneOnOne = Boolean(plan.oneOnOneVsGroupP1?.oneOnOneMode && plan.oneOnOneVsGroupP1?.groupMode);
  const jealousy = Boolean(plan.jealousyExclusionP1?.recognitionSensitivity);
  const initiative = Boolean(plan.initiativeP1?.summary);
  const longDist = Boolean(plan.longDistanceSustainabilityP1?.sustainabilityLevel);
  const synth = (plan.synthesisResultsP1?.length ?? 0) >= 1;
  const conflict = Boolean(plan.conflictLoopP0?.trigger && plan.conflictLoopP0?.breakPattern);
  const repair = Boolean(plan.repairPatternP0?.sosImmediate && plan.repairPatternP0?.repairSequence);
  const actions = (plan.normalizedActionCandidatesP1?.length ?? 0) >= 4;
  const growth = Boolean(plan.growthTransitionP1?.recommendedAdjustment);

  if (
    role && contact && oneOnOne && jealousy && initiative &&
    longDist && synth && conflict && repair && actions && growth
  ) {
    console.log(`Fixture ${fx.id}: PASS`);
    console.log(`  - Role: ok, Contact: ok, OneOnOne: ok, Jealousy: ok`);
    console.log(`  - Initiative: ok, LongDist: ok, Syntheses: ${plan.synthesisResultsP1?.length}, Actions: ${plan.normalizedActionCandidatesP1?.length}, Growth: ok`);
    passCount++;
  } else {
    console.error(`Fixture ${fx.id}: FAIL`, {
      role, contact, oneOnOne, jealousy, initiative, longDist, synth, conflict, repair, actions, growth
    });
  }
}

console.log(`\n>>> INTEGRATION QA AUDIT RESULT: ${passCount}/${fixtures.length} PASSED <<<`);

if (passCount !== fixtures.length) {
  process.exit(1);
}
