/**
 * Family Role Lens — Part2 A/B 이후.
 * parentRole은 제목·의미 문맥만 바꾸고, person shortLabel(bucket)과
 * pair band 계산은 바꾸지 않는다.
 * Run: npx tsx tests/unit/family-role-lens.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import {
  buildFamilySajuCompareTable,
  resolveCorrectionStyleBucket,
  resolveBondDistanceBucket,
  resolveGuidanceBalanceBucket,
} from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function sajuFromBirth(birthDate, birthTime = "12:00") {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };
}

const sajuChild = sajuFromBirth("2014-05-15");
const sajuParent = sajuFromBirth("1988-08-20");

function buildReport(locale, parentType) {
  return buildFamilyParentReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    roles: { roleA: "child", roleB: parentType },
    parentType,
    sajuJsonA: sajuChild,
    sajuJsonB: sajuParent,
    locale,
  });
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

section("1) parentRole 미전달 → neutral 제목");

const legacyCallRows = buildFamilySajuCompareTable({
  parentNickname: "Jordan",
  childNickname: "Alex",
  countsParent: { 정재: 2, 정관: 1, 식신: 3, 정인: 1, 비견: 1 },
  countsChild: { 정재: 1, 정관: 2, 식신: 1, 정인: 3, 비견: 1 },
  chartParent: chartStub,
  chartChild: chartStub,
  locale: "ko-KR",
});
const rowALegacy = legacyCallRows.find((r) => r.id === "correction_style");
const rowBLegacy = legacyCallRows.find((r) => r.id === "bond_distance");
assert.equal(rowALegacy.label, "지적·교정이 들어오는 순간의 반응");
assert.equal(rowBLegacy.label, "가까운 관계와 적당한 거리, 어디에 더 편한가");
ok("neutral titles for A/B when parentRole omitted");

section("2) mother vs father — 제목만 다르고 person shortLabel 동일");

const motherRows = buildReport("ko-KR", "mother").family.section_compare_table;
const fatherRows = buildReport("ko-KR", "father").family.section_compare_table;
const aM = motherRows.find((r) => r.id === "correction_style");
const aF = fatherRows.find((r) => r.id === "correction_style");
const bM = motherRows.find((r) => r.id === "bond_distance");
const bF = fatherRows.find((r) => r.id === "bond_distance");
const cM = motherRows.find((r) => r.id === "guidance_balance");
const cF = fatherRows.find((r) => r.id === "guidance_balance");

assert.notEqual(aM.label, aF.label);
assert.notEqual(bM.label, bF.label);
assert.equal(aM.personParent.shortLabel, aF.personParent.shortLabel);
assert.equal(aM.personChild.shortLabel, aF.personChild.shortLabel);
assert.equal(bM.personParent.shortLabel, bF.personParent.shortLabel);
assert.equal(bM.personChild.shortLabel, bF.personChild.shortLabel);
assert.equal(bM.label, "보호와 독립의 전환");
assert.equal(bF.label, "관여와 자율의 조율");
assert.notEqual(cM.label, cF.label);
assert.equal(cM.personParent.shortLabel, cF.personParent.shortLabel);
assert.equal(cM.personChild.shortLabel, cF.personChild.shortLabel);
ok("A/B/C person labels role-invariant; titles role-framed");

section("3) ③⑤⑥ role-invariant byte-identical");

for (const id of ["affection_expression", "gathering_recovery", "gathering_temperature"]) {
  assert.deepEqual(
    motherRows.find((r) => r.id === id),
    fatherRows.find((r) => r.id === id),
  );
}
ok("③⑤⑥ unchanged by parentRole");

section("4) resolve*Bucket signatures ignore parentRole");

assert.equal(resolveCorrectionStyleBucket.length, 1);
assert.equal(resolveBondDistanceBucket.length, 2);
assert.equal(resolveGuidanceBalanceBucket.length, 1);
ok("bucket resolvers do not take parentRole");

section("5) locale × role lookup miss 없음");

for (const locale of ["ko-KR", "en-US"]) {
  for (const parentType of ["mother", "father"]) {
    const rows = buildReport(locale, parentType).family.section_compare_table;
    for (const id of ["correction_style", "bond_distance", "guidance_balance"]) {
      const r = rows.find((x) => x.id === id);
      assert.ok(r.meaning.length > 0 && r.personParent.shortLabel.length > 0);
    }
  }
}
ok("all role×locale A/B/C lookups resolve");

section("6) en-US Hangul-free");

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;
assert.ok(!HANGUL_RE.test(JSON.stringify(buildReport("en-US", "mother").family.section_compare_table)));
assert.ok(!HANGUL_RE.test(JSON.stringify(buildReport("en-US", "father").family.section_compare_table)));
ok("en-US role copy Hangul-free");

section("7) determinism");

assert.deepEqual(
  buildReport("ko-KR", "mother").family.section_compare_table,
  buildReport("ko-KR", "mother").family.section_compare_table,
);
ok("deterministic");

console.log("\nAll family-role-lens tests passed.");
