/**
 * Marriage Batch 4 — Part2② 배터리 스위치에 11축(외향에너지) 확인문구 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. resolveEnergyStyleAxisNote는 chartEnergyProfile의 밖순이/집돌이 판정
 *      자체는 절대 안 건드리고, psych energy_style 점수가 그 판정을 뒷받침하는지
 *      확인/유보 문구만 만든다.
 *   2. 하이브리드(밖순이·집돌이 둘 다이거나 둘 다 아님)는 대상 아님 — 항상 null.
 *   3. psych 없으면(설문 미완료) 항상 null.
 *
 * No DB, no LLM — 순수 함수라 결정론적으로 assert 가능.
 * Run: npx tsx tests/unit/marriage-energy-axis-note.test.mjs
 */
import assert from "node:assert/strict";
import { resolveEnergyStyleAxisNote } from "../../lib/relationship/marriage/homeLifeLanguage.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

// chartEnergyProfile(chart)는 chart.pillars의 오행/역마로 계산됨 — 밖순이형
// 조건(yeomaCount>=2 또는 hot)과 집돌이형 조건(cold)을 각각 만족하는 최소
// fixture를 구성한다. 역마 지지(인/신/사/해)를 3개 넣어 손쉽게 밖순이형을 만든다.
function outdoorsyPillars() {
  return { yearPillar: "갑인", monthPillar: "을사", dayPillar: "병신", hourPillar: "정해" };
}
// 수(水)+금(金) 중심으로 집돌이형(cold) 사주 구성 — 역마 없음.
function homebodyPillars() {
  return { yearPillar: "임자", monthPillar: "계축", dayPillar: "신유", hourPillar: "경자" };
}
// 밖순이도 집돌이도 아닌 중립 사주(하이브리드 취급 대상 확인용).
function hybridPillars() {
  return { yearPillar: "무진", monthPillar: "기미", dayPillar: "무술", hourPillar: "기미" };
}

function psych(energy_style) {
  return {
    secondary_axes: {
      stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
      conflict_style: 50, resilience: 50, recognition: 50, energy_style,
      thinking_style: 50, decision_style: 50,
    },
  };
}

// buildChartContext를 직접 사용해 fixture를 chart로 변환
import { buildChartContext } from "../../lib/saju/chartContext.ts";
import { chartEnergyProfile } from "../../lib/saju/marriageAnalysis.ts";

const outdoorsyChart = buildChartContext(outdoorsyPillars());
const homebodyChart = buildChartContext(homebodyPillars());
const hybridChart = buildChartContext(hybridPillars());

// ---------------------------------------------------------------------------
section("0) fixture 전제 확인 — 실제로 밖순이/집돌이/하이브리드로 분류되는지");

const outdoorsyProfile = chartEnergyProfile(outdoorsyChart);
const homebodyProfile = chartEnergyProfile(homebodyChart);
const hybridProfile = chartEnergyProfile(hybridChart);

assert.ok(outdoorsyProfile.isOutdoorsy && !outdoorsyProfile.isHomebody, "outdoorsyChart fixture는 밖순이형이어야 함");
assert.ok(homebodyProfile.isHomebody && !homebodyProfile.isOutdoorsy, "homebodyChart fixture는 집돌이형이어야 함");
assert.ok(
  hybridProfile.isHomebody === hybridProfile.isOutdoorsy,
  "hybridChart fixture는 밖순이/집돌이 여부가 같아야(둘 다 true거나 둘 다 false) 하이브리드로 취급됨",
);
ok("세 fixture가 의도한 카테고리로 정확히 분류됨");

// ---------------------------------------------------------------------------
section("1) 밖순이형 — 외향에너지 高/低로 확인/유보 갈림");

const outdoorsyHigh = resolveEnergyStyleAxisNote(outdoorsyChart, psych(75));
assert.ok(outdoorsyHigh && outdoorsyHigh.length > 0);
ok("밖순이형 + 외향에너지 高(≥60) → 확인 문구");

const outdoorsyLow = resolveEnergyStyleAxisNote(outdoorsyChart, psych(25));
assert.ok(outdoorsyLow && outdoorsyLow.length > 0);
assert.notEqual(outdoorsyHigh, outdoorsyLow);
ok("밖순이형 + 외향에너지 低(≤40) → 유보 문구(확인 문구와 다름)");

const outdoorsyMid = resolveEnergyStyleAxisNote(outdoorsyChart, psych(50));
assert.equal(outdoorsyMid, null);
ok("밖순이형 + 외향에너지 중간대 → null");

// ---------------------------------------------------------------------------
section("2) 집돌이형 — 외향에너지 低/高로 확인/유보 갈림(대칭)");

const homebodyHigh = resolveEnergyStyleAxisNote(homebodyChart, psych(25));
assert.ok(homebodyHigh && homebodyHigh.length > 0);
ok("집돌이형 + 외향에너지 低(≤40) → 확인 문구");

const homebodyLow = resolveEnergyStyleAxisNote(homebodyChart, psych(75));
assert.ok(homebodyLow && homebodyLow.length > 0);
assert.notEqual(homebodyHigh, homebodyLow);
ok("집돌이형 + 외향에너지 高(≥60) → 유보 문구(확인 문구와 다름)");

// ---------------------------------------------------------------------------
section("3) 하이브리드/psych 없음 — 항상 null");

assert.equal(resolveEnergyStyleAxisNote(hybridChart, psych(80)), null);
ok("하이브리드(챠트 판정 불명확) → 축 점수와 무관하게 항상 null");

assert.equal(resolveEnergyStyleAxisNote(outdoorsyChart, null), null);
assert.equal(resolveEnergyStyleAxisNote(outdoorsyChart, undefined), null);
ok("psych 없음(null/undefined) → null");

console.log("\nOK: marriage energy axis-note tests passed");
