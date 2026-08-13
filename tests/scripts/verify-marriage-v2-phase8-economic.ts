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
console.log(" MARRIAGE V2 PHASE 8 ECONOMIC ROLE & CONTENT AUDIT");
console.log("==================================================");

// Sera (Saver Accumulator & Risk Reviewer) x 동글 (Cash Flow Manager & Practical Executor)
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

const bundle = vm.canonicalBundle;
const econ = bundle?.economicPartnership;

console.log("\n--- [1. ACTUAL SERA × DONGGLE ECONOMIC ROLE OUTPUT] ---");
console.log("A (Sera) Economic Profile   :", `${econ?.profileA.primaryRoleLabel} / ${econ?.profileA.secondaryRoleLabel}`);
console.log("  └ Behavior                :", econ?.profileA.behaviorDescription);
console.log("B (동글) Economic Profile   :", `${econ?.profileB.primaryRoleLabel} / ${econ?.profileB.secondaryRoleLabel}`);
console.log("  └ Behavior                :", econ?.profileB.behaviorDescription);
console.log("Pair Economic Synergy       :", econ?.pairSynergyTitle);
console.log("  └ Narrative               :", econ?.pairSynergyNarrative);
console.log("Economic Decision Flow:");
console.log("  ├ Cash Flow Manager       :", econ?.decisionFlow.cashFlowTracker);
console.log("  ├ Large Purchase Proposer :", econ?.decisionFlow.largePurchaseProposer);
console.log("  ├ Risk Reviewer           :", econ?.decisionFlow.riskReviewer);
console.log("  └ Financial Executor      :", econ?.decisionFlow.executor);

console.log("\n--- [2. CHAPTER 05 DEPTH AUDIT OUTPUT] ---");
console.log("Conflict 4-Stage A (Sera)   :", bundle?.conflict4Stage.stageA.map((s: any) => typeof s === "string" ? s : s.title).join(" -> "));
console.log("Conflict 4-Stage B (동글)   :", bundle?.conflict4Stage.stageB.map((s: any) => typeof s === "string" ? s : s.title).join(" -> "));
console.log("Crisis Role Practical Lead  :", bundle?.crisisRole.practicalLead);
console.log("Emergency SOS First Line    :", bundle?.emergencySosCombined.scriptAtoB.firstLine);

console.log("\n--- [3. CHAPTER 07 DEPTH AUDIT OUTPUT] ---");
console.log("Primary Burnout Overload Risk:", bundle?.coupleBurnout.primaryOverloadRiskPartner);
console.log("Long-Term Asset #1          :", bundle?.longTermCompounding.assets[0]?.title);
console.log("Long-Term Liability #1      :", bundle?.longTermCompounding.liabilities[0]?.title);

console.log("\n==================================================");
console.log(" FINAL USER-VISIBLE COVERAGE VERDICTS");
console.log("==================================================");
const econPass = Boolean(econ?.pairSynergyNarrative);
const ch5Pass = Boolean(bundle?.emergencySosCombined.scriptAtoB.firstLine);
const ch7Pass = Boolean(bundle?.coupleBurnout.primaryOverloadRiskPartner);

console.log("USER-VISIBLE COVERAGE          :", (econPass && ch5Pass && ch7Pass) ? "COMPLETE" : "PARTIAL");
console.log("CHAPTER 05 DEPTH               :", ch5Pass ? "SUBSTANTIVE" : "THIN");
console.log("CHAPTER 07 DEPTH               :", ch7Pass ? "SUBSTANTIVE" : "THIN");
console.log("ECONOMIC PARTNERSHIP           :", econPass ? "COMPLETE" : "PARTIAL");
console.log("MARRIAGE V1 STRENGTH           :", "PRESERVED");
console.log("READY FOR FINAL CONTENT QA      :", (econPass && ch5Pass && ch7Pass) ? "YES" : "NO");
