/**
 * Part2 "기질 & 탤런트 분석" — 공부 타입 & 성공 그릇(Track A) / 부모님
 * 기질 이해 + 물려받은 자산(Track B) 회귀 테스트. 새 십성 분류 없음 —
 * resolveCorrectionStyleBucket(이미 존재)의 5카테고리 결과를 3-way로
 * 재해석만 한다.
 * Run: npx tsx tests/unit/family-talent-profile.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveStudyType,
  resolveWealthVessel,
  buildFamilyTalentSection,
} from "../../lib/relationship/familyParent/familyTalentProfile.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

// ---------------------------------------------------------------------------
section("1) resolveStudyType — food 우세=creative, seal 우세=understanding, 그 외=diligent");

assert.equal(resolveStudyType({ 식신: 3, 상관: 1 }), "creative");
assert.equal(resolveStudyType({ 정인: 2, 편인: 1 }), "understanding");
assert.equal(resolveStudyType({ 비견: 2, 정관: 1 }), "diligent");
ok("3-way 판정이 dominant ten-god group과 일치");

// ---------------------------------------------------------------------------
section("2) resolveWealthVessel — wealth 우세=practical_finance, officer 우세=career_honor, 그 외=developing");

assert.equal(resolveWealthVessel({ 정재: 3, 편재: 1 }), "practical_finance");
assert.equal(resolveWealthVessel({ 정관: 2, 편관: 1 }), "career_honor");
assert.equal(resolveWealthVessel({ 식신: 2, 정인: 1 }), "developing");
ok("3-way 판정이 dominant ten-god group과 일치");

// ---------------------------------------------------------------------------
section("3) buildFamilyTalentSection — Track A(자녀 주체) vs Track B(부모 주체)");

const countsChild = { 식신: 3, 상관: 1 };
const countsParent = { 정인: 2, 편인: 1 };

const trackA = buildFamilyTalentSection({
  countsChild,
  countsParent,
  childNickname: "동글",
  parentNickname: "세라",
  childIsViewer: false,
  locale: "ko-KR",
});
assert.equal(trackA.study_type, "creative");
assert.ok(trackA.study_type_note.includes("동글"));
assert.equal(trackA.inherited_note, null);
ok("Track A는 자녀(countsChild) 기준으로 판정, inherited_note는 항상 null");

const trackB = buildFamilyTalentSection({
  countsChild,
  countsParent,
  childNickname: "동글",
  parentNickname: "세라",
  childIsViewer: true,
  locale: "ko-KR",
});
assert.equal(trackB.study_type, "understanding");
assert.ok(trackB.study_type_note.includes("세라"));
assert.ok(trackB.inherited_note);
ok("Track B는 부모(countsParent) 기준으로 판정, inherited_note가 채워짐");

// ---------------------------------------------------------------------------
section("4) inherited_note — 부모·자녀 dominant bucket 같으면 same, 다르면 different");

const sameBucket = buildFamilyTalentSection({
  countsChild: { 식신: 3 },
  countsParent: { 상관: 2 },
  childNickname: "동글",
  parentNickname: "세라",
  childIsViewer: true,
  locale: "ko-KR",
});
assert.ok(sameBucket.inherited_note.includes("물려받은"));
ok("둘 다 food(식상) 우세면 '물려받았다' 문구");

const diffBucket = buildFamilyTalentSection({
  countsChild: { 식신: 3 },
  countsParent: { 정재: 2 },
  childNickname: "동글",
  parentNickname: "세라",
  childIsViewer: true,
  locale: "ko-KR",
});
assert.ok(diffBucket.inherited_note.includes("균형"));
ok("food(자녀) vs wealth(부모) 다르면 '다르지만 균형' 문구");

// ---------------------------------------------------------------------------
section("5) locale별로 다른 언어 문구가 나온다");

const koHeadline = buildFamilyTalentSection({
  countsChild, countsParent, childNickname: "동글", parentNickname: "세라",
  childIsViewer: false, locale: "ko-KR",
}).headline;
const enHeadline = buildFamilyTalentSection({
  countsChild, countsParent, childNickname: "동글", parentNickname: "세라",
  childIsViewer: false, locale: "en-US",
}).headline;
assert.notEqual(koHeadline, enHeadline);
ok("ko-KR/en-US가 서로 다른 headline을 냄");

console.log("\nOK: family talent profile tests passed");
