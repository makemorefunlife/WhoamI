/**
 * Round 2 — friendship CE → friend digest adapter (no OpenAI).
 * Run: npx tsx tests/unit/friend-saju-deep-digest.test.mjs
 */
import assert from "node:assert/strict";
import {
  buildFriendHouseholdDigest,
  inferFriendMismatchRoles,
  friendPostValidateParamsFromReport,
} from "../../lib/relationship/friendSajuPromptDigest.ts";
import { buildFriendSajuDeepPromptBundle } from "../../lib/prompts/relationshipPremium/friendSajuDeep/index.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

const fakeReport = {
  meta: {
    grade: "B",
    grade_reason: "test",
    uncertain_items: ["birth_time_b"],
    connection_pct: 50,
    banter_pct: 50,
    risk_pct: 40,
    nickname_a: "나",
    nickname_b: "지후",
  },
  canonical_projections: {
    comparison_table: {
      daily_share_tempo: { band_a: "active", band_b: "steady" },
      upset_expression: { band_a: "food", band_b: "seal" },
      affection_language: { band_a: "fire", band_b: "water" },
      battery_recharge: { band_a: "strong", band_b: "weak" },
      hangout_planning: { band_a: "strong", band_b: "some" },
      communication_rhythm: { band_a: "strong", band_b: "none" },
    },
    treasurer: { side: "a", confidence: "high", align: "confirms" },
    travel_planner: {
      planner_side: "b",
      confidence: "high",
      align: "confirms",
    },
  },
  context_output: {
    schema_version: "context_output_v1",
    domain: "friendship",
  },
};

{
  assert.equal(
    inferFriendMismatchRoles({
      comparison: fakeReport.canonical_projections.comparison_table,
      treasurer: fakeReport.canonical_projections.treasurer,
      travelPlanner: fakeReport.canonical_projections.travel_planner,
    }),
    true,
  );
  ok("infer mismatch when friend bands differ");
}

{
  const digest = buildFriendHouseholdDigest({
    nicknameA: "나",
    nicknameB: "지후",
    report: fakeReport,
  });
  assert.match(digest, /mismatch_roles: true/);
  assert.match(digest, /treasurer: side=a/);
  assert.match(digest, /travel_planner: planner_side=b/);
  assert.match(digest, /daily_share_tempo/);
  assert.match(digest, /communication_rhythm/);
  assert.match(digest, /explain only|canonical/i);
  assert.doesNotMatch(digest, /operating_cfo|risk_taking|가사 분담|양육/);
  assert.match(digest, /Do not invent Romantic dating/);

  const bundle = buildFriendSajuDeepPromptBundle({
    nicknameA: "나",
    nicknameB: "지후",
    friendDigestBlock: digest,
  });
  assert.match(bundle.user, /daily_share_tempo|communication_rhythm/);
  assert.match(bundle.user, /Evidence bridge|연락 템포|티키타카/i);
  assert.doesNotMatch(bundle.user, /operating_cfo|핸드오프|손익/);
  ok("digest feeds prompt bundle");
}

{
  const pv = friendPostValidateParamsFromReport({
    nicknameA: "나",
    nicknameB: "지후",
    report: fakeReport,
  });
  assert.equal(pv.mismatchRoles, true);
  assert.equal(pv.comparisonLeans.daily_share_tempo.band_a, "active");
  assert.equal(pv.comparisonLeans.daily_share_tempo.band_b, "steady");
  assert.equal(
    pv.comparisonLeans.communication_rhythm.band_a,
    "strong",
  );
  ok("postValidate params from CE");
}

{
  const aligned = {
    ...fakeReport,
    canonical_projections: {
      comparison_table: {
        daily_share_tempo: { band_a: "steady", band_b: "steady" },
        upset_expression: { band_a: "food", band_b: "food" },
        affection_language: { band_a: "fire", band_b: "fire" },
        battery_recharge: { band_a: "balanced", band_b: "balanced" },
        hangout_planning: { band_a: "some", band_b: "some" },
        communication_rhythm: { band_a: "some", band_b: "some" },
      },
      treasurer: { side: "a", confidence: "high", align: "confirms" },
      travel_planner: {
        planner_side: "a",
        confidence: "high",
        align: "confirms",
      },
    },
  };
  assert.equal(
    inferFriendMismatchRoles({
      comparison: aligned.canonical_projections.comparison_table,
      treasurer: aligned.canonical_projections.treasurer,
      travelPlanner: aligned.canonical_projections.travel_planner,
    }),
    false,
  );
  ok("aligned bands → no mismatch");
}

console.log("\nfriend-saju-deep-digest: all passed");
