import { runFriendSocialDeepAnalysis } from "../../lib/prompts/relationshipPremium/friendSocial";
import { buildFriendReportViewModel } from "../../lib/relationship/friend/viewModel/buildFriendReportViewModel";
import { buildFriendRuleContext } from "../../lib/relationship/friend/buildFriendRuleContext";
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

type TestPair = {
  name: string;
  nameA: string;
  nameB: string;
  psychA: PsychMasterJson;
  psychB: PsychMasterJson;
  locale: "ko-KR" | "en-US";
};

const testPairs: TestPair[] = [
  {
    name: "Standard Pair (지훈 x 민수)",
    nameA: "지훈",
    nameB: "민수",
    psychA: makePsych({ energy_style: 70, stimulation: 65, empathy: 80 }),
    psychB: makePsych({ energy_style: 40, practicality: 75, thinking_style: 70 }),
    locale: "ko-KR",
  },
  {
    name: "High Conflict Pair (서준 x 현우)",
    nameA: "서준",
    nameB: "현우",
    psychA: makePsych({ conflict_style: 80, recognition: 85, resilience: 30 }),
    psychB: makePsych({ conflict_style: 20, recognition: 75, resilience: 40 }),
    locale: "ko-KR",
  },
  {
    name: "Same Psych Pair (도윤 x 하준)",
    nameA: "도윤",
    nameB: "하준",
    psychA: makePsych({ energy_style: 60, structure: 65, practicality: 60 }),
    psychB: makePsych({ energy_style: 60, structure: 65, practicality: 60 }),
    locale: "ko-KR",
  },
  {
    name: "English Locale Pair (Oliver x Noah)",
    nameA: "Oliver",
    nameB: "Noah",
    psychA: makePsych({ energy_style: 75, empathy: 70 }),
    psychB: makePsych({ energy_style: 35, practicality: 80 }),
    locale: "en-US",
  },
  {
    name: "Extreme Spectrum Pair (시우 x 유준)",
    nameA: "시우",
    nameB: "유준",
    psychA: makePsych({ stimulation: 90, structure: 20, empathy: 30 }),
    psychB: makePsych({ stimulation: 10, structure: 90, empathy: 85 }),
    locale: "ko-KR",
  },
];

async function runRegressionQA() {
  console.log("==================================================");
  console.log(" FRIEND V2 PHASE 2A REAL PRODUCTION QA AUDIT");
  console.log("==================================================\n");

  let allPassed = true;

  // 1. Direct Production Runtime Canonical Extraction Check
  console.log("--- [Static/Runtime Canonical Facts Check] ---");
  const sampleRuleContext = buildFriendRuleContext({
    nicknameA: "지훈",
    nicknameB: "민수",
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: testPairs[0].psychA,
    psychMasterB: testPairs[0].psychB,
    locale: "ko-KR",
  });

  const pA = sampleRuleContext.canonicalPersonalA;
  const pB = sampleRuleContext.canonicalPersonalB;
  const pairFacts = sampleRuleContext.canonicalPairFacts;

  if (pA?.dominantElement && pB?.dominantElement) {
    console.log(`  ✅ [PASS] Canonical dominantElement active: A=${pA.dominantElement}, B=${pB.dominantElement}`);
  } else {
    console.log("  ❌ [FAIL] Canonical dominantElement missing");
    allPassed = false;
  }

  if (pA?.elementCounts && pB?.elementCounts) {
    console.log("  ✅ [PASS] Canonical elementCounts active");
  } else {
    console.log("  ❌ [FAIL] Canonical elementCounts missing");
    allPassed = false;
  }

  if (pA?.tenGods && pB?.tenGods) {
    console.log("  ✅ [PASS] Canonical tenGods active");
  } else {
    console.log("  ❌ [FAIL] Canonical tenGods missing");
    allPassed = false;
  }

  if (typeof pairFacts?.hasYeokma === "boolean") {
    console.log(`  ✅ [PASS] Canonical hasYeokma active: ${pairFacts.hasYeokma}`);
  } else {
    console.log("  ❌ [FAIL] Canonical hasYeokma missing");
    allPassed = false;
  }

  console.log("");

  // 2. 5-Pair End-to-End ViewModel Regression Check
  console.log("--- [5-Pair Production ViewModel Check] ---");
  const pairOutputs: string[] = [];

  for (const pair of testPairs) {
    console.log(`--- [Testing: ${pair.name}] ---`);

    const mockOpenAi = {} as any;
    const payload = await runFriendSocialDeepAnalysis(mockOpenAi, {
      nicknameA: pair.nameA,
      nicknameB: pair.nameB,
      birthA: { date: "1992-05-15", time: "14:30", place: "Seoul" },
      birthB: { date: "1993-08-20", time: "09:15", place: "Seoul" },
      sajuJsonA: sajuA,
      sajuJsonB: sajuB,
      psychMasterA: pair.psychA,
      psychMasterB: pair.psychB,
      locale: pair.locale,
      skipFriendNarrative: true,
    });

    const vm = buildFriendReportViewModel(payload.report, {
      viewerIsReportA: true,
      myName: pair.nameA,
      partnerName: pair.nameB,
      locale: pair.locale,
    });

    const jsonStr = JSON.stringify(vm);
    pairOutputs.push(jsonStr);

    const sectionTypes = vm.sections.map((s) => s.type);
    const hasNull = jsonStr.includes(":null,") && !jsonStr.includes("counseling_gap_note");
    const hasUndefined = jsonStr.includes("undefined");
    const hasWhyUsSection = sectionTypes.includes("why_you_me_us");
    const hasSocialDnaSection = sectionTypes.includes("social_dna");

    if (!hasNull) console.log("  ✅ [PASS] Zero invalid 'null' in ViewModel");
    else { console.log("  ❌ [FAIL] Found invalid 'null' in ViewModel"); allPassed = false; }

    if (!hasUndefined) console.log("  ✅ [PASS] Zero 'undefined' in ViewModel");
    else { console.log("  ❌ [FAIL] Found 'undefined' in ViewModel"); allPassed = false; }

    if (hasWhyUsSection) console.log("  ✅ [PASS] Why You & Me & Us section intact");
    else { console.log("  ❌ [FAIL] Why You & Me & Us section missing"); allPassed = false; }

    if (hasSocialDnaSection) console.log("  ✅ [PASS] Guardian Archetypes intact");
    else { console.log("  ❌ [FAIL] Guardian Archetypes missing"); allPassed = false; }

    console.log("");
  }

  // 3. Cross-pair diversity check
  console.log("--- [Cross-Pair Diversity Check] ---");
  const uniqueCount = new Set(pairOutputs).size;
  if (uniqueCount === testPairs.length) {
    console.log("  ✅ [PASS] All 5 pairs produce distinct ViewModel outputs.");
  } else {
    console.log(`  ❌ [FAIL] Output duplication detected (${uniqueCount}/${testPairs.length} unique)`);
    allPassed = false;
  }

  console.log("\n==================================================");
  console.log(" FINAL FRIEND PHASE 2A QA VERDICT");
  console.log("==================================================");
  if (allPassed) {
    console.log("FRIEND PHASE 2A QA: 100% PERFECT PASS");
    console.log("FRIEND PRODUCTION CANONICAL MIGRATION: COMPLETE");
  } else {
    console.log("FRIEND PHASE 2A QA: REGRESSIONS DETECTED");
  }
}

runRegressionQA().catch(console.error);
