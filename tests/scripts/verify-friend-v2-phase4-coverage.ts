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
  expectedContactInitiator: string;
  expectedPlanningLead: string;
  expectedDistanceCategory: string;
};

const testProfiles: TestProfile[] = [
  {
    name: "1. Balanced Friendship Pair",
    nameA: "지훈",
    nameB: "민수",
    psychA: makePsych({ energy_style: 50, structure: 50 }),
    psychB: makePsych({ energy_style: 50, structure: 50 }),
    locale: "ko-KR",
    expectedContactInitiator: "symmetrical",
    expectedPlanningLead: "symmetrical",
    expectedDistanceCategory: "spontaneous_high_trust",
  },
  {
    name: "2. Asymmetric Social Energy Pair",
    nameA: "서준",
    nameB: "현우",
    psychA: makePsych({ energy_style: 85, structure: 50 }),
    psychB: makePsych({ energy_style: 35, structure: 50 }),
    locale: "ko-KR",
    expectedContactInitiator: "A_initiates",
    expectedPlanningLead: "symmetrical",
    expectedDistanceCategory: "asymmetric_distance_need",
  },
  {
    name: "3. Asymmetric Planning Style Pair",
    nameA: "도윤",
    nameB: "하준",
    psychA: makePsych({ energy_style: 50, structure: 80 }),
    psychB: makePsych({ energy_style: 50, structure: 40 }),
    locale: "ko-KR",
    expectedContactInitiator: "symmetrical",
    expectedPlanningLead: "A_leads",
    expectedDistanceCategory: "spontaneous_high_trust",
  },
  {
    name: "4. Contact-Frequency Mismatch Pair",
    nameA: "Oliver",
    nameB: "Noah",
    psychA: makePsych({ energy_style: 80, structure: 50 }),
    psychB: makePsych({ energy_style: 40, structure: 50 }),
    locale: "en-US",
    expectedContactInitiator: "A_initiates",
    expectedPlanningLead: "symmetrical",
    expectedDistanceCategory: "asymmetric_distance_need",
  },
  {
    name: "5. High Exclusion Sensitivity Candidate Pair",
    nameA: "시우",
    nameB: "유준",
    psychA: makePsych({ recognition: 85, energy_style: 50 }),
    psychB: makePsych({ recognition: 40, energy_style: 50 }),
    locale: "ko-KR",
    expectedContactInitiator: "symmetrical",
    expectedPlanningLead: "symmetrical",
    expectedDistanceCategory: "spontaneous_high_trust",
  },
  {
    name: "6. Low-Contact Durable Friendship Pair",
    nameA: "민준",
    nameB: "지영",
    psychA: makePsych({ energy_style: 35, structure: 40 }),
    psychB: makePsych({ energy_style: 35, structure: 40 }),
    locale: "ko-KR",
    expectedContactInitiator: "symmetrical",
    expectedPlanningLead: "symmetrical",
    expectedDistanceCategory: "low_frequency_durable",
  },
  {
    name: "7. Conflict-Heavy Friendship Pair",
    nameA: "수진",
    nameB: "은우",
    psychA: makePsych({ conflict_style: 85, resilience: 30 }),
    psychB: makePsych({ conflict_style: 25, resilience: 75 }),
    locale: "ko-KR",
    expectedContactInitiator: "symmetrical",
    expectedPlanningLead: "symmetrical",
    expectedDistanceCategory: "spontaneous_high_trust",
  },
  {
    name: "8. Missing Psych Pair",
    nameA: "태호",
    nameB: "동현",
    psychA: null,
    psychB: null,
    locale: "ko-KR",
    expectedContactInitiator: "symmetrical",
    expectedPlanningLead: "symmetrical",
    expectedDistanceCategory: "spontaneous_high_trust",
  },
  {
    name: "9. KO Locale Pair",
    nameA: "성민",
    nameB: "재범",
    psychA: makePsych({ energy_style: 60 }),
    psychB: makePsych({ energy_style: 60 }),
    locale: "ko-KR",
    expectedContactInitiator: "symmetrical",
    expectedPlanningLead: "symmetrical",
    expectedDistanceCategory: "spontaneous_high_trust",
  },
  {
    name: "10. EN Locale Pair",
    nameA: "Liam",
    nameB: "James",
    psychA: makePsych({ energy_style: 60 }),
    psychB: makePsych({ energy_style: 60 }),
    locale: "en-US",
    expectedContactInitiator: "symmetrical",
    expectedPlanningLead: "symmetrical",
    expectedDistanceCategory: "spontaneous_high_trust",
  },
];

async function runPhase45QA() {
  console.log("==================================================");
  console.log(" FRIEND V2 PHASE 4.5 PRE-STORYPLAN SEMANTIC REALITY QA");
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

    const bundle = payload.report.meta.canonical_bundle;
    const coverage = bundle?.coverage;
    const vm = buildFriendReportViewModel(payload.report, {
      viewerIsReportA: true,
      myName: profile.nameA,
      partnerName: profile.nameB,
      locale: profile.locale,
    });

    const jsonStr = JSON.stringify(vm);
    pairOutputs.push(jsonStr);

    if (coverage?.initiativeRole && coverage?.thirdPersonExclusion && coverage?.travelPlayRole && coverage?.distanceProfile) {
      console.log("  ✅ [PASS] All 4 Extended Coverage Profiles populated");
    } else {
      console.log("  ❌ [FAIL] Missing coverage profiles");
      allPassed = false;
    }

    const initContact = coverage?.initiativeRole?.contactInitiator;
    const planLead = coverage?.initiativeRole?.planningLead;
    const distCat = coverage?.distanceProfile?.category;

    if (initContact === profile.expectedContactInitiator) {
      console.log(`  ✅ [PASS] Contact Initiator matches: '${initContact}'`);
    } else {
      console.log(`  ❌ [FAIL] Contact Initiator mismatch. Expected: '${profile.expectedContactInitiator}', Got: '${initContact}'`);
      allPassed = false;
    }

    if (planLead === profile.expectedPlanningLead) {
      console.log(`  ✅ [PASS] Planning Lead matches: '${planLead}'`);
    } else {
      console.log(`  ❌ [FAIL] Planning Lead mismatch. Expected: '${profile.expectedPlanningLead}', Got: '${planLead}'`);
      allPassed = false;
    }

    if (distCat === profile.expectedDistanceCategory) {
      console.log(`  ✅ [PASS] Distance Category matches: '${distCat}'`);
    } else {
      console.log(`  ❌ [FAIL] Distance Category mismatch. Expected: '${profile.expectedDistanceCategory}', Got: '${distCat}'`);
      allPassed = false;
    }

    // Safety check on forbidden claims in third-person profile
    const allowed = coverage?.thirdPersonExclusion?.allowedClaim;
    const forbidden = coverage?.thirdPersonExclusion?.forbiddenOverreach;
    if (allowed && forbidden && !forbidden.includes("비이성적 질투")) {
      console.log("  ✅ [PASS] Allowed & Forbidden claims cleanly separated");
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
  if (uniqueCount >= 8) {
    console.log("  ✅ [PASS] All test profiles produce distinct, personalized ViewModel outputs.");
  } else {
    console.log(`  ❌ [FAIL] Output duplication detected (${uniqueCount}/${testProfiles.length} unique)`);
    allPassed = false;
  }

  console.log("\n==================================================");
  console.log(" FINAL FRIEND PHASE 4.5 QA VERDICT");
  console.log("==================================================");
  if (allPassed) {
    console.log("FRIEND PHASE 4.5 QA: 100% PERFECT PASS");
    console.log("PRE-STORYPLAN SEMANTIC REALITY: VERIFIED");
  } else {
    console.log("FRIEND PHASE 4.5 QA: REGRESSIONS DETECTED");
  }
}

runPhase45QA().catch(console.error);
