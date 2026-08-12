import { writeFileSync } from "fs";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

function psych(overrides: Partial<PsychMasterJson["secondary_axes"]>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    secondary_axes: { ...base, ...overrides },
    home_life_dna: { lifestyle_title: "홈라이프 DNA" },
  } as unknown as PsychMasterJson;
}

const sajuA: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" },
};
const sajuB: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" },
};

// 1. High compatibility / stable household
const couple1 = buildMarriageReport({
  nicknameA: "민수", nicknameB: "영희",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ structure: 80, practicality: 80 }),
  psychMasterB: psych({ structure: 75, practicality: 75 }),
  locale: "ko-KR",
});

// 2. Strong romance / weak practical fit
const couple2 = buildMarriageReport({
  nicknameA: "준호", nicknameB: "소연",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ stimulation: 90, structure: 15 }),
  psychMasterB: psych({ stimulation: 85, structure: 10 }),
  locale: "ko-KR",
});

// 3. Strong practical fit / low emotional synchronization
const couple3 = buildMarriageReport({
  nicknameA: "상우", nicknameB: "지은",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ structure: 90, empathy: 10 }),
  psychMasterB: psych({ structure: 85, empathy: 15 }),
  locale: "ko-KR",
});

// 4. Money decision mismatch
const couple4 = buildMarriageReport({
  nicknameA: "현우", nicknameB: "수진",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ practicality: 90, decision_style: 90 }),
  psychMasterB: psych({ practicality: 10, decision_style: 10 }),
  locale: "ko-KR",
});

// 5. Chores / mental-load imbalance
const couple5 = buildMarriageReport({
  nicknameA: "동현", nicknameB: "미경",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ structure: 95, recognition: 90 }),
  psychMasterB: psych({ structure: 20, recognition: 20 }),
  locale: "ko-KR",
});

// 6. Autonomy / togetherness mismatch
const couple6 = buildMarriageReport({
  nicknameA: "성민", nicknameB: "유진",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ energy_style: 10 }),
  psychMasterB: psych({ energy_style: 90 }),
  locale: "ko-KR",
});

// 7. Family-boundary conflict
const couple7 = buildMarriageReport({
  nicknameA: "재석", nicknameB: "선영",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ conflict_style: 90, self_control: 80 }),
  psychMasterB: psych({ conflict_style: 85, self_control: 15 }),
  locale: "ko-KR",
});

// 8. Career / household-role tension
const couple8 = buildMarriageReport({
  nicknameA: "태영", nicknameB: "혜진",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ decision_style: 90, structure: 85 }),
  psychMasterB: psych({ decision_style: 85, structure: 80 }),
  locale: "ko-KR",
});

const output = `
# COUPLE V1 GOLDEN BASELINE

## Fixture 1: High Compatibility / Stable Household
\`\`\`json
${JSON.stringify(couple1, null, 2)}
\`\`\`

## Fixture 2: Strong Romance / Weak Practical Fit
\`\`\`json
${JSON.stringify(couple2, null, 2)}
\`\`\`

## Fixture 3: Strong Practical Fit / Low Emotional Synchronization
\`\`\`json
${JSON.stringify(couple3, null, 2)}
\`\`\`

## Fixture 4: Money Decision Mismatch
\`\`\`json
${JSON.stringify(couple4, null, 2)}
\`\`\`

## Fixture 5: Chores / Mental-Load Imbalance
\`\`\`json
${JSON.stringify(couple5, null, 2)}
\`\`\`

## Fixture 6: Autonomy / Togetherness Mismatch
\`\`\`json
${JSON.stringify(couple6, null, 2)}
\`\`\`

## Fixture 7: Family-Boundary Conflict
\`\`\`json
${JSON.stringify(couple7, null, 2)}
\`\`\`

## Fixture 8: Career / Household-Role Tension
\`\`\`json
${JSON.stringify(couple8, null, 2)}
\`\`\`
`;

writeFileSync("COUPLE_V1_GOLDEN_BASELINE.md", output);
console.log("Couple Golden baseline written to COUPLE_V1_GOLDEN_BASELINE.md");
