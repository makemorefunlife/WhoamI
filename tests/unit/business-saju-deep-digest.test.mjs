/**
 * Round 2 — work CE → business digest adapter (no OpenAI).
 * Run: npx tsx tests/unit/business-saju-deep-digest.test.mjs
 */
import assert from "node:assert/strict";
import {
  buildBusinessHouseholdDigest,
  inferBusinessMismatchRoles,
  businessPostValidateParamsFromReport,
} from "../../lib/relationship/businessSajuPromptDigest.ts";
import { buildBusinessSajuDeepPromptBundle } from "../../lib/prompts/relationshipPremium/businessSajuDeep/index.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

const fakeReport = {
  meta: {
    grade: "B",
    grade_reason: "test",
    uncertain_items: ["birth_time_b"],
    fit_pct: 50,
    synergy_pct: 50,
    risk_pct: 40,
  },
  canonical_projections: {
    comparison_table: {
      boundary: { band_a: "관성", band_b: "식상" },
      feedback: { band_a: "비겁", band_b: "인성" },
      synergy_position: { band_a: "wood", band_b: "metal" },
      burnout: { band_a: "ja", band_b: "oh" },
      risk_taking: { band_a: "weak", band_b: "strong" },
      reporting_rhythm: { band_a: "yang", band_b: "yin" },
    },
    leadership_split: {
      external_lead: "a",
      internal_qa_lead: "b",
      confidence: "high",
      align: "confirms",
    },
  },
  context_output: {
    schema_version: "context_output_v1",
    domain: "work",
  },
};

{
  assert.equal(
    inferBusinessMismatchRoles({
      comparison: fakeReport.canonical_projections.comparison_table,
      leadership: fakeReport.canonical_projections.leadership_split,
    }),
    true,
  );
  ok("infer mismatch when partner bands differ");
}

{
  const digest = buildBusinessHouseholdDigest({
    nicknameA: "나",
    nicknameB: "지후",
    report: fakeReport,
  });
  assert.match(digest, /mismatch_roles: true/);
  assert.match(digest, /leadership_split: external_lead=a/);
  assert.match(digest, /boundary/);
  assert.match(digest, /risk_taking/);
  assert.match(digest, /explain only|canonical/i);
  assert.doesNotMatch(digest, /operating_cfo|bond_distance|가사 분담/);
  assert.match(digest, /Do not invent Romantic dating/);

  const bundle = buildBusinessSajuDeepPromptBundle({
    nicknameA: "나",
    nicknameB: "지후",
    businessDigestBlock: digest,
  });
  assert.match(bundle.user, /boundary|risk_taking/);
  assert.match(bundle.user, /Evidence bridge|업무 경계/i);
  assert.doesNotMatch(bundle.user, /operating_cfo|가사 분담|양육/);
  ok("digest feeds prompt bundle");
}

{
  const pv = businessPostValidateParamsFromReport({
    nicknameA: "나",
    nicknameB: "지후",
    report: fakeReport,
  });
  assert.equal(pv.mismatchRoles, true);
  assert.equal(pv.comparisonLeans.boundary.band_a, "관성");
  assert.equal(pv.comparisonLeans.boundary.band_b, "식상");
  assert.equal(pv.comparisonLeans.leadership.band_a, "a");
  assert.equal(pv.comparisonLeans.leadership.band_b, "b");
  ok("postValidate params from CE");
}

{
  const aligned = {
    ...fakeReport,
    canonical_projections: {
      comparison_table: {
        boundary: { band_a: "관성", band_b: "관성" },
        feedback: { band_a: "인성", band_b: "인성" },
        synergy_position: { band_a: "wood", band_b: "wood" },
        burnout: { band_a: "ja", band_b: "ja" },
        risk_taking: { band_a: "balanced", band_b: "balanced" },
        reporting_rhythm: { band_a: "yang", band_b: "yang" },
      },
      leadership_split: {
        external_lead: "a",
        internal_qa_lead: "b",
        confidence: "high",
        align: "confirms",
      },
    },
  };
  assert.equal(
    inferBusinessMismatchRoles({
      comparison: aligned.canonical_projections.comparison_table,
      leadership: aligned.canonical_projections.leadership_split,
    }),
    false,
  );
  ok("aligned bands → no mismatch");
}

console.log("\nbusiness-saju-deep-digest: all passed");
