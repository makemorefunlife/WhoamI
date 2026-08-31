/**
 * Romantic Phase 4-4 Batch 4 — Part2① 서로 비교 성향표(comparison_table)에
 * 11축 6대 대조 지표를 digest로 주입한 것에 대한 회귀 테스트.
 *
 * 핵심 불변식:
 *   1. profile(11축) 없으면(레거시·설문 미완료) digest 문자열이 이전과 완전히
 *      동일해야 한다(byte-identical) — romantic_signals(사주 6축) 블록은
 *      이번 변경으로 절대 안 바뀐다.
 *   2. profile이 있으면 6개 참고 라인이 COMPARISON_TABLE_AXIS_MAP과 정확히
 *      같은 순서·값으로 나온다(Phase 5-4: supporting context — 「대응」이 아닌 「참고」).
 *   3. 사주(romantic_signals) 블록 자체의 값은 profile 유무와 무관하게 항상
 *      동일하다 — 11축은 추가 블록일 뿐 사주 블록을 건드리지 않는다.
 *   4. Phase 5-4: 「결합」·재판정 유도 문구 없음. lean 있으면 Server classification
 *      canonical + eleven_axes supporting only.
 *
 * No DB, no LLM — buildRomanticPersonSignalsDigest는 순수 함수라 문자열
 * 자체를 결정론적으로 assert 가능. LLM이 이 근거를 실제로 잘 쓰는지는
 * 검증 불가(Batch 3와 동일한 한계).
 * Run: npx tsx tests/unit/romantic-person-digest-eleven-axes.test.mjs
 */
import assert from "node:assert/strict";
import { buildRomanticPersonSignalsDigest } from "../../lib/relationship/romanticSajuPromptDigest.ts";

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

function fakeMaster(overrides = {}) {
  return {
    domain_signals: {
      romantic_signals: {
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
      },
    },
    johu_climate: {
      temperature_band: "neutral",
      heat_score: 50,
      moisture_score: 50,
      element_counts: { wood: 1, fire: 1, earth: 1, metal: 1, water: 1 },
    },
    special_signals: [],
    relation_dynamics: [],
    pillars: [
      { label_ko: "년주", pillar_hangul: "갑자" },
      { label_ko: "월주", pillar_hangul: "을축" },
      { label_ko: "일주", pillar_hangul: "병인" },
      { label_ko: "시주", pillar_hangul: "정묘" },
    ],
    stem_focus: { day_stem_kor_name: "병", day_stem_code: "byeong", day_branch_code: "in" },
    ...overrides,
  };
}

const baseParams = {
  nickname: "Alex",
  birthDate: "1990-05-15",
  birthTime: "12:00",
  birthPlace: "Seoul",
  master: fakeMaster(),
};

// ---------------------------------------------------------------------------
section("1) profile 없음 — 기존과 완전히 동일한 digest(레거시 안전)");

const withoutProfile = buildRomanticPersonSignalsDigest(baseParams);
const withNullProfile = buildRomanticPersonSignalsDigest({ ...baseParams, profile: null });
const withUndefinedProfile = buildRomanticPersonSignalsDigest({ ...baseParams, profile: undefined });

assert.equal(withNullProfile, withoutProfile);
assert.equal(withUndefinedProfile, withoutProfile);
ok("profile을 안 주거나 null/undefined로 줘도 digest 문자열이 완전히 동일");

assert.ok(!withoutProfile.includes("eleven_axes"), "profile 없으면 eleven_axes 블록 자체가 없어야 함");
assert.ok(
  withoutProfile.includes("romantic_signals 6축을 comparison_table의 6개 aspect와 그대로 매칭"),
  "profile 없으면 기존 경고 문구(romantic_signals만 언급) 그대로 유지",
);
ok("eleven_axes 블록 및 관련 안내 문구가 profile 없을 때 정확히 생략됨");

// ---------------------------------------------------------------------------
section("2) profile 있음 — 6개 대응 라인이 정확한 순서·값으로 포함된다");

const withProfile = buildRomanticPersonSignalsDigest({
  ...baseParams,
  profile: profile({
    energy_style: 71,
    conflict_style: 62,
    empathy: 53,
    self_control: 44,
    decision_style: 35,
    structure: 26,
  }),
});

const expectedLines = [
  "· 감정 표현 참고: 외향성 71",
  "· 갈등 반응 참고: 갈등대처 62",
  "· 애정 언어 참고: 관계공감 53",
  "· 스트레스 패턴 참고: 자기통제 44",
  "· 의사결정 참고: 신중함 35",
  "· 소통 방식 참고: 계획성 26",
];
for (const line of expectedLines) {
  assert.ok(withProfile.includes(line), `digest에 "${line}" 라인이 포함되어야 함`);
}
ok("6개 참고 라인이 COMPARISON_TABLE_AXIS_MAP과 정확히 같은 순서·값으로 포함됨");

const axesBlockIndex = withProfile.indexOf("eleven_axes");
const firstLineIndex = withProfile.indexOf(expectedLines[0]);
const lastLineIndex = withProfile.indexOf(expectedLines[5]);
assert.ok(axesBlockIndex < firstLineIndex && firstLineIndex < lastLineIndex);
ok("eleven_axes 헤더 → 감정표현 → ... → 소통방식 순서로 나옴(COMPARISON_TABLE_AXIS_MAP 순서 그대로)");

assert.ok(
  withProfile.includes("supporting context only"),
  "profile 있으면 eleven_axes가 supporting context로만 안내되어야 함",
);
assert.ok(
  withProfile.includes("romantic_signals 6축 band가 comparison_table의 canonical classification"),
  "lean 없을 때 romantic_signals band가 canonical",
);
assert.doesNotMatch(
  withProfile,
  /결합해서|두 소스를 결합/,
  "Phase 5-4: 「결합」재판정 유도 문구 금지",
);
ok("profile 있을 때 grounding — supporting only, no combine");

// ---------------------------------------------------------------------------
section("3) 사주(romantic_signals) 블록 자체는 profile 유무와 무관하게 항상 동일하다");

function extractRomanticSignalsBlock(digest) {
  const start = digest.indexOf("- romantic_signals(");
  const candidates = ["\n- eleven_axes", "\n⚠️"]
    .map((marker) => digest.indexOf(marker, start))
    .filter((idx) => idx !== -1);
  const end = candidates.length ? Math.min(...candidates) : digest.length;
  return digest.slice(start, end);
}

const sajuBlockWithout = extractRomanticSignalsBlock(withoutProfile);
const sajuBlockWith = extractRomanticSignalsBlock(withProfile);
assert.equal(sajuBlockWith, sajuBlockWithout);
ok("romantic_signals 블록 내용은 profile 유무와 무관하게 완전히 동일 — 11축은 순수 추가 블록");

// ---------------------------------------------------------------------------
section("4) Phase 5-4 — lean + profile → Server classification canonical");

const withLeanAndProfile = buildRomanticPersonSignalsDigest({
  ...baseParams,
  profile: profile({
    energy_style: 71,
    conflict_style: 62,
    empathy: 53,
    self_control: 44,
    decision_style: 35,
    structure: 26,
  }),
  expressionLean: { lean: "expressive", base: "steady" },
  conflictLean: { lean: "principled", base: "steady" },
  affectionLean: { lean: "emotional_care", base: "steady" },
  stressLean: { lean: "withdrawn", base: "steady" },
  decisionLean: { lean: "consultative", base: "steady" },
  communicationLean: { lean: "considerate", base: "steady" },
});

assert.ok(
  withLeanAndProfile.includes("Server classification is canonical"),
  "lean 있으면 Server classification canonical 문구",
);
assert.ok(
  withLeanAndProfile.includes("supporting context only"),
  "lean 있어도 eleven_axes는 supporting context",
);
assert.ok(
  withLeanAndProfile.includes(
    "do not reinterpret, reclassify, rescore, or override",
  ),
  "재분류·재판정 금지 명시",
);
assert.doesNotMatch(withLeanAndProfile, /결합해서|두 소스를 결합|결합하되/);
assert.ok(withLeanAndProfile.includes("서버 lean=expressive"));
assert.ok(withLeanAndProfile.includes("감정 표현 참고: 외향성 71"));
assert.ok(
  withLeanAndProfile.includes("corroboration/background"),
  "lean 경로 eleven_axes 헤더가 corroboration/background",
);
assert.doesNotMatch(
  withLeanAndProfile,
  /같은 순서로 6개 행에 대응/,
  "lean 경로에서 eleven_axes를 대응 입력으로 읽히게 하면 안 됨",
);
ok("lean+profile grounding snapshot");

console.log("\nOK: romantic person digest eleven-axes tests passed");
