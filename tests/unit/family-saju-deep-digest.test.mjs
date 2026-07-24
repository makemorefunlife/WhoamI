/**
 * Round 2 — family CE → digest adapter (no OpenAI).
 * Run: npx tsx tests/unit/family-saju-deep-digest.test.mjs
 */
import assert from "node:assert/strict";
import {
  buildFamilyHouseholdDigest,
  inferFamilyMismatchGenerations,
  familyPostValidateParamsFromReport,
} from "../../lib/relationship/familySajuPromptDigest.ts";
import { buildFamilySajuDeepPromptBundle } from "../../lib/prompts/relationshipPremium/familySajuDeep/index.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

const fakeReport = {
  meta: {
    grade: "B",
    grade_reason: "test",
    uncertain_items: ["birth_time_child"],
    parent_nickname: "엄마",
    child_nickname: "민준",
    parent_role: "mother",
    parent_type: "mother",
  },
  canonical_projections: {
    comparison_table: {
      correction_style: { band_parent: "standards", band_child: "receptive" },
      bond_distance: { band_parent: "smothering", band_child: "distant" },
      affection_expression: { band_parent: "fire", band_child: "water" },
      guidance_balance: { band_parent: "mixed", band_child: "explanatory" },
      gathering_recovery: { band_parent: "strong", band_child: "weak" },
      home_climate: { band_parent: "high", band_child: "medium" },
    },
  },
  context_output: {
    schema_version: "context_output_v1",
    domain: "family",
  },
};

{
  assert.equal(
    inferFamilyMismatchGenerations({
      comparison: fakeReport.canonical_projections.comparison_table,
    }),
    true,
  );
  ok("infer mismatch when parent/child bands differ");
}

{
  const digest = buildFamilyHouseholdDigest({
    nicknameParent: "엄마",
    nicknameChild: "민준",
    report: fakeReport,
  });
  assert.match(digest, /mismatch_generations: true/);
  assert.match(digest, /parent_role: mother/);
  assert.match(digest, /bond_distance/);
  assert.match(digest, /smothering/);
  assert.match(digest, /distant/);
  assert.match(digest, /explain only|canonical/i);
  assert.doesNotMatch(digest, /operating_cfo|marital_conflict|expression_speed/);
  assert.match(digest, /Do not invent Romantic dating axes/);

  const bundle = buildFamilySajuDeepPromptBundle({
    nicknameParent: "엄마",
    nicknameChild: "민준",
    familyDigestBlock: digest,
  });
  assert.match(bundle.user, /bond_distance/);
  assert.match(bundle.user, /Evidence bridge|정서적 거리/i);
  assert.doesNotMatch(bundle.user, /operating_cfo|가사 분담/);
  ok("digest feeds prompt bundle");
}

{
  const pv = familyPostValidateParamsFromReport({
    nicknameParent: "엄마",
    nicknameChild: "민준",
    report: fakeReport,
  });
  assert.equal(pv.mismatchGenerations, true);
  assert.equal(pv.comparisonLeans.bond_distance.band_parent, "smothering");
  assert.equal(pv.comparisonLeans.bond_distance.band_child, "distant");
  assert.equal(
    pv.comparisonLeans.correction_style.band_parent,
    "standards",
  );
  ok("postValidate params from CE");
}

{
  const aligned = {
    ...fakeReport,
    canonical_projections: {
      comparison_table: {
        correction_style: { band_parent: "receptive", band_child: "receptive" },
        bond_distance: { band_parent: "balanced", band_child: "balanced" },
        affection_expression: { band_parent: "earth", band_child: "earth" },
        guidance_balance: { band_parent: "mixed", band_child: "mixed" },
        gathering_recovery: { band_parent: "strong", band_child: "strong" },
        home_climate: { band_parent: "medium", band_child: "medium" },
      },
    },
  };
  assert.equal(
    inferFamilyMismatchGenerations({
      comparison: aligned.canonical_projections.comparison_table,
    }),
    false,
  );
  ok("aligned bands → no mismatch");
}

console.log("\nfamily-saju-deep-digest: all passed");
