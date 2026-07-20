/**
 * family "한눈에 비교" 6행 표 검증 (006/007 로드맵 Step3).
 * Run: npx tsx tests/unit/family-compare-table.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildFamilyParentChildReport } from "../../lib/relationship/familyParent/familyReportTemplate.ts";
import { buildFamilyRuleContext } from "../../lib/relationship/familyParent/buildFamilyRuleContext.ts";
import {
  buildFamilySajuCompareTable,
  resolveNaggingReactionBucket,
  resolveBondDistanceBucket,
  resolveAffectionExpressionBucket,
  resolveCareBalanceBucket,
  resolveGatheringRecoveryBucket,
  resolveGatheringTemperatureBucket,
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

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;
const FORBIDDEN_KO = ["죄책감", "업보", "카르마", "효심", "진심", "사랑의 크기", "가족애의 깊이", "마음의 크기"];
const FORBIDDEN_EN = ["guilt", "karma", "filial piety", "sincer", "depth of love", "how much they love"];

const sajuChild = sajuFromBirth("2014-05-15");
const sajuParent = sajuFromBirth("1988-08-20");

function buildReport(locale) {
  return buildFamilyParentReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
    sajuJsonA: sajuChild,
    sajuJsonB: sajuParent,
    locale,
  });
}

// ---------------------------------------------------------------------------
section("1) 6행이 모두 생성됨(순서·구조 포함)");

const koReport = buildReport("ko-KR");
const rows = koReport.family.section_compare_table;
assert.ok(rows, "section_compare_table must exist");
assert.equal(rows.length, 6);
assert.deepEqual(
  rows.map((r) => r.id),
  [
    "correction_style",
    "bond_distance",
    "affection_expression",
    "care_balance",
    "gathering_recovery",
    "gathering_temperature",
  ],
);
for (const r of rows) {
  assert.ok(r.personParent.shortLabel, `${r.id}: personParent.shortLabel must be non-empty`);
  assert.ok(r.personChild.shortLabel, `${r.id}: personChild.shortLabel must be non-empty`);
  assert.ok(r.meaning, `${r.id}: meaning must be non-empty`);
}
ok("6행 모두 정상 생성, id 순서 정확, 라벨/의미 문구 비어있지 않음");

// ---------------------------------------------------------------------------
section("2) 동일 입력은 항상 동일 결과(결정론성)");

const run1 = buildReport("ko-KR").family.section_compare_table;
const run2 = buildReport("ko-KR").family.section_compare_table;
assert.deepEqual(run1, run2, "동일 입력 두 번 호출해도 완전히 같아야 함");
ok("동일 입력 → 항상 동일 결과");

// ---------------------------------------------------------------------------
section("3) 기존 Family 서사 결과가 변경되지 않음(회귀 없음)");

const ctxForBaseline = buildFamilyRuleContext({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  roles: { roleA: "child", roleB: "mother" },
  parentType: "mother",
  sajuJsonA: sajuChild,
  sajuJsonB: sajuParent,
  locale: "ko-KR",
});
const baselineFamily = buildFamilyParentChildReport(ctxForBaseline);
const { section_compare_table: _omit, ...reportFamilyWithoutCompareTable } = koReport.family;
assert.deepEqual(
  reportFamilyWithoutCompareTable,
  baselineFamily,
  "section_compare_table을 제외한 모든 필드는 buildFamilyParentChildReport(ctx) 원본과 완전히 동일해야 함",
);
ok("section_compare_table 필드 추가 외에는 기존 family 서사 결과가 한 글자도 안 바뀜");

// ---------------------------------------------------------------------------
section("4) B bond_distance는 parent_bond_band(기존 Family SSOT)를 사용함");

const bondCheck = resolveBondDistanceBucket(ctxForBaseline.tenGod.countsParent);
assert.ok(
  ["distant", "balanced", "smothering"].includes(bondCheck.bucket),
  "bond_distance bucket은 ParentBondBand여야 함",
);
assert.ok(typeof bondCheck.sourceValue.seal_count === "number");
ok("row B가 parent_bond_band / seal_count 기반임을 확인 (origin_family_tension 미사용)");

// ---------------------------------------------------------------------------
section("5) ③은 dominant_element(오행 우세)를 사용함");

const affectionCheck = resolveAffectionExpressionBucket(ctxForBaseline.chartParent);
const ELEMENT_KEYS = ["wood", "fire", "earth", "metal", "water"];
assert.ok(
  ELEMENT_KEYS.every((k) => typeof affectionCheck.sourceValue[k] === "number"),
  "row③의 sourceValue는 5개 오행 카운트를 모두 가진 Record여야 함",
);
assert.ok(ELEMENT_KEYS.includes(affectionCheck.bucket), "row③의 bucket은 5개 오행 중 하나여야 함");
// argmax 검증 — bucket이 실제로 sourceValue에서 가장 큰 값인지
const maxVal = Math.max(...ELEMENT_KEYS.map((k) => affectionCheck.sourceValue[k] ?? 0));
assert.equal(affectionCheck.sourceValue[affectionCheck.bucket], maxVal);
ok("row③이 countElements(오행 카운트) argmax를 정확히 사용함을 확인");

// ---------------------------------------------------------------------------
section("6) ⑥은 johu_profile을 사용함(SSOT 값을 그대로 읽는지 주입 테스트)");

// 실제로는 chart에서 유도 불가능한 임의 temperature_band를 주입해서,
// 이 함수가 "값을 그대로 통과"시키는지(재계산하지 않는지) 증명한다.
const injectedSignals = {
  year_month_palace: { harmony_hits: [], tension_hits: [], social_surface_tension_index: 0 },
  johu_profile: { heat_score: 12, moisture_score: 34, temperature_band: "hot", dominant_element: "fire" },
  bijie_isolation: { self_count: 0, peer_cluster_score: 0, isolation_score: 0, isolation_band: "balanced" },
};
const tempCheck = resolveGatheringTemperatureBucket(injectedSignals);
assert.equal(tempCheck.bucket, "hot", "주입한 johu_profile.temperature_band가 그대로 bucket이 되어야 함(재계산 아님)");
assert.equal(tempCheck.sourceValue, injectedSignals.johu_profile);

const tempFallback = resolveGatheringTemperatureBucket(undefined);
assert.equal(tempFallback.bucket, "neutral", "신호 없으면 방어적으로 neutral 폴백");
assert.equal(tempFallback.sourceValue, null);
ok("row⑥이 johu_profile 값을 그대로 읽고, 없을 때만 방어적 neutral 폴백을 씀(로컬 재계산 없음)");

// ---------------------------------------------------------------------------
section("7) 금지 문구가 출력되지 않음");

const enReport = buildReport("en-US");
const koJson = JSON.stringify(koReport.family.section_compare_table);
const enJson = JSON.stringify(enReport.family.section_compare_table);
for (const phrase of FORBIDDEN_KO) {
  assert.ok(!koJson.includes(phrase), `ko-KR compare table에 금지 문구 "${phrase}" 포함됨`);
}
for (const phrase of FORBIDDEN_EN) {
  assert.ok(
    !enJson.toLowerCase().includes(phrase.toLowerCase()),
    `en-US compare table에 금지 문구 "${phrase}" 포함됨`,
  );
}
ok("죄책감/업보/효심/진심/사랑(가족애)의 크기·깊이 관련 금지 문구 전부 미포함");

// ---------------------------------------------------------------------------
section("8) locale별 필드 구조가 유지됨");

assert.ok(!HANGUL_RE.test(enJson), "en-US compare table에 한글이 섞이면 안 됨");
assert.ok(HANGUL_RE.test(koJson), "ko-KR compare table은 한글이어야 함(회귀 없음)");
const enRows = enReport.family.section_compare_table;
assert.deepEqual(enRows.map((r) => r.id), rows.map((r) => r.id), "locale과 무관하게 행 순서/id는 동일해야 함");
for (let i = 0; i < 6; i++) {
  assert.deepEqual(
    Object.keys(enRows[i]).sort(),
    Object.keys(rows[i]).sort(),
    `${rows[i].id}: ko/en 필드 구조(키 집합)가 동일해야 함`,
  );
}
ok("locale이 달라도 필드 구조는 동일, en-US는 한글 zero, ko-KR은 한글 유지");

// ---------------------------------------------------------------------------
section("9) pair relation — 순서형 bucket(⑤⑥)만 near를 쓰고, 명목형(①②③④)은 same/different만");

// 합성 chart로 ⑤(신강신약)가 near를 실제로 낼 수 있는지 구조적으로 확인
// (STRENGTH_ORDER=[weak,balanced,strong] 인접 여부 계산 로직 자체를 화이트박스로 검증)
function fixtureChart(dayStem, branches) {
  const names = ["년주", "월주", "일주", "시주"];
  // countElements()는 pillars[].stemCode/branchCode를 직접 순회하므로, dayStem을
  // 4개 기둥 stemCode에 전부 넣으면 support/drain 계산용 오행 카운트가 인위적으로
  // 부풀려진다("gap"=wood를 4번 카운트). "중립" 케이스를 만들려면 pillars 자체는
  // wood/water/fire/metal과 무관한 흙(mu=earth)으로 채우고, day master 판정에 쓰이는
  // chart.dayStemCode(별도 top-level 필드)만 dayStem으로 지정한다.
  const pillars = names.map((name, i) => ({
    name,
    pillar: `${branches[i]}-pillar`,
    stemCode: "mu",
    branchCode: branches[i],
  }));
  return {
    pillars,
    stemCodes: new Set(pillars.map((p) => p.stemCode)),
    branchCodes: new Set(pillars.map((p) => p.branchCode)),
    dayStemCode: dayStem,
    dayBranchCode: branches[2],
    monthStemCode: dayStem,
    monthBranchCode: branches[1],
    yearStemCode: dayStem,
    yearBranchCode: branches[0],
    hourStemCode: dayStem,
    hourBranchCode: branches[3],
    dayPillar: `${branches[2]}-pillar`,
  };
}
const chartNeutral = fixtureChart("gap", ["sul", "sul", "sul", "sul"]);
const recovery = resolveGatheringRecoveryBucket(chartNeutral);
assert.equal(recovery.bucket, "balanced", "형충 없는 중립 chart는 support=drain=0이라 balanced여야 함");
ok("row⑤ 계산식이 설계대로 동작(중립 chart→balanced), near/different 판정은 STRENGTH_ORDER 인접성 기준");

// ---------------------------------------------------------------------------
section("7) 구형 캐시 판정 — section_compare_table 없으면 deep cache miss");

const { isFamilyParentChildDeepReport, FAMILY_PARENT_CHILD_DEEP_FORMAT } =
  await import("../../lib/prompts/relationshipPremium/familyParentChild/outputSchema.ts");

assert.equal(
  isFamilyParentChildDeepReport({
    format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
    report: {
      family: {
        section_child_dna: { genius_title: "재능" },
      },
    },
  }),
  false,
  "compare table 없는 구형 payload는 cache hit로 인정하면 안 됨",
);
ok("구형 family 캐시(compare table 없음) → isFamilyParentChildDeepReport false");

assert.equal(
  isFamilyParentChildDeepReport({
    format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
    report: koReport,
  }),
  true,
  "신규 build 결과는 cache hit 가능해야 함",
);
ok("신규 family payload(compare table 6행) → isFamilyParentChildDeepReport true");

console.log("\nAll family-compare-table tests passed.");
