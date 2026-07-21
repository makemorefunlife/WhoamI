/**
 * buildMarriageSajuCompareTable() — 부부/동거 "한눈에 비교" 표(6행) 검증.
 * friend 표와 동일 컨벤션(순수 함수, node:assert/strict, npx tsx로 실행).
 *
 * 이 표는 friend 표와 달리 6행 모두 이미 계산돼 있던 person-level 신호를
 * 그대로 재사용해서 설계 단계에서부터 신호 재사용 문제를 피했다. 그래서
 * 가장 중요한 검증 포인트는 "독립성"보다 "콤보 조회 테이블 완전성"이다 —
 * 3-way 밴드(신강/신약/중화, low/medium/high 등)를 sorted-key로 조회하는
 * 방식이라 조합 하나라도 키가 빠지면 `!` non-null assertion이 런타임에서
 * 터진다. 그래서 가능한 모든 조합을 전수 테스트한다.
 *
 * Run: npx tsx tests/unit/marriage-compare-table.test.mjs
 */
import assert from "node:assert/strict";
import { buildMarriageSajuCompareTable } from "../../lib/relationship/marriage/marriageSajuCompareTable.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function findRow(rows, id) {
  const r = rows.find((row) => row.id === id);
  assert.ok(r, `row ${id} must exist`);
  return r;
}

const baseParams = {
  nicknameA: "지수",
  nicknameB: "현우",
  needsStrongBoundaryA: false,
  needsStrongBoundaryB: true,
  parentingStyleA: "empathy",
  parentingStyleB: "structure",
};

// ---------------------------------------------------------------------------
section("1) 기본 스모크 — 6행이 올바른 순서/구조로 나온다");

const rows = buildMarriageSajuCompareTable({
  ...baseParams,
  tenGodsA: { "비견": 2, "편관": 1, "편인": 1 },
  tenGodsB: { "편인": 1, "상관": 1, "비견": 1, "편관": 1 },
  economicDominanceBandA: "high",
  economicDominanceBandB: "low",
  locale: "ko-KR",
});

assert.equal(rows.length, 6);
assert.deepEqual(
  rows.map((r) => r.id),
  [
    "household_stress",
    "marital_conflict",
    "bedroom_lead",
    "family_boundary",
    "asset_management",
    "parenting_style",
  ],
);
for (const r of rows) {
  assert.ok(r.personA.shortLabel, `${r.id}: personA.shortLabel must be non-empty`);
  assert.ok(r.personB.shortLabel, `${r.id}: personB.shortLabel must be non-empty`);
  assert.ok(r.meaning, `${r.id}: meaning must be non-empty`);
  assert.equal(r.personA.nickname, "지수");
  assert.equal(r.personB.nickname, "현우");
}
ok("6행 모두 id·닉네임·라벨·의미 문구가 정상 채워진다");

// ---------------------------------------------------------------------------
section("2) 콤보 조회 테이블 전수 테스트 — 모든 밴드 조합에서 크래시 없음");

const CONFLICT_BANDS = ["explosive", "stonewall", "balanced"];
const ECONOMIC_BANDS = ["low", "medium", "high"];
const PARENTING_STYLES = ["empathy", "structure"];
const BOOLEANS = [true, false];

// 부부싸움 소통(행2) 콤보 — communicationArchetype이 특정 밴드를 내도록
// tenGods 조합을 손으로 구성하기보다, economicDominanceBand/needsStrongBoundary/
// parentingStyle처럼 직접 주입 가능한 파라미터들의 전체 조합만 전수 테스트하고,
// tenGods 기반 밴드(household_stress, marital_conflict, bedroom_lead)는
// 대표적인 tenGods 세트 여러 개로 다양성을 확보해 간접 검증한다.
const TEN_GODS_SAMPLES = [
  {}, // 전부 0
  { "비견": 3 },
  { "겁재": 2, "편재": 2 },
  { "식신": 3, "정관": 1 },
  { "상관": 2, "편관": 2 },
  { "정인": 3 },
  { "편인": 2, "정재": 1 },
  { "정재": 2, "정관": 2 },
];

for (const tenGodsA of TEN_GODS_SAMPLES) {
  for (const tenGodsB of TEN_GODS_SAMPLES) {
    for (const needsStrongBoundaryA of BOOLEANS) {
      for (const needsStrongBoundaryB of BOOLEANS) {
        for (const economicDominanceBandA of ECONOMIC_BANDS) {
          for (const economicDominanceBandB of ECONOMIC_BANDS) {
            for (const parentingStyleA of PARENTING_STYLES) {
              for (const parentingStyleB of PARENTING_STYLES) {
                for (const locale of ["ko-KR", "en-US"]) {
                  assert.doesNotThrow(() => {
                    buildMarriageSajuCompareTable({
                      nicknameA: "A",
                      nicknameB: "B",
                      tenGodsA,
                      tenGodsB,
                      needsStrongBoundaryA,
                      needsStrongBoundaryB,
                      economicDominanceBandA,
                      economicDominanceBandB,
                      parentingStyleA,
                      parentingStyleB,
                      locale,
                    });
                  }, `crashed for tenGodsA=${JSON.stringify(tenGodsA)} tenGodsB=${JSON.stringify(tenGodsB)} boundary=${needsStrongBoundaryA}/${needsStrongBoundaryB} econ=${economicDominanceBandA}/${economicDominanceBandB} parenting=${parentingStyleA}/${parentingStyleB} locale=${locale}`);
                }
              }
            }
          }
        }
      }
    }
  }
}
ok("household_stress/marital_conflict/bedroom_lead의 모든 tenGods 샘플 조합 + family_boundary/asset_management/parenting_style의 전체 밴드 조합에서 크래시 없음 (양쪽 로케일)");

// communicationArchetype 밴드(explosive/stonewall/balanced) 조합도 명시적으로
// 직접 트리거해 전수 확인 — food 위주(식상 강함) vs seal+officer 위주(인성+관성 강함)
// vs 둘 다 낮음(balanced)의 조합을 tenGods로 직접 구성.
const CONFLICT_TRIGGER_TEN_GODS = {
  explosive: { "식신": 3, "상관": 2 }, // food 압도적
  stonewall: { "정인": 2, "편인": 2, "정관": 2, "편관": 2 }, // seal+officer 압도적
  balanced: {}, // 둘 다 0
};
for (const bandA of CONFLICT_BANDS) {
  for (const bandB of CONFLICT_BANDS) {
    assert.doesNotThrow(() => {
      const r = buildMarriageSajuCompareTable({
        ...baseParams,
        tenGodsA: CONFLICT_TRIGGER_TEN_GODS[bandA],
        tenGodsB: CONFLICT_TRIGGER_TEN_GODS[bandB],
        locale: "ko-KR",
      });
      findRow(r, "marital_conflict");
    }, `marital_conflict combo ${bandA}/${bandB} crashed`);
  }
}
ok("marital_conflict의 explosive/stonewall/balanced 3×3 조합 모두 정상 출력된다");

// ---------------------------------------------------------------------------
section("3) 동일 입력은 항상 동일 결과 (결정론성)");

const input = {
  ...baseParams,
  tenGodsA: { "비견": 2, "편관": 1, "편인": 1 },
  tenGodsB: { "편인": 1, "상관": 1, "비견": 1, "편관": 1 },
  economicDominanceBandA: "high",
  economicDominanceBandB: "low",
  locale: "ko-KR",
};
const runOnce = buildMarriageSajuCompareTable(input);
const runTwice = buildMarriageSajuCompareTable(input);
assert.deepEqual(runOnce, runTwice, "동일 입력을 두 번 호출해도 결과가 완전히 같아야 함");

const runThird = buildMarriageSajuCompareTable({
  ...input,
  tenGodsA: { ...input.tenGodsA },
  tenGodsB: { ...input.tenGodsB },
});
assert.deepEqual(runOnce, runThird, "구조적으로 동일한 새 객체를 넣어도 결과가 같아야 함(랜덤성 없음)");
ok("동일 입력 → 항상 동일 결과, 숨은 랜덤성 없음");

// ---------------------------------------------------------------------------
section("4) SSOT economic band 우선, 없으면 로컬 폴백");

const withSsot = buildMarriageSajuCompareTable({
  ...baseParams,
  tenGodsA: {}, // wealthOfficer=0 -> 로컬 폴백이면 'low'
  tenGodsB: {},
  economicDominanceBandA: "high", // SSOT가 있으면 이걸 써야 함
  economicDominanceBandB: "high",
  locale: "ko-KR",
});
const withoutSsot = buildMarriageSajuCompareTable({
  ...baseParams,
  tenGodsA: {},
  tenGodsB: {},
  locale: "ko-KR",
});
const assetWithSsot = findRow(withSsot, "asset_management");
const assetWithoutSsot = findRow(withoutSsot, "asset_management");
assert.notEqual(
  assetWithSsot.personA.shortLabel,
  assetWithoutSsot.personA.shortLabel,
  "SSOT band가 있으면 로컬 폴백(wealthOfficer=0 -> low)과 다른 결과(high)가 나와야 함",
);
ok("SSOT economic_dominance_band가 있으면 우선 사용되고, 없으면 재관 합산 로컬 밴드로 폴백한다");

console.log("\nAll marriage-compare-table tests passed.");
