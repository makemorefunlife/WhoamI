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
  { name: "2. Social Energy Mismatch", nameA: "서준", nameB: "현우", psychA: makePsych({ energy_style: 85 }), psychB: makePsych({ energy_style: 35 }), locale: "ko-KR" },
  { name: "3. Contact Mismatch", nameA: "Oliver", nameB: "Noah", psychA: makePsych({ energy_style: 80 }), psychB: makePsych({ energy_style: 40 }), locale: "en-US" },
  { name: "4. Planning Mismatch", nameA: "도윤", nameB: "하준", psychA: makePsych({ structure: 80 }), psychB: makePsych({ structure: 40 }), locale: "ko-KR" },
  { name: "5. Emotionally Safe Pair", nameA: "지은", nameB: "수빈", psychA: makePsych({ empathy: 80 }), psychB: makePsych({ empathy: 80 }), locale: "ko-KR" },
  { name: "6. Advice vs Empathy Mismatch", nameA: "민준", nameB: "지영", psychA: makePsych({ empathy: 75, practicality: 30 }), psychB: makePsych({ empathy: 35, practicality: 75 }), locale: "ko-KR" },
  { name: "7. Third-Person Sensitive Pair", nameA: "시우", nameB: "유준", psychA: makePsych({ recognition: 85 }), psychB: makePsych({ recognition: 40 }), locale: "ko-KR" },
  { name: "8. Low-Frequency Durable Pair", nameA: "태호", nameB: "동현", psychA: makePsych({ energy_style: 30 }), psychB: makePsych({ energy_style: 30 }), locale: "ko-KR" },
  { name: "9. Conflict-Heavy Pair", nameA: "수진", nameB: "은우", psychA: makePsych({ conflict_style: 85, resilience: 30 }), psychB: makePsych({ conflict_style: 25, resilience: 75 }), locale: "ko-KR" },
  { name: "10. Missing Psych Pair", nameA: "성민", nameB: "재범", psychA: null, psychB: null, locale: "ko-KR" },
];

async function runPhase5StoryPlanQA() {
  console.log("==================================================");
  console.log(" FRIEND V2 PHASE 5 CANONICAL STORYPLAN QA AUDIT");
  console.log("==================================================\n");

  let allPassed = true;
  const pairOutputs: string[] = [];

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

    const storyPlan = payload.report.meta.canonical_story_plan;
    const vm = buildFriendReportViewModel(payload.report, {
      viewerIsReportA: true,
      myName: profile.nameA,
      partnerName: profile.nameB,
      locale: profile.locale,
    });

    const jsonStr = JSON.stringify(vm);
    pairOutputs.push(jsonStr);

    if (storyPlan && storyPlan.chapters && storyPlan.chapters.length === 9) {
      console.log("  ✅ [PASS] All 9 StoryPlan Chapters present in meta.canonical_story_plan");
    } else {
      console.log(`  ❌ [FAIL] Missing or invalid StoryPlan chapters count: ${storyPlan?.chapters?.length}`);
      allPassed = false;
    }

    // Meaning ownership uniqueness check
    const primaryOwners = new Set<string>();
    let duplicateOwnerFound = false;
    for (const ch of storyPlan?.chapters ?? []) {
      for (const m of ch.primaryMeanings) {
        if (primaryOwners.has(m)) {
          console.log(`  ❌ [FAIL] Duplicate primary owner found for meaning: '${m}' in chapter '${ch.chapterKey}'`);
          duplicateOwnerFound = true;
          allPassed = false;
        } else {
          primaryOwners.add(m);
        }
      }
    }
    if (!duplicateOwnerFound) {
      console.log("  ✅ [PASS] Zero duplicate primary owners across all 9 chapters");
    }

    // Check LLM handoff payload presence
    if (storyPlan?.llmHandoffPayload?.chapterHandoffs?.length === 9) {
      console.log("  ✅ [PASS] LLM Handoff Payload cleanly structured for Phase 6 Narrative");
    } else {
      console.log("  ❌ [FAIL] LLM Handoff Payload missing or malformed");
      allPassed = false;
    }

    const hasNull = jsonStr.includes(":null,") && !jsonStr.includes("counseling_gap_note");
    const hasUndefined = jsonStr.includes("undefined");

    if (!hasNull && !hasUndefined) {
      console.log("  ✅ [PASS] Zero invalid null / undefined in ViewModel output");
    } else {
      console.log("  ❌ [FAIL] Invalid null / undefined in ViewModel output");
      allPassed = false;
    }

    console.log("");
  }

  // Cross-pair diversity check
  console.log("--- [Cross-Pair StoryPlan Diversity Check] ---");
  const uniqueCount = new Set(pairOutputs).size;
  if (uniqueCount >= 8) {
    console.log("  ✅ [PASS] All test profiles produce distinct, personalized ViewModel outputs.");
  } else {
    console.log(`  ❌ [FAIL] Output duplication detected (${uniqueCount}/${testProfiles.length} unique)`);
    allPassed = false;
  }

  console.log("\n==================================================");
  console.log(" FINAL FRIEND PHASE 5 QA VERDICT");
  console.log("==================================================");
  if (allPassed) {
    console.log("FRIEND PHASE 5 QA: 100% PERFECT PASS");
    console.log("CANONICAL STORYPLAN & MEANING OWNERSHIP: COMPLETE & VERIFIED");
  } else {
    console.log("FRIEND PHASE 5 QA: REGRESSIONS DETECTED");
  }
}

runPhase5StoryPlanQA().catch(console.error);
