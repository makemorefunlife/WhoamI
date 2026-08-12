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

const sajuParent: SajuDataForIntegrated = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" } };
const sajuChild: SajuDataForIntegrated = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" } };

// Pair 1: Protective Parent + High Recognition Child (Expectation & Love Misaligned)
const report1 = buildFamilyParentReport({
  nicknameA: "엄마1", nicknameB: "아이1",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent, sajuJsonB: sajuChild,
  psychMasterA: makePsych({ structure: 80, empathy: 40 }),
  psychMasterB: makePsych({ structure: 30, recognition: 85, resilience: 30 }),
  locale: "ko-KR",
});

// Pair 2: Autonomous Parent + Independent Child (Matched Alignment)
const report2 = buildFamilyParentReport({
  nicknameA: "엄마2", nicknameB: "아이2",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent, sajuJsonB: sajuChild,
  psychMasterA: makePsych({ structure: 40, empathy: 75 }),
  psychMasterB: makePsych({ structure: 50, stimulation: 80, resilience: 75 }),
  locale: "ko-KR",
});

console.log("=== PAIR 1 (Protective / High Pressure) ===");
console.log(JSON.stringify(report1.canonical_projections?.story_plan?.pairMeanings, null, 2));

console.log("\n=== PAIR 2 (Autonomous / Matched Alignment) ===");
console.log(JSON.stringify(report2.canonical_projections?.story_plan?.pairMeanings, null, 2));
