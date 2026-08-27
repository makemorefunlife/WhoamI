/**
 * Friend Treasurer Gold Logic Vertical Slice Characterization Tests.
 *
 * Covers:
 *  1. Strong Saju A lead, Survey confirms
 *  2. Strong Saju A lead, Survey disagrees but cannot flip
 *  3. Saju gap below lock, Survey gap flips to B
 *  4. Exact tie resolved by 정재 count
 *  5. Full tie defaults to A with caution
 *  6. Real survey score 50 is observed
 *  7. Missing survey neutral 50 is synthetic
 *  8. Synthetic survey cannot flip Saju
 *  9. Unknown birth time uses available pillars and caps confidence if required
 * 10. V1 output and new canonical output select the same person
 * 11. Locked V1 copy remains identical
 *
 * Run: npx tsx tests/unit/friend-treasurer-vertical-slice.test.mjs
 */
import assert from "node:assert/strict";
import {
  computeSajuTreasurerScore,
  computePsychTreasurerAvg,
  extractFriendTreasurerPairFacts,
  resolveFriendTreasurerCanonical,
  buildFriendTreasurerCanonical,
  treasurerSideFromNickname,
  readFriendTreasurerCanonicalProjection,
  formatFriendTreasurerCanonicalLabel,
  SAJU_TREASURER_LOCK,
  COMPOSITE_MARGIN,
  PSYCH_FLIP_GAP,
} from "../../lib/relationship/friend/friendTreasurerCanonical.ts";
import {
  pickFriendTreasurer,
  buildFriendTreasurerReason,
} from "../../lib/relationship/friend/friendDeEscalationPrescriptions.ts";
import { refineFriendTreasurer } from "../../lib/relationship/friend/friendPsychFit.ts";
import { evaluateFriendLenses } from "../../lib/relationship/domainLenses/friend/friendLenses.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function samplePsych(overrides = {}) {
  const keys = [
    "stimulation",
    "self_control",
    "practicality",
    "structure",
    "empathy",
    "conflict_style",
    "resilience",
    "recognition",
    "energy_style",
    "thinking_style",
    "decision_style",
  ];
  const secondary_axes = Object.fromEntries(keys.map((k) => [k, 50]));
  Object.assign(secondary_axes, overrides);
  return {
    schema_version: "psych_master_v1",
    secondary_axes,
    survey_source: "v2_10q",
    survey_completed_at: "2026-08-04T00:00:00Z",
    survey_input_fingerprint: "test_fp",
    home_life_dna: {
      lifestyle_title: "t",
      family_identity_category: "balanced",
      family_identity_line: "l",
      life_values_line: "v",
      private_home_self_line: "p",
      energy_battery_line: "e",
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Strong Saju A lead, Survey confirms
// ─────────────────────────────────────────────────────────────────────────────
section("1) Strong Saju A lead, Survey confirms");
{
  const countsA = { 정재: 2, 정관: 1 }; // 2*3 + 1*2 = 8
  const countsB = { 편재: 1 }; // 1*1 = 1
  const psychA = samplePsych({ practicality: 85, structure: 85 }); // avg 85
  const psychB = samplePsych({ practicality: 30, structure: 30 }); // avg 30

  const res = resolveFriendTreasurerCanonical({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    psychA,
    psychB,
    locale: "ko-KR",
  });

  assert.equal(res.base_selection, "A");
  assert.equal(res.final_selection, "A");
  assert.equal(res.selected_nickname, "Alex");
  assert.equal(res.flipped_by_survey, false);
  assert.equal(res.align, "confirms");
  assert.equal(res.confidence, "high");
  assert.equal(res.survey_evidence_status, "observed");
  assert.equal(res.pair_facts.saju_locked, true);
  ok("Strong Saju A lead + Survey confirmation -> A selected with confirms / high confidence");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Strong Saju A lead, Survey disagrees but cannot flip
// ─────────────────────────────────────────────────────────────────────────────
section("2) Strong Saju A lead, Survey disagrees but cannot flip");
{
  const countsA = { 정재: 2 }; // 6
  const countsB = { 편재: 1 }; // 1
  // Saju diff = 5 >= 2 (locked)
  const psychA = samplePsych({ practicality: 20, structure: 20 }); // avg 20
  const psychB = samplePsych({ practicality: 90, structure: 90 }); // avg 90
  // Composite A = 60 + 20 = 80, Composite B = 10 + 90 = 100 -> Composite favors B (diff -20)
  // BUT sajuLocked is true -> survey cannot flip locked Saju

  const res = resolveFriendTreasurerCanonical({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    psychA,
    psychB,
    locale: "ko-KR",
  });

  assert.equal(res.base_selection, "A");
  assert.equal(res.final_selection, "A");
  assert.equal(res.selected_nickname, "Alex");
  assert.equal(res.flipped_by_survey, false);
  assert.equal(res.align, "caution");
  assert.equal(res.confidence, "low");
  assert.equal(res.pair_facts.saju_locked, true);
  assert.match(res.reason, /설문 축은 엇갈려 있어요/);
  ok("Strong Saju A lead cannot be flipped by Survey; yields caution with low confidence");
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Saju gap below lock, Survey gap flips to B
// ─────────────────────────────────────────────────────────────────────────────
section("3) Saju gap below lock, Survey gap flips to B");
{
  const countsA = { 편재: 1 }; // 1
  const countsB = {}; // 0
  // Saju diff = 1 < 2 (NOT locked) -> Base A
  const psychA = samplePsych({ practicality: 25, structure: 25 }); // avg 25
  const psychB = samplePsych({ practicality: 85, structure: 85 }); // avg 85
  // Composite A = 10 + 25 = 35, Composite B = 0 + 85 = 85 -> Composite diff = -50 <= -12 (Winner B)
  // Psych diff = 60 >= 20 -> clearFlip triggers!

  const res = resolveFriendTreasurerCanonical({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    psychA,
    psychB,
    locale: "ko-KR",
  });

  assert.equal(res.base_selection, "A");
  assert.equal(res.final_selection, "B");
  assert.equal(res.selected_nickname, "Jordan");
  assert.equal(res.flipped_by_survey, true);
  assert.equal(res.align, "caution");
  assert.equal(res.confidence, "high");
  assert.match(res.reason, /Jordan이\(가\) 이 우정의 절대적 총무입니다/);
  assert.match(res.reason, /설문 축은 엇갈려 있어요/);
  ok("Weak Saju lead is legitimately flipped to B by strong observed Survey");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Exact tie resolved by 정재 count
// ─────────────────────────────────────────────────────────────────────────────
section("4) Exact tie resolved by 정재 count");
{
  // A has 정재 1 (3 points)
  // B has 정관 1 + 편재 1 (2 + 1 = 3 points)
  const countsA = { 정재: 1 };
  const countsB = { 정관: 1, 편재: 1 };

  const res = resolveFriendTreasurerCanonical({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    locale: "ko-KR",
  });

  assert.equal(res.pair_facts.saju_treasurer_score_a, 3);
  assert.equal(res.pair_facts.saju_treasurer_score_b, 3);
  assert.equal(res.base_selection, "A");
  assert.equal(res.final_selection, "A");
  assert.equal(res.selected_nickname, "Alex");
  assert.equal(res.align, null); // Not a full tie; resolved cleanly by 정재
  assert.equal(res.confidence, "medium");
  ok("Exact Saju score tie broken in favor of higher 정재 count");
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Full tie defaults to A with caution
// ─────────────────────────────────────────────────────────────────────────────
section("5) Full tie defaults to A with caution");
{
  const countsA = { 정관: 1 }; // 2 points, 정재 0
  const countsB = { 정관: 1 }; // 2 points, 정재 0

  const res = resolveFriendTreasurerCanonical({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    locale: "ko-KR",
  });

  assert.equal(res.pair_facts.saju_treasurer_score_a, 2);
  assert.equal(res.pair_facts.saju_treasurer_score_b, 2);
  assert.equal(res.base_selection, "A");
  assert.equal(res.final_selection, "A");
  assert.equal(res.selected_nickname, "Alex");
  assert.equal(res.align, "caution");
  assert.equal(res.confidence, "low");
  assert.match(res.reason, /설문 축은 엇갈려 있어요/);
  ok("Full score and 정재 tie defaults to A with caution status and low confidence");
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Real survey score 50 is observed
// ─────────────────────────────────────────────────────────────────────────────
section("6) Real survey score 50 is observed");
{
  const countsA = { 정재: 1 };
  const countsB = {};
  const psychA = samplePsych({ practicality: 50, structure: 50 });
  const psychB = samplePsych({ practicality: 50, structure: 50 });

  const res = resolveFriendTreasurerCanonical({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    psychA,
    psychB,
    locale: "ko-KR",
  });

  assert.equal(res.survey_evidence_status, "observed");
  assert.deepEqual(res.psych_scores, { a: 50, b: 50 });
  ok("Real survey with neutral scores (50) is marked observed with psych_scores");
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Missing survey neutral 50 is synthetic
// ─────────────────────────────────────────────────────────────────────────────
section("7) Missing survey neutral 50 is synthetic");
{
  const countsA = { 정재: 1 };
  const countsB = {};

  const res = resolveFriendTreasurerCanonical({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    psychA: null,
    psychB: null,
    locale: "ko-KR",
  });

  assert.equal(res.survey_evidence_status, "unobserved");
  assert.equal(res.psych_scores, null);
  assert.equal(res.pair_facts.psych_treasurer_avg_a, 50); // synthetic fallback
  assert.equal(res.pair_facts.psych_treasurer_avg_b, 50); // synthetic fallback
  ok("Missing survey is marked unobserved and psych_scores is null");
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Synthetic survey cannot flip Saju
// ─────────────────────────────────────────────────────────────────────────────
section("8) Synthetic survey cannot flip Saju");
{
  const countsA = { 편재: 1 }; // 1 point -> Base A
  const countsB = {}; // 0 points

  // Partial or unobserved survey
  const res = resolveFriendTreasurerCanonical({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    psychA: null,
    psychB: samplePsych({ practicality: 99, structure: 99 }), // partial
    locale: "ko-KR",
  });

  assert.equal(res.survey_evidence_status, "partial_inference");
  assert.equal(res.base_selection, "A");
  assert.equal(res.final_selection, "A");
  assert.equal(res.flipped_by_survey, false);
  ok("Synthetic/unobserved survey cannot trigger a flip under any circumstance");
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Unknown birth time uses available pillars and caps confidence if required
// ─────────────────────────────────────────────────────────────────────────────
section("9) Unknown birth time uses available pillars and caps confidence if required");
{
  const countsA = { 정재: 2, 정관: 1 }; // 8 points
  const countsB = { 편재: 1 }; // 1 point
  const psychA = samplePsych({ practicality: 80, structure: 80 });
  const psychB = samplePsych({ practicality: 20, structure: 20 });

  // Known hour -> confidence "high"
  const known = resolveFriendTreasurerCanonical({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    psychA,
    psychB,
    birthTimeUnknownA: false,
    birthTimeUnknownB: false,
  });
  assert.equal(known.confidence, "high");

  // Unknown hour -> confidence capped to "medium"
  const unknown = resolveFriendTreasurerCanonical({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    psychA,
    psychB,
    birthTimeUnknownA: true,
    birthTimeUnknownB: false,
  });
  assert.equal(unknown.confidence, "medium");
  assert.equal(unknown.pair_facts.unknown_hour, true);
  ok("Unknown birth time caps confidence from high to medium");
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. V1 output and new canonical output select the same person
// ─────────────────────────────────────────────────────────────────────────────
section("10) V1 output and new canonical output select the same person");
{
  const fixtures = [
    {
      countsA: { 정재: 2 },
      countsB: { 편재: 1 },
      psychA: samplePsych({ practicality: 80, structure: 80 }),
      psychB: samplePsych({ practicality: 20, structure: 20 }),
    },
    {
      countsA: { 편재: 1 },
      countsB: {},
      psychA: samplePsych({ practicality: 20, structure: 20 }),
      psychB: samplePsych({ practicality: 85, structure: 85 }),
    },
    {
      countsA: { 정재: 1 },
      countsB: { 정관: 1, 편재: 1 },
      psychA: null,
      psychB: null,
    },
    {
      countsA: { 정관: 1 },
      countsB: { 정관: 1 },
      psychA: null,
      psychB: null,
    },
  ];

  for (const [idx, fix] of fixtures.entries()) {
    const base = pickFriendTreasurer({
      nicknameA: "Alex",
      nicknameB: "Jordan",
      countsA: fix.countsA,
      countsB: fix.countsB,
      locale: "ko-KR",
    });

    const v1Refined = refineFriendTreasurer({
      baseNickname: base.nickname,
      baseReason: base.reason,
      nicknameA: "Alex",
      nicknameB: "Jordan",
      countsA: fix.countsA,
      countsB: fix.countsB,
      psychA: fix.psychA,
      psychB: fix.psychB,
      locale: "ko-KR",
    });

    const canonical = resolveFriendTreasurerCanonical({
      nicknameA: "Alex",
      nicknameB: "Jordan",
      countsA: fix.countsA,
      countsB: fix.countsB,
      psychA: fix.psychA,
      psychB: fix.psychB,
      locale: "ko-KR",
    });

    assert.equal(
      canonical.selected_nickname,
      v1Refined.nickname,
      `Fixture ${idx} person selection mismatch`,
    );
  }
  ok("All fixtures match 100% between V1 refineFriendTreasurer and new canonical engine");
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Locked V1 copy remains identical
// ─────────────────────────────────────────────────────────────────────────────
section("11) Locked V1 copy remains identical");
{
  const countsA = { 정재: 2 };
  const countsB = { 편재: 1 };
  const psychA = samplePsych({ practicality: 80, structure: 80 });
  const psychB = samplePsych({ practicality: 20, structure: 20 });

  const base = pickFriendTreasurer({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    locale: "ko-KR",
  });

  const v1Refined = refineFriendTreasurer({
    baseNickname: base.nickname,
    baseReason: base.reason,
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    psychA,
    psychB,
    locale: "ko-KR",
  });

  const canonical = resolveFriendTreasurerCanonical({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    countsA,
    countsB,
    psychA,
    psychB,
    locale: "ko-KR",
  });

  assert.equal(canonical.reason, v1Refined.reason);
  assert.match(
    canonical.reason,
    /돈·규칙 감각이 더 반듯한 Alex이\(가\) 이 우정의 절대적 총무입니다/,
  );
  ok("Locked V1 reason copy is preserved exactly down to the character");
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. Lens Integration & Canonical Evaluation
// ─────────────────────────────────────────────────────────────────────────────
section("12) Lens Integration & Canonical Evaluation");
{
  const mockFacts = {
    schema_version: "pair_saju_facts_v1",
    report_id_a: "a",
    report_id_b: "b",
    birth_time_unknown_a: false,
    birth_time_unknown_b: false,
    cross_hits: [],
    trio_hits: [],
    element_flow: null,
    johu_relation: null,
    yongsin_alignment: null,
    gongmang_shared: null,
    ssot_gaps: [],
    exclusions: [],
    provenance: { pair_fact_version: "pair_saju_facts_v1", palace_weight_source: "p", gongmang_method: "xunkong_by_day_pillar_v1", built_at: "" },
  };

  const personalCeA = {
    schema_version: "personal_context_engine_v1",
    lens: "innate",
    groups: {},
    packets: [],
    aggregates: {
      ten_god_stem_counts: { 정재: 2, 정관: 1 },
      dominant_element: null,
      weakest_element: null,
      strength_token: null,
      birth_time_unknown: false,
      ssot_gaps: [],
    },
    exclusions: [],
    unresolved_references: [],
    provenance: {},
  };

  const personalCeB = {
    schema_version: "personal_context_engine_v1",
    lens: "innate",
    groups: {},
    packets: [],
    aggregates: {
      ten_god_stem_counts: { 편재: 1 },
      dominant_element: null,
      weakest_element: null,
      strength_token: null,
      birth_time_unknown: false,
      ssot_gaps: [],
    },
    exclusions: [],
    unresolved_references: [],
    provenance: {},
  };

  const evals = evaluateFriendLenses({
    facts: mockFacts,
    packets: [],
    personalCeA,
    personalCeB,
    partyNames: { a: "Alex", b: "Jordan" },
    psychScores: {
      practicality_a: 85,
      structure_a: 85,
      practicality_b: 30,
      structure_b: 30,
    },
  });

  const treasLens = evals.find((l) => l.lens_id === "friend_treasurer_split");
  assert.ok(treasLens);
  assert.ok(
    treasLens.canonical_meaning_id === "friend_money_exact_split_rule" ||
    treasLens.canonical_meaning_id === "friend_treasurer_canonical"
  );
  assert.equal(treasLens.directionality.lead_party, "A");
  assert.match(treasLens.headline_ko, /Alex이\(가\) 이 우정의 1\/N 정산과 모임 총무를 전담/);
  assert.match(treasLens.narrative_ko, /돈·규칙 감각이 더 반듯한 Alex/);
  ok("Friend domain lens properly exposes canonical treasurer judgment and narrative");
}

console.log("\nAll 11+ Friend Treasurer Vertical Slice characterization tests passed successfully!");
