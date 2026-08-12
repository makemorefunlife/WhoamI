import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

function makePsych(overrides: Record<string, number>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return { secondary_axes: { ...base, ...overrides } } as unknown as PsychMasterJson;
}

const sajuParent: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "경오", hourPillar: "무신" },
  tenGods: [{ pillar: "년주", godCode: "정관" }],
};

const sajuChildOfficer: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "정축" },
  tenGods: [{ pillar: "년주", godCode: "정관" }],
};

const sajuChildFood: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "임인", dayPillar: "계묘", hourPillar: "갑인" },
  tenGods: [{ pillar: "년주", godCode: "식신" }],
};

// Case 1: Structure Needed + Parent Structured + No Pressure -> WELL_SUPPLIED
const reportCase1 = buildFamilyParentReport({
  nicknameA: "엄마1", nicknameB: "아이1",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent, sajuJsonB: sajuChildOfficer,
  psychMasterA: makePsych({ structure: 70 }),
  psychMasterB: makePsych({ structure: 75, resilience: 70 }),
  locale: "ko-KR",
});

// Case 2: Structure Needed + Parent Structured + High Pressure -> WELL_SUPPLIED Forbidden!
const reportCase2 = buildFamilyParentReport({
  nicknameA: "엄마2", nicknameB: "아이2",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent, sajuJsonB: sajuChildOfficer,
  psychMasterA: makePsych({ structure: 85 }),
  psychMasterB: makePsych({ structure: 75, resilience: 30 }), // Low resilience -> high pressure gap
  locale: "ko-KR",
});

// Case 3: Recognition High + Parent Warm + Love Misaligned -> WELL_SUPPLIED Forbidden!
const reportCase3 = buildFamilyParentReport({
  nicknameA: "엄마3", nicknameB: "아이3",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent, sajuJsonB: sajuChildFood,
  psychMasterA: makePsych({ structure: 75, empathy: 75 }),
  psychMasterB: makePsych({ recognition: 85 }),
  locale: "ko-KR",
});

// Case 4: Autonomy Needed + Parent Already Patient -> Placed in wellSuppliedNeeds
const reportCase4 = buildFamilyParentReport({
  nicknameA: "엄마4", nicknameB: "아이4",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent, sajuJsonB: sajuChildFood,
  psychMasterA: makePsych({ structure: 30, empathy: 70 }), // Low structure -> High autonomy supply
  psychMasterB: makePsych({ stimulation: 70 }),
  locale: "ko-KR",
});

// Case 5: Emotional Acceptance Important + Parent Supply Low -> Primary Need Top
const reportCase5 = buildFamilyParentReport({
  nicknameA: "엄마5", nicknameB: "아이5",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent, sajuJsonB: sajuChildOfficer,
  psychMasterA: makePsych({ structure: 80, empathy: 30 }), // Low empathy -> Low acceptance supply
  psychMasterB: makePsych({ empathy: 80 }),
  locale: "ko-KR",
});

console.log("=== CASE 1: Structure Needed + Parent Structured + Healthy ===");
console.log("Well Supplied:", reportCase1.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.wellSuppliedNeeds.map(n => n.label));

console.log("\n=== CASE 2: Structure Needed + Parent Structured + High Pressure ===");
console.log("Well Supplied (Must NOT contain Structure):", reportCase2.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.wellSuppliedNeeds.map(n => n.label));
console.log("Primary Needs:", reportCase2.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.primaryNeeds.map(n => n.label));

console.log("\n=== CASE 3: Recognition High + Parent Warm + Love Misaligned ===");
console.log("Well Supplied (Must NOT contain Recognition):", reportCase3.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.wellSuppliedNeeds.map(n => n.label));
console.log("Primary Needs:", reportCase3.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.primaryNeeds.map(n => n.label));

console.log("\n=== CASE 4: Autonomy Needed + Parent Already Patient ===");
console.log("Well Supplied (Should contain Autonomy/Patience):", reportCase4.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.wellSuppliedNeeds.map(n => n.label));

console.log("\n=== CASE 5: Emotional Acceptance Important + Parent Low Supply ===");
console.log("Primary Needs Top (Should be Emotional Acceptance):", reportCase5.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.primaryNeeds.map(n => n.label));
