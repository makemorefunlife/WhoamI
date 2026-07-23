/**
 * Romantic Phase 4-3 Batch 3 — Part3① 안심 신호(reassurance) digest 줄에
 * 희용신(yongsin_estimate) 오행을 give 쪽 괄호 병기로 추가한 것에 대한 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. resolveReassuranceBand/resolveGiveStyle/resolveReassuranceMatch 등 판정
 *      함수의 출력(need=/give=/일치: 토큰)은 yongsin 유무와 무관하게 완전히 동일해야
 *      한다 — 이번 변경은 판정 로직이 아니라 digest 텍스트에 근거만 추가한 것.
 *   2. yongsinA/B가 없으면(레거시 스냅샷) digest 문자열이 이전과 완전히 동일해야
 *      한다(byte-identical) — give 쪽에 아무것도 안 붙음.
 *   3. yongsinA/B가 있으면 "give=<style>(희용신 <오행>)" 형태로 정확히 병기된다.
 *
 * No DB, no LLM — buildRomanticDynamicsDigest는 순수 함수라 문자열 자체를
 * 결정론적으로 assert 가능.
 * Run: npx tsx tests/unit/romantic-dynamics-digest-yongsin.test.mjs
 */
import assert from "node:assert/strict";
import { buildRomanticDynamicsDigest } from "../../lib/relationship/romanticSajuPromptDigest.ts";
import { collectRomanticDynamicsTypedSnapshot } from "../../lib/relationship/romantic/romanticContextInput.ts";
import { hasDayStemRootInDayBranch } from "../../lib/relationship/romanticRules/relationshipDynamics.ts";
import { buildChartContext } from "../../lib/saju/chartContext.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { sajuJsonToPillars } from "../../lib/saju/pairChartAnalysis.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function profile(overrides = {}) {
  const base = {
    stimulation: 50,
    self_control: 50,
    practicality: 50,
    structure: 50,
    empathy: 50,
    conflict_style: 50,
    resilience: 50,
    recognition: 50,
    energy_style: 50,
    thinking_style: 50,
    decision_style: 50,
  };
  return { secondary_axes: { ...base, ...overrides } };
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

function yongsin(element) {
  return {
    yongsin_candidates: [`${element} — 부족한 기운, 관계에서 채우고 싶은 에너지`],
    gisin_candidates: ["금(金) — 과한 기운, 과부하·고집·예민함으로 나올 수 있음"],
    confidence: "low",
    note: "오행 분포 기반 후보 — 확정 아님",
  };
}

const baseParams = {
  nicknameA: "Alex",
  nicknameB: "Jordan",
  profileA: profile({ empathy: 70 }),
  profileB: profile({ empathy: 40 }),
  romanticA: romanticSignals(),
  romanticB: romanticSignals(),
  rootedA: true,
  rootedB: false,
  dayStemInteraction: "화이(가) 목을(를) 살림(상생)",
};

// ---------------------------------------------------------------------------
section("1) yongsinA/B 없음 — 기존과 완전히 동일한 digest(레거시 안전)");

const withoutYongsin = buildRomanticDynamicsDigest(baseParams);
const withNullYongsin = buildRomanticDynamicsDigest({ ...baseParams, yongsinA: null, yongsinB: null });
const withUndefinedYongsin = buildRomanticDynamicsDigest({
  ...baseParams,
  yongsinA: undefined,
  yongsinB: undefined,
});

assert.equal(withNullYongsin, withoutYongsin);
assert.equal(withUndefinedYongsin, withoutYongsin);
ok("yongsinA/B를 안 주거나 null/undefined로 줘도 digest 문자열이 완전히 동일");

assert.ok(!withoutYongsin.includes("희용신"), "yongsin 없을 때 '희용신' 문구 자체가 안 나와야 함");
ok("yongsin 정보 없으면 '희용신' 텍스트 자체가 생략됨");

// ---------------------------------------------------------------------------
section("2) yongsinA/B 있음 — give 쪽에 정확히 병기된다");

const withYongsin = buildRomanticDynamicsDigest({
  ...baseParams,
  yongsinA: yongsin("목(木)"),
  yongsinB: yongsin("화(火)"),
});

assert.ok(withYongsin.includes("(희용신 목(木))"), "A의 give= 옆에 A의 희용신(목)이 붙어야 함");
assert.ok(withYongsin.includes("(희용신 화(火))"), "B의 give= 옆에 B의 희용신(화)이 붙어야 함");
ok("각자의 희용신 오행이 자신이 give하는 쪽에 정확히 병기됨");

// give=<style>(희용신 ...) 형태로, need=/일치: 위치는 안 건드렸는지 확인
const reassuranceLine = withYongsin.split("\n").find((l) => l.startsWith("- reassurance:"));
assert.ok(reassuranceLine, "reassurance 줄이 존재해야 함");
// give하는 사람 본인의 희용신이 붙는다 — 첫 절은 Jordan이 give하므로 Jordan(B)의
// 희용신(화), 둘째 절은 Alex가 give하므로 Alex(A)의 희용신(목)이 붙어야 한다.
assert.match(
  reassuranceLine,
  /^- reassurance: Alex need=\w+ vs Jordan give=\w+\(희용신 화\(火\)\) → 일치:(true|false) \| Jordan need=\w+ vs Alex give=\w+\(희용신 목\(木\)\) → 일치:(true|false)$/,
);
ok("reassurance 줄 전체가 예상 포맷과 정확히 일치(give하는 사람 본인의 희용신이 붙음, need=/일치: 구조 안 바뀜)");

// ---------------------------------------------------------------------------
section("3) 판정 함수 출력(need=/give=/일치:) 자체는 yongsin 유무와 무관하게 동일하다");

function extractTokens(digestLine) {
  // "- reassurance: A need=X vs B give=Y(희용신 화(火)) → 일치:Z | ..." 에서
  // "(희용신 ...)" 괄호 전체(오행명 자체에 "화(火)"처럼 중첩 괄호가 있으므로
  // 바깥쪽 닫는 괄호까지 포함해서)를 제거하고 need=/give=/일치: 토큰만 남긴다.
  return digestLine
    .replace(/\(희용신[^)]*\([^)]*\)\)/g, "")
    .trim();
}

const lineWithout = withoutYongsin.split("\n").find((l) => l.startsWith("- reassurance:"));
const lineWithYongsinStripped = extractTokens(reassuranceLine);

assert.equal(lineWithYongsinStripped, lineWithout);
ok("희용신 괄호만 제거하면 두 digest의 reassurance 줄이 완전히 동일 — 판정 로직 자체는 안 바뀜");

// ---------------------------------------------------------------------------
section("4) dynamics typed snapshot 재사용 — legacy digest와 byte-identical");

const chartBundleA = calculateSajuBundle({
  birthDate: "1990-05-15",
  birthTime: "12:00",
});
const chartBundleB = calculateSajuBundle({
  birthDate: "1992-08-20",
  birthTime: "12:00",
});
const chartA = buildChartContext(sajuJsonToPillars(chartBundleA.saju));
const chartB = buildChartContext(sajuJsonToPillars(chartBundleB.saju));
const rootedFromChartA = hasDayStemRootInDayBranch(chartA);
const rootedFromChartB = hasDayStemRootInDayBranch(chartB);
const snap = collectRomanticDynamicsTypedSnapshot({
  profileA: baseParams.profileA,
  profileB: baseParams.profileB,
  romanticA: baseParams.romanticA,
  romanticB: baseParams.romanticB,
  chartA,
  chartB,
  dayStemInteraction: baseParams.dayStemInteraction,
});
const legacyAligned = buildRomanticDynamicsDigest({
  ...baseParams,
  rootedA: rootedFromChartA,
  rootedB: rootedFromChartB,
});
const viaSnap = buildRomanticDynamicsDigest({
  ...baseParams,
  dynamics: snap,
});
assert.equal(viaSnap, legacyAligned);
ok("dynamics snapshot 경로 ≡ 동일 rooted 기준 resolver 경로 digest");

console.log("\nOK: romantic dynamics digest yongsin tests passed");
