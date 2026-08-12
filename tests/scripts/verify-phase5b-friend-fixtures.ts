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

console.log("=== PHASE 5B: FRIEND V5 DOMAIN MODELS & FIXTURES QA ===");

const fixtures = [
  { id: "1. High closeness + Frequent contact", psychA: psych({ energy_style: 85 }), psychB: psych({ energy_style: 80 }) },
  { id: "2. High closeness + Low contact", psychA: psych({ energy_style: 30 }), psychB: psych({ energy_style: 25 }) },
  { id: "3. One-on-one preference", psychA: psych({ stimulation: 20 }), psychB: psych({ stimulation: 25 }) },
  { id: "4. Group-energy preference", psychA: psych({ stimulation: 90 }), psychB: psych({ stimulation: 85 }) },
  { id: "5. Recognition sensitive", psychA: psych({ recognition: 90 }), psychB: psych({ recognition: 40 }) },
  { id: "6. Exclusion-supported case", psychA: psych({ recognition: 95 }), psychB: psych({ recognition: 90 }) },
  { id: "7. One-sided planning", psychA: psych({ structure: 90 }), psychB: psych({ structure: 10 }) },
  { id: "8. Balanced initiative", psychA: psych({ structure: 50 }), psychB: psych({ structure: 50 }) },
  { id: "9. Strong long-distance sustainability", psychA: psych({ resilience: 90 }), psychB: psych({ resilience: 85 }) },
  { id: "10. Weak long-distance evidence", psychA: psych({ resilience: 20 }), psychB: psych({ resilience: 15 }) },
  { id: "11. Conflict tension + Strong repair", psychA: psych({ conflict_style: 85, resilience: 90 }), psychB: psych({ conflict_style: 80, resilience: 85 }) },
  { id: "12. Healthy balanced friendship", psychA: psych({ energy_style: 50, resilience: 75 }), psychB: psych({ energy_style: 50, resilience: 75 }) },
];

let passedCount = 0;

for (const fx of fixtures) {
  const report = buildFriendReportEnriched({
    nicknameA: "민준", nicknameB: "서준",
    sajuJsonA: sajuA, sajuJsonB: sajuB,
    psychMasterA: fx.psychA, psychMasterB: fx.psychB,
    locale: "ko-KR",
  });

  const plan = report.story_plan;

  if (!plan) {
    throw new Error(`[FAIL] ${fx.id}: story_plan missing`);
  }

  const hasRole = Boolean(plan.friendshipRoleP1);
  const hasContact = Boolean(plan.contactDistanceP1);
  const hasOneOnOne = Boolean(plan.oneOnOneVsGroupP1);
  const hasJealousy = Boolean(plan.jealousyExclusionP1);
  const hasInitiative = Boolean(plan.initiativeP1);
  const hasLongDist = Boolean(plan.longDistanceSustainabilityP1);
  const hasSynth = (plan.synthesisResultsP1?.length ?? 0) > 0;
  const hasConflict = Boolean(plan.conflictLoopP0);
  const hasRepair = Boolean(plan.repairPatternP0);
  const hasActions = (plan.normalizedActionCandidatesP1?.length ?? 0) >= 4;
  const hasGrowth = Boolean(plan.growthTransitionP1);

  if (
    hasRole && hasContact && hasOneOnOne && hasJealousy &&
    hasInitiative && hasLongDist && hasSynth && hasConflict &&
    hasRepair && hasActions && hasGrowth
  ) {
    console.log(`[PASS] ${fx.id}`);
    console.log(`  - Role: ok, Contact: ok, OneOnOne: ok, Jealousy: ok`);
    console.log(`  - Initiative: ok, LongDist: ok, Synth: ${plan.synthesisResultsP1?.length}, Actions: ${plan.normalizedActionCandidatesP1?.length}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${fx.id}`, {
      hasRole, hasContact, hasOneOnOne, hasJealousy, hasInitiative,
      hasLongDist, hasSynth, hasConflict, hasRepair, hasActions, hasGrowth
    });
  }
}

console.log(`\n>>> PHASE 5B FRIEND FIXTURES QA AUDIT RESULT: ${passedCount}/${fixtures.length} PASSED <<<`);

if (passedCount !== fixtures.length) {
  process.exit(1);
}
