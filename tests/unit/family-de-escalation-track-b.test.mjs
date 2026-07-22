/**
 * Part4 "갈등 행동 처방전" — 연락 대기시간(Track A/B 공통) + 자녀→부모
 * 거절/독립 스크립트(Track B 전용, boundary_script) 회귀 테스트. 새 십성
 * 분류 없음 — 기존 5카테고리(correction_style bucket)를 그대로 재사용.
 * Run: npx tsx tests/unit/family-de-escalation-track-b.test.mjs
 */
import assert from "node:assert/strict";
import { buildChildDeEscalationCard } from "../../lib/relationship/familyParent/childDeEscalationPrescriptions.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const sealCounts = { 정인: 2, 편인: 1 }; // seal 우세 → "seal" 카테고리

// ---------------------------------------------------------------------------
section("1) 기존 필드(solution_script 등) 회귀 없음 — 4번째 인자 생략 시 기존 동작 그대로");

const legacy = buildChildDeEscalationCard({
  childNickname: "동글",
  parentNickname: "세라",
  parentRole: "mother",
  childCounts: sealCounts,
  locale: "ko-KR",
});
assert.equal(legacy.category, "seal");
assert.ok(legacy.solution_script.includes("동글"));
assert.equal(legacy.boundary_script, null);
assert.ok(legacy.contact_wait_note.length > 0);
ok("childIsViewer 생략 시 boundary_script는 null, 기존 5필드는 그대로 채워짐");

// ---------------------------------------------------------------------------
section("2) contact_wait_note — 3시간 고정 규칙이 트랙 불문 항상 포함됨");

const trackA = buildChildDeEscalationCard({
  childNickname: "동글",
  parentNickname: "세라",
  parentRole: "mother",
  childCounts: sealCounts,
  parentCounts: { 비견: 1 },
  childIsViewer: false,
  locale: "ko-KR",
});
const trackB = buildChildDeEscalationCard({
  childNickname: "동글",
  parentNickname: "세라",
  parentRole: "mother",
  childCounts: sealCounts,
  parentCounts: { 비견: 1 },
  childIsViewer: true,
  locale: "ko-KR",
});
assert.ok(trackA.contact_wait_note.includes("3시간"));
assert.ok(trackB.contact_wait_note.includes("3시간"));
assert.notEqual(trackA.contact_wait_note, trackB.contact_wait_note);
ok("Track A/B 둘 다 '3시간' 고정값 포함, 서술 톤은 다름(부모向 vs 자녀向)");

// ---------------------------------------------------------------------------
section("3) contact_wait_note — 비겁 카운트 비교로 개인화(판정 조건은 유지)");

const childStubborn = buildChildDeEscalationCard({
  childNickname: "동글",
  parentNickname: "세라",
  parentRole: "mother",
  childCounts: { ...sealCounts, 비견: 3 },
  parentCounts: { 비견: 0 },
  childIsViewer: false,
  locale: "ko-KR",
}).contact_wait_note;
const childNotStubborn = buildChildDeEscalationCard({
  childNickname: "동글",
  parentNickname: "세라",
  parentRole: "mother",
  childCounts: sealCounts,
  parentCounts: { 비견: 3, 겁재: 2 },
  childIsViewer: false,
  locale: "ko-KR",
}).contact_wait_note;
assert.notEqual(childStubborn, childNotStubborn);
ok("자녀 비겁 카운트가 부모보다 높/낮음에 따라 다른 서술이 나옴");

// ---------------------------------------------------------------------------
section("4) boundary_script — Track B에서만 채워지고, 5카테고리 판정과 category가 일치");

for (const [counts, expectedCategory] of [
  [{ 비견: 3 }, "self"],
  [{ 식신: 3 }, "food"],
  [{ 정인: 3 }, "seal"],
  [{ 정관: 3 }, "officer"],
  [{ 정재: 3 }, "wealth"],
]) {
  const card = buildChildDeEscalationCard({
    childNickname: "동글",
    parentNickname: "세라",
    parentRole: "mother",
    childCounts: counts,
    childIsViewer: true,
    locale: "ko-KR",
  });
  assert.equal(card.category, expectedCategory);
  assert.ok(card.boundary_script);
  assert.ok(card.boundary_script.includes("세라"));
  ok(`category=${expectedCategory} → boundary_script가 채워지고 부모 닉네임을 포함`);
}

// ---------------------------------------------------------------------------
section("5) locale별로 다른 언어 문구가 나온다");

const ko = buildChildDeEscalationCard({
  childNickname: "동글", parentNickname: "세라", parentRole: "mother",
  childCounts: sealCounts, childIsViewer: true, locale: "ko-KR",
}).boundary_script;
const en = buildChildDeEscalationCard({
  childNickname: "동글", parentNickname: "세라", parentRole: "mother",
  childCounts: sealCounts, childIsViewer: true, locale: "en-US",
}).boundary_script;
assert.notEqual(ko, en);
ok("ko-KR/en-US가 서로 다른 boundary_script를 냄");

console.log("\nOK: family de-escalation Track B tests passed");
