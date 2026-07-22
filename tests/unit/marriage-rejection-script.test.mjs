/**
 * Marriage Batch 5 — Part3② 상처 주지 않고 밤을 거절하는 기술 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. resolveRejectionScript는 순수 사주 함수(psych 불필요) — 관성/재성/식상/인성
 *      우세 카테고리별로 다른 문구를 낸다. 스펙의 관성/식상 예시 방향을 따른다.
 *   2. resolveRejectionAxisNote는 관계공감 평균 격차로만 확인/유보 문구를 얹는다 —
 *      psychMatch가 없으면(설문 미완료) null.
 *   3. 기존 attachment_style/sleep_fit/matrix 판정은 이번 변경으로 안 바뀐다.
 *
 * No DB, no LLM — 순수 함수라 결정론적으로 assert 가능.
 * Run: npx tsx tests/unit/marriage-rejection-script.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveRejectionScript,
  resolveRejectionAxisNote,
} from "../../lib/relationship/marriage/bedroomProfile.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function counts(overrides = {}) {
  return { 정관: 0, 편관: 0, 정재: 0, 편재: 0, 식신: 0, 상관: 0, 정인: 0, 편인: 0, ...overrides };
}

function psych(empathy) {
  return { secondary_axes: { empathy } };
}

// ---------------------------------------------------------------------------
section("1) resolveRejectionScript — 관성/재성/식상/인성/균형 5케이스");

const officerScript = resolveRejectionScript(counts({ 정관: 3 }));
assert.ok(officerScript.includes("약속") || officerScript.includes("주말"));
ok("관성 우세 → 재약속/원칙 존중 문구");

const wealthScript = resolveRejectionScript(counts({ 정재: 3 }));
assert.ok(wealthScript.includes("대안"));
assert.notEqual(wealthScript, officerScript);
ok("재성 우세 → 구체적 대안 제시 문구(관성과 다름)");

const foodScript = resolveRejectionScript(counts({ 식신: 3 }));
assert.ok(foodScript.includes("스킨십") || foodScript.includes("다정"));
assert.notEqual(foodScript, wealthScript);
ok("식상 우세 → 스킨십/다정한 말 선행 문구");

const sealScript = resolveRejectionScript(counts({ 정인: 3 }));
assert.ok(sealScript.includes("사랑") || sealScript.includes("신뢰") || sealScript.includes("흔들리지"));
assert.notEqual(sealScript, foodScript);
ok("인성 우세 → 신뢰·애정 재확인 문구");

const balancedScript = resolveRejectionScript(counts());
assert.ok(balancedScript.includes("담백"));
ok("균형(전부 0) → 담백한 솔직 화법 문구");

// 사주 용어(관성/재성/식상/인성 등)가 최종 문구에 노출되면 안 됨
for (const s of [officerScript, wealthScript, foodScript, sealScript, balancedScript]) {
  assert.ok(!/관성|재성|식상|인성|정관|편관|정재|편재|식신|상관|정인|편인/.test(s));
}
ok("사주 용어(십성 이름)가 최종 문구 어디에도 노출되지 않음");

// ---------------------------------------------------------------------------
section("2) resolveRejectionAxisNote — 관계공감 격차 高/低/중간, psych 없음");

assert.equal(resolveRejectionAxisNote(null, psych(50)), null);
assert.equal(resolveRejectionAxisNote(psych(50), undefined), null);
ok("psychA/B 중 하나라도 없으면 null");

const highNote = resolveRejectionAxisNote(psych(80), psych(70));
assert.ok(highNote && highNote.length > 0);
ok("관계공감 평균 高(≥60) → 확인 문구");

const lowNote = resolveRejectionAxisNote(psych(20), psych(30));
assert.ok(lowNote && lowNote.length > 0);
assert.notEqual(highNote, lowNote);
ok("관계공감 평균 低(≤40) → 유보 문구(확인 문구와 다름)");

assert.equal(resolveRejectionAxisNote(psych(50), psych(50)), null);
ok("중간대(40<평균<60) → null(억지로 문구 안 붙임)");

console.log("\nOK: marriage rejection script tests passed");
