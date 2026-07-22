/**
 * Marriage Batch 8(마지막) — Part5① 냉전 골든타임 & 화해 치트키 회귀 테스트.
 * 이 배치로 부부(Marriage/Cohabitation) 도메인 14/14 완료.
 *
 * 핵심 불변식:
 *   1. golden_time_note는 비겁(비견+겁재) 세기가 더 강한 쪽을 정확히 지목하고,
 *      동률이면 특정인을 지목하지 않는 공통 문구를 낸다.
 *   2. reconciliation_cue는 topCategory(기존 5카테고리 프레임)를 그대로 재사용해
 *      카테고리별로 서로 다른 문구를 낸다 — 새 판정 로직 없음.
 *   3. 십성 용어(비견/겁재/식상 등)가 최종 문구에 노출되지 않는다.
 *
 * No DB, no LLM — 순수 함수라 결정론적으로 assert 가능.
 * Run: npx tsx tests/unit/marriage-cold-war-protocol.test.mjs
 */
import assert from "node:assert/strict";
import { resolveColdWarProtocol } from "../../lib/relationship/marriage/homeDeEscalationPrescriptions.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function counts(overrides = {}) {
  return { 비견: 0, 겁재: 0, 상관: 0, 식신: 0, 정인: 0, 편인: 0, 정관: 0, 편관: 0, 정재: 0, 편재: 0, ...overrides };
}

// ---------------------------------------------------------------------------
section("1) golden_time_note — 비겁 세기가 강한 쪽을 정확히 지목");

const aStronger = resolveColdWarProtocol({
  nicknameA: "Sera",
  nicknameB: "동글",
  countsA: counts({ 비견: 3, 겁재: 1 }),
  countsB: counts({ 비견: 0, 겁재: 0 }),
});
assert.ok(aStronger.golden_time_note.includes("Sera"));
assert.ok(!aStronger.golden_time_note.includes("동글"));
ok("A의 비겁이 강하면 A만 지목(B는 언급 안 됨)");

const bStronger = resolveColdWarProtocol({
  nicknameA: "Sera",
  nicknameB: "동글",
  countsA: counts(),
  countsB: counts({ 비견: 2, 겁재: 2 }),
});
assert.ok(bStronger.golden_time_note.includes("동글"));
ok("B의 비겁이 강하면 B를 지목");

const tied = resolveColdWarProtocol({
  nicknameA: "Sera",
  nicknameB: "동글",
  countsA: counts({ 비견: 1 }),
  countsB: counts({ 겁재: 1 }),
});
assert.ok(tied.golden_time_note.includes("Sera") && tied.golden_time_note.includes("동글"));
ok("동률이면 둘 다 언급하는 공통 문구");

for (const note of [aStronger.golden_time_note, bStronger.golden_time_note, tied.golden_time_note]) {
  assert.ok(note.includes("24") && (note.includes("2") || note.includes("이틀") || note.includes("day")));
}
ok("세 케이스 모두 24시간/2일 룰 문구를 포함");

// ---------------------------------------------------------------------------
section("2) reconciliation_cue — 카테고리별로 서로 다른 문구(topCategory 재사용)");

const selfCue = resolveColdWarProtocol({
  nicknameA: "Sera", nicknameB: "동글",
  countsA: counts({ 비견: 3 }), countsB: counts(),
}).reconciliation_cue_a;
const foodCue = resolveColdWarProtocol({
  nicknameA: "Sera", nicknameB: "동글",
  countsA: counts({ 상관: 3 }), countsB: counts(),
}).reconciliation_cue_a;
const sealCue = resolveColdWarProtocol({
  nicknameA: "Sera", nicknameB: "동글",
  countsA: counts({ 정인: 3 }), countsB: counts(),
}).reconciliation_cue_a;
const officerCue = resolveColdWarProtocol({
  nicknameA: "Sera", nicknameB: "동글",
  countsA: counts({ 정관: 3 }), countsB: counts(),
}).reconciliation_cue_a;
const wealthCue = resolveColdWarProtocol({
  nicknameA: "Sera", nicknameB: "동글",
  countsA: counts({ 정재: 3 }), countsB: counts(),
}).reconciliation_cue_a;

const cues = [selfCue, foodCue, sealCue, officerCue, wealthCue];
assert.equal(new Set(cues).size, 5);
ok("5개 카테고리 모두 서로 다른 화해 치트키 문구를 냄");

for (const cue of cues) {
  assert.ok(cue.includes("Sera"));
}
ok("각 문구에 대상 닉네임이 정확히 포함됨");

// ---------------------------------------------------------------------------
section("3) 십성 용어가 최종 문구에 노출되지 않는다");

const allText = [...cues, aStronger.golden_time_note, bStronger.golden_time_note, tied.golden_time_note].join(" ");
assert.ok(!/비견|겁재|식상|상관|식신|정인|편인|정관|편관|정재|편재/.test(allText));
ok("십성 용어가 golden_time_note/reconciliation_cue 어디에도 노출되지 않음");

console.log("\nOK: marriage cold war protocol tests passed");
