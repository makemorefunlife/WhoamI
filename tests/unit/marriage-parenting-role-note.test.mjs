/**
 * Marriage Batch 7 — Part4① 육아 롤플레이(Good Cop vs Bad Cop) + 11축 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. resolveParentingRoleNote는 resolveParentingStyle의 empathy/structure 판정
 *      자체는 안 건드리고, style에 맞는 Good Cop/Bad Cop 문구 + 11축 확인/유보를 낸다.
 *   2. structure → 자기통제 高/低/중간, empathy → 관계공감 高/低/중간.
 *   3. psych 없으면(설문 미완료) 항상 null.
 *
 * No DB, no LLM — 순수 함수라 결정론적으로 assert 가능.
 * Run: npx tsx tests/unit/marriage-parenting-role-note.test.mjs
 */
import assert from "node:assert/strict";
import { resolveParentingRoleNote } from "../../lib/relationship/marriage/marriageTenGodAnalysis.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function psych(axisScores) {
  return {
    secondary_axes: {
      stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
      conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
      thinking_style: 50, decision_style: 50,
      ...axisScores,
    },
  };
}

// ---------------------------------------------------------------------------
section("1) structure(규칙형) — 자기통제 高/低/중간, psych 없음");

assert.equal(resolveParentingRoleNote("structure", null), null);
ok("psych 없음 → null");

const structureHigh = resolveParentingRoleNote("structure", psych({ self_control: 75 }));
assert.ok(structureHigh && structureHigh.includes("Bad Cop"));
ok("자기통제 高(≥60) → Bad Cop 확인 문구");

const structureLow = resolveParentingRoleNote("structure", psych({ self_control: 25 }));
assert.ok(structureLow && structureLow.includes("Bad Cop"));
assert.notEqual(structureHigh, structureLow);
ok("자기통제 低(≤40) → Bad Cop 유보 문구(확인 문구와 다름)");

assert.equal(resolveParentingRoleNote("structure", psych({ self_control: 50 })), null);
ok("중간대(40<점수<60) → null");

// ---------------------------------------------------------------------------
section("2) empathy(공감형) — 관계공감 高/低/중간, psych 없음");

assert.equal(resolveParentingRoleNote("empathy", undefined), null);
ok("psych 없음 → null");

const empathyHigh = resolveParentingRoleNote("empathy", psych({ empathy: 80 }));
assert.ok(empathyHigh && empathyHigh.includes("Good Cop"));
ok("관계공감 高(≥60) → Good Cop 확인 문구");

const empathyLow = resolveParentingRoleNote("empathy", psych({ empathy: 20 }));
assert.ok(empathyLow && empathyLow.includes("Good Cop"));
assert.notEqual(empathyHigh, empathyLow);
ok("관계공감 低(≤40) → Good Cop 유보 문구(확인 문구와 다름)");

assert.equal(resolveParentingRoleNote("empathy", psych({ empathy: 55 })), null);
ok("중간대(40<점수<60) → null");

// ---------------------------------------------------------------------------
section("3) 롤 네이밍이 style에 정확히 대응되고 서로 섞이지 않는다");

assert.ok(!structureHigh.includes("Good Cop"));
assert.ok(!empathyHigh.includes("Bad Cop"));
ok("structure는 Bad Cop만, empathy는 Good Cop만 언급함(교차 없음)");

console.log("\nOK: marriage parenting role note tests passed");
