import assert from "node:assert/strict";
import { buildChartContext } from "../../lib/saju/chartContext";
import {
  deriveIndividualFriendCharacter,
  deriveDirectionalFriendValue,
  derivePairFriendshipIdentity,
  type DayMasterStemCode,
} from "../../lib/relationship/friend/friendCharacterEngine";
import type { TenGodCounts } from "../../lib/relationship/marriage/marriageTenGodAnalysis";

const STEM_KOREAN: Record<DayMasterStemCode, string> = {
  gap: "갑",
  eul: "을",
  byeong: "병",
  jeong: "정",
  mu: "무",
  gi: "기",
  gyeong: "경",
  sin: "신",
  im: "임",
  gye: "계",
};

function mockChart(dayStem: DayMasterStemCode, monthBranch = "인", dayBranch = "자") {
  const stemKor = STEM_KOREAN[dayStem];
  return buildChartContext({
    yearPillar: "갑자",
    monthPillar: `병${monthBranch}`,
    dayPillar: `${stemKor}${dayBranch}`,
    hourPillar: "무진",
  });
}

function run() {
  console.log("=== FRIEND VNext Chapter 2 Engine Tests ===");

  // A. All 10 Day Master families reachable
  const stems: DayMasterStemCode[] = [
    "gap", "eul", "byeong", "jeong", "mu", "gi", "gyeong", "sin", "im", "gye"
  ];
  for (const stem of stems) {
    const chart = mockChart(stem);
    const res = deriveIndividualFriendCharacter({
      chart,
      tenGods: {},
      psych: null,
      locale: "ko-KR",
    });
    assert.equal(res.dayMaster, stem);
    assert.ok(res.characterTitle.length > 0);
    assert.ok(res.emoji.length > 0);
  }
  console.log("ok - All 10 Day Master families reachable");

  // B. Same Day Master can produce multiple expression variants
  const chart = mockChart("jeong");
  const res1 = deriveIndividualFriendCharacter({
    chart,
    tenGods: { "정관": 2, "정인": 1 },
    psych: { secondary_axes: { thinking_style: 68, empathy: 58 } },
    locale: "ko-KR",
  });
  const res2 = deriveIndividualFriendCharacter({
    chart,
    tenGods: { "식신": 2, "상관": 1 },
    psych: { secondary_axes: { stimulation: 75, empathy: 50 } },
    locale: "ko-KR",
  });
  assert.equal(res1.expressionVariant, "jeong_counselor");
  assert.equal(res2.expressionVariant, "jeong_companion");
  assert.notEqual(res1.expressionVariant, res2.expressionVariant);
  console.log("ok - Same Day Master produces multiple expression variants");

  // C-G. Discrimination Tests (甲!=乙, 丙!=丁, 戊!=己, 庚!=辛, 壬!=癸)
  const gap = deriveIndividualFriendCharacter({ chart: mockChart("gap"), tenGods: {}, psych: null, locale: "ko-KR" });
  const eul = deriveIndividualFriendCharacter({ chart: mockChart("eul"), tenGods: {}, psych: null, locale: "ko-KR" });
  assert.notEqual(gap.characterTitle, eul.characterTitle);
  assert.notEqual(gap.primaryCapability, eul.primaryCapability);

  const byeong = deriveIndividualFriendCharacter({ chart: mockChart("byeong"), tenGods: {}, psych: null, locale: "ko-KR" });
  const jeong = deriveIndividualFriendCharacter({ chart: mockChart("jeong"), tenGods: {}, psych: null, locale: "ko-KR" });
  assert.notEqual(byeong.characterTitle, jeong.characterTitle);
  assert.notEqual(byeong.primaryCapability, jeong.primaryCapability);

  const mu = deriveIndividualFriendCharacter({ chart: mockChart("mu"), tenGods: {}, psych: null, locale: "ko-KR" });
  const gi = deriveIndividualFriendCharacter({ chart: mockChart("gi"), tenGods: {}, psych: null, locale: "ko-KR" });
  assert.notEqual(mu.characterTitle, gi.characterTitle);
  assert.notEqual(mu.primaryCapability, gi.primaryCapability);

  const gyeong = deriveIndividualFriendCharacter({ chart: mockChart("gyeong"), tenGods: {}, psych: null, locale: "ko-KR" });
  const sin = deriveIndividualFriendCharacter({ chart: mockChart("sin"), tenGods: {}, psych: null, locale: "ko-KR" });
  assert.notEqual(gyeong.characterTitle, sin.characterTitle);
  assert.notEqual(gyeong.primaryCapability, sin.primaryCapability);

  const im = deriveIndividualFriendCharacter({ chart: mockChart("im"), tenGods: {}, psych: null, locale: "ko-KR" });
  const gye = deriveIndividualFriendCharacter({ chart: mockChart("gye"), tenGods: {}, psych: null, locale: "ko-KR" });
  assert.notEqual(im.characterTitle, gye.characterTitle);
  assert.notEqual(im.primaryCapability, gye.primaryCapability);
  console.log("ok - Discrimination tests pass for all 5 pairs (甲!=乙, 丙!=丁, 戊!=己, 庚!=辛, 壬!=癸)");

  // H-I. Missing psych works safely and invalid aliases don't pollute
  const invalidTenGods = { "officer": 5 } as unknown as TenGodCounts;
  const res = deriveIndividualFriendCharacter({
    chart,
    tenGods: invalidTenGods,
    psych: null,
    locale: "ko-KR",
  });
  assert.ok(res.confidence < 0.9);
  assert.ok(res.characterTitle.length > 0);
  console.log("ok - Missing psych and invalid aliases work safely");

  // J. Missing receiver need stays null (no fabricated psychology)
  const valNoNeed = deriveDirectionalFriendValue({
    giverName: "A",
    receiverName: "B",
    giverCharacter: res,
    receiverChart: mockChart("mu"),
    receiverTenGods: {},
    receiverPsych: null,
    locale: "ko-KR",
  });
  assert.equal(valNoNeed.receiverNeed, null);
  assert.ok(valNoNeed.roleTitle.length > 0);
  console.log("ok - Missing receiver need stays null without fabricating unbacked psychology");

  // K. Directionality & Pair Synthesis Provenance Safety
  const chartA = mockChart("jeong");
  const chartB = mockChart("gap");
  const indA = deriveIndividualFriendCharacter({ chart: chartA, tenGods: { "정관": 2 }, psych: { secondary_axes: { thinking_style: 68 } }, locale: "ko-KR" });
  const indB = deriveIndividualFriendCharacter({ chart: chartB, tenGods: { "정인": 2 }, psych: { secondary_axes: { empathy: 72 } }, locale: "ko-KR" });

  const valAtoB = deriveDirectionalFriendValue({
    giverName: "Sera",
    receiverName: "동글",
    giverCharacter: indA,
    receiverChart: chartB,
    receiverTenGods: { "정인": 2 },
    receiverPsych: { secondary_axes: { empathy: 72 } },
    locale: "ko-KR",
  });

  const valBtoA = deriveDirectionalFriendValue({
    giverName: "동글",
    receiverName: "Sera",
    giverCharacter: indB,
    receiverChart: chartA,
    receiverTenGods: { "정관": 2 },
    receiverPsych: { secondary_axes: { thinking_style: 68 } },
    locale: "ko-KR",
  });

  const pair = derivePairFriendshipIdentity({
    nameA: "Sera",
    nameB: "동글",
    valAtoB,
    valBtoA,
    locale: "ko-KR",
  });

  assert.equal(valAtoB.giverName, "Sera");
  assert.equal(valAtoB.receiverName, "동글");
  assert.equal(valBtoA.giverName, "동글");
  assert.equal(valBtoA.receiverName, "Sera");
  assert.ok(pair.pairTitle.length > 0);
  assert.ok(pair.lineAtoB.includes("Sera"));
  assert.ok(pair.lineBtoA.includes("동글"));
  assert.ok(pair.pairSynthesisDescription.length > 0);
  assert.ok(pair.pairSynthesisDescription.includes("Sera") || pair.pairSynthesisDescription.includes("동글"));

  // L. Situation Snapshots Generation
  assert.ok(indA.situationSnapshots.length > 0 && indA.situationSnapshots.length <= 4);
  assert.ok(indB.situationSnapshots.length > 0 && indB.situationSnapshots.length <= 4);
  assert.ok(indA.situationSnapshots.every((s) => s.strength === "STRONG" || s.strength === "MODERATE"));
  assert.notDeepEqual(indA.situationSnapshots, indB.situationSnapshots);
  console.log("ok - Situation Snapshots generated cleanly with max 4 caps, STRONG/MODERATE priority, and zero WEAK claims");

  // M. 4-Slot Behavioral Profile & Deduplication Safety
  assert.ok(indA.fourSlotProfile.groupSlot.label.length > 0);
  assert.ok(indA.fourSlotProfile.oneOnOneSlot.label.length > 0);
  assert.ok(indA.fourSlotProfile.supportSlot.label.length > 0);
  assert.notEqual(indA.fourSlotProfile.oneOnOneSlot.claimFamily, indA.fourSlotProfile.supportSlot.claimFamily);
  assert.ok(!indA.fourSlotProfile.groupSlot.label.includes("촛불"));
  assert.ok(!indA.fourSlotProfile.supportSlot.label.includes("태산"));
  assert.ok(!valAtoB.roleTitle.includes("파수꾼"));
  console.log("ok - 4-Slot Behavioral Profile generated with zero Myeongri metaphor leakage and semantic deduplication");

  console.log("\nALL CHAPTER 2 ENGINE TESTS PASSED!");
}

run();
