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

console.log("=== PHASE 7B: COUPLE V5 DOMAIN MODELS & FIXTURES QA ===");

const fixtures = [
  { id: "1. High emotional + high practical fit", psychA: psych({ structure: 80, practicality: 80 }), psychB: psych({ structure: 75, practicality: 75 }) },
  { id: "2. Strong romance + weak household fit", psychA: psych({ stimulation: 90, structure: 15 }), psychB: psych({ stimulation: 85, structure: 10 }) },
  { id: "3. Strong household + low emotional expression", psychA: psych({ structure: 90, empathy: 10 }), psychB: psych({ structure: 85, empathy: 15 }) },
  { id: "4. Daily money alignment", psychA: psych({ practicality: 80 }), psychB: psych({ practicality: 75 }) },
  { id: "5. Major-money decision mismatch", psychA: psych({ decision_style: 95 }), psychB: psych({ decision_style: 10 }) },
  { id: "6. Chore standard mismatch", psychA: psych({ structure: 95 }), psychB: psych({ structure: 15 }) },
  { id: "7. Actual mental-load imbalance evidence", psychA: psych({ structure: 90, recognition: 90 }), psychB: psych({ structure: 20, recognition: 10 }) },
  { id: "8. Structure gap without mental-load evidence", psychA: psych({ structure: 60 }), psychB: psych({ structure: 40 }) },
  { id: "9. Autonomy / togetherness mismatch", psychA: psych({ energy_style: 10 }), psychB: psych({ energy_style: 90 }) },
  { id: "10. Social-life mismatch", psychA: psych({ energy_style: 95 }), psychB: psych({ energy_style: 15 }) },
  { id: "11. Extended-family boundary difference", psychA: psych({ conflict_style: 90 }), psychB: psych({ conflict_style: 15 }) },
  { id: "12. Career / household tension", psychA: psych({ decision_style: 90, structure: 85 }), psychB: psych({ decision_style: 85, structure: 80 }) },
  { id: "13. Crisis-role complement", psychA: psych({ self_control: 85 }), psychB: psych({ self_control: 25 }) },
  { id: "14. Repeating role lock", psychA: psych({ conflict_style: 90, resilience: 10 }), psychB: psych({ conflict_style: 85, resilience: 15 }) },
  { id: "15. Chemistry + chronic conflict", psychA: psych({ stimulation: 95, conflict_style: 90 }), psychB: psych({ stimulation: 90, conflict_style: 85 }) },
  { id: "16. Healthy balanced long-term couple", psychA: psych({ structure: 50, resilience: 75 }), psychB: psych({ structure: 50, resilience: 75 }) },
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

  const role = Boolean(plan.lifePartnerRoles?.selfRole && plan.lifePartnerRoles?.partnerRole);
  const operating = Boolean(plan.householdOperatingP1?.coordinationPattern);
  const mental = Boolean(plan.mentalLoadP1?.primaryCoordinator);
  const money = Boolean(plan.moneyP1?.dailySpendingStyle);
  const major = Boolean(plan.majorDecisionsP1?.decisionTempo);
  const chores = Boolean(plan.choresP1?.taskVisibility);
  const space = Boolean(plan.spaceTogethernessP1?.closenessStyle);
  const family = Boolean(plan.extendedFamilyP1?.privacyBoundary);
  const crisis = Boolean(plan.crisisP1?.logisticsHandler);
  const lock = Boolean(plan.roleLockP1?.repeatingConflictRole);
  const intimacy = (plan.longTermIntimacyP1?.sustainingFactors.length ?? 0) >= 1;
  const future = Boolean(plan.futureOperatingP1?.jointDiscussionStyle);
  const synth = (plan.synthesisResultsP1?.length ?? 0) >= 1;
  const conflict = Boolean(plan.conflictLoopP0?.trigger && plan.conflictLoopP0?.breakPattern);
  const repair = Boolean(plan.repairPatternP0?.deEscalateSos && plan.repairPatternP0?.repairSequence);
  const actions = (plan.normalizedActionCandidatesP1?.length ?? 0) >= 4;
  const growth = Boolean(plan.growthTransitionP1?.recommendedAdjustment);

  if (
    role && operating && mental && money && major && chores && space &&
    family && crisis && lock && intimacy && future && synth &&
    conflict && repair && actions && growth
  ) {
    console.log(`[PASS] ${fx.id}`);
    console.log(`  - Role: ok, Operating: ok, MentalLoad: ok, Money: ok, MajorDecision: ok`);
    console.log(`  - Chores: ok, Space: ok, Family: ok, Crisis: ok, Lock: ok, Intimacy: ok`);
    console.log(`  - Syntheses: ${plan.synthesisResultsP1?.length}, Actions: ${plan.normalizedActionCandidatesP1?.length}, Growth: ok`);
    passCount++;
  } else {
    console.error(`[FAIL] ${fx.id}`, {
      role, operating, mental, money, major, chores, space, family, crisis, lock, intimacy, future, synth, conflict, repair, actions, growth
    });
  }
}

console.log(`\n>>> PHASE 7B COUPLE FIXTURES QA AUDIT RESULT: ${passCount}/${fixtures.length} PASSED <<<`);

if (passCount !== fixtures.length) {
  process.exit(1);
}
