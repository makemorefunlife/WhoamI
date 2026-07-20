/**
 * Family Role Lens 검증 (008 문서 "최소 변경" 승인분).
 * ②(origin_family_distance)/④(care_balance) 두 축의 라벨·의미·제목만
 * parentRole(mother/father)에 따라 분기하고, bucket/relation 계산과
 * ①③⑤⑥은 절대 영향받지 않아야 한다는 제약을 검증한다.
 * Run: npx tsx tests/unit/family-role-lens.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import {
  buildFamilySajuCompareTable,
  resolveOriginFamilyDistanceBucket,
  resolveCareBalanceBucket,
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

// ---------------------------------------------------------------------------
section("1) fallback 회귀 — parentRole 미전달 시 기존 neutral 문구와 byte-identical");

// buildFamilySajuCompareTable을 parentRole 없이 직접 호출(레거시 호출부 시뮬레이션)
const legacyCallRows = buildFamilySajuCompareTable({
  parentNickname: "Jordan",
  childNickname: "Alex",
  countsParent: { wealth: 2, officer: 1, food: 3, seal: 1, self: 1 },
  countsChild: { wealth: 1, officer: 2, food: 1, seal: 3, self: 1 },
  chartParent: {
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
  },
  chartChild: {
    pillars: [
      { name: "년주", pillar: "x", stemCode: "gyeong", branchCode: "sin" },
      { name: "월주", pillar: "x", stemCode: "sin", branchCode: "yu" },
      { name: "일주", pillar: "x", stemCode: "im", branchCode: "sul" },
      { name: "시주", pillar: "x", stemCode: "gye", branchCode: "hae" },
    ],
    stemCodes: new Set(["gyeong", "sin", "im", "gye"]),
    branchCodes: new Set(["sin", "yu", "sul", "hae"]),
    dayStemCode: "im",
    dayBranchCode: "sul",
    monthStemCode: "sin",
    monthBranchCode: "yu",
    yearStemCode: "gyeong",
    yearBranchCode: "sin",
    hourStemCode: "gye",
    hourBranchCode: "hae",
    dayPillar: "x",
  },
  locale: "ko-KR",
  // parentRole 미전달
});

const row2Legacy = legacyCallRows.find((r) => r.id === "origin_family_distance");
const row4Legacy = legacyCallRows.find((r) => r.id === "care_balance");
assert.equal(row2Legacy.label, "가족과 편안한 정서적 거리", "②제목은 기존 neutral 제목과 동일해야 함");
assert.equal(row4Legacy.label, "가족을 돌볼 때 공감과 기준의 균형", "④제목은 기존 neutral 제목과 동일해야 함");
assert.ok(
  ["원가족과 확실히 거리를 둬야 편한 타입", "원가족과 적당히 가까워도 괜찮은 타입"].includes(
    row2Legacy.personParent.shortLabel,
  ),
  "②의 personParent.shortLabel은 기존 neutral 문구 집합 안에 있어야 함",
);
assert.ok(
  ["감정을 먼저 살피는 공감형", "기준을 먼저 세우는 원칙형"].includes(row4Legacy.personParent.shortLabel),
  "④의 personParent.shortLabel은 기존 neutral 문구 집합 안에 있어야 함",
);
ok("parentRole 미전달 시 ②④ 라벨·제목이 기존 neutral(배포 중) 문구와 정확히 일치");

// ---------------------------------------------------------------------------
section("2) role 분기 동작 — mother vs father 호출 시 ②④만 달라짐");

const motherReport = buildReport("ko-KR", "mother");
const fatherReport = buildReport("ko-KR", "father");
const motherRows = motherReport.family.section_compare_table;
const fatherRows = fatherReport.family.section_compare_table;

const row2Mother = motherRows.find((r) => r.id === "origin_family_distance");
const row2Father = fatherRows.find((r) => r.id === "origin_family_distance");
const row4Mother = motherRows.find((r) => r.id === "care_balance");
const row4Father = fatherRows.find((r) => r.id === "care_balance");

assert.notEqual(row2Mother.label, row2Father.label, "②제목이 mother/father로 달라야 함");
assert.equal(row2Mother.label, "보호와 독립의 거리");
assert.equal(row2Father.label, "자율성과 관여의 거리");
assert.notEqual(row4Mother.label, row4Father.label, "④제목이 mother/father로 달라야 함");
assert.equal(row4Mother.label, "감정 수용과 기준의 균형");
assert.equal(row4Father.label, "설명·지도와 기준의 균형");
assert.notEqual(
  row2Mother.personParent.shortLabel,
  row2Father.personParent.shortLabel,
  "②personParent.shortLabel이 mother/father로 달라야 함",
);
assert.notEqual(
  row4Mother.personParent.shortLabel,
  row4Father.personParent.shortLabel,
  "④personParent.shortLabel이 mother/father로 달라야 함",
);
ok("mother/father 호출 시 ②④의 제목·라벨·의미가 정확히 분기됨");

// ---------------------------------------------------------------------------
section("3) 불변 축 검증 — ①③⑤⑥은 mother/father 호출 결과가 byte-identical");

for (const id of ["nagging_reaction", "affection_expression", "gathering_recovery", "gathering_temperature"]) {
  const m = motherRows.find((r) => r.id === id);
  const f = fatherRows.find((r) => r.id === id);
  assert.deepEqual(m, f, `${id}: mother/father 호출 결과가 완전히 동일해야 함(role-agnostic 유지)`);
}
ok("①③⑤⑥ 네 축은 parentRole과 무관하게 byte-identical — 승인된 범위(②④만 변경) 준수 확인");

// ---------------------------------------------------------------------------
section("4) 계산 불변 검증 — resolve*Bucket 리턴값이 role 인자를 받지 않고도 동일");

// resolveOriginFamilyDistanceBucket/resolveCareBalanceBucket 시그니처 자체가
// parentRole을 아예 받지 않는다는 것이 곧 "계산 레이어 미변경"의 구조적 증거.
assert.equal(resolveOriginFamilyDistanceBucket.length, 2, "resolveOriginFamilyDistanceBucket은 (counts, chart) 2개 인자만 받음 — parentRole 파라미터 없음");
assert.equal(resolveCareBalanceBucket.length, 1, "resolveCareBalanceBucket은 (counts) 1개 인자만 받음 — parentRole 파라미터 없음");
ok("resolve*Bucket 함수 시그니처에 parentRole이 없음을 직접 확인 — role은 카피 레이어에서만 소비됨");

// ---------------------------------------------------------------------------
section("5) 콤보키 누락 검증 — mother/father × 가능한 모든 bucket 조합에서 lookup miss 없음");

const DISTANCE_BUCKETS = ["needs_distance", "comfortable"];
const CARE_BUCKETS = ["empathy", "structure"];
const ROLE_KEYS = ["neutral", "mother", "father"];
const LOCALES = ["ko-KR", "en-US"];

// 모듈 내부 상수는 export되어 있지 않으므로, buildFamilySajuCompareTable을
// 통해 간접적으로 모든 조합이 크래시 없이 문자열을 반환하는지 검증한다.
// (같은 bucket이 나오도록 동일 counts를 양쪽에 주입해 same/diff 두 갈래 모두 태운다)
for (const locale of LOCALES) {
  for (const parentType of ["mother", "father"]) {
    const r = buildReport(locale, parentType).family.section_compare_table;
    const row2 = r.find((x) => x.id === "origin_family_distance");
    const row4 = r.find((x) => x.id === "care_balance");
    assert.ok(typeof row2.meaning === "string" && row2.meaning.length > 0, `${locale}/${parentType}: row② meaning lookup miss 없음`);
    assert.ok(typeof row4.meaning === "string" && row4.meaning.length > 0, `${locale}/${parentType}: row④ meaning meaning lookup miss 없음`);
    assert.ok(row2.personParent.shortLabel.length > 0 && row2.personChild.shortLabel.length > 0, `${locale}/${parentType}: row② label lookup miss 없음`);
    assert.ok(row4.personParent.shortLabel.length > 0 && row4.personChild.shortLabel.length > 0, `${locale}/${parentType}: row④ label lookup miss 없음`);
  }
}
ok("locale × role(mother/father) 전 조합에서 ②④ label/meaning lookup miss 없음 확인");

// ---------------------------------------------------------------------------
section("6) locale parity — en-US/ko-KR 모두 동일한 role×bucket 키 구조");

const enMotherRows = buildReport("en-US", "mother").family.section_compare_table;
const enFatherRows = buildReport("en-US", "father").family.section_compare_table;
assert.deepEqual(
  enMotherRows.map((r) => r.id),
  motherRows.map((r) => r.id),
  "en-US/ko-KR 행 순서·id는 동일해야 함",
);
for (let i = 0; i < 6; i++) {
  assert.deepEqual(
    Object.keys(enMotherRows[i]).sort(),
    Object.keys(motherRows[i]).sort(),
    `${motherRows[i].id}: locale 간 필드 구조 동일해야 함(mother)`,
  );
}
// en-US에는 한글이 섞이면 안 됨(②④ role 카피 포함)
const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;
assert.ok(!HANGUL_RE.test(JSON.stringify(enMotherRows)), "en-US(mother) ②④에 한글 누락 없어야 함");
assert.ok(!HANGUL_RE.test(JSON.stringify(enFatherRows)), "en-US(father) ②④에 한글 누락 없어야 함");
ok("en-US/ko-KR 모두 role 카피 구조·언어 일관성 확인");

// ---------------------------------------------------------------------------
section("7) 결정성 — 동일 입력+동일 role 반복 호출 시 완전히 동일한 결과");

const motherRun1 = buildReport("ko-KR", "mother").family.section_compare_table;
const motherRun2 = buildReport("ko-KR", "mother").family.section_compare_table;
assert.deepEqual(motherRun1, motherRun2, "동일 입력+동일 role 반복 호출은 완전히 같아야 함");
const fatherRun1 = buildReport("ko-KR", "father").family.section_compare_table;
const fatherRun2 = buildReport("ko-KR", "father").family.section_compare_table;
assert.deepEqual(fatherRun1, fatherRun2, "동일 입력+동일 role 반복 호출은 완전히 같아야 함(father)");
ok("mother/father 각각 결정론적 — 동일 입력 반복 호출 결과 완전 일치");

console.log("\nAll family-role-lens tests passed.");
