import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel";
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
console.log(" MARRIAGE V2 PHASE 9 ACTUAL REPORT DOM AUDIT");
console.log("==================================================");

const psychA = makePsych({ self_control: 75, practicality: 65, structure: 80 });
const psychB = makePsych({ practicality: 70, self_control: 45, recognition: 40 });

const report = buildMarriageReport({
  nicknameA: "Sera",
  nicknameB: "동글",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  psychMasterA: psychA,
  psychMasterB: psychB,
  locale: "ko-KR",
});

const vm = buildMarriageReportViewModel(report, {
  viewerIsReportA: true,
  myName: "Sera",
  partnerName: "동글",
  locale: "ko-KR",
});

const storyPlan = vm.canonicalStoryPlan;
const bundle = vm.canonicalBundle;
const econ = bundle?.economicPartnership;

console.log("\n--- [1. CHAPTER 01..09 EDITORIAL HEADER & DOM ORDER AUDIT] ---");
const expectedChapters = [
  "c1_who_we_are", "c2_lifestyle_dna", "c3_household_os", "c4_intimacy_bedroom",
  "c5_conflict_deescalation", "c6_family_parenting_career", "c7_longterm_compounding",
  "c8_partnership_verdict", "c9_next_chapter_rituals"
];

let chapterOrderValid = true;
expectedChapters.forEach((chId, idx) => {
  const ch = storyPlan?.chapters.find(c => c.chapterId === chId);
  const expectedNumber = String(idx + 1).padStart(2, "0");
  if (!ch || ch.chapterNumber !== expectedNumber) {
    chapterOrderValid = false;
  }
  console.log(`[DOM Header ${ch?.chapterNumber || "??"}] ${chId} -> Title: ${ch?.title}`);
});

console.log("\nChapter 01..09 Hierarchy & Order Valid?:", chapterOrderValid ? "RESTORED" : "BROKEN");

console.log("\n--- [2. CHAPTER 03 ECONOMIC PARTNERSHIP ACTUAL TEXT AUDIT] ---");
console.log("Sera Economic Role          :", `${econ?.profileA.primaryRoleLabel} / ${econ?.profileA.secondaryRoleLabel}`);
console.log("Sera Economic Strengths     :", econ?.profileA.behaviorDescription);
console.log("동글 Economic Role          :", `${econ?.profileB.primaryRoleLabel} / ${econ?.profileB.secondaryRoleLabel}`);
console.log("동글 Economic Strengths     :", econ?.profileB.behaviorDescription);
console.log("Pair Economic Synergy       :", econ?.pairSynergyTitle);
console.log("Pair Economic Narrative     :", econ?.pairSynergyNarrative);
console.log("Decision Flow (Cash Flow)   :", econ?.decisionFlow.cashFlowTracker);
console.log("Decision Flow (Large Purch) :", econ?.decisionFlow.largePurchaseProposer);
console.log("Decision Flow (Risk Review) :", econ?.decisionFlow.riskReviewer);
console.log("Decision Flow (Executor)    :", econ?.decisionFlow.executor);

console.log("\n--- [3. CHAPTER 05 DEPTH ACTUAL TEXT AUDIT] ---");
// stageA/stageB are raw canonical stage objects, not strings — extract the
// same readable field the production normalizer uses (normalizeConflict4Stage
// in buildMarriageReportViewModel.ts), matching what actually renders in the
// DOM, instead of implicitly stringifying the object to "[object Object]".
const stageText = (st: unknown) =>
  typeof st === "string"
    ? st
    : ((st as Record<string, string>)?.internalState ||
        (st as Record<string, string>)?.externalBehavior ||
        (st as Record<string, string>)?.description ||
        (st as Record<string, string>)?.title ||
        "(no readable field)");
console.log("Conflict 4-Stage A (Sera)   :", bundle?.conflict4Stage.stageA.map(stageText).join(" -> "));
console.log("Conflict 4-Stage B (동글)   :", bundle?.conflict4Stage.stageB.map(stageText).join(" -> "));
console.log("Crisis Role Practical Lead  :", bundle?.crisisRole.practicalLead);
console.log("Crisis Role Narrative       :", bundle?.crisisRole.narrative);
console.log("Emergency SOS A->B FirstLine:", bundle?.emergencySosCombined.scriptAtoB.firstLine);

console.log("\n--- [4. CHAPTER 07 DEPTH ACTUAL TEXT AUDIT] ---");
console.log("Primary Burnout Partner     :", bundle?.coupleBurnout.primaryOverloadRiskPartner);
console.log("Burnout Risk Narrative      :", bundle?.coupleBurnout.overallNarrative);
console.log("What Not to Expect A->B     :", bundle?.expectationsAndNeeds.expectationsAtoB[0]?.whatNotToExpect);
console.log("What Not to Expect B->A     :", bundle?.expectationsAndNeeds.expectationsBtoA[0]?.whatNotToExpect);
console.log("Long-Term Asset #1          :", bundle?.longTermCompounding.assets[0]?.title);
console.log("Long-Term Liability #1      :", bundle?.longTermCompounding.liabilities[0]?.title);

console.log("\n==================================================");
console.log(" FINAL PHASE 9 VERDICTS");
console.log("==================================================");
const econSubstantive = Boolean(econ?.profileA.behaviorDescription && econ?.decisionFlow.cashFlowTracker);
const ch5Substantive = Boolean(bundle?.crisisRole.narrative && bundle?.emergencySosCombined.scriptAtoB.firstLine);
const ch7Substantive = Boolean(bundle?.expectationsAndNeeds.expectationsAtoB[0]?.whatNotToExpect && bundle?.coupleBurnout.overallNarrative);

console.log("CHAPTER 01-09 EDITORIAL STRUCTURE:", chapterOrderValid ? "RESTORED" : "BROKEN");
console.log("ECONOMIC PARTNERSHIP             :", econSubstantive ? "SUBSTANTIVE" : "THIN");
console.log("CHAPTER 05                       :", ch5Substantive ? "SUBSTANTIVE" : "THIN");
console.log("CHAPTER 07                       :", ch7Substantive ? "SUBSTANTIVE" : "THIN");
console.log("USER-VISIBLE COVERAGE            :", (chapterOrderValid && econSubstantive && ch5Substantive && ch7Substantive) ? "ACTUALLY COMPLETE" : "STILL PARTIAL");
console.log("READY FOR FINAL CONTENT QA        :", (chapterOrderValid && econSubstantive && ch5Substantive && ch7Substantive) ? "YES" : "NO");
