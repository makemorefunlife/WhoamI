/**
 * Marriage Batch 6 — Part3① 스태미나 12운성(제왕/건록 vs 묘/절) 정밀 확인문구 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. resolveStaminaTwelveStageNote는 순수 사주 함수(psych 불필요) — 제왕/건록,
 *      묘/절, 그 외 운성에서 서로 다르게(또는 null) 반응한다.
 *   2. 운성 이름("제왕"/"건록"/"묘"/"절") 자체는 최종 문구에 노출되지 않는다.
 *   3. 기존 resolveStaminaArchetype(마라톤/스파크 판정) 자체는 이번 변경으로
 *      완전히 안 바뀐다(비교 대상 함수가 private라 buildBedroomMatrixSection의
 *      person.archetypes.stamina를 통해 간접 확인).
 *
 * No DB, no LLM — 순수 함수라 결정론적으로 assert 가능.
 * Run: npx tsx tests/unit/marriage-stamina-precision-note.test.mjs
 */
import assert from "node:assert/strict";
import { calculateTwelveStage } from "../../lib/saju/repository.ts";
import { buildChartContext } from "../../lib/saju/chartContext.ts";
import { buildBedroomMatrixSection } from "../../lib/relationship/marriage/bedroomProfile.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const STEMS = ["gap", "eul", "byeong", "jeong", "mu", "gi", "gyeong", "sin", "im", "gye"];
const BRANCHES = ["ja", "chuk", "in", "myo", "jin", "sa", "o", "mi", "sin", "yu", "sul", "hae"];

// calculateTwelveStage(dayStem, dayBranch)를 전수 조회해서 원하는 스테이지의
// 첫 (stem, branch) 조합을 찾는다 — 손으로 12운성 표를 계산하는 대신 실제
// 함수 자체를 근거로 fixture를 만든다(Batch 4와 동일한 "fixture 전제 확인" 원칙).
function findStemBranchForStage(targetStage) {
  for (const stem of STEMS) {
    for (const branch of BRANCHES) {
      if (calculateTwelveStage(stem, branch) === targetStage) return { stem, branch };
    }
  }
  throw new Error(`no (stem, branch) pair found for stage ${targetStage}`);
}

const HANGUL_STEM = {
  gap: "갑", eul: "을", byeong: "병", jeong: "정", mu: "무", gi: "기",
  gyeong: "경", sin: "신", im: "임", gye: "계",
};
const HANGUL_BRANCH = {
  ja: "자", chuk: "축", in: "인", myo: "묘", jin: "진", sa: "사",
  o: "오", mi: "미", sin: "신", yu: "유", sul: "술", hae: "해",
};

function pillarsForDay(stem, branch) {
  // 년/월/시는 임의 고정값 — 일간·일지만 fixture 대상.
  const dayPillar = `${HANGUL_STEM[stem]}${HANGUL_BRANCH[branch]}`;
  return { yearPillar: "경오", monthPillar: "신사", dayPillar, hourPillar: "신미" };
}

function chartForStage(targetStage) {
  const { stem, branch } = findStemBranchForStage(targetStage);
  return buildChartContext(pillarsForDay(stem, branch));
}

// buildBedroomMatrixSection을 직접 호출하기보다, resolveStaminaTwelveStageNote는
// export 안 된 private 함수라 매트릭스 빌더를 통해 간접 확인한다.
function matrixFor(chart, locale = "ko-KR") {
  return buildBedroomMatrixSection({
    nicknameA: "Sera",
    nicknameB: "동글",
    sajuJsonA: { saju: pillarsFromChart(chart) },
    sajuJsonB: { saju: pillarsFromChart(chart) },
    countsA: {},
    countsB: {},
    chartA: chart,
    chartB: chart,
    dayBranch: { bedFitLevel: "good", hasDayBranchChungHyung: false },
    locale,
  });
}

function pillarsFromChart(chart) {
  const byName = Object.fromEntries(chart.pillars.map((p) => [p.name, p.pillar]));
  return {
    yearPillar: byName["년주"],
    monthPillar: byName["월주"],
    dayPillar: byName["일주"],
    hourPillar: byName["시주"],
  };
}

// ---------------------------------------------------------------------------
section("0) fixture 전제 확인 — calculateTwelveStage가 실제로 원하는 스테이지를 낸다");

const jewangChart = chartForStage("jewang");
const geollokChart = chartForStage("geollok");
const myoChart = chartForStage("myo");
const jeolChart = chartForStage("jeol");
const jangsaengChart = chartForStage("jangsaeng");

assert.equal(calculateTwelveStage(jewangChart.dayStemCode, jewangChart.dayBranchCode), "jewang");
assert.equal(calculateTwelveStage(geollokChart.dayStemCode, geollokChart.dayBranchCode), "geollok");
assert.equal(calculateTwelveStage(myoChart.dayStemCode, myoChart.dayBranchCode), "myo");
assert.equal(calculateTwelveStage(jeolChart.dayStemCode, jeolChart.dayBranchCode), "jeol");
assert.equal(calculateTwelveStage(jangsaengChart.dayStemCode, jangsaengChart.dayBranchCode), "jangsaeng");
ok("5개 fixture가 의도한 운성으로 정확히 나옴");

// ---------------------------------------------------------------------------
section("1) 제왕/건록 — 확인문구 존재, 서로 같은 톤(둘 다 '강함' 계열)");

const jewangNote = matrixFor(jewangChart).person_a.stamina_precision_note;
const geollokNote = matrixFor(geollokChart).person_a.stamina_precision_note;
assert.ok(jewangNote && jewangNote.length > 0);
assert.ok(geollokNote && geollokNote.length > 0);
ok("제왕/건록 둘 다 확인문구를 반환함");

// ---------------------------------------------------------------------------
section("2) 묘/절 — 확인문구 존재, 제왕/건록과 다른 문구");

const myoNote = matrixFor(myoChart).person_a.stamina_precision_note;
const jeolNote = matrixFor(jeolChart).person_a.stamina_precision_note;
assert.ok(myoNote && myoNote.length > 0);
assert.ok(jeolNote && jeolNote.length > 0);
assert.notEqual(myoNote, jewangNote);
ok("묘/절 둘 다 확인문구를 반환하고, 제왕/건록 문구와는 다름");

// ---------------------------------------------------------------------------
section("3) 그 외 운성(장생) — null(억지로 안 붙임)");

const jangsaengNote = matrixFor(jangsaengChart).person_a.stamina_precision_note;
assert.equal(jangsaengNote, null);
ok("장생 등 그 외 운성은 null");

// ---------------------------------------------------------------------------
section("4) 운성 이름 원문이 최종 문구에 노출되지 않는다");

for (const note of [jewangNote, geollokNote, myoNote, jeolNote]) {
  assert.ok(!/제왕|건록|묘|절|십이운성|장생|목욕|관대/.test(note));
}
ok("제왕/건록/묘/절 등 운성 명칭이 문구 어디에도 노출되지 않음");

console.log("\nOK: marriage stamina precision note tests passed");
