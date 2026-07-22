/**
 * Romantic Phase 4-2 Batch 2 — Part1① 종합 관계 지수(친밀·끌림/갈등·긴장)에
 * 11축(관계공감/갈등직면성) 확인 문구(axisNote)를 추가한 것에 대한 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. computeRelationshipEventScores의 원점수/grade는 이 기능과 무관 — 이 테스트는
 *      점수 계산 자체를 검증하지 않는다(다른 곳에서 이미 검증됨).
 *   2. axisNote는 intimacy/conflict에만 붙는다. stability는 스펙이 축을 지정하지
 *      않아 대상이 아니다.
 *   3. profile(11축)이 없으면 axisNote는 undefined/null이고, 그 외 필드
 *      (title/subtitle/interpretation/isWarning)는 axisNote 유무와 무관하게 항상 동일해야
 *      한다(레거시 캐시·설문 미완료 페어에서 기존 동작이 깨지면 안 됨).
 *   4. interpretTopic/buildSnapshotNarrative는 로케일 파라미터가 없는 국문 전용
 *      함수다(사전 존재 갭) — axisNote도 en-US 요청에서 그대로 한글로 나간다는 것을
 *      이 테스트가 명시적으로 고정해 둔다(향후 로케일 지원 작업 시 이 assert를
 *      고쳐야 한다는 신호가 되도록).
 *
 * No DB, no LLM — 순수 함수 + 실제 saju 계산 파이프라인만으로 검증.
 * Run: npx tsx tests/unit/romantic-relationship-index-axis-notes.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveIntimacyAxisNote,
  resolveConflictAxisNote,
} from "../../lib/relationship/romanticRules/relationshipDynamics.ts";
import {
  interpretTopic,
  buildSnapshotNarrativeFromGauges,
} from "../../lib/relationship/romanticSnapshot/buildSnapshotNarrative.ts";
import { buildRomanticSnapshotPanel } from "../../lib/relationship/romanticSnapshot/buildRomanticSnapshot.ts";
import { buildRomanticRuleContext } from "../../lib/relationship/romanticRules/index.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const INTIMACY_HIGH_NOTE =
  "관계공감 축도 둘 다 높은 편이라, 사주로 보이는 끌림이 실제 느낌으로도 잘 이어질 가능성이 커요.";
const INTIMACY_LOW_NOTE =
  "관계공감 축은 낮은 편이라, 끌림이 있어도 표현으로 이어지려면 조금 더 의식적인 노력이 필요할 수 있어요.";
const CONFLICT_GAP_NOTE =
  "갈등을 대하는 방식(갈등직면성) 격차도 큰 편이라, 부딪힐 때 체감 긴장이 사주 신호보다 더 크게 느껴질 수 있어요.";

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

function fullProfile(overrides = {}) {
  return {
    profile_type: "current_self",
    primary_axes: {
      autonomy: 50,
      connection: 50,
      stability: 50,
      growth: 50,
      structure: 50,
      adaptability: 50,
    },
    secondary_axes: profile(overrides).secondary_axes,
    personalization: { primary_concern: null },
    meta: { survey_version: "v2", completed_at: new Date().toISOString(), completion_time_seconds: null },
  };
}

function sajuFromBirth(birthDate) {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };
}

// ---------------------------------------------------------------------------
section("1) resolveIntimacyAxisNote — 높은/낮은 관계공감이 서로 다른 문구를 낸다");

assert.equal(resolveIntimacyAxisNote(null, profile()), null);
ok("profile 없으면 null");

const intimacyHigh = resolveIntimacyAxisNote(profile({ empathy: 80 }), profile({ empathy: 70 }));
assert.equal(intimacyHigh, INTIMACY_HIGH_NOTE);
ok("관계공감 高(평균≥60) → 확인 문구");

const intimacyLow = resolveIntimacyAxisNote(profile({ empathy: 20 }), profile({ empathy: 30 }));
assert.equal(intimacyLow, INTIMACY_LOW_NOTE);
ok("관계공감 低(평균≤40) → 유보 문구");

assert.notEqual(intimacyHigh, intimacyLow);
ok("高/低 문구는 서로 다른 텍스트 — 단순 존재 여부가 아니라 방향까지 구분됨");

assert.equal(resolveIntimacyAxisNote(profile({ empathy: 50 }), profile({ empathy: 50 })), null);
ok("중간대(40<평균<60) → null(억지로 문구 안 붙임)");

// ---------------------------------------------------------------------------
section("2) resolveConflictAxisNote — 격차 大/小로 갈리고, 격차 방향과 무관하게 대칭이다");

assert.equal(resolveConflictAxisNote(undefined, profile()), null);
ok("profile 없으면 null");

const conflictAHigh = resolveConflictAxisNote(
  profile({ conflict_style: 90 }),
  profile({ conflict_style: 20 }),
);
assert.equal(conflictAHigh, CONFLICT_GAP_NOTE);
ok("A 高·B 低, 격차≥30 → 확인 문구");

const conflictBHigh = resolveConflictAxisNote(
  profile({ conflict_style: 20 }),
  profile({ conflict_style: 90 }),
);
assert.equal(conflictBHigh, CONFLICT_GAP_NOTE);
ok("A 低·B 高(반대 방향), 격차≥30 → 동일한 확인 문구(대칭 — 어느 쪽이 높은지는 구분하지 않고 '격차 존재'만 판정)");

assert.equal(
  resolveConflictAxisNote(profile({ conflict_style: 55 }), profile({ conflict_style: 50 })),
  null,
);
ok("격차 小(<30) → null");

// ---------------------------------------------------------------------------
section("3) stability 토픽엔 axisNote가 붙지 않는다");

const restored = buildSnapshotNarrativeFromGauges([
  { topic: "intimacy", activation: 70, benefit: 75, risk: 30 },
  { topic: "stability", activation: 60, benefit: 65, risk: 40 },
  { topic: "conflict", activation: 50, benefit: 40, risk: 60 },
]);
const stabilityFromCache = restored.topics.find((t) => t.topic === "stability");
assert.equal(stabilityFromCache.axisNote, undefined);
ok("캐시 복원 경로에서도 stability.axisNote는 undefined");

// ---------------------------------------------------------------------------
section("4) profile 없을 때 — axisNote 이외 필드는 기존 동작과 완전히 동일하다(회귀 안전)");

const gauge = { topic: "intimacy", activation: 70, benefit: 75, risk: 30 };
const withoutAxisNoteArg = interpretTopic(gauge); // 옛 2-arg 호출부와 동일한 형태
const withNullAxisNote = interpretTopic(gauge, undefined, null);
const withUndefinedAxisNote = interpretTopic(gauge, undefined, undefined);

for (const key of ["title", "subtitle", "interpretation", "isWarning", "activation", "benefit", "risk"]) {
  assert.equal(withNullAxisNote[key], withoutAxisNoteArg[key]);
  assert.equal(withUndefinedAxisNote[key], withoutAxisNoteArg[key]);
}
ok("axisNote 인자 유무와 무관하게 title/subtitle/interpretation/isWarning/점수 필드는 항상 동일");

assert.equal(
  withoutAxisNoteArg.interpretation,
  "단둘이 감정을 나눌 때는 최고예요. 매력과 함께 있을 때의 즐거움이 크게 올라옵니다. 긴장은 낮은 편이라, 설레는 마음을 즐기기 좋아요.",
);
ok("기존 interpretation 문구 자체가 이번 변경으로 한 글자도 안 바뀜(고정 스냅샷)");

// ---------------------------------------------------------------------------
section("5) 통합 — buildRomanticRuleContext → buildRomanticSnapshotPanel까지 axisNote가 전달된다(renderer 입력 확인)");

const ctxKo = buildRomanticRuleContext({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuFromBirth("1990-05-15"),
  sajuJsonB: sajuFromBirth("1992-08-20"),
  surveyProfileA: fullProfile({ empathy: 80, conflict_style: 90 }),
  surveyProfileB: fullProfile({ empathy: 75, conflict_style: 20 }),
  locale: "ko",
});
const panelKo = buildRomanticSnapshotPanel(ctxKo, {
  gaugeLabel: "테스트",
  representativeLine: "테스트 라인",
});
const topicsKo = Object.fromEntries(panelKo.narrative.topics.map((t) => [t.topic, t]));

assert.equal(typeof topicsKo.intimacy.axisNote, "string");
assert.equal(typeof topicsKo.conflict.axisNote, "string");
assert.equal(topicsKo.stability.axisNote, undefined);
ok("panel.narrative.topics — intimacy/conflict엔 axisNote 문자열, stability엔 없음(TriScoreSnapshotPanel이 그대로 받는 최종 shape)");

console.log("\n[표본 출력 — main interpretation vs axisNote 의미 비교]");
console.log("intimacy.interpretation:", topicsKo.intimacy.interpretation);
console.log("intimacy.axisNote      :", topicsKo.intimacy.axisNote);
console.log("conflict.interpretation:", topicsKo.conflict.interpretation);
console.log("conflict.axisNote      :", topicsKo.conflict.axisNote);

// ---------------------------------------------------------------------------
section("6) [알려진 갭, 의도적으로 고정] en-US 요청에서도 axisNote는 한글로 나간다");

const ctxEn = buildRomanticRuleContext({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuFromBirth("1990-05-15"),
  sajuJsonB: sajuFromBirth("1992-08-20"),
  surveyProfileA: fullProfile({ empathy: 80, conflict_style: 90 }),
  surveyProfileB: fullProfile({ empathy: 75, conflict_style: 20 }),
  locale: "en",
});
const panelEn = buildRomanticSnapshotPanel(ctxEn, {
  gaugeLabel: "test",
  representativeLine: "test line",
});
const topicsEn = Object.fromEntries(panelEn.narrative.topics.map((t) => [t.topic, t]));
const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;

assert.ok(
  HANGUL_RE.test(topicsEn.intimacy.axisNote ?? ""),
  "TODO(romantic locale): interpretTopic/buildSnapshotNarrative에 로케일 파라미터가 없어서 " +
    "en-US 리포트에서도 이 카드 전체(title/interpretation/axisNote)가 한글로 나간다. " +
    "이 assert는 '고쳐야 할 버그가 남아있다'를 능동적으로 표시하는 용도 — 로케일 지원을 " +
    "추가하면 이 assert가 깨지도록 일부러 반대 방향으로 걸어 둔다. 그때 이 테스트를 갱신할 것.",
);
ok("en 요청에서도 axisNote가 국문 그대로임을 확인(사전 존재 로케일 갭, 이번 배치 범위 아님 — TODO로 고정)");

console.log("\nOK: romantic relationship-index axis-notes tests passed");
