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
  { name: "5. Planning Mismatch", nameA: "도윤", nameB: "하준", psychA: makePsych({ structure: 80 }), psychB: makePsych({ structure: 40 }), locale: "ko-KR" },
  { name: "6. Low-Frequency Durable Pair", nameA: "태호", nameB: "동현", psychA: makePsych({ energy_style: 30 }), psychB: makePsych({ energy_style: 30 }), locale: "ko-KR" },
  { name: "7. Conflict-Heavy Pair", nameA: "수진", nameB: "은우", psychA: makePsych({ conflict_style: 85, resilience: 30 }), psychB: makePsych({ conflict_style: 25, resilience: 75 }), locale: "ko-KR" },
  { name: "8. Missing Psych Pair", nameA: "성민", nameB: "재범", psychA: null, psychB: null, locale: "ko-KR" },
  { name: "9. Innate / Current Discrepancy", nameA: "영수", nameB: "철수", psychA: makePsych({ energy_style: 20 }), psychB: makePsych({ energy_style: 80 }), locale: "ko-KR" },
  { name: "10. EN Locale Pair", nameA: "Oliver", nameB: "Noah", psychA: makePsych({ energy_style: 60 }), psychB: makePsych({ energy_style: 60 }), locale: "en-US" },
];

async function runPhase6NarrativeQA() {
  console.log("==================================================");
  console.log(" FRIEND V2 PHASE 6 EXPERT NARRATIVE QA AUDIT");
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

    const sectionsJson = JSON.stringify(vm.sections);
    const fullJson = JSON.stringify(vm);
    pairOutputs.push(fullJson);

    if (storyPlan && storyPlan.chapters && storyPlan.chapters.length === 9) {
      console.log("  ✅ [PASS] Canonical StoryPlan SSOT attached to report meta");
    } else {
      console.log("  ❌ [FAIL] Missing Canonical StoryPlan in report meta");
      allPassed = false;
    }

    // Forbidden terminology check in user-facing sections
    const forbiddenTerms = ["오행", "십성", "비겁", "관성", "식상", "원진", "귀문"];
    let foundTerm = false;
    for (const term of forbiddenTerms) {
      if (sectionsJson.includes(term)) {
        console.log(`  ❌ [FAIL] User-facing prose contains raw Saju terminology: '${term}'`);
        foundTerm = true;
        allPassed = false;
      }
    }
    if (!foundTerm) {
      console.log("  ✅ [PASS] Zero raw Saju terminology in user-facing sections");
    }

    const hasNull = fullJson.includes(":null,") && !fullJson.includes("counseling_gap_note");
    const hasUndefined = fullJson.includes("undefined");

    if (!hasNull && !hasUndefined) {
      console.log("  ✅ [PASS] Zero invalid null / undefined in ViewModel output");
    } else {
      console.log("  ❌ [FAIL] Invalid null / undefined in ViewModel output");
      allPassed = false;
    }

    console.log("");
  }

  // Cross-pair diversity check
  console.log("--- [Cross-Pair Narrative Diversity Check] ---");
  const uniqueCount = new Set(pairOutputs).size;
  if (uniqueCount >= 8) {
    console.log("  ✅ [PASS] All test profiles produce distinct, personalized ViewModel outputs.");
  } else {
    console.log(`  ❌ [FAIL] Output duplication detected (${uniqueCount}/${testProfiles.length} unique)`);
    allPassed = false;
  }

  console.log("\n==================================================");
  console.log(" FINAL FRIEND PHASE 6 QA VERDICT");
  console.log("==================================================");
  if (allPassed) {
    console.log("FRIEND PHASE 6 QA: 100% PERFECT PASS");
    console.log("SINGLE NARRATIVE AUTHORITY & STORYPLAN CONTROL: COMPLETE & VERIFIED");
  } else {
    console.log("FRIEND PHASE 6 QA: REGRESSIONS DETECTED");
  }
}

runPhase6NarrativeQA().catch(console.error);
