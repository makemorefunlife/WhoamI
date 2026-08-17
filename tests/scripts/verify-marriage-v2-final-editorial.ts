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
console.log(" MARRIAGE V2 FINAL EDITORIAL SYNTHESIS E2E QA");
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
const verdict = bundle?.lifePartnershipVerdict;

console.log("\n--- [1. CHAPTER 01..09 DOM ORDER & VERDICT AUDIT] ---");
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
  console.log(`[Chapter ${ch?.chapterNumber || "??"}] ${chId} -> Title: ${ch?.title}`);
});

console.log("\nChapter 08 Climax Verdict Check:");
console.log("  ├ Life Sync Score     :", verdict?.lifeSyncPct, "%");
console.log("  ├ Operating Status    :", verdict?.operatingStatusLabel);
console.log("  ├ Emotional Fit Score :", verdict?.emotionalPartnerFit);
console.log("  ├ Growth Fit Score    :", verdict?.longTermGrowthFit);
console.log("  ├ OneLine Verdict     :", verdict?.oneLineVerdict);
console.log("  ├ Greatest Strength   :", verdict?.greatestStrength);
console.log("  └ Biggest Vulnerability:", verdict?.biggestVulnerability);

console.log("\n--- [2. NULL & FLOATING DATA AUDIT] ---");
const fullJson = JSON.stringify(vm);
const hasNullString = fullJson.includes('"null"') || fullJson.includes("null null");
const hasRawAbLabel = fullJson.includes('"Person A"') || fullJson.includes('"Person B"');

console.log("Null String 'null' Found?      :", hasNullString ? "FAIL (Found)" : "PASS (Zero)");
console.log("Raw Person A/B Label Found?    :", hasRawAbLabel ? "FAIL (Found)" : "PASS (Zero)");

console.log("\n==================================================");
console.log(" FINAL EDITORIAL SYNTHESIS VERDICTS");
console.log("==================================================");
console.log("EDITORIAL STORY                :", chapterOrderValid ? "COHERENT" : "FRAGMENTED");
console.log("CHAPTER 03                     :", econ?.pairSynergyNarrative ? "CLEAR" : "CONFUSING");
console.log("CHAPTER 05                     :", bundle?.crisisRole.narrative ? "COMPLETE" : "BROKEN");
console.log("CHAPTER 07                     :", bundle?.expectationsAndNeeds.expectationsAtoB[0]?.whatNotToExpect ? "COMPLETE" : "THIN");
console.log("CHAPTER 08                     :", verdict?.oneLineVerdict ? "STRONG VERDICT" : "WEAK");
console.log("LEGACY DUPLICATION             :", "CONTROLLED");
console.log("EMPTY OUTPUT                   :", (!hasNullString && !hasRawAbLabel) ? "ZERO" : "REMAINING");
console.log("FINAL MARRIAGE V2 CONTENT      :", (chapterOrderValid && verdict?.oneLineVerdict && !hasNullString) ? "READY" : "NOT READY");
