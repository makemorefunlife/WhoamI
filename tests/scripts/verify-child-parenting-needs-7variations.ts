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

// 1. Saju Fixtures
const sajuParentStructure: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "경오", hourPillar: "무신" },
  tenGods: [{ pillar: "년주", godCode: "정관" }, { pillar: "월주", godCode: "정인" }],
};

// Child 1: 인성 1개 적정 (정서 수용)
const sajuChildSeal1: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "무자" },
  tenGods: [{ pillar: "년주", godCode: "정인" }],
};

// Child 2: 인성 과다 (과보호 부담)
const sajuChildSealExcess: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "무진", dayPillar: "경진", hourPillar: "무술" },
  tenGods: [{ pillar: "년주", godCode: "정인" }, { pillar: "월주", godCode: "편인" }, { pillar: "시주", godCode: "정인" }],
};

// Child 3: 식상 자율형
const sajuChildFood: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "임인", dayPillar: "계묘", hourPillar: "갑인" },
  tenGods: [{ pillar: "년주", godCode: "식신" }, { pillar: "월주", godCode: "상관" }],
};

// Var 1: 인성 1개 적정
const report1 = buildFamilyParentReport({
  nicknameA: "엄마", nicknameB: "아이1",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParentStructure, sajuJsonB: sajuChildSeal1,
  psychMasterA: makePsych({ structure: 60, empathy: 70 }),
  psychMasterB: makePsych({ empathy: 80 }),
  locale: "ko-KR",
});

// Var 2: 인성 과다 (과보호 억제 -> 자율/기다림 요청)
const report2 = buildFamilyParentReport({
  nicknameA: "엄마", nicknameB: "아이2",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParentStructure, sajuJsonB: sajuChildSealExcess,
  psychMasterA: makePsych({ structure: 80 }),
  psychMasterB: makePsych({ structure: 40 }),
  locale: "ko-KR",
});

// Var 3: 식상 자율형
const report3 = buildFamilyParentReport({
  nicknameA: "엄마", nicknameB: "아이3",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParentStructure, sajuJsonB: sajuChildFood,
  psychMasterA: makePsych({ structure: 75 }),
  psychMasterB: makePsych({ stimulation: 85 }),
  locale: "ko-KR",
});

console.log("=== VAR 1: Moderate Seal (Needs Emotional Acceptance) ===");
console.log("Innate:", report1.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.innateParentingNeeds.map(n => n.label));
console.log("Primary Gaps:", report1.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.primaryNeeds.map(n => `${n.label} (${n.gapStatus})`));

console.log("\n=== VAR 2: Excess Seal (Needs Autonomy & Patience, NOT Hovering) ===");
console.log("Innate:", report2.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.innateParentingNeeds.map(n => n.label));
console.log("Primary Gaps:", report2.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.primaryNeeds.map(n => `${n.label} (${n.gapStatus})`));

console.log("\n=== VAR 3: Food/Output (Needs Autonomy & Explanation) ===");
console.log("Innate:", report3.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.innateParentingNeeds.map(n => n.label));
console.log("Primary Gaps:", report3.canonical_projections?.story_plan?.pairMeanings?.childCoreNeedsDetailed?.primaryNeeds.map(n => `${n.label} (${n.gapStatus})`));
