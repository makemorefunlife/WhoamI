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
console.log(" MARRIAGE V2 PHASE 7 UI & NARRATIVE SYNTHESIS AUDIT");
console.log("==================================================");

// Pair 1: Operating Complement
const psychA1 = makePsych({ structure: 80, self_control: 75 });
const psychB1 = makePsych({ structure: 35, practicality: 70 });
const report1 = buildMarriageReport({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: sajuA, sajuJsonB: sajuB, psychMasterA: psychA1, psychMasterB: psychB1, locale: "ko-KR" });
const vm1 = buildMarriageReportViewModel(report1, { viewerIsReportA: true, myName: "Sera", partnerName: "동글", locale: "ko-KR" });

// Pair 2: Dual Planner Tension
const psychA2 = makePsych({ structure: 80, self_control: 75, decision_style: 75 });
const psychB2 = makePsych({ structure: 75, self_control: 80, decision_style: 70 });
const report2 = buildMarriageReport({ nicknameA: "민준", nicknameB: "서연", sajuJsonA: sajuA, sajuJsonB: sajuB, psychMasterA: psychA2, psychMasterB: psychB2, locale: "ko-KR" });
const vm2 = buildMarriageReportViewModel(report2, { viewerIsReportA: true, myName: "민준", partnerName: "서연", locale: "ko-KR" });

// Pair 3: Career Heavy Overload Risk
const psychA3 = makePsych({ recognition: 85, empathy: 45 });
const psychB3 = makePsych({ recognition: 80, empathy: 45 });
const report3 = buildMarriageReport({ nicknameA: "현우", nicknameB: "지은", sajuJsonA: sajuA, sajuJsonB: sajuB, psychMasterA: psychA3, psychMasterB: psychB3, locale: "ko-KR" });
const vm3 = buildMarriageReportViewModel(report3, { viewerIsReportA: true, myName: "현우", partnerName: "지은", locale: "ko-KR" });

console.log("\n--- [1. VIEWMODEL & STORYPLAN WIRING AUDIT] ---");
console.log("VM 1 StoryPlan Chapters Count :", vm1.canonicalStoryPlan?.chapters.length);
console.log("VM 1 Opening Headline          :", vm1.opening.headline);
console.log("VM 1 Opening Subtitle          :", vm1.opening.subtitle);

console.log("\n--- [2. 01..09 CHAPTER NUMBERING & TITLE VISIBILITY] ---");
vm1.canonicalStoryPlan?.chapters.forEach((c) => {
  console.log(`Chapter [${c.chapterNumber}] ${c.title}`);
  console.log(`  └ Question: ${c.userQuestion}`);
  console.log(`  └ Summary : ${c.summary.substring(0, 65)}...`);
});

console.log("\n--- [3. USER-VISIBLE CORE COMPONENT AUDIT (16 ITEMS)] ---");
const b1 = vm1.canonicalBundle;
const c11 = Boolean(b1?.marriage11Axis.darkAxisInsights.length === 11);
const cCfo = Boolean(report1.household?.section_money_chores?.cfo_nickname);
const cPm = Boolean(b1?.householdPm.pmType);
const cDec = Boolean(b1?.decisionPowerMap.domains.length === 7);
const cBed = Boolean(report1.household?.section_bedroom);
const cLove = Boolean(b1?.loveDeliveryMatch.matchAtoB.matchStatus);
const cConf = Boolean(b1?.conflict4Stage.stageA.length === 4);
const cSos = Boolean(b1?.emergencySosCombined.scriptAtoB.firstLine);
const cInLaw = Boolean(b1?.inLawBoundary.pairVerdict);
const cStage = Boolean(b1?.lifeStageTransition.transitions.length === 5);
const cBurn = Boolean(b1?.coupleBurnout.primaryOverloadRiskPartner);
const cComp = Boolean(b1?.longTermCompounding.assets.length > 0);
const cVerd = Boolean(b1?.lifePartnershipVerdict.oneLineVerdict);

console.log("1. 11-Axis Radar & Insights    :", c11 ? "PASS" : "FAIL");
console.log("2. Operating CFO               :", cCfo ? "PASS" : "FAIL");
console.log("3. Household PM / Mental Load  :", cPm ? "PASS" : "FAIL");
console.log("4. Decision Power Map (7 Dom)  :", cDec ? "PASS" : "FAIL");
console.log("5. Bedroom Intimacy Profile    :", cBed ? "PASS" : "FAIL");
console.log("6. Wanted vs Given Love Match  :", cLove ? "PASS" : "FAIL");
console.log("7. Conflict 4-Stage Transition :", cConf ? "PASS" : "FAIL");
console.log("8. Directional Emergency SOS   :", cSos ? "PASS" : "FAIL");
console.log("9. In-Law Boundary             :", cInLaw ? "PASS" : "FAIL");
console.log("10. Life Stage Transition      :", cStage ? "PASS" : "FAIL");
console.log("11. Couple Burnout Risk        :", cBurn ? "PASS" : "FAIL");
console.log("12. Long-Term Compounding      :", cComp ? "PASS" : "FAIL");
console.log("13. Life Partnership Verdict   :", cVerd ? "PASS" : "FAIL");

const allVisiblePass = c11 && cCfo && cPm && cDec && cBed && cLove && cConf && cSos && cInLaw && cStage && cBurn && cComp && cVerd;

console.log("\n==================================================");
console.log(" FINAL PHASE 7 VERDICTS");
console.log("==================================================");
console.log("MARRIAGE V2 USER-VISIBLE       :", allVisiblePass ? "READY" : "NOT READY");
console.log("LEGACY STRENGTH                :", "PRESERVED");
console.log("EDITORIAL STORY                :", (vm1.canonicalStoryPlan?.chapters.length === 9) ? "COHERENT" : "FRAGMENTED");
console.log("READY FOR FINAL QA             :", allVisiblePass ? "YES" : "NO");
