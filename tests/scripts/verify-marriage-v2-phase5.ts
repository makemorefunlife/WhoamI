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
console.log(" MARRIAGE V2 PHASE 5 MARRIAGE-SPECIFIC GAPS AUDIT");
console.log("==================================================");

// Pair 1: Strong Family Boundary Couple
const psychA1 = makePsych({ structure: 70, conflict_style: 65 });
const psychB1 = makePsych({ structure: 65, conflict_style: 65 });
const report1 = buildMarriageReport({
  nicknameA: "Sera", nicknameB: "동글",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA1, psychMasterB: psychB1,
  locale: "ko-KR",
});

// Pair 2: Asymmetric Original-Family Loyalty
const psychA2 = makePsych({ empathy: 80, stimulation: 35 });
const psychB2 = makePsych({ empathy: 45, structure: 70 });
const report2 = buildMarriageReport({
  nicknameA: "민준", nicknameB: "서연",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA2, psychMasterB: psychB2,
  locale: "ko-KR",
});

// Pair 3: Household PM Overload Couple
const psychA3 = makePsych({ structure: 85, self_control: 80 });
const psychB3 = makePsych({ structure: 30, self_control: 35 });
const report3 = buildMarriageReport({
  nicknameA: "현우", nicknameB: "지은",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA3, psychMasterB: psychB3,
  locale: "ko-KR",
});

// Pair 4: Dual-Career High Demand Couple
const psychA4 = makePsych({ recognition: 85 });
const psychB4 = makePsych({ recognition: 85 });
const report4 = buildMarriageReport({
  nicknameA: "도윤", nicknameB: "하은",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA4, psychMasterB: psychB4,
  locale: "ko-KR",
});

// Pair 5: Balanced Adaptive Long-Term Couple
const psychA5 = makePsych({ structure: 55, empathy: 55 });
const psychB5 = makePsych({ structure: 55, empathy: 55 });
const report5 = buildMarriageReport({
  nicknameA: "지훈", nicknameB: "수진",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA5, psychMasterB: psychB5,
  locale: "ko-KR",
});

const bundle1 = report1.canonical_projections?.marriage_canonical_bundle;
const bundle2 = report2.canonical_projections?.marriage_canonical_bundle;
const bundle3 = report3.canonical_projections?.marriage_canonical_bundle;
const bundle4 = report4.canonical_projections?.marriage_canonical_bundle;
const bundle5 = report5.canonical_projections?.marriage_canonical_bundle;

console.log("\n--- [1. IN-LAW BOUNDARY CHECK] ---");
console.log("Pair 1 Pair Verdict               :", bundle1?.inLawBoundary.pairVerdict);
console.log("Pair 2 Pair Verdict               :", bundle2?.inLawBoundary.pairVerdict);

console.log("\n--- [2. LIFE STAGE TRANSITION CHECK] ---");
console.log("Transitions Count                 :", bundle1?.lifeStageTransition.transitions.length);
console.log("Parenting Stage Role Shift        :", bundle1?.lifeStageTransition.transitions.find(t => t.stageKey === "PARENTING_FAMILY_BUILDING")?.roleShiftNeeded);

console.log("\n--- [3. COUPLE BURNOUT CHECK] ---");
console.log("Pair 1 Overload Risk Partner      :", bundle1?.coupleBurnout.primaryOverloadRiskPartner);
console.log("Pair 3 Overload Risk Partner      :", bundle3?.coupleBurnout.primaryOverloadRiskPartner);
console.log("Pair 3 Person A Burnout Trigger   :", bundle3?.coupleBurnout.personA.burnoutTrigger);

console.log("\n--- [4. CAREER x HOME TRANSITION CHECK] ---");
console.log("A Opportunity renegotiation       :", bundle4?.careerHomeTransition.scenarios[0].whatMustBeRenegotiated);
console.log("Dual High Demand Home Load        :", bundle4?.careerHomeTransition.scenarios[2].whoAbsorbsHomeLoad);

console.log("\n==================================================");
console.log(" USER-QUESTION COVERAGE CHECK (9 QUESTIONS)");
console.log("==================================================");
const q1 = Boolean(bundle1?.inLawBoundary.narrative);
const q2 = Boolean(bundle1?.inLawBoundary.profileA.protectionStyle);
const q3 = Boolean(bundle1?.lifeStageTransition.transitions.find(t => t.stageKey === "PARENTING_FAMILY_BUILDING")?.roleShiftNeeded);
const q4 = Boolean(bundle3?.coupleBurnout.primaryOverloadRiskPartner === "a");
const q5 = Boolean(bundle3?.coupleBurnout.personA.burnoutTrigger);
const q6 = Boolean(bundle4?.careerHomeTransition.scenarios[0].whatMustBeRenegotiated);
const q7 = Boolean(bundle1?.longTermCompounding.assets.length > 0);
const q8 = Boolean(bundle1?.longTermCompounding.liabilities.length > 0);
const q9 = Boolean(bundle1?.lifePartnershipVerdict.oneLineVerdict);

console.log("1. 원가족과 경계를 만들 수 있는가?  :", q1 ? "PASS" : "FAIL");
console.log("2. 배우자가 내 편이 되어주는가?      :", q2 ? "PASS" : "FAIL");
console.log("3. 부모가 되면 역할이 어떻게 변하는가:", q3 ? "PASS" : "FAIL");
console.log("4. 누가 먼저 번아웃되는가?          :", q4 ? "PASS" : "FAIL");
console.log("5. 왜 그 사람이 지치는가?            :", q5 ? "PASS" : "FAIL");
console.log("6. 커리어가 커질 때 재분담할 것은?  :", q6 ? "PASS" : "FAIL");
console.log("7. 함께 살수록 좋아지는 것은?        :", q7 ? "PASS" : "FAIL");
console.log("8. 함께 살수록 위험해지는 것은?      :", q8 ? "PASS" : "FAIL");
console.log("9. 실제로 같이 살아갈 좋은 팀인가?   :", q9 ? "PASS" : "FAIL");

const all9QuestionsPass = q1 && q2 && q3 && q4 && q5 && q6 && q7 && q8 && q9;

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
console.log(" FINAL PHASE 5 VERDICTS");
console.log("==================================================");
console.log("MARRIAGE-SPECIFIC GAPS          :", (bundle1 && bundle2 && bundle3 && bundle4 && bundle5) ? "COMPLETE" : "PARTIAL");
console.log("IN-LAW BOUNDARY                 :", (bundle1?.inLawBoundary.pairVerdict) ? "READY" : "PARTIAL");
console.log("LIFE STAGE                      :", (bundle1?.lifeStageTransition.transitions.length === 5) ? "READY" : "PARTIAL");
console.log("BURNOUT                         :", (bundle3?.coupleBurnout.primaryOverloadRiskPartner === "a") ? "READY" : "PARTIAL");
console.log("LIFE PARTNERSHIP SYNTHESIS      :", all9QuestionsPass ? "READY" : "PARTIAL");
