/**
 * Part1 "관계 입체 진단" — 훈육 마찰 지수(Track A) / 소통 엇박자 진단(Track B)
 * 회귀 테스트. 신규 계산 없음 — PairFamilySignals(이미 계산됨)와
 * masterScores.risk 폴백을 재사용, 11축 decision_style만 처음 소비.
 * Run: npx tsx tests/unit/family-relationship-index.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyRelationshipIndexSection } from "../../lib/relationship/familyParent/familyRelationshipIndexSection.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function pairFamily(overrides = {}) {
  return {
    umbilical_separation_index: 50,
    umbilical_band: "medium",
    nagging_trigger_index: 42,
    nagging_band: "medium",
    combined_karma_tension: 30,
    guidance_fit: null,
    ...overrides,
  };
}

function psych(decisionScore) {
  return { secondary_axes: { decision_style: decisionScore } };
}

// ---------------------------------------------------------------------------
section("1) friction_index — pairFamily 있으면 nagging_trigger_index, 없으면 masterScores.risk 폴백");

const withPair = buildFamilyRelationshipIndexSection({
  pairFamily: pairFamily({ nagging_trigger_index: 67 }),
  fallbackRisk: 20,
  childIsViewer: false,
  locale: "ko-KR",
});
assert.equal(withPair.friction_index, 67);
ok("pairFamily 있으면 nagging_trigger_index 사용");

const withoutPair = buildFamilyRelationshipIndexSection({
  pairFamily: null,
  fallbackRisk: 33,
  childIsViewer: false,
  locale: "ko-KR",
});
assert.equal(withoutPair.friction_index, 33);
assert.equal(withoutPair.safe_distance_note.length > 0, true);
ok("pairFamily 없으면 masterScores.risk로 안전 폴백, safe_distance_note도 중립값(medium) 생성");

// ---------------------------------------------------------------------------
section("2) headline/safe_distance_note — childIsViewer로 트랙 분기, band 판정은 공유");

const trackA = buildFamilyRelationshipIndexSection({
  pairFamily: pairFamily({ umbilical_band: "high" }),
  fallbackRisk: 50,
  childIsViewer: false,
  locale: "ko-KR",
});
const trackB = buildFamilyRelationshipIndexSection({
  pairFamily: pairFamily({ umbilical_band: "high" }),
  fallbackRisk: 50,
  childIsViewer: true,
  locale: "ko-KR",
});
assert.equal(trackA.headline, "훈육 마찰 지수");
assert.equal(trackB.headline, "소통 엇박자 진단");
assert.notEqual(trackA.safe_distance_note, trackB.safe_distance_note);
ok("동일 band(high)에서도 트랙별 headline/safe_distance_note가 다름");

// band별로 다른 문구가 나오는지(트랙 고정, band만 변화)
const low = buildFamilyRelationshipIndexSection({
  pairFamily: pairFamily({ umbilical_band: "low" }),
  fallbackRisk: 50,
  childIsViewer: false,
  locale: "ko-KR",
});
const high = buildFamilyRelationshipIndexSection({
  pairFamily: pairFamily({ umbilical_band: "high" }),
  fallbackRisk: 50,
  childIsViewer: false,
  locale: "ko-KR",
});
assert.notEqual(low.safe_distance_note, high.safe_distance_note);
ok("band(low vs high)가 다르면 같은 트랙이라도 safe_distance_note가 다름");

// ---------------------------------------------------------------------------
section("3) decision_axis_note — 극단값만 확인문구, 중간대는 null, psych 없으면 null");

const noPsych = buildFamilyRelationshipIndexSection({
  pairFamily: pairFamily(),
  fallbackRisk: 50,
  childIsViewer: false,
  locale: "ko-KR",
});
assert.equal(noPsych.decision_axis_note, null);
ok("psych 없으면 decision_axis_note는 null");

const midPsych = buildFamilyRelationshipIndexSection({
  pairFamily: pairFamily(),
  fallbackRisk: 50,
  psychChild: psych(50),
  childIsViewer: false,
  locale: "ko-KR",
});
assert.equal(midPsych.decision_axis_note, null);
ok("중간대(50) 점수는 확인문구 없이 null(억지로 안 만듦)");

const highPsychChild = buildFamilyRelationshipIndexSection({
  pairFamily: pairFamily(),
  fallbackRisk: 50,
  psychChild: psych(85),
  childIsViewer: false,
  locale: "ko-KR",
});
assert.ok(highPsychChild.decision_axis_note);
assert.ok(highPsychChild.decision_axis_note.includes("아이"));
ok("Track A + 자녀 decision_style 높음 → 자녀向 신중함 확인문구");

const lowPsychParent = buildFamilyRelationshipIndexSection({
  pairFamily: pairFamily(),
  fallbackRisk: 50,
  psychParent: psych(10),
  childIsViewer: true,
  locale: "ko-KR",
});
assert.ok(lowPsychParent.decision_axis_note);
assert.ok(lowPsychParent.decision_axis_note.includes("부모님"));
ok("Track B + 부모 decision_style 낮음 → 부모向 즉흥성 확인문구 (축 주체가 트랙에 따라 반대로 뒤바뀜)");

// ---------------------------------------------------------------------------
section("4) locale별로 다른 언어 문구가 나온다");

const koHeadline = buildFamilyRelationshipIndexSection({
  pairFamily: pairFamily(),
  fallbackRisk: 50,
  childIsViewer: false,
  locale: "ko-KR",
}).headline;
const enHeadline = buildFamilyRelationshipIndexSection({
  pairFamily: pairFamily(),
  fallbackRisk: 50,
  childIsViewer: false,
  locale: "en-US",
}).headline;
assert.notEqual(koHeadline, enHeadline);
ok("ko-KR/en-US가 서로 다른 headline을 냄");

console.log("\nOK: family relationship index tests passed");
