/**
 * Marriage Batch 3 — Part2③ 자산 관리 주도권(CFO) & 소비 스위치 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. resolveSpendingStyleNote는 순수 사주 함수(psych 불필요) — 정재/편재
 *      우세로 3분류(stability/experience/balanced) 후 조합별로 다른 문구를 낸다.
 *   2. resolveCfoAxisNote는 pickHouseholdCfo의 기존 판정을 절대 안 바꾸고,
 *      practicality/self_control 평균 격차로만 확인/유보 문구를 얹는다 — psychMatch가
 *      없으면(설문 미완료) null, 격차가 작으면 null(억지로 안 붙임).
 *
 * No DB, no LLM — 순수 함수라 결정론적으로 assert 가능.
 * Run: npx tsx tests/unit/marriage-cfo-consumption.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveSpendingStyleNote,
  resolveCfoAxisNote,
} from "../../lib/relationship/marriage/marriageCfoConsumption.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function counts(overrides = {}) {
  return { 정재: 0, 편재: 0, ...overrides };
}

function psychMatch(rows) {
  return { axis_results: rows, conflict_triggers: [] };
}

function axisRow(axis_key, score_a, score_b) {
  return { axis_key, score_a, score_b, gap: Math.abs(score_a - score_b), match_type: "similarity" };
}

// ---------------------------------------------------------------------------
section("1) resolveSpendingStyleNote — 정재/편재 우세 3분류 조합");

const bothStable = resolveSpendingStyleNote(
  counts({ 정재: 3 }),
  counts({ 정재: 2 }),
  "Sera",
  "동글",
);
assert.ok(bothStable.includes("Sera") && bothStable.includes("동글"));
assert.ok(bothStable.includes("적금") || bothStable.includes("저축"));
ok("둘 다 정재 우세 → 저축/안정 문구, 두 닉네임 모두 포함");

const bothExperience = resolveSpendingStyleNote(
  counts({ 편재: 3 }),
  counts({ 편재: 2 }),
  "Sera",
  "동글",
);
assert.ok(bothExperience.includes("즐거움") || bothExperience.includes("경험"));
assert.notEqual(bothStable, bothExperience);
ok("둘 다 편재 우세 → 경험/삶의 질 문구, 안정 문구와 다름");

const bothBalanced = resolveSpendingStyleNote(counts(), counts(), "Sera", "동글");
assert.ok(bothBalanced.includes("균형"));
ok("둘 다 균형(0=0) → 균형 문구");

const mixedStableExperience = resolveSpendingStyleNote(
  counts({ 정재: 3 }),
  counts({ 편재: 3 }),
  "Sera",
  "동글",
);
assert.ok(mixedStableExperience.includes("Sera") && mixedStableExperience.includes("동글"));
assert.ok(mixedStableExperience.includes("미래") && mixedStableExperience.includes("오늘"));
ok("한쪽 정재/한쪽 편재 → 미래-오늘 통장 분리 조언");

const mixedStableBalanced = resolveSpendingStyleNote(
  counts({ 정재: 3 }),
  counts(),
  "Sera",
  "동글",
);
assert.notEqual(mixedStableBalanced, mixedStableExperience);
ok("한쪽 정재/한쪽 균형 → 편재 케이스와 다른 문구(대칭 오분류 없음)");

// ---------------------------------------------------------------------------
section("2) resolveCfoAxisNote — psychMatch 없음/격차 大/격차 小");

assert.equal(resolveCfoAxisNote(null, true), null);
ok("psychMatch 없음(설문 미완료) → null");

const strongCfoMatch = psychMatch([axisRow("practicality", 80, 40), axisRow("self_control", 75, 45)]);
const confirmForA = resolveCfoAxisNote(strongCfoMatch, true);
assert.ok(confirmForA && confirmForA.length > 0);
assert.ok(!/practicality|self_control/.test(confirmForA));
ok("CFO(A)의 현실실리+자기통제 평균이 파트너보다 뚜렷이 높음 → 확인 문구, 축 이름 원문 노출 없음");

const cautionForA = resolveCfoAxisNote(strongCfoMatch, false);
assert.notEqual(cautionForA, confirmForA);
assert.ok(cautionForA && cautionForA.length > 0);
ok("같은 데이터라도 CFO가 반대쪽(B)이면 유보 문구로 갈림(대칭 확인)");

const smallGapMatch = psychMatch([axisRow("practicality", 55, 50), axisRow("self_control", 52, 48)]);
assert.equal(resolveCfoAxisNote(smallGapMatch, true), null);
ok("격차가 작으면 null(억지로 문구 안 붙임)");

const missingAxisMatch = psychMatch([axisRow("empathy", 80, 40)]);
assert.equal(resolveCfoAxisNote(missingAxisMatch, true), null);
ok("practicality/self_control 행 자체가 없으면(레거시) null");

console.log("\nOK: marriage cfo/consumption tests passed");
