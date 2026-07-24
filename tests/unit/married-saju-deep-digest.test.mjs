/**
 * Round 2 — marriage CE → digest adapter (no OpenAI).
 * Run: npx tsx tests/unit/married-saju-deep-digest.test.mjs
 */
import assert from "node:assert/strict";
import {
  buildMarriedHouseholdDigest,
  inferMarriageMismatchRoles,
  marriedPostValidateParamsFromReport,
} from "../../lib/relationship/marriageSajuPromptDigest.ts";
import { buildMarriedSajuDeepPromptBundle } from "../../lib/prompts/relationshipPremium/marriedSajuDeep/index.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

const fakeReport = {
  meta: {
    grade: "B",
    grade_reason: "test",
    uncertain_items: ["birth_time_b"],
    romantic_fit_pct: 50,
    life_synergy_pct: 50,
    home_risk_pct: 40,
  },
  canonical_projections: {
    comparison_table: {
      household_stress: { band_a: "wealth", band_b: "officer" },
      marital_conflict: { band_a: "explosive", band_b: "stonewall" },
      bedroom_lead: { band_a: "sweet_guide", band_b: "sweet_guide" },
      family_boundary: { band_a: "true", band_b: "false" },
      asset_management: { band_a: "high", band_b: "low" },
      parenting_style: { band_a: "empathy", band_b: "structure" },
    },
    operating_cfo: {
      side: "a",
      confidence: "high",
      align: "confirms",
      dual: false,
    },
  },
  context_output: {
    schema_version: "context_output_v1",
    domain: "cohabitation",
    dominant_categories: {
      cfo_confidence: { category: "high" },
      cfo_align: { category: "confirms" },
      parenting_a_confidence: { category: "low" },
      parenting_a_align: { category: "caution" },
    },
  },
};

{
  assert.equal(
    inferMarriageMismatchRoles({
      comparison: fakeReport.canonical_projections.comparison_table,
      operatingCfo: fakeReport.canonical_projections.operating_cfo,
    }),
    true,
  );
  ok("infer mismatch when bands differ");
}

{
  const digest = buildMarriedHouseholdDigest({
    nicknameA: "나",
    nicknameB: "지후",
    report: fakeReport,
  });
  assert.match(digest, /mismatch_roles: true/);
  assert.match(digest, /operating_cfo: side=a/);
  assert.match(digest, /marital_conflict/);
  assert.match(digest, /explosive/);
  assert.match(digest, /stonewall/);
  assert.match(digest, /explain only|canonical/i);
  assert.doesNotMatch(digest, /expression_speed|compare_affection/);
  assert.match(digest, /Do not invent Romantic axes/);

  const bundle = buildMarriedSajuDeepPromptBundle({
    nicknameA: "나",
    nicknameB: "지후",
    householdDigestBlock: digest,
  });
  assert.match(bundle.user, /marital_conflict/);
  assert.match(bundle.user, /Evidence bridge|가사·루틴/i);
  ok("digest feeds prompt bundle");
}

{
  const pv = marriedPostValidateParamsFromReport({
    nicknameA: "나",
    nicknameB: "지후",
    report: fakeReport,
  });
  assert.equal(pv.mismatchRoles, true);
  assert.equal(pv.operatingCfoSide, "a");
  assert.equal(pv.comparisonLeans.marital_conflict.band_a, "explosive");
  assert.equal(pv.comparisonLeans.marital_conflict.band_b, "stonewall");
  ok("postValidate params from CE");
}

console.log("\nmarried-saju-deep-digest: all passed");
