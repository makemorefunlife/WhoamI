import { writeFileSync } from "fs";
import { buildFriendReportEnriched } from "../../lib/relationship/enrichment/buildFriendReportEnriched";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

function psych(overrides: Partial<PsychMasterJson["secondary_axes"]>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return { secondary_axes: { ...base, ...overrides } } as unknown as PsychMasterJson;
}

const sajuA: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" },
};
const sajuB: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" },
};

// 1. High friendship chemistry / low risk
const friend1 = buildFriendReportEnriched({
  nicknameA: "민준", nicknameB: "서준",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ stimulation: 80, energy_style: 70 }),
  psychMasterB: psych({ stimulation: 75, energy_style: 65 }),
  locale: "ko-KR",
});

// 2. High contact mismatch
const friend2 = buildFriendReportEnriched({
  nicknameA: "지후", nicknameB: "도윤",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ energy_style: 90, conflict_style: 80 }),
  psychMasterB: psych({ energy_style: 10, conflict_style: 20 }),
  locale: "ko-KR",
});

// 3. Large social-energy gap
const friend3 = buildFriendReportEnriched({
  nicknameA: "시우", nicknameB: "하준",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ energy_style: 95, stimulation: 90 }),
  psychMasterB: psych({ energy_style: 15, stimulation: 10 }),
  locale: "ko-KR",
});

// 4. Strong advice-style difference
const friend4 = buildFriendReportEnriched({
  nicknameA: "지호", nicknameB: "유준",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ empathy: 90, practicality: 10 }),
  psychMasterB: psych({ empathy: 10, practicality: 90 }),
  locale: "ko-KR",
});

// 5. Conflict-sensitive friendship
const friend5 = buildFriendReportEnriched({
  nicknameA: "준우", nicknameB: "예준",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ conflict_style: 90, resilience: 10 }),
  psychMasterB: psych({ conflict_style: 85, resilience: 15 }),
  locale: "ko-KR",
});

// 6. Healthy low-maintenance friendship
const friend6 = buildFriendReportEnriched({
  nicknameA: "건우", nicknameB: "우진",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ energy_style: 50, resilience: 80 }),
  psychMasterB: psych({ energy_style: 50, resilience: 80 }),
  locale: "ko-KR",
});

const output = `
# FRIEND V1 GOLDEN BASELINE

## Fixture 1: High Friendship Chemistry / Low Risk
\`\`\`json
${JSON.stringify(friend1, null, 2)}
\`\`\`

## Fixture 2: High Contact Mismatch
\`\`\`json
${JSON.stringify(friend2, null, 2)}
\`\`\`

## Fixture 3: Large Social-Energy Gap
\`\`\`json
${JSON.stringify(friend3, null, 2)}
\`\`\`

## Fixture 4: Strong Advice-Style Difference
\`\`\`json
${JSON.stringify(friend4, null, 2)}
\`\`\`

## Fixture 5: Conflict-Sensitive Friendship
\`\`\`json
${JSON.stringify(friend5, null, 2)}
\`\`\`

## Fixture 6: Healthy Low-Maintenance Friendship
\`\`\`json
${JSON.stringify(friend6, null, 2)}
\`\`\`
`;

writeFileSync("FRIEND_V1_GOLDEN_BASELINE.md", output);
console.log("Friend Golden baseline written to FRIEND_V1_GOLDEN_BASELINE.md");
