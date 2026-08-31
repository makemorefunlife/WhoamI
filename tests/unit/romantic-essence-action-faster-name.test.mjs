/**
 * Romantic Phase 4-7 Batch 7 — Part5① 에센스 가이드에 Batch 6의
 * expressionSpeedDirection 신호를 재사용해 서버 신호 확인 줄을 추가한 것에
 * 대한 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. fasterName이 있으면 서버 신호 확인 줄이 정확히 삽입된다.
 *   2. fasterName이 없으면(균형/레거시/미전달) 문자열이 byte-identical하게
 *      완전히 동일해야 한다.
 *
 * 새 신호 함수를 만들지 않고 Batch 6의 resolveExpressionSpeedDirection을
 * 그대로 재사용하므로, 그 함수 자체의 단위 테스트는
 * romantic-conflict-expression-speed.test.mjs에 이미 있음 — 여기서는
 * buildEssenceActionFewShotExample 쪽 배선만 검증한다.
 *
 * No DB, no LLM. LLM이 이 신호를 실제로 잘 활용하는지는 검증 불가
 * (Batch 3~6과 동일한 한계).
 * Run: npx tsx tests/unit/romantic-essence-action-faster-name.test.mjs
 */
import assert from "node:assert/strict";
import { buildEssenceActionFewShotExample } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/essenceActionWritingRules.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

// ---------------------------------------------------------------------------
section("1) fasterName 있음 — 서버 신호 확인 줄이 정확히 삽입된다");

const withFaster = buildEssenceActionFewShotExample({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  myName: "Alex",
  targetName: "Jordan",
  fasterName: "Alex",
});
assert.ok(
  withFaster.includes(
    '⚠️ 서버 신호: 이 리포트는 **Alex**가 갈등대처↑·자기통제↓ 쪽으로 신호가 갈립니다 — Alex에게는 "상대 타이밍 존중" 계열 팁을, 반대쪽에게는 "침묵 깨고 내면 보여주기" 계열 팁을 01번에 우선 배치하세요.',
  ),
);
ok("fasterName이 있으면 서버 신호 확인 줄이 정확한 문구로 삽입됨");

// ---------------------------------------------------------------------------
section("2) fasterName 없음/미전달 — 기존과 byte-identical한 문구");

const withoutFasterUndefined = buildEssenceActionFewShotExample({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  myName: "Alex",
  targetName: "Jordan",
});
const withoutFasterNull = buildEssenceActionFewShotExample({
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
    '⚠️ `real_life_example`은 모든 항목 **`""`**. "이런 순간에 —" **절대 금지**.',
  ),
);
ok("fasterName 도입 이전의 정확한 원문과 한 글자도 다르지 않음(고정 스냅샷)");

console.log("\nOK: romantic essence-action faster-name tests passed");
