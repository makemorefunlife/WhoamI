import { writeFileSync } from "fs";
import { buildWorkColleagueReportEnriched } from "../../lib/relationship/enrichment/buildWorkColleagueReportEnriched";
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

// 1. High fit / low risk
const work1 = buildWorkColleagueReportEnriched({
  nicknameA: "김팀장", nicknameB: "이매니저",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ structure: 85, decision_style: 80 }),
  psychMasterB: psych({ structure: 80, decision_style: 75 }),
  locale: "ko-KR",
});

// 2. Strong complementary roles
const work2 = buildWorkColleagueReportEnriched({
  nicknameA: "박디렉터", nicknameB: "최파트장",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ thinking_style: 90, structure: 20 }),
  psychMasterB: psych({ thinking_style: 10, structure: 90 }),
  locale: "ko-KR",
});

// 3. Authority / decision clash
const work3 = buildWorkColleagueReportEnriched({
  nicknameA: "정수석", nicknameB: "강수석",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ decision_style: 90, self_control: 80 }),
  psychMasterB: psych({ decision_style: 85, self_control: 20 }),
  locale: "ko-KR",
});

// 4. Feedback-style mismatch
const work4 = buildWorkColleagueReportEnriched({
  nicknameA: "윤리더", nicknameB: "한담당",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ empathy: 10, practicality: 90 }),
  psychMasterB: psych({ empathy: 90, practicality: 10 }),
  locale: "ko-KR",
});

// 5. Deadline / stress-sensitive pair
const work5 = buildWorkColleagueReportEnriched({
  nicknameA: "임선임", nicknameB: "송선임",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ conflict_style: 90, resilience: 10 }),
  psychMasterB: psych({ conflict_style: 85, resilience: 15 }),
  locale: "ko-KR",
});

// 6. Healthy balanced collaborators
const work6 = buildWorkColleagueReportEnriched({
  nicknameA: "오책임", nicknameB: "신책임",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psych({ structure: 50, resilience: 75 }),
  psychMasterB: psych({ structure: 50, resilience: 75 }),
  locale: "ko-KR",
});

const output = `
# WORK V1 GOLDEN BASELINE

## Fixture 1: High Fit / Low Risk
\`\`\`json
${JSON.stringify(work1, null, 2)}
\`\`\`

## Fixture 2: Strong Complementary Roles
\`\`\`json
${JSON.stringify(work2, null, 2)}
\`\`\`

## Fixture 3: Authority / Decision Clash
\`\`\`json
${JSON.stringify(work3, null, 2)}
\`\`\`

## Fixture 4: Feedback-Style Mismatch
\`\`\`json
${JSON.stringify(work4, null, 2)}
\`\`\`

## Fixture 5: Deadline / Stress-Sensitive Pair
\`\`\`json
${JSON.stringify(work5, null, 2)}
\`\`\`

## Fixture 6: Healthy Balanced Collaborators
\`\`\`json
${JSON.stringify(work6, null, 2)}
\`\`\`
`;

writeFileSync("WORK_V1_GOLDEN_BASELINE.md", output);
console.log("Work Golden baseline written to WORK_V1_GOLDEN_BASELINE.md");
