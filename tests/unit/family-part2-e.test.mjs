/**
 * Family Part2 E — home_climate.
 * Run: npx tsx tests/unit/family-part2-e.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveHomeClimateBand,
  resolveHomeClimateBandFromIndex,
} from "../../lib/personCore/sajuSignals/extractFamilySignals.ts";
import { buildPairFamilySignals } from "../../lib/personCore/sajuSignals/pairFamilySignals.ts";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import {
  resolveHomeClimateBucket,
  buildFamilySajuCompareTable,
} from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}

function sajuFromBirth(birthDate) {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
  const payload = toV1SajuApiPayload(bundle);
  return {
    bundle,
    json: {
      saju: payload.saju,
      dayStemData: payload.dayStemData,
      dayBranchData: payload.dayBranchData,
      hiddenStemsData: payload.hiddenStemsData,
      tenGods: payload.tenGods,
      twelveStageData: payload.twelveStageData,
      relations: payload.relations,
      shinsals: payload.shinsals,
    },
  };
}

function synthFamily({
  conflictIndex = 0,
  punishmentCount = 0,
  sealCount = 2,
  sealExcess = false,
  sealIsolated = false,
  karma = 0,
}) {
  const band = sealIsolated
    ? "distant"
    : sealExcess
      ? "smothering"
      : sealCount >= 2
        ? "balanced"
        : "distant";
  return {
    year_karma: {
      year_branch_code: "ja",
      tension_hits: [],
      karma_tension_index: karma,
    },
    seal_parent: {
      seal_count: sealCount,
      seal_excess: sealExcess,
      seal_isolated: sealIsolated,
      parent_bond_band: band,
    },
    home_punishment: {
      punishment_hits: [],
      punishment_count: punishmentCount,
      family_conflict_index: conflictIndex,
    },
  };
}

const chartStub = {
  pillars: [
    { name: "년주", pillar: "x", stemCode: "gap", branchCode: "ja" },
    { name: "월주", pillar: "x", stemCode: "eul", branchCode: "chuk" },
    { name: "일주", pillar: "x", stemCode: "byeong", branchCode: "in" },
    { name: "시주", pillar: "x", stemCode: "jeong", branchCode: "myo" },
  ],
  stemCodes: new Set(["gap", "eul", "byeong", "jeong"]),
  branchCodes: new Set(["ja", "chuk", "in", "myo"]),
  dayStemCode: "byeong",
  dayBranchCode: "in",
  monthStemCode: "eul",
  monthBranchCode: "chuk",
  yearStemCode: "gap",
  yearBranchCode: "ja",
  hourStemCode: "jeong",
  hourBranchCode: "myo",
  dayPillar: "x",
};

section("1) band thresholds (existing intensityBand3)");

assert.equal(resolveHomeClimateBandFromIndex(0), "low");
assert.equal(resolveHomeClimateBandFromIndex(33), "low");
assert.equal(resolveHomeClimateBandFromIndex(34), "medium");
assert.equal(resolveHomeClimateBandFromIndex(66), "medium");
assert.equal(resolveHomeClimateBandFromIndex(67), "high");
assert.equal(resolveHomeClimateBandFromIndex(100), "high");
ok("0–33 low, 34–66 medium, ≥67 high");

section("2) year_karma / johu / psych do not change E");

const base = synthFamily({ conflictIndex: 50, punishmentCount: 1 });
const karmaHigh = synthFamily({ conflictIndex: 50, punishmentCount: 1, karma: 99 });
assert.equal(resolveHomeClimateBand(base).bucket, resolveHomeClimateBand(karmaHigh).bucket);
assert.equal(resolveHomeClimateBand(base).bucket, "medium");
ok("year_karma change does not alter home climate band");

section("3) pair meaning from band combo — no pair numeric field");

function meaningFor(indexP, indexC, parentRole = "mother", locale = "ko-KR") {
  const famP = synthFamily({ conflictIndex: indexP });
  const famC = synthFamily({ conflictIndex: indexC });
  const rows = buildFamilySajuCompareTable({
    parentNickname: "P",
    childNickname: "C",
    countsParent: { 정인: 1 },
    countsChild: { 정인: 1 },
    chartParent: chartStub,
    chartChild: chartStub,
    familySignalsParent: famP,
    familySignalsChild: famC,
    parentRole,
    locale,
  });
  return rows.find((r) => r.id === "home_climate");
}

const ll = meaningFor(10, 10);
const hh = meaningFor(80, 80);
const lh = meaningFor(10, 80);
const hl = meaningFor(80, 10);
const mm = meaningFor(50, 50);
assert.ok(ll.meaning.includes("오래 붙잡지") || ll.meaning.includes("doesn't") || ll.meaning.length > 10);
assert.notEqual(ll.meaning, hh.meaning);
assert.equal(lh.meaning, hl.meaning); // comboKey sort → symmetric
assert.ok(mm.meaning.length > 10);
ok("low/low, high/high, low/high symmetric, medium/medium");

section("4) A nagging independence");

const mildClimate = synthFamily({
  conflictIndex: 10,
  punishmentCount: 0,
  sealCount: 2,
  sealExcess: false,
});
const hotNagPair = buildPairFamilySignals(
  synthFamily({
    conflictIndex: 10,
    punishmentCount: 3,
    sealCount: 4,
    sealExcess: true,
    karma: 80,
  }),
  synthFamily({
    conflictIndex: 10,
    punishmentCount: 2,
    sealCount: 0,
    sealIsolated: true,
    karma: 70,
  }),
);
assert.equal(hotNagPair.nagging_band, "high");
assert.equal(resolveHomeClimateBand(mildClimate).bucket, "low");
ok(`nagging high (${hotNagPair.nagging_band}) with climate low on mild person — axes independent`);

const highClimate = synthFamily({ conflictIndex: 80, punishmentCount: 0, sealCount: 2 });
const mildNag = buildPairFamilySignals(
  synthFamily({ conflictIndex: 80, punishmentCount: 0, sealCount: 2 }),
  synthFamily({ conflictIndex: 80, punishmentCount: 0, sealCount: 2 }),
);
assert.equal(mildNag.nagging_band, "low");
assert.equal(resolveHomeClimateBand(highClimate).bucket, "high");
ok("nagging low with climate high — axes independent");

section("5) parentRole invariant calc");

const child = sajuFromBirth("2014-05-15");
const parent = sajuFromBirth("1988-08-20");
const famLow = synthFamily({ conflictIndex: 20 });
const famHigh = synthFamily({ conflictIndex: 90 });

function buildReport(parentType, locale = "ko-KR") {
  return buildFamilyParentReport({
    nicknameA: "아이",
    nicknameB: parentType === "mother" ? "엄마" : "아빠",
    roles: { roleA: "child", roleB: parentType },
    parentType,
    sajuJsonA: child.json,
    sajuJsonB: parent.json,
    familySignalsA: famHigh,
    familySignalsB: famLow,
    locale,
  });
}

const m = buildReport("mother");
const f = buildReport("father");
const eM = m.family.section_compare_table.find((r) => r.id === "home_climate");
const eF = f.family.section_compare_table.find((r) => r.id === "home_climate");
assert.equal(eM.personParent.shortLabel, eF.personParent.shortLabel);
assert.equal(eM.personChild.shortLabel, eF.personChild.shortLabel);
assert.notEqual(eM.label, eF.label);
ok("parentRole: labels identical, titles differ");

section("6) locale + no gathering_temperature + A/B/C present");

const ids = m.family.section_compare_table.map((r) => r.id);
assert.deepEqual(ids, [
  "correction_style",
  "bond_distance",
  "affection_expression",
  "guidance_balance",
  "gathering_recovery",
  "home_climate",
]);
assert.ok(!ids.includes("gathering_temperature"));
const en = buildReport("mother", "en-US");
const enE = en.family.section_compare_table.find((r) => r.id === "home_climate");
assert.ok(!/[ㄱ-ㅎ가-힣]/.test(enE.label + enE.personParent.shortLabel + enE.meaning));
ok("6 rows; gathering_temperature gone; en-US Hangul-free");

section("7) forbidden event-claim copy");

const banned = /불행|폭력|부모가 문제|갈등이 많았다|관계가 나쁘/;
for (const locale of ["ko-KR", "en-US"]) {
  for (const role of ["mother", "father"]) {
    const row = meaningFor(80, 80, role, locale);
    assert.ok(!banned.test(row.meaning + row.label + row.personParent.shortLabel));
  }
}
ok("no event-claim / blame copy");

section("8) cache validator");

const { isFamilyParentChildDeepReport, FAMILY_PARENT_CHILD_DEEP_FORMAT } =
  await import("../../lib/prompts/relationshipPremium/familyParentChild/outputSchema.ts");
assert.equal(
  isFamilyParentChildDeepReport({ format: FAMILY_PARENT_CHILD_DEEP_FORMAT, report: m }),
  true,
);
ok("premium cache accepts E payload");

console.log("\nAll family-part2-e tests passed.");
