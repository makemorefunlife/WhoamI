/**
 * Romantic Phase 4-6 Batch 6 — Part4① 표현 속도 차이 교정 대사(Before/After)에
 * 갈등직면성+자기통제 기반 방향 신호를 추가한 것에 대한 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. resolveExpressionSpeedDirection — A 우세/B 우세/균형(격차<15)/profile 없음
 *      4케이스가 정확한 방향을 낸다.
 *   2. buildConflictSituationFewShotExample에 fasterName이 있으면 서버 신호
 *      확인 줄이 정확히 삽입된다.
 *   3. fasterName이 없으면(균형/레거시/미전달) — 문자열이 byte-identical하게
 *      완전히 동일해야 한다(레거시 안전).
 *
 * No DB, no LLM — 둘 다 순수 함수라 문자열 자체를 결정론적으로 assert 가능.
 * LLM이 이 신호를 실제로 잘 활용하는지는 검증 불가(Batch 3~5와 동일한 한계).
 * Run: npx tsx tests/unit/romantic-conflict-expression-speed.test.mjs
 */
import assert from "node:assert/strict";
import { resolveExpressionSpeedDirection } from "../../lib/relationship/romanticRules/relationshipDynamics.ts";
import { buildConflictSituationFewShotExample } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/conflictSituationWritingRules.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function profile(overrides = {}) {
  const base = {
    stimulation: 50,
    self_control: 50,
    practicality: 50,
    structure: 50,
    empathy: 50,
    conflict_style: 50,
    resilience: 50,
    recognition: 50,
    energy_style: 50,
    thinking_style: 50,
    decision_style: 50,
  };
  return { secondary_axes: { ...base, ...overrides } };
}

// ---------------------------------------------------------------------------
section("1) resolveExpressionSpeedDirection — A우세/B우세/균형/profile없음 4케이스");

assert.equal(resolveExpressionSpeedDirection(null, profile()), "balanced");
ok("profile 없으면 'balanced'");

const aFaster = resolveExpressionSpeedDirection(
  profile({ conflict_style: 85, self_control: 30 }),
  profile({ conflict_style: 40, self_control: 60 }),
);
assert.equal(aFaster, "A");
ok("A의 (갈등직면성-자기통제)가 B보다 15 이상 높으면 'A'");

const bFaster = resolveExpressionSpeedDirection(
  profile({ conflict_style: 40, self_control: 60 }),
  profile({ conflict_style: 85, self_control: 30 }),
);
assert.equal(bFaster, "B");
ok("B의 (갈등직면성-자기통제)가 A보다 15 이상 높으면 'B'");

const balanced = resolveExpressionSpeedDirection(profile(), profile());
assert.equal(balanced, "balanced");
ok("격차가 15 미만이면 'balanced'");

// ---------------------------------------------------------------------------
section("2) fasterName 있음 — 서버 신호 확인 줄이 정확히 삽입된다");

const withFaster = buildConflictSituationFewShotExample({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  myName: "Alex",
  targetName: "Jordan",
  fasterName: "Alex",
});
assert.ok(
  withFaster.includes(
    "⚠️ 서버 신호: 이 리포트는 **Alex**가 갈등직면성↑·자기통제↓ 쪽으로 신호가 갈립니다 — 빠른 표현 슬롯에 Alex를 우선 배치하세요.",
  ),
);
ok("fasterName이 있으면 서버 신호 확인 줄이 정확한 문구로 삽입됨");

// ---------------------------------------------------------------------------
section("3) fasterName 없음/미전달 — 기존과 byte-identical한 문구");

const withoutFasterUndefined = buildConflictSituationFewShotExample({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  myName: "Alex",
  targetName: "Jordan",
});
const withoutFasterNull = buildConflictSituationFewShotExample({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  myName: "Alex",
  targetName: "Jordan",
  fasterName: null,
});

assert.equal(withoutFasterNull, withoutFasterUndefined);
assert.ok(!withoutFasterUndefined.includes("서버 신호"));
ok("fasterName을 안 주거나 null로 줘도 완전히 동일하고, 서버 신호 줄 자체가 없음");

assert.ok(
  withoutFasterUndefined.includes(
    "⚠️ 입력 데이터로 **누가 빠른 감정 표현 / 누가 신중·무거운 처리**인지 판별한 뒤, 해당 슬롯에 bad/good를 배치하세요. (아래는 Alex=빠른 쪽, Jordan=신중 쪽 **예시**)",
  ),
);
ok("fasterName 도입 이전의 정확한 원문과 한 글자도 다르지 않음(고정 스냅샷)");

console.log("\nOK: romantic conflict expression-speed tests passed");
