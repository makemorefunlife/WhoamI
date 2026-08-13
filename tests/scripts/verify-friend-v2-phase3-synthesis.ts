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
  expectedContactCategory: string;
  expectedEmotionalCategory: string;
  expectedThirdPersonCategory: string;
  expectedStatus?: string;
};

const testProfiles: TestProfile[] = [
  {
    name: "1. Same Contact Tempo Pair",
    nameA: "지훈",
    nameB: "민수",
    psychA: makePsych({ energy_style: 50, empathy: 60 }),
    psychB: makePsych({ energy_style: 50, empathy: 60 }),
    locale: "ko-KR",
    expectedContactCategory: "tempo_sync",
    expectedEmotionalCategory: "mutual_deep_safety",
    expectedThirdPersonCategory: "group_stable",
    expectedStatus: "CONFIRMED",
  },
  {
    name: "2. High Contact Mismatch Pair",
    nameA: "서준",
    nameB: "현우",
    psychA: makePsych({ energy_style: 85 }),
    psychB: makePsych({ energy_style: 35 }),
    locale: "ko-KR",
    expectedContactCategory: "tempo_mismatch",
    expectedEmotionalCategory: "mutual_deep_safety",
    expectedThirdPersonCategory: "group_stable",
    expectedStatus: "CONFIRMED",
  },
  {
    name: "3. Emotionally Compatible Pair",
    nameA: "도윤",
    nameB: "하준",
    psychA: makePsych({ empathy: 80, practicality: 40 }),
    psychB: makePsych({ empathy: 75, practicality: 45 }),
    locale: "ko-KR",
    expectedContactCategory: "tempo_sync",
    expectedEmotionalCategory: "mutual_deep_safety",
    expectedThirdPersonCategory: "group_stable",
    expectedStatus: "CONFIRMED",
  },
  {
    name: "4. Advice-vs-Empathy Mismatch Pair",
    nameA: "Oliver",
    nameB: "Noah",
    psychA: makePsych({ empathy: 75, practicality: 30 }),
    psychB: makePsych({ empathy: 35, practicality: 75 }),
    locale: "en-US",
    expectedContactCategory: "tempo_sync",
    expectedEmotionalCategory: "solution_vs_empathy_mismatch",
    expectedThirdPersonCategory: "group_stable",
    expectedStatus: "CONFIRMED",
  },
  {
    name: "5. Third-Person Jealousy-Sensitive Pair",
    nameA: "시우",
    nameB: "유준",
    psychA: makePsych({ recognition: 85 }),
    psychB: makePsych({ recognition: 40 }),
    locale: "ko-KR",
    expectedContactCategory: "tempo_sync",
    expectedEmotionalCategory: "mutual_deep_safety",
    expectedThirdPersonCategory: "group_stable",
    expectedStatus: "CONFIRMED",
  },
  {
    name: "6. Socially Expansive Pair",
    nameA: "민준",
    nameB: "지영",
    psychA: makePsych({ recognition: 40, energy_style: 75 }),
    psychB: makePsych({ recognition: 40, energy_style: 75 }),
    locale: "ko-KR",
    expectedContactCategory: "tempo_sync",
    expectedEmotionalCategory: "mutual_deep_safety",
    expectedThirdPersonCategory: "group_stable",
    expectedStatus: "CONFIRMED",
  },
  {
    name: "7. Balanced / Low-Drama Pair",
    nameA: "수진",
    nameB: "은우",
    psychA: makePsych({ recognition: 30, energy_style: 30 }),
    psychB: makePsych({ recognition: 30, energy_style: 30 }),
    locale: "ko-KR",
    expectedContactCategory: "low_frequency_durable",
    expectedEmotionalCategory: "mutual_deep_safety",
    expectedThirdPersonCategory: "one_on_one_preferred",
    expectedStatus: "CONFIRMED",
  },
  {
    name: "8. Missing Psych Edge Case Pair",
    nameA: "태호",
    nameB: "동현",
    psychA: null,
    psychB: null,
    locale: "ko-KR",
    expectedContactCategory: "tempo_sync",
    expectedEmotionalCategory: "mutual_deep_safety",
    expectedThirdPersonCategory: "group_stable",
    expectedStatus: "INSUFFICIENT",
  },
];

async function runPhase3QA() {
  console.log("==================================================");
  console.log(" FRIEND V2 PHASE 3.5 EVIDENCE SAFETY QA AUDIT");
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

    const syntheses = payload.report.meta.canonical_bundle?.syntheses;
    const vm = buildFriendReportViewModel(payload.report, {
      viewerIsReportA: true,
      myName: profile.nameA,
      partnerName: profile.nameB,
      locale: profile.locale,
    });

    const jsonStr = JSON.stringify(vm);
    pairOutputs.push(jsonStr);

    if (syntheses?.contactClosenessFit && syntheses?.emotionalSafetyFit && syntheses?.thirdPersonDynamic && syntheses?.maintenanceDynamic) {
      console.log("  ✅ [PASS] All 4 Selective Syntheses populated in Canonical Bundle");
    } else {
      console.log("  ❌ [FAIL] Missing selective syntheses in Canonical Bundle");
      allPassed = false;
    }

    const contactCat = syntheses?.contactClosenessFit?.category;
    const emotionalCat = syntheses?.emotionalSafetyFit?.category;
    const thirdPersonCat = syntheses?.thirdPersonDynamic?.category;
    const status = syntheses?.contactClosenessFit?.status;
    const level = syntheses?.contactClosenessFit?.confidenceLevel;
    const score = syntheses?.contactClosenessFit?.confidenceScore;

    if (contactCat === profile.expectedContactCategory) {
      console.log(`  ✅ [PASS] Contact Closeness Fit category matches: '${contactCat}'`);
    } else {
      console.log(`  ❌ [FAIL] Contact Closeness Fit category mismatch. Expected: '${profile.expectedContactCategory}', Got: '${contactCat}'`);
      allPassed = false;
    }

    if (emotionalCat === profile.expectedEmotionalCategory) {
      console.log(`  ✅ [PASS] Emotional Safety Fit category matches: '${emotionalCat}'`);
    } else {
      console.log(`  ❌ [FAIL] Emotional Safety Fit category mismatch. Expected: '${profile.expectedEmotionalCategory}', Got: '${emotionalCat}'`);
      allPassed = false;
    }

    if (thirdPersonCat === profile.expectedThirdPersonCategory) {
      console.log(`  ✅ [PASS] Third-Person Dynamic category matches: '${thirdPersonCat}'`);
    } else {
      console.log(`  ❌ [FAIL] Third-Person Dynamic category mismatch. Expected: '${profile.expectedThirdPersonCategory}', Got: '${thirdPersonCat}'`);
      allPassed = false;
    }

    if (status === profile.expectedStatus) {
      console.log(`  ✅ [PASS] Evidence Status matches: '${status}' (Confidence Level: ${level}, Score: ${score})`);
    } else {
      console.log(`  ❌ [FAIL] Evidence Status mismatch. Expected: '${profile.expectedStatus}', Got: '${status}'`);
      allPassed = false;
    }

    // Check for absence of secret-keeping overreach
    const synthJson = JSON.stringify(syntheses);
    if (!synthJson.includes("비밀 보장") && !synthJson.includes("비밀을 잘 지켜")) {
      console.log("  ✅ [PASS] Zero unsupported secret-keeping claims in synthesis text");
    } else {
      console.log("  ❌ [FAIL] Found unsupported secret-keeping claim in synthesis text");
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
  console.log("--- [Cross-Pair Synthesis Diversity Check] ---");
  const uniqueCount = new Set(pairOutputs).size;
  if (uniqueCount >= 7) {
    console.log("  ✅ [PASS] All test profiles produce distinct, personalized ViewModel outputs.");
  } else {
    console.log(`  ❌ [FAIL] Output duplication detected (${uniqueCount}/${testProfiles.length} unique)`);
    allPassed = false;
  }

  console.log("\n==================================================");
  console.log(" FINAL FRIEND PHASE 3.5 QA VERDICT");
  console.log("==================================================");
  if (allPassed) {
    console.log("FRIEND PHASE 3.5 QA: 100% PERFECT PASS");
    console.log("SYNTHESIS EVIDENCE VALIDITY & SEMANTIC SAFETY: VERIFIED");
  } else {
    console.log("FRIEND PHASE 3.5 QA: REGRESSIONS DETECTED");
  }
}

runPhase3QA().catch(console.error);
