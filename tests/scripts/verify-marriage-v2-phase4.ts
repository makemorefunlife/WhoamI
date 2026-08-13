import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

function makePsych(overrides: Record<string, number>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
    home_life_dna: { lifestyle_title: "체계적인 정리자", life_values_line: "안정된 공간" },
  } as unknown as PsychMasterJson;
}

const sajuA: SajuDataForIntegrated = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" } };
const sajuB: SajuDataForIntegrated = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" } };

console.log("==================================================");
console.log(" MARRIAGE V2 PHASE 4 REFERENCE CAPABILITY AUDIT");
console.log("==================================================");

// Pair 1: Household fit HIGH + Emotional Delivery Mismatch
const psychA1 = makePsych({ structure: 75, empathy: 80 });
const psychB1 = makePsych({ structure: 75, practicality: 75, empathy: 35 });
const report1 = buildMarriageReport({
  nicknameA: "Sera", nicknameB: "동글",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA1, psychMasterB: psychB1,
  locale: "ko-KR",
});

// Pair 2: Financial Complement + Intimacy Mismatch
const psychA2 = makePsych({ practicality: 80, stimulation: 35 });
const psychB2 = makePsych({ practicality: 40, stimulation: 80 });
const report2 = buildMarriageReport({
  nicknameA: "민준", nicknameB: "서연",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA2, psychMasterB: psychB2,
  locale: "ko-KR",
});

// Pair 3: Dual Planner / Conflict Escalation
const psychA3 = makePsych({ structure: 80, conflict_style: 30 });
const psychB3 = makePsych({ structure: 80, conflict_style: 30 });
const report3 = buildMarriageReport({
  nicknameA: "현우", nicknameB: "지은",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA3, psychMasterB: psychB3,
  locale: "ko-KR",
});

// Pair 4: High Career Load + Strong Crisis Complement
const psychA4 = makePsych({ recognition: 85, thinking_style: 75 });
const psychB4 = makePsych({ recognition: 80, empathy: 80 });
const report4 = buildMarriageReport({
  nicknameA: "도윤", nicknameB: "하은",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA4, psychMasterB: psychB4,
  locale: "ko-KR",
});

const bundle1 = report1.canonical_projections?.marriage_canonical_bundle;
const bundle2 = report2.canonical_projections?.marriage_canonical_bundle;
const bundle3 = report3.canonical_projections?.marriage_canonical_bundle;
const bundle4 = report4.canonical_projections?.marriage_canonical_bundle;

console.log("\n--- [1. 11-AXIS FULL INTEGRATION CHECK] ---");
console.log("Dark Axis Insights Count          :", bundle1?.marriage11Axis.darkAxisInsights.length);
console.log("Pair 1 Max Tension Axis           :", bundle1?.marriage11Axis.highlights.maxTension.axisLabel);
console.log("Pair 2 Max Tension Axis           :", bundle2?.marriage11Axis.highlights.maxTension.axisLabel);

console.log("\n--- [2. CONFLICT 4-STAGE STATE TRANSITION CHECK] ---");
console.log("Person A 4-Stage Count            :", bundle1?.conflict4Stage.stageA.length);
console.log("Person A Overload Behavior        :", bundle1?.conflict4Stage.stageA[2].externalBehavior);
console.log("Person B Overload Behavior        :", bundle1?.conflict4Stage.stageB[2].externalBehavior);

console.log("\n--- [3. WANTED LOVE vs GIVEN LOVE CHECK] ---");
console.log("Pair 1 Delivery Match A->B        :", bundle1?.loveDeliveryMatch.matchAtoB.matchStatus);
console.log("Pair 1 A Wants vs B Gives         :", `${bundle1?.loveDeliveryMatch.matchAtoB.wantedChannelLabel} vs ${bundle1?.loveDeliveryMatch.matchAtoB.givenChannelLabel}`);

console.log("\n--- [4. WHAT NOT TO EXPECT & WHEN NEEDED MOST CHECK] ---");
console.log("Pair 1 What Not to Expect A->B    :", bundle1?.expectationsAndNeeds.expectationsAtoB[0].whatNotToExpect);
console.log("Pair 1 When Needed Most Scene     :", bundle1?.expectationsAndNeeds.momentsAtoB[0].sceneTitle);

console.log("\n--- [5. EMERGENCY SOS COMBINED CHECK] ---");
console.log("Directional SOS Script A->B First :", bundle1?.emergencySosCombined.scriptAtoB.firstLine);

console.log("\n--- [6. NEED x ACTUAL DELIVERY x GAP CHECK] ---");
console.log("Pair 1 Emotional Need Status      :", bundle1?.expectationsAndNeeds.needGaps.find(g => g.category === "EMOTIONAL_NEED")?.status);

console.log("\n==================================================");
console.log(" USER-QUESTION GAP CHECK (8 QUESTIONS)");
console.log("==================================================");
const q1 = Boolean(bundle1?.loveDeliveryMatch.matchAtoB.wantedChannelLabel);
const q2 = Boolean(bundle1?.loveDeliveryMatch.matchAtoB.givenChannelLabel);
const q3 = Boolean(bundle1?.loveDeliveryMatch.matchAtoB.matchStatus);
const q4 = Boolean(bundle1?.expectationsAndNeeds.expectationsAtoB[0].whatNotToExpect);
const q5 = Boolean(bundle1?.expectationsAndNeeds.momentsAtoB[0].sceneTitle);
const q6 = Boolean(bundle1?.conflict4Stage.stageA.length === 4);
const q7 = Boolean(bundle1?.emergencySosCombined.scriptAtoB.firstLine);
const q8 = Boolean(bundle1?.expectationsAndNeeds.needGaps.length >= 6);

console.log("1. 어떤 사랑을 받고 싶은가?       :", q1 ? "PASS" : "FAIL");
console.log("2. 배우자는 실제 어떻게 주는가?   :", q2 ? "PASS" : "FAIL");
console.log("3. 그것이 잘 전달되는가?           :", q3 ? "PASS" : "FAIL");
console.log("4. 무엇을 기대하지 말아야 하는가? :", q4 ? "PASS" : "FAIL");
console.log("5. 언제 서로를 가장 필요로 하는가?:", q5 ? "PASS" : "FAIL");
console.log("6. 싸울 때 어떤 단계로 변하는가?  :", q6 ? "PASS" : "FAIL");
console.log("7. 지금 싸웠다면 무엇이라 말할가? :", q7 ? "PASS" : "FAIL");
console.log("8. 필요한 것을 실제 충분히 주는가?:", q8 ? "PASS" : "FAIL");

const allQuestionsPass = q1 && q2 && q3 && q4 && q5 && q6 && q7 && q8;

console.log("\n==================================================");
console.log(" EXISTING MARRIAGE V1 STRENGTH PRESERVATION CHECK");
console.log("==================================================");
const hasCfo = Boolean(report1.household?.section_money_chores?.cfo_nickname);
const hasBedroom = Boolean(report1.household?.section_bedroom);
const hasSleep = Boolean(report1.household?.section_weather_forecast);
const hasDeEscalation = Boolean(report1.household?.section_warning?.de_escalation);
const hasParenting = Boolean(report1.household?.section_parenting);
const hasMoneyChores = Boolean(report1.household?.section_money_chores);

console.log("Operating CFO Preserved?        :", hasCfo ? "PASS" : "FAIL");
console.log("Bedroom Intimacy Preserved?     :", hasBedroom ? "PASS" : "FAIL");
console.log("Sleep Fit Preserved?            :", hasSleep ? "PASS" : "FAIL");
console.log("Home De-Escalation Preserved?   :", hasDeEscalation ? "PASS" : "FAIL");
console.log("Parenting Synergy Preserved?    :", hasParenting ? "PASS" : "FAIL");
console.log("Money & Chores System Preserved?:", hasMoneyChores ? "PASS" : "FAIL");

const allPreserved = hasCfo && hasBedroom && hasSleep && hasDeEscalation && hasParenting && hasMoneyChores;

console.log("\n==================================================");
console.log(" FINAL PHASE 4 VERDICTS");
console.log("==================================================");
console.log("MARRIAGE REFERENCE PORTING      :", (bundle1 && bundle2 && bundle3 && bundle4) ? "READY" : "FAIL");
console.log("11-AXIS FULL INTEGRATION         :", (bundle1?.marriage11Axis.darkAxisInsights.length === 11) ? "COMPLETE" : "PARTIAL");
console.log("RELATIONSHIP MEANINGS            :", allQuestionsPass ? "COMPLETE" : "PARTIAL");
console.log("MARRIAGE V1 STRENGTH PRESERVATION:", allPreserved ? "PASS" : "FAIL");
