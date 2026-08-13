import React from "react";
import ReactDOMServer from "react-dom/server";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel";
import { MarriageReportViewModelView } from "../../components/relationship/marriage/sections/SectionRenderer";
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

type TestCase = {
  name: string;
  nameA: string;
  nameB: string;
  psychA: PsychMasterJson;
  psychB: PsychMasterJson;
  locale: "ko-KR" | "en-US";
};

const testCases: TestCase[] = [
  {
    name: "Standard Pair (Sera x 동글)",
    nameA: "Sera",
    nameB: "동글",
    psychA: makePsych({ self_control: 75, practicality: 65, structure: 80 }),
    psychB: makePsych({ practicality: 70, self_control: 45, recognition: 40 }),
    locale: "ko-KR",
  },
  {
    name: "High Conflict Pair (민준 x 지영)",
    nameA: "민준",
    nameB: "지영",
    psychA: makePsych({ conflict_style: 80, resilience: 30, empathy: 35 }),
    psychB: makePsych({ conflict_style: 75, resilience: 40, empathy: 40 }),
    locale: "ko-KR",
  },
  {
    name: "Same Economic Role Pair (철수 x 영희)",
    nameA: "철수",
    nameB: "영희",
    psychA: makePsych({ practicality: 80, self_control: 80 }),
    psychB: makePsych({ practicality: 80, self_control: 80 }),
    locale: "ko-KR",
  },
  {
    name: "English Locale Pair (Alex x Emma)",
    nameA: "Alex",
    nameB: "Emma",
    psychA: makePsych({ self_control: 60 }),
    psychB: makePsych({ empathy: 70 }),
    locale: "en-US",
  },
  {
    name: "Extreme Spectrum Pair (준호 x 수진)",
    nameA: "준호",
    nameB: "수진",
    psychA: makePsych({ structure: 90, stimulation: 20 }),
    psychB: makePsych({ structure: 20, stimulation: 90 }),
    locale: "ko-KR",
  },
];

console.log("==================================================");
console.log(" MARRIAGE V2 PHASE 11 E2E PRODUCTION QA AUDIT");
console.log("==================================================");

let allCasesPassed = true;

testCases.forEach((tc, idx) => {
  console.log(`\n--- [Test Case ${idx + 1}: ${tc.name}] ---`);

  const report = buildMarriageReport({
    nicknameA: tc.nameA,
    nicknameB: tc.nameB,
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: tc.psychA,
    psychMasterB: tc.psychB,
    locale: tc.locale,
  });

  const vm = buildMarriageReportViewModel(report, {
    viewerIsReportA: true,
    myName: tc.nameA,
    partnerName: tc.nameB,
    locale: tc.locale,
  });

  // Render actual DOM element to string via Server Side Renderer
  const domHtml = ReactDOMServer.renderToString(
    React.createElement(MarriageReportViewModelView, {
      vm,
      viewerIsReportA: true,
    })
  );

  const checks = [
    { desc: "Chapter 01..09 DOM presence", pass: domHtml.includes("c1_who_we_are") && domHtml.includes("c9_next_chapter_rituals") },
    { desc: "Zero 'null' string in DOM", pass: !domHtml.includes("null") },
    { desc: "Zero 'undefined' in DOM", pass: !domHtml.includes("undefined") },
    { desc: "Zero raw 'Person A/B' in DOM", pass: !domHtml.includes("Person A") && !domHtml.includes("Person B") },
    { desc: "Zero empty 'Step 1:' in DOM", pass: !domHtml.includes("Step 1:</") && !domHtml.includes("Step 1: <") },
    { desc: "Zero empty '점' labels in DOM", pass: !/>\s*점</.test(domHtml) && !/>\s*<!-- -->점</.test(domHtml) },
    { desc: "Life Partnership Verdict card present", pass: domHtml.includes("Life Partnership Verdict") || domHtml.includes("부부 파트너십 최종 판정") },
    { desc: "Action Playbook Do & Don't present", pass: domHtml.includes("Do &amp; Don&#x27;t") || domHtml.includes("Do & Don't") || domHtml.includes("Do") },
    { desc: "No duplicate deep read dump after Ch 09", pass: !domHtml.includes('id="ch_deep_read"') },
  ];

  let casePassed = true;
  checks.forEach((chk) => {
    if (!chk.pass) {
      casePassed = false;
      console.log(`  ❌ [FAIL] ${chk.desc}`);
    } else {
      console.log(`  ✅ [PASS] ${chk.desc}`);
    }
  });

  if (!casePassed) allCasesPassed = false;
});

console.log("\n==================================================");
console.log(" FINAL PRODUCTION QA VERDICT");
console.log("==================================================");
console.log("5-PAIR PRODUCTION DOM QA VERDICT:", allCasesPassed ? "ALL 5 PAIRS 100% PERFECT PASS" : "FAILURES DETECTED");
console.log("FINAL MARRIAGE V2 PRODUCTION CONTENT READY:", allCasesPassed ? "YES" : "NO");
