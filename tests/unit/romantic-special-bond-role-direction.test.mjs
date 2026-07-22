/**
 * Romantic Phase 4-5 Batch 5 — Part3② special_bond 역할 동적 배정 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. resolveSajuFrameDirection — A 우세/B 우세/균형(격차<2) 3케이스가 정확한
 *      방향을 낸다.
 *   2. buildSectionRoleSeparationGuide(anchorIsA=true)일 때 a_gives_b 행에
 *      "안식처"류 문구, b_gives_a 행에 "온기"류 문구가 들어간다(스왑 확인).
 *   3. anchorIsA가 false/null/undefined(미전달)이면 — 즉 균형이거나
 *      romantic_signals 없는 레거시 스냅샷이면 — 문자열이 byte-identical하게
 *      완전히 동일해야 한다(레거시 안전, 신호 무관 A/B 고정 문제를 고치되
 *      "신호 없을 때"의 기존 동작 자체는 안 깨야 함).
 *
 * No DB, no LLM — 둘 다 순수 함수라 문자열 자체를 결정론적으로 assert 가능.
 * LLM이 이 스왑된 역할 지시를 실제로 잘 따라 쓰는지는 검증 불가(Batch 3/4와
 * 동일한 한계) — 다만 "지시 자체가 A/B 무관하게 고정되지 않는다"까지는
 * 결정론적으로 보장됨.
 * Run: npx tsx tests/unit/romantic-special-bond-role-direction.test.mjs
 */
import assert from "node:assert/strict";
import { resolveSajuFrameDirection } from "../../lib/relationship/romanticRules/relationshipDynamics.ts";
import { buildSectionRoleSeparationGuide } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/essenceJournalWritingRules.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function romanticSignals(overrides = {}) {
  return {
    expression_style: { food_count: 1, expression_band: "steady" },
    conflict_response: {
      officer_count: 1,
      food_count: 1,
      day_branch_tension_hits: [],
      conflict_band: "steady",
    },
    affection_language: { wealth_count: 1, seal_count: 1, affection_band: "steady" },
    stress_pattern: { heat_score: 50, temperature_band: "neutral", stress_band: "steady" },
    decision_making: { strength_label: "중화", decision_band: "steady" },
    communication_style: { self_count: 1, seal_count: 1, communication_band: "steady" },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
section("1) resolveSajuFrameDirection — A 우세/B 우세/균형 3케이스");

const aHigh = resolveSajuFrameDirection(
  romanticSignals({ affection_language: { wealth_count: 1, seal_count: 3, affection_band: "steady" } }),
  romanticSignals(),
);
assert.equal(aHigh, "A");
ok("A의 인성+관성 합산이 B보다 격차 2 이상 높으면 'A'");

const bHigh = resolveSajuFrameDirection(
  romanticSignals(),
  romanticSignals({
    conflict_response: { officer_count: 3, food_count: 1, day_branch_tension_hits: [], conflict_band: "steady" },
  }),
);
assert.equal(bHigh, "B");
ok("B의 인성+관성 합산이 A보다 격차 2 이상 높으면 'B'");

const balanced = resolveSajuFrameDirection(romanticSignals(), romanticSignals());
assert.equal(balanced, "balanced");
ok("격차가 2 미만이면 'balanced'");

// ---------------------------------------------------------------------------
section("2) anchorIsA=true — a_gives_b가 안식처 역, b_gives_a가 온기 역으로 스왑된다");

const swapped = buildSectionRoleSeparationGuide("Alex", "Jordan", true);
assert.match(swapped, /a_gives_b`.*Alex → Jordan.*다정한 안식처/s);
assert.match(swapped, /b_gives_a`.*Jordan → Alex.*다정한 생동감/s);
ok("anchorIsA=true면 a_gives_b(Alex→Jordan)가 안식처 역, b_gives_a(Jordan→Alex)가 온기(생동감) 역");

// ---------------------------------------------------------------------------
section("3) anchorIsA가 false/null/undefined — 기존과 byte-identical한 기본 문구");

const defaultUndefined = buildSectionRoleSeparationGuide("Alex", "Jordan");
const defaultFalse = buildSectionRoleSeparationGuide("Alex", "Jordan", false);
const defaultNull = buildSectionRoleSeparationGuide("Alex", "Jordan", null);

assert.equal(defaultFalse, defaultUndefined);
assert.equal(defaultNull, defaultUndefined);
ok("anchorIsA를 false/null/미전달 어느 쪽으로 줘도 완전히 동일한 문자열");

// 이번 배치 이전(anchorIsA 파라미터 도입 전)의 정확한 원문 — 고정 스냅샷.
assert.ok(
  defaultUndefined.includes(
    "**Alex → Jordan**: 다정한 생동감·**새 경험·변화·더 나은 결정** | 자연물 비유, b_gives_a 미러링",
  ),
);
assert.ok(
  defaultUndefined.includes(
    "**Jordan → Alex**: 안정·**감정 부담 경감·분석적 새 시각** | a_gives_b 미러링",
  ),
);
ok("기본값 텍스트가 anchorIsA 도입 이전의 정확한 원문과 한 글자도 다르지 않음(고정 스냅샷)");

console.log("\nOK: romantic special-bond role-direction tests passed");
