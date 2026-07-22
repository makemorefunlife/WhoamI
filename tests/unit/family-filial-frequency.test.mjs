/**
 * Part3 Track B 전용 — 효도 주파수(부모 사주 기반 맞춤형 효도 유형) 회귀
 * 테스트. 새 십성 분류 없음 — resolveCorrectionStyleBucket(이미 존재하는
 * 5카테고리 우세 판정)을 3-way로 재해석만. 스펙이 Track B 전용으로 명시해서
 * Track A(childIsViewer=false)면 항상 null.
 * Run: npx tsx tests/unit/family-filial-frequency.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveFilialFrequencyType,
  buildFamilyFilialFrequencySection,
} from "../../lib/relationship/familyParent/familyFilialFrequency.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

// ---------------------------------------------------------------------------
section("1) resolveFilialFrequencyType — wealth=cash_gift, food/self=quality_time, seal/officer=emotional_recognition");

assert.equal(resolveFilialFrequencyType({ 정재: 3, 편재: 1 }), "cash_gift");
assert.equal(resolveFilialFrequencyType({ 식신: 3 }), "quality_time");
assert.equal(resolveFilialFrequencyType({ 비견: 3 }), "quality_time");
assert.equal(resolveFilialFrequencyType({ 정인: 3 }), "emotional_recognition");
assert.equal(resolveFilialFrequencyType({ 정관: 3 }), "emotional_recognition");
ok("5카테고리 dominant bucket이 3-way 효도 유형으로 정확히 매핑됨");

// ---------------------------------------------------------------------------
section("2) buildFamilyFilialFrequencySection — Track A(childIsViewer=false)면 항상 null");

const trackA = buildFamilyFilialFrequencySection({
  countsParent: { 정재: 3 },
  parentNickname: "세라",
  childIsViewer: false,
  locale: "ko-KR",
});
assert.equal(trackA, null);
ok("스펙이 Track B 전용으로 명시 — Track A는 psych 여부와 무관하게 항상 null");

// ---------------------------------------------------------------------------
section("3) buildFamilyFilialFrequencySection — Track B에서 부모 사주 기반으로 채워짐");

const trackB = buildFamilyFilialFrequencySection({
  countsParent: { 정재: 3, 편재: 1 },
  parentNickname: "세라",
  childIsViewer: true,
  locale: "ko-KR",
});
assert.ok(trackB);
assert.equal(trackB.frequency_type, "cash_gift");
assert.ok(trackB.frequency_label.includes("현금"));
assert.ok(trackB.frequency_note.includes("세라"));
ok("Track B에서 재성 우세 → 현금·선물형, 부모 닉네임 포함");

// ---------------------------------------------------------------------------
section("4) locale별로 다른 언어 문구가 나온다");

const koNote = buildFamilyFilialFrequencySection({
  countsParent: { 식신: 3 },
  parentNickname: "세라",
  childIsViewer: true,
  locale: "ko-KR",
}).frequency_note;
const enNote = buildFamilyFilialFrequencySection({
  countsParent: { 식신: 3 },
  parentNickname: "세라",
  childIsViewer: true,
  locale: "en-US",
}).frequency_note;
assert.notEqual(koNote, enNote);
ok("ko-KR/en-US가 서로 다른 frequency_note를 냄");

console.log("\nOK: family filial frequency tests passed");
