/**
 * Marriage Batch 2 — Part2① 종합 관계 지수(로맨틱 핏/라이프 시너지/홈 리스크)에
 * 11축(관계공감/계획구조화) 확인 문구(axisNote)를 추가한 것에 대한 회귀 테스트.
 * 로맨틱의 `tests/unit/romantic-relationship-index-axis-notes.test.mjs`와 동일한
 * 컨벤션(fixture, 고정 스냅샷, 알려진 갭을 능동적으로 고정)을 따른다.
 *
 * 핵심 불변식:
 *   1. computeMarriageMasterScores의 원점수/grade는 이 기능과 무관 — 이 테스트는
 *      점수 계산 자체를 검증하지 않는다(marriage-compare-table 등에서 별도 검증됨).
 *   2. axisNote는 intimacy(관계공감)/stability(계획구조화)에만 붙는다. conflict(홈
 *      리스크)는 스펙이 축을 지정하지 않아 대상이 아니다.
 *   3. psych(11축)가 없으면 axisNote는 undefined/null이고, 그 외 필드
 *      (title/subtitle/interpretation/isWarning)는 axisNote 유무와 무관하게 항상 동일해야
 *      한다(레거시 캐시·설문 미완료 페어에서 기존 동작이 깨지면 안 됨).
 *   4. axisNote 리졸버도 로케일 파라미터를 받는다 — en-US 리포트에서는
 *      axisNote도 영문으로 나가야 한다(과거엔 main interpretation만 pick()으로
 *      로케일 대응되고 axisNote는 국문 전용이던 사전 존재 갭을 이번에 수정).
 *
 * No DB, no LLM — 순수 함수라 결정론적으로 assert 가능.
 * Run: npx tsx tests/unit/marriage-relationship-index-axis-notes.test.mjs
 */
import assert from "node:assert/strict";
import {
  buildMarriageSnapshotNarrative,
  buildMarriageSnapshotNarrativeFromGauges,
} from "../../lib/relationship/marriage/buildMarriageSnapshotNarrative.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function psych(overrides = {}) {
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

function stubCtx(locale = "ko-KR") {
  return {
    locale,
    marriagePairAnalysis: { dayBranch: { bedFitLevel: "good" } },
    tenGod: { cfo: { nickname: "동글" } },
  };
}

const GAUGES = [
  { topic: "intimacy", activation: 70, benefit: 75, risk: 30 },
  { topic: "stability", activation: 65, benefit: 70, risk: 40 },
  { topic: "conflict", activation: 50, benefit: 40, risk: 45 },
];

function topicsFrom(narrative) {
  return Object.fromEntries(narrative.topics.map((t) => [t.topic, t]));
}

// ---------------------------------------------------------------------------
section("1) psych 없음 — axisNote는 intimacy/stability 둘 다 없고, 나머지 필드는 기존과 동일");

const withoutPsych = buildMarriageSnapshotNarrative({ ctx: stubCtx(), relationshipGauges: GAUGES });
const withNullPsych = buildMarriageSnapshotNarrative({
  ctx: stubCtx(),
  relationshipGauges: GAUGES,
  psychA: null,
  psychB: null,
});
const topicsWithout = topicsFrom(withoutPsych);
const topicsWithNull = topicsFrom(withNullPsych);

assert.equal(topicsWithout.conflict.axisNote, undefined, "conflict 토픽은 axisNote 필드 자체를 안 만듦");
for (const topic of ["intimacy", "stability"]) {
  assert.equal(topicsWithout[topic].axisNote, null, `${topic}: psych 인자 자체를 안 주면 axisNote는 null(리졸버가 항상 호출되지만 데이터 없어 null 반환)`);
  assert.equal(topicsWithNull[topic].axisNote, null, `${topic}: psychA/B=null이어도 axisNote null`);
}
for (const topic of ["intimacy", "stability", "conflict"]) {
  for (const key of ["title", "subtitle", "interpretation", "isWarning", "activation", "benefit", "risk"]) {
    assert.equal(topicsWithNull[topic][key], topicsWithout[topic][key]);
  }
}
ok("psych 인자 유무와 무관하게 axisNote 제외 전 필드는 완전히 동일 — 레거시 안전");

// ---------------------------------------------------------------------------
section("2) intimacy — 관계공감(empathy) 평균 高/低로 다른 axisNote");

const intimacyHigh = topicsFrom(
  buildMarriageSnapshotNarrative({
    ctx: stubCtx(),
    relationshipGauges: GAUGES,
    psychA: psych({ empathy: 80 }),
    psychB: psych({ empathy: 70 }),
  }),
).intimacy;
assert.equal(
  intimacyHigh.axisNote,
  "관계공감 축도 둘 다 높은 편이라, 사주로 보이는 로맨틱 핏이 실제 애정 표현으로도 잘 이어질 가능성이 커요.",
);
ok("관계공감 高(평균≥60) → 확인 문구");

const intimacyLow = topicsFrom(
  buildMarriageSnapshotNarrative({
    ctx: stubCtx(),
    relationshipGauges: GAUGES,
    psychA: psych({ empathy: 20 }),
    psychB: psych({ empathy: 30 }),
  }),
).intimacy;
assert.equal(
  intimacyLow.axisNote,
  "관계공감 축은 낮은 편이라, 핏이 좋아도 애정 표현으로 이어지려면 조금 더 의식적인 노력이 필요할 수 있어요.",
);
ok("관계공감 低(평균≤40) → 유보 문구");
assert.notEqual(intimacyHigh.axisNote, intimacyLow.axisNote);

const intimacyMid = topicsFrom(
  buildMarriageSnapshotNarrative({
    ctx: stubCtx(),
    relationshipGauges: GAUGES,
    psychA: psych({ empathy: 50 }),
    psychB: psych({ empathy: 50 }),
  }),
).intimacy;
assert.equal(intimacyMid.axisNote, null);
ok("중간대(40<평균<60) → null(억지로 문구 안 붙임)");

// ---------------------------------------------------------------------------
section("3) stability — 계획구조화(structure) 평균 高/低로 다른 axisNote");

const stabilityHigh = topicsFrom(
  buildMarriageSnapshotNarrative({
    ctx: stubCtx(),
    relationshipGauges: GAUGES,
    psychA: psych({ structure: 75 }),
    psychB: psych({ structure: 65 }),
  }),
).stability;
assert.equal(
  stabilityHigh.axisNote,
  "계획구조화 축도 둘 다 높은 편이라, 가사·재정·육아를 시스템으로 맞춰 가기 유리한 조합이에요.",
);
ok("계획구조화 高(평균≥60) → 확인 문구");

const stabilityLow = topicsFrom(
  buildMarriageSnapshotNarrative({
    ctx: stubCtx(),
    relationshipGauges: GAUGES,
    psychA: psych({ structure: 25 }),
    psychB: psych({ structure: 35 }),
  }),
).stability;
assert.equal(
  stabilityLow.axisNote,
  "계획구조화 축은 낮은 편이라, 역할 합의를 문서·루틴으로 명시해 두지 않으면 시너지가 흐지부지될 수 있어요.",
);
ok("계획구조화 低(평균≤40) → 유보 문구");
assert.notEqual(stabilityHigh.axisNote, stabilityLow.axisNote);

// ---------------------------------------------------------------------------
section("4) conflict 토픽엔 axisNote가 절대 안 붙는다(스펙이 축을 안 정함)");

const withStrongSignals = topicsFrom(
  buildMarriageSnapshotNarrative({
    ctx: stubCtx(),
    relationshipGauges: GAUGES,
    psychA: psych({ empathy: 90, structure: 90 }),
    psychB: psych({ empathy: 90, structure: 90 }),
  }),
).conflict;
assert.equal(withStrongSignals.axisNote, undefined);
ok("psych 신호가 아무리 강해도 conflict.axisNote는 항상 undefined");

// ---------------------------------------------------------------------------
section("5) 저장 복원 경로(buildMarriageSnapshotNarrativeFromGauges) — axisNote 없이 기존과 동일");

const restored = topicsFrom(buildMarriageSnapshotNarrativeFromGauges(GAUGES));
assert.equal(restored.intimacy.axisNote, null);
assert.equal(restored.stability.axisNote, null);
assert.equal(restored.conflict.axisNote, undefined);
ok("캐시 복원 경로에서는 psych 자체가 없어 intimacy/stability는 axisNote=null, conflict는 필드 자체가 없음");

// ---------------------------------------------------------------------------
section("6) en-US locale이면 axisNote도 영문으로 나간다");

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;
const enTopics = topicsFrom(
  buildMarriageSnapshotNarrative({
    ctx: stubCtx("en-US"),
    relationshipGauges: GAUGES,
    psychA: psych({ empathy: 80, structure: 80 }),
    psychB: psych({ empathy: 75, structure: 75 }),
  }),
);
assert.ok(!HANGUL_RE.test(enTopics.intimacy.axisNote ?? ""), "intimacy.axisNote는 en-US에서 한글 없음");
assert.ok(!HANGUL_RE.test(enTopics.stability.axisNote ?? ""), "stability.axisNote는 en-US에서 한글 없음");
assert.ok(!HANGUL_RE.test(enTopics.intimacy.interpretation), "intimacy.interpretation도 여전히 한글 없음(회귀 확인)");
ok("en-US ctx에서 axisNote도 영문으로 나감 — 로케일 갭 수정 확인");

const koTopics = topicsFrom(
  buildMarriageSnapshotNarrative({
    ctx: stubCtx("ko-KR"),
    relationshipGauges: GAUGES,
    psychA: psych({ empathy: 80, structure: 80 }),
    psychB: psych({ empathy: 75, structure: 75 }),
  }),
);
assert.notEqual(enTopics.intimacy.axisNote, koTopics.intimacy.axisNote);
assert.notEqual(enTopics.stability.axisNote, koTopics.stability.axisNote);
ok("동일 입력이라도 locale에 따라 axisNote가 실제로 달라짐(단순 통과가 아니라 진짜 분기)");

console.log("\nOK: marriage relationship-index axis-notes tests passed");
