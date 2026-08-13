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
console.log(" MARRIAGE V2 PHASE 1-2 REGRESSION & VARIATION AUDIT");
console.log("==================================================");

// Pair 1: PM Heavy A + Executor Heavy B
const psychA1 = makePsych({ structure: 80, self_control: 75, recognition: 50 });
const psychB1 = makePsych({ structure: 35, practicality: 70, empathy: 60 });
const report1 = buildMarriageReport({
  nicknameA: "Sera", nicknameB: "동글",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA1, psychMasterB: psychB1,
  locale: "ko-KR",
});

// Pair 2: Dual Planner Tension
const psychA2 = makePsych({ structure: 80, self_control: 75, decision_style: 75 });
const psychB2 = makePsych({ structure: 75, self_control: 80, decision_style: 70 });
const report2 = buildMarriageReport({
  nicknameA: "민준", nicknameB: "서연",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA2, psychMasterB: psychB2,
  locale: "ko-KR",
});

// Pair 3: Dual High Career Recognition (Overload Risk)
const psychA3 = makePsych({ recognition: 85, empathy: 45, structure: 50 });
const psychB3 = makePsych({ recognition: 80, empathy: 45, structure: 50 });
const report3 = buildMarriageReport({
  nicknameA: "현우", nicknameB: "지은",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA3, psychMasterB: psychB3,
  locale: "ko-KR",
});

// Pair 4: Crisis Complement (Practical A + Emotional B)
const psychA4 = makePsych({ practicality: 80, thinking_style: 75, empathy: 40 });
const psychB4 = makePsych({ empathy: 85, resilience: 75, practicality: 40 });
const report4 = buildMarriageReport({
  nicknameA: "도윤", nicknameB: "하은",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA4, psychMasterB: psychB4,
  locale: "ko-KR",
});

console.log("\n--- [PAIR 1: PM Heavy A vs Executor Heavy B] ---");
const b1 = report1.canonical_projections?.marriage_canonical_bundle;
console.log("Household PM Type        :", b1?.householdPm.pmType);
console.log("Primary Household Manager:", b1?.householdPm.primaryManager);
console.log("Planner vs Executor Role :", `${b1?.plannerExecutor.roleA} vs ${b1?.plannerExecutor.roleB}`);
console.log("Role Shift Note          :", b1?.plannerExecutor.shiftNote);

console.log("\n--- [PAIR 2: Dual Planner Tension] ---");
const b2 = report2.canonical_projections?.marriage_canonical_bundle;
console.log("Planner vs Executor Role :", `${b2?.plannerExecutor.roleA} vs ${b2?.plannerExecutor.roleB}`);
console.log("Alignment Type           :", b2?.plannerExecutor.alignmentType);

console.log("\n--- [PAIR 3: Dual High Career Recognition] ---");
const b3 = report3.canonical_projections?.marriage_canonical_bundle;
console.log("Career Priority A vs B   :", `${b3?.careerHome.careerPriorityA} vs ${b3?.careerHome.careerPriorityB}`);
console.log("Load Transfer Risk       :", b3?.careerHome.loadTransferRisk);

console.log("\n--- [PAIR 4: Crisis Complement] ---");
const b4 = report4.canonical_projections?.marriage_canonical_bundle;
console.log("Crisis Synergy Type      :", b4?.crisisRole.synergyType);
console.log("Practical Lead vs Anchor :", `${b4?.crisisRole.practicalLead} vs ${b4?.crisisRole.emotionalAnchor}`);

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
const allBundlesReady = Boolean(b1 && b2 && b3 && b4);

console.log("\n==================================================");
console.log(" FINAL VERDICT");
console.log("==================================================");
console.log("MARRIAGE CANONICAL FOUNDATION   :", allBundlesReady ? "READY" : "NOT READY");
console.log("MARRIAGE V1 STRENGTH PRESERVATION:", allPreserved ? "PASS" : "FAIL");
console.log("HOUSEHOLD OS FOUNDATION         :", (allBundlesReady && b1?.householdPm.pmType === "HOUSEHOLD_PM") ? "READY" : "NOT READY");
