/**
 * 부부(Marriage) 도메인 Batch 1 — 마스터 사양서 Part1(시그니처 아키타입 +
 * "우리가 부부가 된 이유") 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. 천간합(5쌍) 신호가 analyzeMarriagePairSaju().scoringSignals에 정확히 실린다.
 *   2. resolveHealingDirection은 두 일간 오행의 상생 방향(5각 순환이라 방향이
 *      항상 한쪽으로만 정해짐)을 정확히 판정한다 — 같은 오행이면 "none".
 *   3. resolveHouseholdArchetype은 천간합/일지합 또는 관성재성 우세 시에만
 *      값을 반환하고, 그 외엔 null(기존 점수 기반 로직으로 폴백)을 반환한다.
 *   4. buildOriginStorySection이 신호별로 다른 문구를 만들고, 크래시 없이
 *      항상 세 필드(why_us/positive_change_a/positive_change_b)를 채운다.
 *
 * No DB, no LLM — 전부 순수 함수라 결정론적으로 assert 가능.
 * Run: npx tsx tests/unit/marriage-origin-story.test.mjs
 */
import assert from "node:assert/strict";
import { analyzeMarriagePairSaju, resolveHealingDirection } from "../../lib/saju/marriageAnalysis.ts";
import { resolveHouseholdArchetype } from "../../lib/relationship/marriage/homeReportTemplate.ts";
import { buildOriginStorySection } from "../../lib/relationship/marriage/marriageOriginStory.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

// A는 세 케이스 모두 고정 — 갑(甲/wood)일간, 자(子)일지
const PERSON_A = { yearPillar: "경오", monthPillar: "신사", dayPillar: "갑자", hourPillar: "신미" };

// B: 천간합(갑기합) — 기(己/earth)일간, 묘(卯)일지(자와 육합·충 관계 없음)
const PERSON_B_COMBINE = { yearPillar: "임신", monthPillar: "무신", dayPillar: "기묘", hourPillar: "임인" };
// B: 비합, A(wood)가 생함(木生火) — 병(丙/fire)일간, 인(寅)일지
const PERSON_B_GENERATED_BY_A = { yearPillar: "임신", monthPillar: "무신", dayPillar: "병인", hourPillar: "임인" };
// B: 비합, 같은 오행(갑/wood) — 방향성 없음
const PERSON_B_SAME_ELEMENT = { yearPillar: "임신", monthPillar: "무신", dayPillar: "갑인", hourPillar: "임인" };

function ctxFixture({ chartA, chartB, scoringSignals, wealthOfficerA = 0, wealthOfficerB = 0 }) {
  return {
    nicknameA: "Sera",
    nicknameB: "동글",
    locale: "ko-KR",
    marriagePairAnalysis: { chartA, chartB, scoringSignals },
    householdDnaA: { lifestyle_title: "Warm Nest" },
    householdDnaB: { lifestyle_title: "Steady Anchor" },
    tenGod: {
      countsA: wealthOfficerA ? { 정관: wealthOfficerA } : {},
      countsB: wealthOfficerB ? { 정재: wealthOfficerB } : {},
    },
  };
}

// ---------------------------------------------------------------------------
section("1) 천간합 신호 — analyzeMarriagePairSaju().scoringSignals에 정확히 실린다");

const combineResult = analyzeMarriagePairSaju(PERSON_A, PERSON_B_COMBINE);
assert.equal(
  combineResult.scoringSignals.hasHeavenlyStemCombine,
  true,
  "갑(A)+기(B)는 천간합 5쌍 중 하나 — true여야 함",
);
ok("갑기합 케이스에서 hasHeavenlyStemCombine=true");

const noCombineResult = analyzeMarriagePairSaju(PERSON_A, PERSON_B_GENERATED_BY_A);
assert.equal(
  noCombineResult.scoringSignals.hasHeavenlyStemCombine,
  false,
  "갑(A)+병(B)은 천간합 5쌍에 없음 — false여야 함",
);
ok("갑+병 케이스에서 hasHeavenlyStemCombine=false");

// ---------------------------------------------------------------------------
section("2) resolveHealingDirection — 일간 오행 상생 방향 판정");

assert.equal(
  resolveHealingDirection(combineResult.chartA, combineResult.chartB),
  "none",
  "목(A)-토(B)는 직접 상생 관계 아님 — none",
);
ok("갑(목)-기(토) 조합은 방향성 none");

assert.equal(
  resolveHealingDirection(noCombineResult.chartA, noCombineResult.chartB),
  "b_healed_by_a",
  "목(A)이 화(B)를 생함(木生火) — B가 A 덕분에 치유받는 방향",
);
ok("갑(목)-병(화) 조합은 A가 B를 생하는 방향(b_healed_by_a)");

const sameElementResult = analyzeMarriagePairSaju(PERSON_A, PERSON_B_SAME_ELEMENT);
assert.equal(
  resolveHealingDirection(sameElementResult.chartA, sameElementResult.chartB),
  "none",
  "같은 오행(목-목)이면 방향 없음 — none",
);
assert.equal(
  sameElementResult.scoringSignals.hasHeavenlyStemCombine,
  false,
  "갑+갑은 천간합 5쌍(서로 다른 두 글자)에 해당 안 됨",
);
ok("같은 일간 오행(갑-갑)이면 천간합도 방향성도 모두 없음");

// ---------------------------------------------------------------------------
section("3) resolveHouseholdArchetype — 천간합/일지합·관성재성 우세일 때만 값, 그 외 null");

const archetypeCombine = resolveHouseholdArchetype(
  ctxFixture({
    chartA: combineResult.chartA,
    chartB: combineResult.chartB,
    scoringSignals: combineResult.scoringSignals,
  }),
);
assert.ok(archetypeCombine, "천간합 신호가 있으면 아키타입 문구를 반환해야 함");
assert.ok(
  archetypeCombine.includes("운명적 정서 끌림형 패밀리"),
  "천간합/일지합 케이스는 '운명적 정서 끌림형 패밀리' 문구를 포함해야 함",
);
ok("천간합 있음 → 운명적 정서 끌림형 패밀리 문구 반환");

const archetypeWealthOfficer = resolveHouseholdArchetype(
  ctxFixture({
    chartA: noCombineResult.chartA,
    chartB: noCombineResult.chartB,
    scoringSignals: noCombineResult.scoringSignals,
    wealthOfficerA: 2,
    wealthOfficerB: 2,
  }),
);
assert.ok(archetypeWealthOfficer, "관성/재성 합산이 충분히 크면 아키타입 문구를 반환해야 함");
assert.ok(
  archetypeWealthOfficer.includes("체계적 패밀리 경영형"),
  "관성/재성 우세 케이스는 '체계적 패밀리 경영형' 문구를 포함해야 함",
);
ok("관성/재성 합산 우세 → 체계적 패밀리 경영형 문구 반환");

const archetypeNone = resolveHouseholdArchetype(
  ctxFixture({
    chartA: noCombineResult.chartA,
    chartB: noCombineResult.chartB,
    scoringSignals: noCombineResult.scoringSignals,
    wealthOfficerA: 0,
    wealthOfficerB: 0,
  }),
);
assert.equal(
  archetypeNone,
  null,
  "천간합/일지합도 없고 관성재성도 약하면 null을 반환해 기존 점수 기반 로직으로 폴백해야 함",
);
ok("신호 없음 → null 반환(레거시 5개 케이스로 폴백, byte-identical 유지)");

// ---------------------------------------------------------------------------
section("4) buildOriginStorySection — 신호별로 다른 문구, 항상 3개 필드 채움");

const originCombine = buildOriginStorySection(
  ctxFixture({
    chartA: combineResult.chartA,
    chartB: combineResult.chartB,
    scoringSignals: combineResult.scoringSignals,
  }),
);
assert.ok(originCombine.why_us.includes("끌렸던"), "천간합 케이스는 why_us에 끌림 서사가 나와야 함");
assert.ok(
  !/일간|천간합|지지|조후|오행/.test(originCombine.why_us),
  "사양서 용어(일간/천간합 등)는 최종 문구에 노출되면 안 됨 — sanitizeHomeLifeText로 걸러져야 함",
);
assert.ok(originCombine.positive_change_a.length > 0 && originCombine.positive_change_b.length > 0);
ok("천간합 케이스: why_us가 끌림 서사, 사주 용어 노출 없음, 양쪽 positive_change 모두 채워짐");

const originHealed = buildOriginStorySection(
  ctxFixture({
    chartA: noCombineResult.chartA,
    chartB: noCombineResult.chartB,
    scoringSignals: noCombineResult.scoringSignals,
  }),
);
assert.ok(
  !originHealed.why_us.includes("천간합"),
  "천간합 신호가 없으면 why_us에 천간합 문구가 나오면 안 됨",
);
assert.notEqual(
  originHealed.positive_change_a,
  originHealed.positive_change_b,
  "치유 방향이 있으면(b_healed_by_a) A/B의 positive_change 문구가 서로 달라야 함(복붙 방지)",
);
ok("방향성 있는 케이스: why_us는 천간합 문구 없음, positive_change A/B가 서로 다름(A/B 복붙 방지 확인)");

const originNeutral = buildOriginStorySection(
  ctxFixture({
    chartA: sameElementResult.chartA,
    chartB: sameElementResult.chartB,
    scoringSignals: sameElementResult.scoringSignals,
  }),
);
assert.ok(
  originNeutral.why_us.length > 0 &&
    originNeutral.positive_change_a.length > 0 &&
    originNeutral.positive_change_b.length > 0,
  "천간합도 조후보완도 방향성도 없어도(완전 중립) 세 필드 모두 빈 문자열이면 안 됨",
);
ok("완전 중립 케이스에서도 세 필드 모두 항상 채워짐(빈 문자열 없음)");

console.log("\nOK: marriage origin story tests passed");
