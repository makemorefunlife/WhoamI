/**
 * buildFriendSajuCompareTable() — v4 structural fixes (2026-07-20):
 *   1. Row②(서운함 표출)와 행⑤(모임 준비)가 더 이상 같은 신호를 재사용하지
 *      않고 독립적으로 움직여야 한다.
 *   2. 행④(배터리 충전)는 신강/신약/중화 모든 조합에서 "혼자/만나서" 식으로
 *      단정하지 않고 조합별 문구를 내야 한다.
 *   3. 행③(애정 언어)의 "마음의 크기는 같아요" 문구가 더 이상 출력되지
 *      않아야 한다.
 *   4. 동일 입력은 항상 동일 결과(결정론성)를 내야 한다.
 * Phase 5-3: 행⑤ 카피는 개인 계획·물류 기질만 — "총무/treasurer" 금지.
 * No DB, no LLM — 순수 함수 입력만으로 검증. saju pillars는 실제 두 사람의
 * 생년월일시(880202 11:10 / 871027 22:30)로 진단 스크립트를 돌려 확인한
 * 실제 간지 문자열을 그대로 사용한다.
 * Run: npx tsx tests/unit/friend-compare-table.test.mjs
 */
import assert from "node:assert/strict";
import { buildFriendSajuCompareTable } from "../../lib/relationship/friend/friendSajuCompareTable.ts";
import {
  pickFriendTreasurer,
  buildFriendTreasurerReason,
} from "../../lib/relationship/friend/friendDeEscalationPrescriptions.ts";
import { refineFriendTreasurer } from "../../lib/relationship/friend/friendPsychFit.ts";
import { buildChartContext } from "../../lib/saju/chartContext.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

// 실제 두 사람(Sera 880202 11:10 / 다시고고 871027 22:30)의 간지 —
// calculateSajuBundle로 계산한 결과를 그대로 하드코딩(테스트에 외부 패키지
// 의존을 늘리지 않기 위해).
const SERA_SAJU = { yearPillar: "정묘", monthPillar: "계축", dayPillar: "정해", hourPillar: "을사" };
const DASIGOGO_SAJU = { yearPillar: "정묘", monthPillar: "경술", dayPillar: "기유", hourPillar: "을해" };
// 신강/신약/중화 margin=1 기준 "balanced"로 떨어지는 합성 인물(1985-06-20 14:30) —
// 중화 포함 조합을 테스트하기 위한 픽스처.
const BALANCED_SAJU = { yearPillar: "을축", monthPillar: "임오", dayPillar: "경인", hourPillar: "계미" };

const chartSera = buildChartContext(SERA_SAJU);
const chartDasigogo = buildChartContext(DASIGOGO_SAJU);
const chartBalanced = buildChartContext(BALANCED_SAJU);

// row③(애정 언어)만 읽는 최소 dnaA/dnaB fixture.
const dna = (dominantElement) => ({ dominantElement });

function findRow(rows, id) {
  const r = rows.find((row) => row.id === id);
  assert.ok(r, `row ${id} must exist`);
  return r;
}

// ---------------------------------------------------------------------------
section("1) 행②·⑤가 같은 신호를 재사용하지 않고 독립적으로 움직인다");
// self가 최댓값(행②)이면서 wealthOfficer 합산(행⑤)만 다른 두 세트를 구성.
const countsA_self = { "비견": 3 }; // self=3 dominant, wealthOfficer=0 -> "none"
const countsB_selfHighWO = { "비견": 2, "정관": 2 }; // self=2 dominant(동률시 self 우선), wealthOfficer=2 -> "strong"

const rowsIndep = buildFriendSajuCompareTable({
  nicknameA: "A",
  nicknameB: "B",
  tenGodsA: countsA_self,
  tenGodsB: countsB_selfHighWO,
  dnaA: dna("fire"),
  dnaB: dna("fire"),
  chartA: chartSera,
  chartB: chartSera, // 행②/⑤만 보는 테스트라 행①/④는 관심사 아님(같은 chart로 고정)
  locale: "ko-KR",
});

const upset = findRow(rowsIndep, "upset_expression");
const hangout = findRow(rowsIndep, "hangout_planning");

assert.equal(upset.personA.shortLabel, upset.personB.shortLabel, "row② dominant category(self) must match for both — precondition of this test");
assert.notEqual(
  hangout.personA.shortLabel,
  hangout.personB.shortLabel,
  "row⑤ must differ even though row② matched — proves independent signal",
);
ok("행② 카테고리가 같아도 행⑤(재관 합산)는 독립적으로 다르게 나온다");

// 반대 방향도 확인: 재관 합산이 같아도(둘 다 wealthOfficer=0) 행②는 다를 수 있어야 함.
const countsC_food = { "식신": 3 }; // food dominant, wealthOfficer=0
const countsD_seal = { "정인": 3 }; // seal dominant, wealthOfficer=0
const rowsIndep2 = buildFriendSajuCompareTable({
  nicknameA: "C",
  nicknameB: "D",
  tenGodsA: countsC_food,
  tenGodsB: countsD_seal,
  dnaA: dna("fire"),
  dnaB: dna("fire"),
  chartA: chartSera,
  chartB: chartSera,
  locale: "ko-KR",
});
const upset2 = findRow(rowsIndep2, "upset_expression");
const hangout2 = findRow(rowsIndep2, "hangout_planning");
assert.equal(hangout2.personA.shortLabel, hangout2.personB.shortLabel, "row⑤(둘 다 wealthOfficer=0) precondition");
assert.notEqual(upset2.personA.shortLabel, upset2.personB.shortLabel, "row②(food vs seal)는 행⑤가 같아도 독립적으로 달라야 함");
ok("행⑤가 같아도 행②는 독립적으로 다르게 나온다 (양방향 확인)");

// ---------------------------------------------------------------------------
section("2) 행④ 배터리 — 신강/신약/중화 조합별 문구, 절대 단정 없음");

const realPairRows = buildFriendSajuCompareTable({
  nicknameA: "Sera",
  nicknameB: "다시고고",
  tenGodsA: { "비견": 2, "편관": 1, "편인": 1 },
  tenGodsB: { "편인": 1, "상관": 1, "비견": 1, "편관": 1 },
  dnaA: dna("fire"),
  dnaB: dna("wood"),
  chartA: chartSera,
  chartB: chartDasigogo,
  locale: "ko-KR",
});
const batteryReal = findRow(realPairRows, "battery_recharge");
assert.notEqual(
  batteryReal.personA.shortLabel,
  batteryReal.personB.shortLabel,
  "실제 두 사람은 margin=1 재계산으로 강/약이 갈려야 함(margin=2 시절엔 둘 다 중화로 뭉쳤던 케이스)",
);
ok("실제 두 사람(Sera/다시고고) 배터리 행이 더 이상 같은 문구로 뭉치지 않는다");

const balancedVsStrongRows = buildFriendSajuCompareTable({
  nicknameA: "Sera",
  nicknameB: "Balanced",
  tenGodsA: { "비견": 2, "편관": 1, "편인": 1 },
  tenGodsB: { "비견": 1 },
  dnaA: dna("fire"),
  dnaB: dna("earth"),
  chartA: chartSera,
  chartB: chartBalanced,
  locale: "ko-KR",
});
const batteryBalancedCombo = findRow(balancedVsStrongRows, "battery_recharge");
assert.match(
  batteryBalancedCombo.meaning,
  /그날그날/,
  "중화가 포함된 조합은 '그날그날 다른 편' 뉘앙스를 반영해야 함",
);
assert.doesNotMatch(
  batteryBalancedCombo.meaning,
  /무조건 혼자|무조건 발산/,
  "중화를 '무조건 혼자' 또는 '무조건 발산'으로 단정하면 안 됨",
);
ok("중화 포함 배터리 조합 문구가 정상 출력되고 절대적 단정을 하지 않는다");

// 같은 밴드끼리도(둘 다 balanced) 정상 출력되는지 확인.
const bothBalancedRows = buildFriendSajuCompareTable({
  nicknameA: "B1",
  nicknameB: "B2",
  tenGodsA: {},
  tenGodsB: {},
  dnaA: dna("earth"),
  dnaB: dna("earth"),
  chartA: chartBalanced,
  chartB: chartBalanced,
  locale: "ko-KR",
});
const bothBalanced = findRow(bothBalancedRows, "battery_recharge");
assert.equal(bothBalanced.personA.shortLabel, bothBalanced.personB.shortLabel);
assert.match(bothBalanced.meaning, /그날그날/);
ok("둘 다 중화인 경우도 정상 출력된다");

// ---------------------------------------------------------------------------
section("3) '마음의 크기' 문구가 더 이상 출력되지 않는다");

const allSampleRows = [...rowsIndep, ...rowsIndep2, ...realPairRows, ...balancedVsStrongRows, ...bothBalancedRows];
for (const locale of ["ko-KR", "en-US"]) {
  const rows = buildFriendSajuCompareTable({
    nicknameA: "X",
    nicknameB: "Y",
    tenGodsA: { "식신": 2, "정재": 1 },
    tenGodsB: { "정인": 2, "정관": 1 },
    dnaA: dna("metal"),
    dnaB: dna("water"),
    chartA: chartSera,
    chartB: chartDasigogo,
    locale,
  });
  for (const r of rows) {
    assert.doesNotMatch(JSON.stringify(r), /마음의 크기|same-size heart/i);
  }
}
for (const r of allSampleRows) {
  assert.doesNotMatch(JSON.stringify(r), /마음의 크기|same-size heart/i);
}
ok("'마음의 크기' 계열 문구가 어떤 조합/로케일에서도 나오지 않는다");

// ---------------------------------------------------------------------------
section("4) 동일 입력은 항상 동일 결과 (결정론성)");

const inputA = {
  nicknameA: "Sera",
  nicknameB: "다시고고",
  tenGodsA: { "비견": 2, "편관": 1, "편인": 1 },
  tenGodsB: { "편인": 1, "상관": 1, "비견": 1, "편관": 1 },
  dnaA: dna("fire"),
  dnaB: dna("wood"),
  chartA: chartSera,
  chartB: chartDasigogo,
  locale: "ko-KR",
};
const runOnce = buildFriendSajuCompareTable(inputA);
const runTwice = buildFriendSajuCompareTable(inputA);
assert.deepEqual(runOnce, runTwice, "동일 입력을 두 번 호출해도 결과가 완전히 같아야 함");

// 새 객체로(참조는 다르지만 내용은 동일) 다시 호출해도 동일해야 함 — 진짜
// 순수 함수인지(숨은 전역 상태·랜덤 없음) 확인.
const runThird = buildFriendSajuCompareTable(JSON.parse(JSON.stringify(inputA)) && {
  ...inputA,
  tenGodsA: { ...inputA.tenGodsA },
  tenGodsB: { ...inputA.tenGodsB },
});
assert.deepEqual(runOnce, runThird, "구조적으로 동일한 새 객체를 넣어도 결과가 같아야 함(랜덤성 없음)");
ok("동일 입력 → 항상 동일 결과, 숨은 랜덤성 없음");

// ---------------------------------------------------------------------------
section("5) report_id_a/report_id_b가 실제로 다른 사람 데이터를 쓰면 6/6 동일하지 않다");
// 2026-07-21: 동글(partner_manual) report row에 Sera 본인의 birth_date가 잘못
// 들어가 있어서, family/friend/work/marriage 비교표 6행이 전부 동일하게
// 나온 사고가 있었음. 원인은 classifier가 아니라 DB에 저장된 입력 데이터
// 자체가 같았기 때문 — 이 테스트는 "서로 다른 실제 두 사람 데이터를 넣으면
// 6행이 전부 동일해지지 않는다"는 것과, 반대로 "같은 데이터를 두 번 넣으면
// (버그가 재발하면) 실제로 6/6 동일해진다"는 대조군을 함께 남겨서, 앞으로
// compare table 결과가 전부 동일하게 나오면 classifier가 아니라 데이터
// 페칭 쪽을 의심하게 만드는 회귀 가드다.
const realDistinctPairRows = buildFriendSajuCompareTable({
  nicknameA: "Sera",
  nicknameB: "다시고고",
  tenGodsA: { "비견": 2, "편관": 1, "편인": 1 },
  tenGodsB: { "편인": 1, "상관": 1, "비견": 1, "편관": 1 },
  dnaA: dna("fire"),
  dnaB: dna("wood"),
  chartA: chartSera,
  chartB: chartDasigogo,
  locale: "ko-KR",
});
const sameCountDistinct = realDistinctPairRows.filter(
  (r) => r.personA.shortLabel === r.personB.shortLabel,
).length;
assert.ok(
  sameCountDistinct < realDistinctPairRows.length,
  `서로 다른 실제 두 사람인데 ${sameCountDistinct}/${realDistinctPairRows.length}행이 동일함 — classifier 회귀 의심`,
);
ok(`실제 두 사람(Sera/다시고고) 데이터는 ${sameCountDistinct}/6행만 겹침 (전부 동일 아님)`);

// 대조군: Sera 데이터를 A/B 양쪽에 그대로 복제해서 넣으면(=파이프라인이
// 동일 인물 데이터를 두 번 페칭하는 버그 상황) 실제로 6/6 전부 동일해짐을
// 확인 — "6/6 동일"이 나오면 데이터 중복 유입을 의심할 근거가 되는 것을
// 증명하는 대조군.
const duplicatedInputRows = buildFriendSajuCompareTable({
  nicknameA: "Sera",
  nicknameB: "Sera(복제 버그 시뮬레이션)",
  tenGodsA: { "비견": 2, "편관": 1, "편인": 1 },
  tenGodsB: { "비견": 2, "편관": 1, "편인": 1 },
  dnaA: dna("fire"),
  dnaB: dna("fire"),
  chartA: chartSera,
  chartB: chartSera,
  locale: "ko-KR",
});
const sameCountDuplicated = duplicatedInputRows.filter(
  (r) => r.personA.shortLabel === r.personB.shortLabel,
).length;
assert.equal(
  sameCountDuplicated,
  duplicatedInputRows.length,
  "동일 인물 데이터를 A/B에 중복 입력하면 6/6 전부 동일해야 함(대조군) — classifier는 정상 동작 중임을 증명",
);
ok("동일 데이터 중복 입력 시 6/6 전부 동일 — classifier가 아니라 데이터 유입 문제였음을 재확인하는 대조군");

// ---------------------------------------------------------------------------
section("6) Phase 5-3 — hangout_planning 카피 ≠ Part3 총무 추천");

const TREASURER_COPY_RE = /총무|treasurer/i;

/** F1: compare A=strong planning(편관), Part3 B=treasurer(정재) */
const F1_COUNTS_A = { 편관: 2 };
const F1_COUNTS_B = { 정재: 1 };

for (const locale of ["ko-KR", "en-US"]) {
  const f1Rows = buildFriendSajuCompareTable({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    tenGodsA: F1_COUNTS_A,
    tenGodsB: F1_COUNTS_B,
    dnaA: dna("fire"),
    dnaB: dna("wood"),
    chartA: chartSera,
    chartB: chartDasigogo,
    locale,
  });
  const f1Hangout = findRow(f1Rows, "hangout_planning");
  assert.equal(f1Hangout.id, "hangout_planning");

  const hangoutBlob = JSON.stringify(f1Hangout);
  assert.doesNotMatch(
    hangoutBlob,
    TREASURER_COPY_RE,
    `hangout_planning must not use treasurer/총무 copy (${locale})`,
  );

  if (locale === "ko-KR") {
    assert.equal(f1Hangout.label, "모임 준비 스타일");
    assert.equal(f1Hangout.personA.shortLabel, "약속·동선을 주도적으로 짜는 편");
    assert.equal(f1Hangout.personB.shortLabel, "필요할 때는 계획도 짜는 균형형");
    assert.equal(
      f1Hangout.meaning,
      "모임 준비·계획 성향의 정도가 서로 달라요 — 준비를 더 즐기는 쪽에 자연스럽게 맡기되, 가끔은 반대쪽도 골라보면 좋아요.",
    );
  } else {
    assert.equal(f1Hangout.label, "Planning Style");
    assert.equal(f1Hangout.personA.shortLabel, "Naturally takes charge of logistics");
    assert.equal(
      f1Hangout.personB.shortLabel,
      "Plans when it matters, goes with the flow otherwise",
    );
    assert.equal(
      f1Hangout.meaning,
      "You differ in how much you enjoy organizing plans — let the one who enjoys it more lead, but let the other pick sometimes too.",
    );
  }
}
ok("F1 compare snapshot — A planning-strong / B mid, no treasurer wording");

const f1Base = pickFriendTreasurer({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: F1_COUNTS_A,
  countsB: F1_COUNTS_B,
  locale: "ko-KR",
});
const f1Refined = refineFriendTreasurer({
  baseNickname: f1Base.nickname,
  baseReason: f1Base.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: F1_COUNTS_A,
  countsB: F1_COUNTS_B,
  locale: "ko-KR",
});
assert.equal(f1Refined.nickname, "Jordan");
assert.match(f1Refined.reason, /총무/);
assert.equal(
  f1Refined.reason,
  buildFriendTreasurerReason("Jordan", "ko-KR"),
);
ok("F1 Part3 still recommends Jordan as treasurer — orthogonal to compare planning bands");

for (const locale of ["ko-KR", "en-US"]) {
  const allBandsRows = buildFriendSajuCompareTable({
    nicknameA: "X",
    nicknameB: "Y",
    tenGodsA: {},
    tenGodsB: { 편관: 1, 정재: 1 },
    dnaA: dna("earth"),
    dnaB: dna("earth"),
    chartA: chartSera,
    chartB: chartSera,
    locale,
  });
  const row = findRow(allBandsRows, "hangout_planning");
  assert.doesNotMatch(JSON.stringify(row), TREASURER_COPY_RE);
  assert.doesNotMatch(row.label, /Who's the Treasurer|총무 기질/);
}
ok("hangout_planning bands/title never say treasurer across locales");

console.log("\nAll friend-compare-table tests passed.");
