/**
 * Phase 5-3 리팩터링 — compare*Composite 6행이 공유하는 generic resolver 단위 테스트.
 * Run: npx tsx tests/unit/romantic-compare-composite-shared.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveCompareCompositeLean,
  resolveCompareCompositePairAlignment,
} from "../../lib/relationship/romantic/compareCompositeShared.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

// ---------------------------------------------------------------------------
section("1) psych mid → base 유지 + caution/low (base·opposite·locked 무관)");

for (const locked of [true, false]) {
  const r = resolveCompareCompositeLean({
    base: "high",
    psychLean: "mid",
    oppositeOfBase: "low",
    locked,
  });
  assert.deepEqual(r, {
    lean: "high",
    flipped: false,
    align: "caution",
    confidence: "low",
  });
}
ok("mid always base/caution/low");

// ---------------------------------------------------------------------------
section("2) psych === base → confirms/high, flipped=false");

const confirms = resolveCompareCompositeLean({
  base: "high",
  psychLean: "high",
  oppositeOfBase: "low",
  locked: true, // locked 여부와 무관해야 함
});
assert.deepEqual(confirms, {
  lean: "high",
  flipped: false,
  align: "confirms",
  confidence: "high",
});
ok("psych agrees with base");

// ---------------------------------------------------------------------------
section("3) base가 중립(opposite=null) + 뚜렷한 psych → soft fill");

const fill = resolveCompareCompositeLean({
  base: "balanced",
  psychLean: "high",
  oppositeOfBase: null,
  locked: false,
});
assert.deepEqual(fill, {
  lean: "high",
  flipped: true,
  align: "caution",
  confidence: "high",
});
ok("neutral base soft fill (lean 쪽 무관 — low도 동일)");

const fillOtherSide = resolveCompareCompositeLean({
  base: "balanced",
  psychLean: "low",
  oppositeOfBase: null,
  locked: false,
});
assert.deepEqual(fillOtherSide, {
  lean: "low",
  flipped: true,
  align: "caution",
  confidence: "high",
});
ok("neutral base soft fill — 반대쪽도 동일 규칙");

// ---------------------------------------------------------------------------
section("4) base가 극단 + psych가 반대 + locked → flip 금지, base 유지");

const locked = resolveCompareCompositeLean({
  base: "high",
  psychLean: "low",
  oppositeOfBase: "low",
  locked: true,
});
assert.deepEqual(locked, {
  lean: "high",
  flipped: false,
  align: "caution",
  confidence: "low",
});
ok("locked opposite → base kept");

// ---------------------------------------------------------------------------
section("5) base가 극단 + psych가 반대 + unlocked → soft flip");

const softFlip = resolveCompareCompositeLean({
  base: "high",
  psychLean: "low",
  oppositeOfBase: "low",
  locked: false,
});
assert.deepEqual(softFlip, {
  lean: "low",
  flipped: true,
  align: "caution",
  confidence: "high",
});
ok("unlocked opposite → soft flip");

// ---------------------------------------------------------------------------
section("6) psych가 base·opposite 어느쪽도 아님 → 예외 경로, base 유지");

const fallback = resolveCompareCompositeLean({
  base: "high",
  psychLean: "other",
  oppositeOfBase: "low",
  locked: false,
});
assert.deepEqual(fallback, {
  lean: "high",
  flipped: false,
  align: "caution",
  confidence: "low",
});
ok("unmatched psych lean falls back to base");

// ---------------------------------------------------------------------------
section("7) pair alignment — 둘 다 confirms/high일 때만 confirms/high");

assert.deepEqual(
  resolveCompareCompositePairAlignment(
    { align: "confirms", confidence: "high" },
    { align: "confirms", confidence: "high" },
  ),
  { align: "confirms", confidence: "high" },
);
ok("both confirms/high");

assert.deepEqual(
  resolveCompareCompositePairAlignment(
    { align: "confirms", confidence: "high" },
    { align: "caution", confidence: "high" },
  ),
  { align: "caution", confidence: "high" },
);
ok("one caution → pair caution, confidence unaffected by align");

assert.deepEqual(
  resolveCompareCompositePairAlignment(
    { align: "confirms", confidence: "high" },
    { align: "confirms", confidence: "low" },
  ),
  { align: "confirms", confidence: "low" },
);
ok("one low confidence → pair low, align unaffected by confidence");

assert.deepEqual(
  resolveCompareCompositePairAlignment(
    { align: "caution", confidence: "low" },
    { align: "caution", confidence: "low" },
  ),
  { align: "caution", confidence: "low" },
);
ok("both caution/low");

console.log("\nAll romantic-compare-composite-shared tests passed.");
