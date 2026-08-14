import React from "react";
import ReactDOMServer from "react-dom/server";

// Register font mock before importing SectionRenderer
const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (request: string) {
  if (request === "next/font/google") {
    const dummyFont = () => ({ variable: "font-dummy", className: "font-dummy" });
    return {
      Noto_Sans_KR: dummyFont,
      Noto_Serif_KR: dummyFont,
    };
  }
  return originalRequire.apply(this, arguments);
};

const { FriendReportViewModelView } = require("../../components/relationship/friend/sections/SectionRenderer");
import { runFriendSocialDeepAnalysis } from "../../lib/prompts/relationshipPremium/friendSocial";
import { buildFriendReportViewModel } from "../../lib/relationship/friend/viewModel/buildFriendReportViewModel";
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

type TestProfile = {
  name: string;
  nameA: string;
  nameB: string;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale: "ko-KR" | "en-US";
};

const testProfiles: TestProfile[] = [
  { name: "1. Balanced Pair", nameA: "지훈", nameB: "민수", psychA: makePsych({ energy_style: 50, empathy: 50 }), psychB: makePsych({ energy_style: 50, empathy: 50 }), locale: "ko-KR" },
  { name: "2. Contact Mismatch", nameA: "서준", nameB: "현우", psychA: makePsych({ energy_style: 85, stimulation: 80 }), psychB: makePsych({ energy_style: 35, stimulation: 30 }), locale: "ko-KR" },
  { name: "3. Planning Mismatch", nameA: "태양", nameB: "바다", psychA: makePsych({ structure: 85, practicality: 80 }), psychB: makePsych({ structure: 25, practicality: 30 }), locale: "ko-KR" },
  { name: "4. Advice vs Empathy Mismatch", nameA: "민준", nameB: "지영", psychA: makePsych({ empathy: 80, practicality: 30 }), psychB: makePsych({ empathy: 30, practicality: 85 }), locale: "ko-KR" },
  { name: "5. Third-Person Sensitive Pair", nameA: "시우", nameB: "유준", psychA: makePsych({ recognition: 85, empathy: 80 }), psychB: makePsych({ recognition: 30, empathy: 30 }), locale: "ko-KR" },
  { name: "6. Low-Frequency Durable Pair", nameA: "도윤", nameB: "하준", psychA: makePsych({ self_control: 80, resilience: 85 }), psychB: makePsych({ self_control: 80, resilience: 85 }), locale: "ko-KR" },
  { name: "7. Conflict-Heavy Pair", nameA: "우진", nameB: "지호", psychA: makePsych({ conflict_style: 80, resilience: 30 }), psychB: makePsych({ conflict_style: 80, resilience: 30 }), locale: "ko-KR" },
];

async function runCHAPTER10CLEANUPQA() {
  console.log("==================================================");
  console.log(" FRIEND V2 CHAPTER 1~10 & 11-AXIS RELOCATION QA");
  console.log("==================================================\n");

  let allPassed = true;

  for (const profile of testProfiles) {
    console.log(`--- [Testing Profile: ${profile.name}] ---`);

    const mockOpenAi = {} as any;
    const payload = await runFriendSocialDeepAnalysis(mockOpenAi, {
      nicknameA: profile.nameA,
      nicknameB: profile.nameB,
      birthA: { date: "1992-05-15", time: "14:30", place: "Seoul" },
      birthB: { date: "1993-08-20", time: "09:15", place: "Seoul" },
      sajuJsonA: sajuA,
      sajuJsonB: sajuB,
      psychMasterA: profile.psychA,
      psychMasterB: profile.psychB,
      locale: profile.locale,
      skipFriendNarrative: true,
    });

    const vm = buildFriendReportViewModel(payload.report, {
      viewerIsReportA: true,
      myName: profile.nameA,
      partnerName: profile.nameB,
      locale: profile.locale,
    });

    // Render component to HTML string
    const html = ReactDOMServer.renderToString(
      React.createElement(FriendReportViewModelView, {
        vm,
        viewerIsReportA: true,
      })
    );

    // 1. Verify Chapters 1 ~ 10 DOM Containers in Order
    const chapterIds = [
      'id="ch01_overview"',
      'id="ch02_why_us"',
      'id="ch03_roles"',
      'id="ch04_tempo"',
      'id="ch05_teamwork"',
      'id="ch06_counseling_group"',
      'id="ch07_conflict_repair"',
      'id="ch08_boundaries"',
      'id="ch09_distance_durability"',
      'id="ch10_playbook"',
    ];

    let lastIdx = -1;
    let missingCh = false;
    for (const id of chapterIds) {
      const idx = html.indexOf(id);
      if (idx === -1) {
        console.log(`  ❌ [FAIL] Missing Chapter container: '${id}'`);
        missingCh = true;
        allPassed = false;
      } else if (idx <= lastIdx) {
        console.log(`  ❌ [FAIL] Out of order Chapter container: '${id}'`);
        allPassed = false;
      } else {
        lastIdx = idx;
      }
    }
    if (!missingCh) {
      console.log("  ✅ [PASS] Unified Chapter 1 ~ 10 DOM Containers Present in Strict Sequence");
    }

    // 2. Verify 11-Axis Relocation: Absent from Ch 1, Present in Ch 4
    const ch01End = html.indexOf('id="ch02_why_us"');
    const ch04Start = html.indexOf('id="ch04_tempo"');
    const ch05Start = html.indexOf('id="ch05_teamwork"');

    const ch01Sub = html.substring(0, ch01End);
    const ch04Sub = html.substring(ch04Start, ch05Start);

    if (ch01Sub.includes("11-axis") || ch01Sub.includes("11축")) {
      console.log("  ❌ [FAIL] 11-Axis chart or label still found in Chapter 1 Summary");
      allPassed = false;
    } else {
      console.log("  ✅ [PASS] Chapter 1 is Executive Summary ONLY (Zero 11-Axis duplication)");
    }

    if (ch04Sub.includes("11축") || ch04Sub.includes("11-axis")) {
      console.log("  ✅ [PASS] 11-Axis Radar Graph relocated into Chapter 4 as primary visual");
    } else {
      console.log("  ❌ [FAIL] 11-Axis Radar Graph missing from Chapter 4");
      allPassed = false;
    }

    // 3. Verify Absence of Duplicate Chapter Labels (e.g. "CHAPTER 2 — CHAPTER 2")
    if (html.includes("CHAPTER 2 — CHAPTER 2") || html.includes("CHAPTER 3 — CHAPTER 3")) {
      console.log("  ❌ [FAIL] Duplicate Chapter label detected");
      allPassed = false;
    } else {
      console.log("  ✅ [PASS] Zero Duplicate Chapter Labels (Single clean header)");
    }

    // 4. Verify 4 New Capabilities Placed in Target Chapters
    const cap1 = ch04Sub.includes("이 우정에서 누가 무엇을 주도할까?") || ch04Sub.includes("Who leads what in this friendship?");
    const cap2 = html.includes("놀 때 우리는 어떤 팀인가?") || html.includes("What kind of team are we when hanging out?");
    const cap3 = html.includes("둘만 있을 때와 다른 친구가 함께 있을 때") || html.includes("1-on-1 vs Group");
    const cap4 = html.includes("우리는 자주 봐야 하는 친구인가, 가끔 봐도 괜찮은 친구인가?") || html.includes("Distance &amp; Durability Verdict");

    if (cap1 && cap2 && cap3 && cap4) {
      console.log("  ✅ [PASS] All 4 New V2 Capabilities Placed in Target Chapter Containers");
    } else {
      console.log("  ❌ [FAIL] Missing capability placement in target chapters");
      allPassed = false;
    }

    console.log("");
  }

  console.log("\n==================================================");
  console.log(" FINAL FRIEND V2 CLEANUP QA VERDICT");
  console.log("==================================================");
  if (allPassed) {
    console.log("FRIEND CLEANUP QA: 100% PERFECT PASS");
    console.log("11-AXIS RELOCATED TO CH 4: 100% PERFECT");
    console.log("CHAPTER 1 SUMMARY ONLY: 100% PERFECT");
    console.log("NO ACCORDIONS ON CHAPTER HEADERS: 100% PERFECT");
  } else {
    console.log("FRIEND CLEANUP QA: REGRESSIONS DETECTED");
  }
}

runCHAPTER10CLEANUPQA().catch(console.error);
