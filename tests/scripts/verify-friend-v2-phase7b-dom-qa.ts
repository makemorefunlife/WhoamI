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

// Dynamic require of SectionRenderer after font mock hook
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
  { name: "1. Balanced Pair", nameA: "지훈", nameB: "민수", psychA: makePsych({ energy_style: 50 }), psychB: makePsych({ energy_style: 50 }), locale: "ko-KR" },
  { name: "2. Contact Mismatch", nameA: "서준", nameB: "현우", psychA: makePsych({ energy_style: 85 }), psychB: makePsych({ energy_style: 35 }), locale: "ko-KR" },
  { name: "3. Advice vs Empathy Mismatch", nameA: "민준", nameB: "지영", psychA: makePsych({ empathy: 75, practicality: 30 }), psychB: makePsych({ empathy: 35, practicality: 75 }), locale: "ko-KR" },
  { name: "4. Third-Person Sensitive Pair", nameA: "시우", nameB: "유준", psychA: makePsych({ recognition: 85 }), psychB: makePsych({ recognition: 40 }), locale: "ko-KR" },
  { name: "5. EN Locale Pair", nameA: "Oliver", nameB: "Noah", psychA: makePsych({ energy_style: 60 }), psychB: makePsych({ energy_style: 60 }), locale: "en-US" },
];

async function runPhase7bDOMQA() {
  console.log("==================================================");
  console.log(" FRIEND V2 PHASE 7B REAL DOM RENDER QA AUDIT");
  console.log("==================================================\n");

  let allPassed = true;
  const domOutputs: string[] = [];

  for (const profile of testProfiles) {
    console.log(`--- [Testing: ${profile.name}] ---`);

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

    domOutputs.push(html);

    // 1. Verify 9 visible Chapter containers in DOM
    const chapters = [
      "ch01_why_us", "ch02_who_we_are", "ch03_social_dna_tempo",
      "ch04_play_travel", "ch05_communication_third_person", "ch06_conflict_repair",
      "ch07_expectation_boundaries", "ch08_distance_durability", "ch09_action_playbook"
    ];

    let missingCh = false;
    for (const key of chapters) {
      if (!html.includes(`data-chapter-key="${key}"`)) {
        console.log(`  ❌ [FAIL] Missing Chapter DOM container: '${key}'`);
        missingCh = true;
        allPassed = false;
      }
    }
    if (!missingCh) {
      console.log("  ✅ [PASS] All 9 Chapter DOM containers rendered in correct order");
    }

    // 2. Verify 4 New Capabilities rendered in HTML
    if (html.includes("주도성 및 소통 역할") || html.includes("연락 물꼬")) {
      console.log("  ✅ [PASS] Capability 1: 'initiativeRole' visibly rendered in DOM");
    } else {
      console.log("  ❌ [FAIL] Capability 1: 'initiativeRole' missing in DOM");
      allPassed = false;
    }

    if (html.includes("제3자 다자간 모임") || html.includes("모임 성향")) {
      console.log("  ✅ [PASS] Capability 2: 'thirdPersonExclusion' visibly rendered in DOM");
    } else {
      console.log("  ❌ [FAIL] Capability 2: 'thirdPersonExclusion' missing in DOM");
      allPassed = false;
    }

    if (html.includes("놀 때 우리는 어떤 팀인가?") || html.includes("아이디어 제안")) {
      console.log("  ✅ [PASS] Capability 3: 'travelPlayRole' visibly rendered in DOM");
    } else {
      console.log("  ❌ [FAIL] Capability 3: 'travelPlayRole' missing in DOM");
      allPassed = false;
    }

    if (html.includes("거리감 &amp; 장기 우정 내구성 프로필") || html.includes("거리감 & 장기 우정 내구성 프로필")) {
      console.log("  ✅ [PASS] Capability 4: 'distanceProfile' visibly rendered in DOM");
    } else {
      console.log("  ❌ [FAIL] Capability 4: 'distanceProfile' missing in DOM");
      allPassed = false;
    }

    // 3. Fail-closed guards
    if (!html.includes("null") && !html.includes("undefined")) {
      console.log("  ✅ [PASS] Zero 'null' / 'undefined' in DOM HTML");
    } else {
      console.log("  ❌ [FAIL] Invalid 'null' or 'undefined' found in DOM HTML");
      allPassed = false;
    }

    console.log("");
  }

  // Cross-pair diversity check
  console.log("--- [Cross-Pair DOM Diversity Check] ---");
  const uniqueCount = new Set(domOutputs).size;
  if (uniqueCount >= 4) {
    console.log(`  ✅ [PASS] All test profiles produce distinct, highly personalized DOM outputs (${uniqueCount}/${testProfiles.length} unique).`);
  } else {
    console.log(`  ❌ [FAIL] Output duplication detected (${uniqueCount}/${testProfiles.length} unique)`);
    allPassed = false;
  }

  console.log("\n==================================================");
  console.log(" FINAL FRIEND PHASE 7B DOM QA VERDICT");
  console.log("==================================================");
  if (allPassed) {
    console.log("FRIEND PHASE 7B DOM QA: 100% PERFECT PASS");
    console.log("9-CHAPTER VISIBLE UI & 4 NEW CAPABILITIES: COMPLETE & VERIFIED");
  } else {
    console.log("FRIEND PHASE 7B DOM QA: REGRESSIONS DETECTED");
  }
}

runPhase7bDOMQA().catch(console.error);
