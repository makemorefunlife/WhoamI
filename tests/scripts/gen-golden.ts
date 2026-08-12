import { writeFileSync } from "fs";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport";
import { buildFriendReportEnriched } from "../../lib/relationship/enrichment/buildFriendReportEnriched";
import { buildWorkColleagueReport } from "../../lib/relationship/workColleague/buildWorkColleagueReport";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";
import type { PairFamilySignals } from "../../lib/personCore/sajuSignals/pairTypes";

function psych(overrides: Partial<PsychMasterJson["secondary_axes"]>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return { secondary_axes: { ...base, ...overrides } } as unknown as PsychMasterJson;
}

const pf: PairFamilySignals = {
  umbilical_separation_index: 50, umbilical_band: "medium",
  nagging_trigger_index: 50, nagging_band: "medium",
  combined_karma_tension: 50, guidance_fit: null,
};

// 1. Bond High / Risk Low
const sajuParent1: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" },
};
const sajuChild1: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" },
};

// 2. Wonjin/Guimun (ja-myo, ja-yu etc)
const sajuParent2: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병자", dayPillar: "경자", hourPillar: "무자" },
};
const sajuChild2: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "신묘", hourPillar: "기묘" },
};

// 3. 11-axis gap
const sajuParent3: SajuDataForIntegrated = {
  saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "경오", hourPillar: "무신" },
};
const sajuChild3: SajuDataForIntegrated = {
  saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "신유", hourPillar: "기사" },
};

const family1 = buildFamilyParentReport({
  nicknameA: "Parent1", nicknameB: "Child1",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent1, sajuJsonB: sajuChild1,
  psychMasterA: psych({ structure: 80, stimulation: 30 }),
  psychMasterB: psych({ structure: 70, stimulation: 40 }),
  pairFamily: pf,
  locale: "ko-KR",
});

const family2 = buildFamilyParentReport({
  nicknameA: "Parent2", nicknameB: "Child2",
  roles: { roleA: "mother", roleB: "child" },
  sajuJsonA: sajuParent2, sajuJsonB: sajuChild2,
  psychMasterA: psych({ structure: 50, stimulation: 50 }),
  psychMasterB: psych({ structure: 50, stimulation: 50 }),
  pairFamily: pf,
  locale: "ko-KR",
});

const family3 = buildFamilyParentReport({
  nicknameA: "Parent3", nicknameB: "Child3",
  roles: { roleA: "father", roleB: "child" },
  sajuJsonA: sajuParent3, sajuJsonB: sajuChild3,
  psychMasterA: psych({ structure: 90, empathy: 10 }),
  psychMasterB: psych({ structure: 10, empathy: 90 }),
  pairFamily: pf,
  locale: "ko-KR",
});

const friend1 = buildFriendReportEnriched({
  nicknameA: "FriendA", nicknameB: "FriendB",
  sajuJsonA: sajuParent1, sajuJsonB: sajuChild1,
  locale: "ko-KR",
});

const work1 = buildWorkColleagueReport({
  nicknameA: "WorkA", nicknameB: "WorkB",
  sajuJsonA: sajuParent1, sajuJsonB: sajuChild1,
  locale: "ko-KR",
});

const output = `
# FAMILY V1 GOLDEN BASELINE

## Family Fixture 1: Bond High / Risk Low
\`\`\`json
${JSON.stringify(family1.family, null, 2)}
\`\`\`

## Family Fixture 2: Wonjin/Guimun
\`\`\`json
${JSON.stringify(family2.family, null, 2)}
\`\`\`

## Family Fixture 3: Large 11-Axis Gap
\`\`\`json
${JSON.stringify(family3.family, null, 2)}
\`\`\`

# FRIEND SMOKE CHECK
\`\`\`json
${JSON.stringify(friend1.friend_enriched, null, 2)}
\`\`\`

# WORK SMOKE CHECK
\`\`\`json
${JSON.stringify(work1.work_colleague, null, 2)}
\`\`\`
`;

writeFileSync("C:\\Users\\tehch\\.gemini\\antigravity\\brain\\5f253ad2-8630-4056-974c-437fd2b5b86e\\FAMILY_V1_GOLDEN_BASELINE.md", output);
console.log("Done");
