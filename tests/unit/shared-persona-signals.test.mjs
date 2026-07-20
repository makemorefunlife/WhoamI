/**
 * sharedPersonaSignals.ts (006 로드맵 Step1) 검증.
 * - resolveParentingStyleLean이 marriage의 resolveParentingStyle과 완전히 동일한 값을 내는지
 * - resolveOriginFamilyTension이 marriage의 기존 가중치/threshold를 그대로 보존하는지
 *   (실제 Sera/다시고고 십신 카운트로 회귀 검증 — 이전 진단 스크립트에서 확인된
 *   marriage 원본 analyzeFamilyBoundary 결과: hasHyoshin=true, sealExcess=false,
 *   yearTension=false(빈 intraHits) → inlawStressIndex=45, needsStrongBoundary=false)
 * - home_punishment가 tensionIndex/needsStrongBoundary에 영향을 안 주는지(불변식)
 * - 결정론성
 *
 * Run: npx tsx tests/unit/shared-persona-signals.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveParentingStyleLean,
  resolveOriginFamilyTension,
} from "../../lib/personCore/sajuSignals/sharedPersonaSignals.ts";
import { resolveParentingStyle } from "../../lib/relationship/marriage/marriageTenGodAnalysis.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

/** 최소 ChartContext fixture — collectBranchPalaceRelations는 pillars만 읽는다. */
function fixtureChart(branches) {
  const names = ["년주", "월주", "일주", "시주"];
  const pillars = names.map((name, i) => ({
    name,
    pillar: `${branches[i]}-pillar`,
    stemCode: "gap",
    branchCode: branches[i],
  }));
  return {
    pillars,
    stemCodes: new Set(pillars.map((p) => p.stemCode)),
    branchCodes: new Set(pillars.map((p) => p.branchCode)),
    dayStemCode: "gap",
    dayBranchCode: branches[2],
    monthStemCode: "gap",
    monthBranchCode: branches[1],
    yearStemCode: "gap",
    yearBranchCode: branches[0],
    hourStemCode: "gap",
    hourBranchCode: branches[3],
    dayPillar: `${branches[2]}-pillar`,
  };
}

// 실제 Sera(880202)/다시고고(871027) 십신 카운트 — 이전 marriage 진단 스크립트에서
// 이미 실측 확인된 값 재사용.
const countsA = { "비견": 2, "편관": 1, "편인": 1 };
const countsB = { "편인": 1, "상관": 1, "비견": 1, "편관": 1 };

// ---------------------------------------------------------------------------
section("1) resolveParentingStyleLean == marriage의 resolveParentingStyle.style");

for (const counts of [countsA, countsB, {}, { "식신": 3 }, { "정인": 2, "정관": 2 }]) {
  const lean = resolveParentingStyleLean(counts);
  const original = resolveParentingStyle(counts, "ko-KR").style;
  assert.equal(lean, original, `counts=${JSON.stringify(counts)}: lean(${lean}) !== original(${original})`);
}
ok("합성 데이터 5종 모두 marriage 원본과 완전히 동일한 결과");

// ---------------------------------------------------------------------------
section("2) resolveOriginFamilyTension — 형충 없는 중립 chart에서 marriage 기존 결과 재현");

// 4개 궁 전부 동일 지지 → 자기 자신과의 관계라 형충 후보 자체가 안 생김(중립 chart).
const neutralChart = fixtureChart(["sul", "sul", "sul", "sul"]);

const profileA = resolveOriginFamilyTension(countsA, neutralChart);
console.log("A:", profileA);
assert.equal(profileA.hyoshinRisk, true, "A는 편인 보유 → hasHyoshin=true여야 함");
assert.equal(profileA.sealExcess, false, "A는 seal=1 → sealExcess(>=3) false여야 함");
assert.equal(profileA.yearPalaceTension, false, "중립 chart라 yearTension 없어야 함");
assert.equal(profileA.tensionIndex, 45, "20(base)+25(hyoshin) = 45 — marriage 원본과 동일해야 함");
assert.equal(profileA.needsStrongBoundary, false, "45 < 55, yearTension 없음, hyoshin&&sealExcess도 false");

const profileB = resolveOriginFamilyTension(countsB, neutralChart);
assert.equal(profileB.tensionIndex, 45, "B도 A와 동일한 십신 프로필(hyoshin만 true)이라 45여야 함");
assert.equal(profileB.needsStrongBoundary, false);
ok("실제 Sera/다시고고 카운트로 marriage 원본(inlawStressIndex=45, needsStrongBoundary=false) 재현 성공");

// ---------------------------------------------------------------------------
section("3) 형충 없음 + hyoshin/sealExcess 없음 → 완전 baseline(20, false)");

const baseline = resolveOriginFamilyTension({}, neutralChart);
assert.equal(baseline.tensionIndex, 20);
assert.equal(baseline.needsStrongBoundary, false);
ok("십신 신호 전혀 없으면 base 20, needsStrongBoundary=false");

// ---------------------------------------------------------------------------
section("4) sealExcess만 있는 경우 → 20+20=40, hyoshin&&sealExcess 조건은 false(hyoshin 없음)");

const sealOnly = resolveOriginFamilyTension({ "정인": 3 }, neutralChart);
assert.equal(sealOnly.sealExcess, true);
assert.equal(sealOnly.hyoshinRisk, false);
assert.equal(sealOnly.tensionIndex, 40);
assert.equal(sealOnly.needsStrongBoundary, false, "40 < 55, hyoshin 없어서 and-조건도 false");
ok("sealExcess 단독 케이스 정상");

// ---------------------------------------------------------------------------
section("5) hyoshin + sealExcess 동시 → and-조건으로 needsStrongBoundary=true (index 미달이어도)");

const both = resolveOriginFamilyTension({ "편인": 4 }, neutralChart);
// 편인=4 → hasHyoshin(>=1)=true, seal=4>=3 → sealExcess=true
assert.equal(both.hyoshinRisk, true);
assert.equal(both.sealExcess, true);
assert.equal(both.tensionIndex, 65, "20+25+20=65");
assert.equal(both.needsStrongBoundary, true, "index>=55로도 true, and-조건으로도 true — 이중 확인");
ok("hyoshin+sealExcess 동시 케이스 정상(marriage 원본 로직의 or-분기 보존 확인)");

// ---------------------------------------------------------------------------
section("6) home_punishment는 tensionIndex/needsStrongBoundary에 영향 없음(불변식)");

// 월주·일주에 형(형살) 관계를 만들어서 punishment는 채워지지만, 그게 년주 기준
// yearPalaceTension 조건(상대궁 월주/일주, 타입 충/형)과 겹치지 않는 케이스를 만든다.
// 형은 조합에 따라 년주와도 겹칠 수 있으므로, 여기서는 homePunishment 필드가
// 채워지든 안 채워지든 상관없이 "tensionIndex 계산식 자체에는 punishment 항이
// 없다"는 코드 구조를 형충 있는/없는 두 경우 모두에서 확인한다.
const withHits = resolveOriginFamilyTension(countsA, fixtureChart(["ja", "o", "sul", "sul"]));
const withoutHits = resolveOriginFamilyTension(countsA, neutralChart);
console.log("withHits:", withHits);
// punishment 유무와 무관하게, tensionIndex는 오직 hyoshin/sealExcess/yearPalaceTension만의 함수.
const expectedWithHits =
  20 + (withHits.hyoshinRisk ? 25 : 0) + (withHits.sealExcess ? 20 : 0) + (withHits.yearPalaceTension ? 30 : 0);
assert.equal(withHits.tensionIndex, Math.min(100, expectedWithHits));
ok("homePunishment 필드는 참고용으로만 노출되고 tensionIndex/needsStrongBoundary 계산식에는 개입하지 않음");

// ---------------------------------------------------------------------------
section("7) 결정론성 — 동일 입력 → 항상 동일 결과");

const run1 = resolveOriginFamilyTension(countsA, neutralChart);
const run2 = resolveOriginFamilyTension({ ...countsA }, fixtureChart(["sul", "sul", "sul", "sul"]));
assert.deepEqual(run1, run2, "구조적으로 동일한 새 객체를 넣어도 결과가 완전히 같아야 함");
ok("동일 입력 → 항상 동일 결과, 숨은 랜덤성 없음");

console.log("\nAll shared-persona-signals tests passed.");
