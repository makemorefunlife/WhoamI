import { calculateSajuBundle } from "../lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "../lib/saju/toApiPayload";
import { buildFamilyRuleContext } from "../lib/relationship/familyParent/buildFamilyRuleContext";
import { buildFamilyOverviewCardNarratives } from "../lib/relationship/familyParent/familyOverviewNarrative";

function createMockSaju(dateStr: string, timeStr: string) {
  const bundle = calculateSajuBundle({
    birthDate: dateStr,
    birthTime: timeStr,
  });
  return toV1SajuApiPayload(bundle);
}

const testPairs = [
  {
    label: "Pair 1: 엄마 김민정 (1980.04.12) & 딸 이지은 (2010.09.25)",
    roleA: "mother" as const,
    roleB: "child" as const,
    nameA: "김민정",
    nameB: "이지은",
    birthA: ["1980-04-12", "14:20"],
    birthB: ["2010-09-25", "09:10"],
  },
  {
    label: "Pair 2: 아빠 박성호 (1975.11.05) & 아들 박서준 (2012.03.18)",
    roleA: "father" as const,
    roleB: "child" as const,
    nameA: "박성호",
    nameB: "박서준",
    birthA: ["1975-11-05", "08:30"],
    birthB: ["2012-03-18", "16:45"],
  },
  {
    label: "Pair 3: 엄마 정유진 (1985.01.20) & 딸 최아린 (2015.07.12)",
    roleA: "mother" as const,
    roleB: "child" as const,
    nameA: "정유진",
    nameB: "최아린",
    birthA: ["1985-01-20", "22:15"],
    birthB: ["2015-07-12", "11:00"],
  },
  {
    label: "Pair 4: 아빠 강동원 (1978.08.30) & 딸 강예은 (2011.12.04)",
    roleA: "father" as const,
    roleB: "child" as const,
    nameA: "강동원",
    nameB: "강예은",
    birthA: ["1978-08-30", "04:50"],
    birthB: ["2011-12-04", "19:20"],
  },
  {
    label: "Pair 5: 엄마 윤소희 (1982.06.14) & 아들 윤도현 (2014.05.02)",
    roleA: "mother" as const,
    roleB: "child" as const,
    nameA: "윤소희",
    nameB: "윤도현",
    birthA: ["1982-06-14", "13:00"],
    birthB: ["2014-05-02", "10:30"],
  },
];

console.log("=== FAMILY 5-PAIR DYNAMIC GENERATION VERIFICATION ===\n");

for (const pair of testPairs) {
  const sajuA = createMockSaju(pair.birthA[0], pair.birthA[1]);
  const sajuB = createMockSaju(pair.birthB[0], pair.birthB[1]);

  const ctx = buildFamilyRuleContext({
    nicknameA: pair.nameA,
    nicknameB: pair.nameB,
    roles: { roleA: pair.roleA, roleB: pair.roleB },
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    locale: "ko-KR",
  });

  const cards = buildFamilyOverviewCardNarratives(ctx);

  console.log(`--------------------------------------------------`);
  console.log(`📌 ${pair.label}`);
  console.log(`   [점수] 유대: ${ctx.masterScores.bond}점 | 시너지: ${ctx.masterScores.synergy}점 | 마찰: ${ctx.masterScores.risk}점`);
  console.log(``);
  console.log(`🔥 [Card 1: 정서적 유대]`);
  console.log(`   - 등급: ${cards.bond.gradeLabel}`);
  console.log(`   - 렌즈: ${cards.bond.oneLiner}`);
  console.log(`   - 순간: ${cards.bond.scene}`);
  console.log(`   - 왜: ${cards.bond.why}`);
  console.log(``);
  console.log(`🧩 [Card 2: 성장 시너지]`);
  console.log(`   - 등급: ${cards.synergy.gradeLabel}`);
  console.log(`   - 렌즈: ${cards.synergy.oneLiner}`);
  console.log(`   - 순간: ${cards.synergy.scene}`);
  console.log(`   - 왜: ${cards.synergy.why}`);
  console.log(``);
  console.log(`⚡ [Card 3: 훈육 마찰]`);
  console.log(`   - 등급: ${cards.risk.gradeLabel}`);
  console.log(`   - 렌즈: ${cards.risk.oneLiner}`);
  console.log(`   - 순간: ${cards.risk.scene}`);
  console.log(`   - 왜: ${cards.risk.why}`);
  console.log(``);
}
