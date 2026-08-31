/**
 * Romantic V4 — 11-axis relationship insight overhaul regression tests.
 *
 * Covers the original bug (every axis card sharing two boilerplate
 * sentences with only the axis name swapped in) AND the follow-up QA
 * findings from the production-path audit:
 *  - the hook/title line must be axis+state+direction-aware, not the old
 *    mechanical "differ -> friction" template shared across all axes;
 *  - asymmetric_extreme content must show how EACH side experiences the
 *    other, not just what mechanically differs;
 *  - no dangling "긴장/보완/공명" (tension/complement/resonance) label may
 *    leak into user-facing narrative text;
 *  - state-diversity may only act as a soft, near-tie tie-breaker — it must
 *    never be the reason a higher-significance axis is dropped;
 *  - classification thresholds are per-axis-relative (scoreToAxisRatio),
 *    matching each axis's real achievable [scoreMin, scoreMax] range
 *    (AXIS_GAP_PERCENTILES) instead of an unreachable absolute 0-100 scale.
 *
 * Run: npx tsx tests/unit/romantic-v4-axis-insight-diversity.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const {
  classifyAxisState,
  computeAxisSignificance,
  getAxisWhyItMatters,
  buildAxisRelationshipHook,
  selectAxisRelationshipInsights,
  STATE_REPEAT_SOFT_PENALTY: STATE_REPEAT_SOFT_PENALTY_FOR_TEST,
} = await import("../../lib/relationship/romantic/prototypeV4/axisRelationshipInsights.ts");
const { buildRomanticV4PrototypePayload } = await import(
  "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts"
);
const { buildNeutralV2Profile } = await import("../../lib/v2/survey/neutralProfile.ts");

const AXES = [
  "stimulation",
  "self_control",
  "practicality",
  "structure",
  "empathy",
  "resilience",
  "recognition",
  "energy_style",
  "thinking_style",
  "decision_style",
];
const STATES = ["both_high", "both_low", "both_mid", "asymmetric_extreme", "moderate_diff"];
const CALLOUT_AXES = [
  "thinking_style",
  "self_control",
  "practicality",
  "empathy",
  "resilience",
  "recognition",
  "decision_style",
];

const OLD_BOILERPLATE = [
  "차이가 정서적 소통 템포에 반영됩니다",
  "비슷한 성향으로 의사결정 시 높은 직관적 공감대를 형성합니다",
  "일상 대화에서 서로의 의도를 해석하고 기대를 갖는 방식과 바로 이어지는 부분이라, 반복되는 패턴을 이해하는 실마리가 됩니다",
];
// Retired generic hook template (buildAxisAttributionSentence, axis-swappable by design) —
// must never again be used for the Romantic V4 11-axis cards.
const OLD_HOOK_TEMPLATE_FRAGMENTS = ["서로 다른 방식을 쓰는 편이라 부딪히기 쉬워요", "모두 비슷한 방식이라 잘 맞는 편이에요", "서로 다른 역할을 맡는 편이에요"];
const DANGLING_TAG_PATTERN = /(긴장|보완|공명)\s*$/;

function makeProfile(overrides) {
  const base = buildNeutralV2Profile();
  return { ...base, secondary_axes: { ...base.secondary_axes, ...overrides } };
}

// Real per-axis achievable ranges (AXIS_GAP_PERCENTILES scoreMin/scoreMax) —
// fixtures below stay inside these so classification is exercised on data
// the actual scoring engine could really produce.
// stimulation 49-63, self_control 49-60, practicality 50-64, structure 50-66,
// empathy 49-64, conflict_style 48-55, resilience 41-56, recognition 49-57,
// energy_style 44-59, thinking_style 50-67, decision_style 50-69.

// ---------------------------------------------------------------------------
section("1) classifyAxisState is axis-relative (percentile of each axis's real range), not an absolute 0-100 cutoff");

assert.equal(classifyAxisState("stimulation", 61, 60, "similarity"), "both_high", "both near top of stimulation's real 49-63 range -> both_high");
assert.equal(classifyAxisState("resilience", 43, 44, "similarity"), "both_low", "both near bottom of resilience's real 41-56 range -> both_low");
assert.equal(classifyAxisState("practicality", 56, 57, "similarity"), "both_mid", "both mid-range and calibrated-typical gap -> both_mid");
assert.equal(classifyAxisState("structure", 52, 64, "tension"), "asymmetric_extreme", "one near the bottom, one near the top of structure's real range -> asymmetric_extreme");
assert.equal(classifyAxisState("structure", 64, 52, "tension"), "asymmetric_extreme", "mirrored (A high / B low vs A low / B high) still resolves to the same bucket");
assert.equal(classifyAxisState("recognition", 53, 53, "similarity"), "both_mid", "identical mid scores -> both_mid (the 'nothing to say' bucket)");
assert.equal(
  classifyAxisState("recognition", 53, 53, "tension"),
  "moderate_diff",
  "identical raw scores can still be a calibrated-unusual pairwise gap (match_type != similarity) -> moderate_diff, not silently both_mid",
);
// Old absolute cutoffs (>=70 / <=35) were unreachable for real users — every
// axis's real max tops out at 69 (decision_style) or lower.
assert.equal(classifyAxisState("stimulation", 63, 63, "similarity"), "both_high", "axis maximum (63) must classify as high under the real range, not fail an unreachable >=70 check");
ok("classification now keys off each axis's real achievable range + the existing calibrated match_type, not a universal absolute scale");

// ---------------------------------------------------------------------------
section("2) Full content bank: no two (axis, state) cells share identical text, in either locale");

for (const locale of ["ko-KR", "en-US"]) {
  const seen = new Map();
  for (const axis of AXES) {
    for (const state of STATES) {
      const text = getAxisWhyItMatters(axis, state, locale);
      assert.ok(text && text.length > 10, `${locale} ${axis}/${state} must have real content`);
      const dup = seen.get(text);
      assert.ok(!dup, `${locale}: ${axis}/${state} duplicates ${dup ? `${dup.axis}/${dup.state}` : ""} verbatim: "${text}"`);
      seen.set(text, { axis, state });
    }
  }
  ok(`${locale}: all ${AXES.length * STATES.length} (axis, state) cells are pairwise distinct`);
}

// ---------------------------------------------------------------------------
section("3) The 7 called-out axes: 5 states must be 5 genuinely distinct sentences");

for (const axis of CALLOUT_AXES) {
  const texts = STATES.map((state) => getAxisWhyItMatters(axis, state, "ko-KR"));
  const unique = new Set(texts);
  assert.equal(unique.size, STATES.length, `${axis}: expected ${STATES.length} distinct sentences, got ${unique.size}`);
}
ok(`${CALLOUT_AXES.join(", ")} each express 5 fully distinct relationship behaviors across states`);

// ---------------------------------------------------------------------------
section("4) Asymmetric directionality: EVERY axis's asymmetric_extreme line names how each side experiences the other");

// A neutral pattern any axis-swappable "what mechanically differs" sentence
// would also satisfy is NOT enough — require both a "one side" framing and
// an explicit differing-reaction verb pair, spot-checked via two markers
// that must both be present per axis (not just axis-label substitution).
for (const axis of AXES) {
  const text = getAxisWhyItMatters(axis, "asymmetric_extreme", "ko-KR");
  const hasBothSides = /(한\s*사람|한쪽|쪽은)/.test(text) && /(다른\s*사람|다른\s*쪽|상대)/.test(text);
  const hasFeelingVerb = /(느끼고|느낄 수|답답해|억울해|서운해|불만|오해|이해하기 어려|힘들어|지칠)/.test(text);
  assert.ok(hasBothSides, `${axis}/asymmetric_extreme must frame both "one side" and "the other side": "${text}"`);
  assert.ok(hasFeelingVerb, `${axis}/asymmetric_extreme must state how a side feels/reacts, not just what differs: "${text}"`);
}
ok("all 10 axes' asymmetric_extreme content names both sides' likely feeling/reaction, not just the mechanical difference");

// ---------------------------------------------------------------------------
section("5) Hook builder: axis+state+direction-aware, never the retired generic template, and mirrors correctly");

const hookHighDiff = buildAxisRelationshipHook({
  axisKey: "energy_style",
  state: "asymmetric_extreme",
  scoreA: 57,
  scoreB: 45,
  nameA: "Jaeyoung",
  nameB: "Somin",
  locale: "ko-KR",
});
const hookStructure = buildAxisRelationshipHook({
  axisKey: "structure",
  state: "asymmetric_extreme",
  scoreA: 52,
  scoreB: 64,
  nameA: "Jaeyoung",
  nameB: "Somin",
  locale: "ko-KR",
});
assert.notEqual(hookHighDiff, hookStructure, "different axes must not produce the same hook skeleton with only the axis name swapped");
for (const fragment of OLD_HOOK_TEMPLATE_FRAGMENTS) {
  assert.ok(!hookHighDiff.includes(fragment), `hook must not reuse the retired generic template: "${fragment}"`);
}
assert.ok(hookHighDiff.includes("Jaeyoung") || hookHighDiff.includes("Somin"), "asymmetric hook must name the higher/lower person");

const hookAHigh = buildAxisRelationshipHook({ axisKey: "structure", state: "asymmetric_extreme", scoreA: 64, scoreB: 52, nameA: "Jaeyoung", nameB: "Somin", locale: "ko-KR" });
const hookBHigh = buildAxisRelationshipHook({ axisKey: "structure", state: "asymmetric_extreme", scoreA: 52, scoreB: 64, nameA: "Jaeyoung", nameB: "Somin", locale: "ko-KR" });
assert.notEqual(hookAHigh, hookBHigh, "A-high/B-low and A-low/B-high must swap which name is cast as 'higher' — not be identical text");
ok("hooks differ by axis and correctly swap direction when A/B reverse");

// ---------------------------------------------------------------------------
section("6) Significance: shared extremity scores highly even at gap 0 (not gap-only)");

const sharedExtremeAtZeroGap = computeAxisSignificance({ axisKey: "empathy", state: "both_high", scoreA: 63, scoreB: 63, ownershipCollision: false });
const flatMidAtZeroGap = computeAxisSignificance({ axisKey: "practicality", state: "both_mid", scoreA: 57, scoreB: 57, ownershipCollision: false });
assert.ok(sharedExtremeAtZeroGap >= 10, `both-high at gap 0 must clear the selection floor, got ${sharedExtremeAtZeroGap}`);
assert.ok(sharedExtremeAtZeroGap > flatMidAtZeroGap * 2, "a shared extreme must score substantially higher than a flat mid-range axis at the same (zero) gap");
ok(`shared extreme significance (${sharedExtremeAtZeroGap}) clears the floor at gap 0, flat-mid (${flatMidAtZeroGap}) does not`);

// ---------------------------------------------------------------------------
section("7) State diversity is a soft near-tie nudge, never a hard gate that drops a higher-significance axis");

const nearTieHigher = computeAxisSignificance({ axisKey: "empathy", state: "moderate_diff", scoreA: 58, scoreB: 52, ownershipCollision: false });
const nearTieLower = computeAxisSignificance({ axisKey: "self_control", state: "both_high", scoreA: 58, scoreB: 57, ownershipCollision: false });
// Construct axisResults where 3 moderate_diff candidates would previously
// have forced the 3rd (highest of the three) out via the old hard gate.
const diversityAxisResults = [
  { axis_key: "recognition", score_a: 54, score_b: 51, gap: 3, match_type: "tension" }, // moderate_diff
  { axis_key: "structure", score_a: 52, score_b: 60, gap: 8, match_type: "tension" }, // moderate_diff
  { axis_key: "empathy", score_a: 58, score_b: 52, gap: 6, match_type: "tension" }, // moderate_diff, 3rd occurrence
  { axis_key: "self_control", score_a: 58, score_b: 57, gap: 1, match_type: "similarity" }, // both_high, fresh state
];
const { selected: diversitySelected } = selectAxisRelationshipInsights({ locale: "ko-KR", axisResults: diversityAxisResults, maxCount: 4 });
assert.equal(diversitySelected.length, 4, "all 4 real candidates must be selected when maxCount allows it — none padded, none dropped just for state variety");
assert.ok(diversitySelected.some((r) => r.axisKey === "empathy"), "the 3rd moderate_diff axis (empathy) must NOT be excluded purely for repeating a state when it still fits within maxCount");
ok("with room for all candidates, the soft diversity penalty does not exclude a meaningful 3rd-occurrence axis");

// A real forced-choice case: 5 candidates competing for 4 slots. Expectations
// are derived from computeAxisSignificance itself (not hand-guessed), so this
// stays correct regardless of the exact formula — the property under test is
// structural: whichever axis has the clearly lowest raw significance must be
// the one dropped, UNLESS it's within the soft state-repeat penalty's margin
// of a same-state axis ranked above it (a genuine near-tie).
const forcedChoiceResults = [
  { axis_key: "recognition", score_a: 56, score_b: 50, gap: 6, match_type: "tension" },
  { axis_key: "structure", score_a: 50, score_b: 65, gap: 15, match_type: "tension" },
  { axis_key: "empathy", score_a: 60, score_b: 51, gap: 9, match_type: "tension" },
  { axis_key: "practicality", score_a: 58, score_b: 52, gap: 6, match_type: "tension" },
  { axis_key: "energy_style", score_a: 48, score_b: 46, gap: 2, match_type: "tension" },
];
const rawByAxis = new Map(
  forcedChoiceResults.map((a) => [
    a.axis_key,
    computeAxisSignificance({
      axisKey: a.axis_key,
      state: classifyAxisState(a.axis_key, a.score_a, a.score_b, a.match_type),
      scoreA: a.score_a,
      scoreB: a.score_b,
      ownershipCollision: false,
    }),
  ]),
);
const sortedByRawDesc = [...rawByAxis.entries()].sort((a, b) => b[1] - a[1]);
const weakestAxis = sortedByRawDesc[sortedByRawDesc.length - 1][0];
const weakestRaw = sortedByRawDesc[sortedByRawDesc.length - 1][1];
const secondWeakestRaw = sortedByRawDesc[sortedByRawDesc.length - 2][1];

const { selected: forcedChoiceSelected } = selectAxisRelationshipInsights({
  locale: "ko-KR",
  axisResults: forcedChoiceResults,
  maxCount: 4,
});
assert.equal(forcedChoiceSelected.length, 4);

if (secondWeakestRaw - weakestRaw > STATE_REPEAT_SOFT_PENALTY_FOR_TEST) {
  // Not a near-tie — the diversity nudge must not be able to save/displace anything here.
  assert.ok(!forcedChoiceSelected.some((r) => r.axisKey === weakestAxis), `${weakestAxis} has the clearly lowest raw significance (${weakestRaw} vs next ${secondWeakestRaw}) and must be the one dropped`);
}
const top3ByRaw = sortedByRawDesc.slice(0, 3).map(([k]) => k);
for (const axisKey of top3ByRaw) {
  assert.ok(forcedChoiceSelected.some((r) => r.axisKey === axisKey), `${axisKey} is in the raw-significance top 3 of 5 and must survive a 5-into-4 cut regardless of state repetition`);
}
ok(
  `forced 5-into-4 choice (raw significance: ${sortedByRawDesc.map(([k, v]) => `${k}=${v}`).join(", ")}) keeps the top 3 unconditionally; selected: ${forcedChoiceSelected.map((r) => r.axisKey).join(", ")}`,
);

// ---------------------------------------------------------------------------
section("8) Pair fixtures (real achievable score ranges): highly similar / highly different / mixed (Sera x 동글)");

const fixtures = {
  highlySimilar: {
    nameA: "Yuna",
    nameB: "Minho",
    profileA: makeProfile({
      stimulation: 61, self_control: 50, practicality: 56, structure: 63, empathy: 61,
      conflict_style: 51, resilience: 43, recognition: 56, energy_style: 46,
      thinking_style: 57, decision_style: 58,
    }),
    profileB: makeProfile({
      stimulation: 60, self_control: 51, practicality: 57, structure: 62, empathy: 60,
      conflict_style: 52, resilience: 44, recognition: 55, energy_style: 47,
      thinking_style: 58, decision_style: 59,
    }),
  },
  highlyDifferent: {
    nameA: "Jaeyoung",
    nameB: "Somin",
    profileA: makeProfile({
      stimulation: 61, self_control: 50, practicality: 63, structure: 52, empathy: 62,
      conflict_style: 50, resilience: 54, recognition: 50, energy_style: 57,
      thinking_style: 51, decision_style: 67,
    }),
    profileB: makeProfile({
      stimulation: 50, self_control: 58, practicality: 51, structure: 64, empathy: 50,
      conflict_style: 54, resilience: 42, recognition: 56, energy_style: 45,
      thinking_style: 66, decision_style: 51,
    }),
  },
  // Real-fixture couple already used for QA (tests/scripts/export_sera_donggle_text.ts),
  // remapped into each axis's real achievable range (the original script's
  // raw overrides like self_control:70/recognition:75 exceed what the actual
  // scoring engine can ever produce — see QA finding on threshold sourcing).
  mixedSeraDonggle: {
    nameA: "Sera",
    nameB: "동글",
    profileA: makeProfile({ self_control: 55, recognition: 54, empathy: 58, structure: 53 }),
    profileB: makeProfile({ self_control: 51, recognition: 51, empathy: 52, structure: 60 }),
  },
};

for (const [fixtureName, { nameA, nameB, profileA, profileB }] of Object.entries(fixtures)) {
  section(`8.${fixtureName}) end-to-end diversity + no boilerplate + no dangling tag + no generic hook`);

  const payload = buildRomanticV4PrototypePayload("complete", "ko-KR", {
    surveyInput: { mode: "real", profileA, profileB },
    pairSajuInput: { mode: "dev_fixture", birthA: null, birthB: null, nameA, nameB },
  });

  const primary = payload.selectedAxisInsights;
  assert.ok(Array.isArray(primary) && primary.length > 0, `${fixtureName}: primary path must select at least one real insight`);

  const fallback = selectAxisRelationshipInsights({
    locale: "ko-KR",
    axisResults: payload.axisOverview,
    names: { nameA, nameB },
  }).selected;
  assert.ok(fallback.length > 0, `${fixtureName}: fallback path must also select at least one real insight`);

  for (const [pathName, rows] of [
    ["primary", primary],
    ["fallback", fallback],
  ]) {
    const whyTexts = rows.map((r) => r.whyItMatters);
    assert.equal(new Set(whyTexts).size, whyTexts.length, `${fixtureName}/${pathName}: expected all whyItMatters distinct`);

    const hooks = rows.map((r) => r.hook);
    assert.equal(new Set(hooks).size, hooks.length, `${fixtureName}/${pathName}: expected all hooks distinct`);
    for (const hook of hooks) {
      for (const fragment of OLD_HOOK_TEMPLATE_FRAGMENTS) {
        assert.ok(!hook.includes(fragment), `${fixtureName}/${pathName}: retired generic hook template leaked back in: "${hook}"`);
      }
      assert.ok(!DANGLING_TAG_PATTERN.test(hook), `${fixtureName}/${pathName}: hook must not end with a dangling tension/complement/resonance tag: "${hook}"`);
    }

    const stripped = rows.map((r) => r.whyItMatters.split(r.axisLabel).join("{AXIS}"));
    assert.equal(new Set(stripped).size, stripped.length, `${fixtureName}/${pathName}: sentences differ only by axis-label substitution, not real content`);

    for (const row of rows) {
      assert.ok(!DANGLING_TAG_PATTERN.test(row.whyItMatters.trim()), `${fixtureName}/${pathName}/${row.axisKey}: narrative body must not end with a dangling 긴장/보완/공명 tag`);
    }

    const joined = whyTexts.join(" ");
    for (const banned of OLD_BOILERPLATE) {
      assert.ok(!joined.includes(banned), `${fixtureName}/${pathName}: retired boilerplate line leaked back in: "${banned}"`);
    }
  }
  ok(`${fixtureName}: ${primary.length} primary / ${fallback.length} fallback cards, all distinct hooks+bodies, no boilerplate, no dangling tags`);
}

// ---------------------------------------------------------------------------
section("9) Mixed (Sera x 동글): axes with genuinely nothing to say (both_mid, tiny gap) are excluded, not padded in");

const seraDonggleAxisOverview = buildRomanticV4PrototypePayload("complete", "ko-KR", {
  surveyInput: { mode: "real", profileA: fixtures.mixedSeraDonggle.profileA, profileB: fixtures.mixedSeraDonggle.profileB },
  pairSajuInput: { mode: "dev_fixture", birthA: null, birthB: null, nameA: "Sera", nameB: "동글" },
}).axisOverview;

const { selected: seraDonggleSelected } = selectAxisRelationshipInsights({
  locale: "ko-KR",
  axisResults: seraDonggleAxisOverview,
  names: { nameA: "Sera", nameB: "동글" },
});
const selectedKeys = seraDonggleSelected.map((r) => r.axisKey);

// NOTE (threshold-audit finding): "identical score" is no longer a safe proxy
// for "nothing to say" under axis-relative classification — the survey's flat
// SCORE_BASELINE (50) sits near the achievable FLOOR for some axes (e.g.
// stimulation's real range is 49-63, so an untouched 50/50 pair reads as
// both_low, a real shared-extremity signal, not noise). This test instead
// asserts on the actual classification: only axes BOTH untouched from
// baseline AND still classified both_mid (i.e. 50 lands mid-range for that
// specific axis) must be excluded.
const bothMidUntouched = seraDonggleAxisOverview
  .filter((a) => a.axis_key !== "conflict_style" && a.score_a === a.score_b)
  .filter((a) => classifyAxisState(a.axis_key, a.score_a, a.score_b, a.match_type) === "both_mid")
  .map((a) => a.axis_key);
assert.ok(bothMidUntouched.length > 0, "sanity: the Sera x 동글 fixture should still have at least one genuinely both_mid untouched axis");
for (const flatAxis of bothMidUntouched) {
  assert.ok(!selectedKeys.includes(flatAxis), `both_mid untouched axis "${flatAxis}" must not be selected just to fill card slots`);
}

// Separately surface (not fail on) the baseline-near-floor quirk itself.
const untouchedButNotMid = seraDonggleAxisOverview
  .filter((a) => a.axis_key !== "conflict_style" && a.score_a === a.score_b)
  .map((a) => ({ axis: a.axis_key, state: classifyAxisState(a.axis_key, a.score_a, a.score_b, a.match_type) }))
  .filter((r) => r.state !== "both_mid");
if (untouchedButNotMid.length > 0) {
  console.log(
    `  note: baseline 50/50 (untouched from survey default) classifies as NON-mid for ${untouchedButNotMid.length} axis(es) — ${untouchedButNotMid.map((r) => `${r.axis}=${r.state}`).join(", ")}. This reflects SCORE_BASELINE sitting near that axis's real floor/ceiling, not a classifier bug — see QA threshold-audit note.`,
  );
}
ok(`${bothMidUntouched.length} genuinely both_mid untouched axes (${bothMidUntouched.join(", ")}) correctly excluded; selected ${selectedKeys.join(", ")}`);

console.log("\nOK: romantic-v4-axis-insight-diversity tests passed");
