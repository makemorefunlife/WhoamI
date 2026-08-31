/**
 * Part5 "미래 & 실전 행동 지침" — 비상시 SOS 룰 회귀 테스트. 새 스코어링
 * 없음 — childSealStrong/childWealthStrong(이미 계산됨, familyEventScores.ts)를
 * 처음으로 텍스트에 연결. 실천 루틴(냉장고 규칙 등)은 buildFamilyPrescriptions.ts에
 * 이미 있어 이번 배치 범위 아님(회귀 테스트 대상도 아님).
 * Run: npx tsx tests/unit/family-sos-script.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilySosSection } from "../../lib/relationship/familyParent/familySosScript.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function sig(overrides = {}) {
  return { childSealStrong: false, childWealthStrong: false, ...overrides };
}

// ---------------------------------------------------------------------------
section("1) Track A — childWealthStrong/childSealStrong 조합별 분기");

const base = buildFamilySosSection({
  scoringSignals: sig(),
  countsParent: {},
  childNickname: "동글",
  parentNickname: "세라",
  childIsViewer: false,
  locale: "ko-KR",
});
assert.ok(base.sos_line.includes("믿어"));
ok("둘 다 아니면 기본 '너를 믿는다' 톤");

const wealthStrong = buildFamilySosSection({
  scoringSignals: sig({ childWealthStrong: true }),
  countsParent: {},
  childNickname: "동글",
  parentNickname: "세라",
  childIsViewer: false,
  locale: "ko-KR",
});
assert.ok(wealthStrong.sos_line.includes("재물운"));
assert.notEqual(wealthStrong.sos_line, base.sos_line);
ok("childWealthStrong → 재물운 톤");

const sealStrong = buildFamilySosSection({
  scoringSignals: sig({ childSealStrong: true }),
  countsParent: {},
  childNickname: "동글",
  parentNickname: "세라",
  childIsViewer: false,
  locale: "ko-KR",
});
assert.ok(sealStrong.sos_line.includes("관계 회복력"));
ok("childSealStrong(단독) → 관계 회복력 톤");

const both = buildFamilySosSection({
  scoringSignals: sig({ childWealthStrong: true, childSealStrong: true }),
  countsParent: {},
  childNickname: "동글",
  parentNickname: "세라",
  childIsViewer: false,
  locale: "ko-KR",
});
assert.equal(both.sos_line, wealthStrong.sos_line);
ok("둘 다 true면 wealth가 우선(if-else 순서)");

// ---------------------------------------------------------------------------
section("2) Track B — 부모 인성/재성 강도로 분기, 새 카운트 계산 없이 countsParent 재사용");

const parentSeal = buildFamilySosSection({
  scoringSignals: sig(),
  countsParent: { 정인: 2, 편인: 1 },
  childNickname: "동글",
  parentNickname: "세라",
  childIsViewer: true,
  locale: "ko-KR",
});
assert.ok(parentSeal.sos_line.includes("혼자 삭이는"));
ok("부모 인성 우세 → 혼자 삭이는 톤");

const parentWealth = buildFamilySosSection({
  scoringSignals: sig(),
  countsParent: { 정재: 2, 편재: 1 },
  childNickname: "동글",
  parentNickname: "세라",
  childIsViewer: true,
  locale: "ko-KR",
});
assert.ok(parentWealth.sos_line.includes("실질적인 도움"));
ok("부모 재성 우세 → 실질적 도움 톤");

const parentNeutral = buildFamilySosSection({
  scoringSignals: sig(),
  countsParent: {},
  childNickname: "동글",
  parentNickname: "세라",
  childIsViewer: true,
  locale: "ko-KR",
});
assert.ok(parentNeutral.sos_line.includes("정서적 울타리"));
ok("부모 인성/재성 둘 다 약하면 기본 정서적 울타리 톤");

// ---------------------------------------------------------------------------
section("3) headline/trigger_label이 트랙별로 다름");

assert.notEqual(base.headline, parentNeutral.headline);
assert.notEqual(base.trigger_label, parentNeutral.trigger_label);
ok("Track A(자녀 위기)와 Track B(부모 케어)는 headline/trigger_label이 다름");

// ---------------------------------------------------------------------------
section("4) locale별로 다른 언어 문구가 나온다");

const koLine = buildFamilySosSection({
  scoringSignals: sig(), countsParent: {}, childNickname: "동글", parentNickname: "세라",
  childIsViewer: false, locale: "ko-KR",
}).sos_line;
const enLine = buildFamilySosSection({
  scoringSignals: sig(), countsParent: {}, childNickname: "동글", parentNickname: "세라",
  childIsViewer: false, locale: "en-US",
}).sos_line;
assert.notEqual(koLine, enLine);
ok("ko-KR/en-US가 서로 다른 sos_line을 냄");

console.log("\nOK: family SOS script tests passed");
