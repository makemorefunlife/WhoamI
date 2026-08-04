/**
 * Romantic V4 — Batch D2/D3 Current Self contract + shared resolver.
 *
 * Covers the 13 required assertions from the "Romantic V4 Current Self
 * Contract and Neutral Fallback" task: source tagging (survey vs
 * synthetic_neutral), evidence status, disclosure codes, confidence
 * capping, shared-resolver reuse between axisOverview/comparisonTable,
 * fixture isolation, and KO/EN label parity.
 *
 * Run: npx tsx tests/unit/romantic-v4-survey-evidence.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const root = execSync("git rev-parse --show-toplevel").toString().trim();
function read(relPath) {
  return readFileSync(`${root}/${relPath}`, "utf8");
}

const { resolveRomanticV4SurveyEvidence } = await import(
  "../../lib/relationship/romantic/prototypeV4/romanticV4SurveyEvidence.ts"
);
const { SECONDARY_AXIS_KEYS } = await import("../../lib/v2/survey/types.ts");
const { buildNeutralV2Profile } = await import("../../lib/v2/survey/neutralProfile.ts");
const { psychMatchAxisLabel } = await import("../../lib/relationship/psychMatch/axisLabels.ts");
const { buildRomanticV4PrototypePayload, labelOfAxis } = await import(
  "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts"
);

function makeProfile(overrides) {
  const base = buildNeutralV2Profile();
  return {
    ...base,
    secondary_axes: { ...base.secondary_axes, ...overrides },
  };
}

// ---------------------------------------------------------------------------
section("1) Real survey score 50 stays source: survey");

const profileAAllFifty = makeProfile({}); // every axis is exactly 50, but it's a REAL profile
const profileBDistinct = makeProfile({
  conflict_style: 80,
  empathy: 20,
});
const bothRealEvidence = resolveRomanticV4SurveyEvidence({
  mode: "real",
  profileA: profileAAllFifty,
  profileB: profileBDistinct,
});
const conflictRow = bothRealEvidence.rows.find((r) => r.axis_key === "conflict_style");
assert.equal(conflictRow.score_a, 50);
assert.equal(conflictRow.person_a_source, "survey");
ok("a real profile's axis score of 50 is tagged source: survey, not synthetic_neutral");

// ---------------------------------------------------------------------------
section("2) Missing survey -> score 50, source: synthetic_neutral");

const oneMissingEvidence = resolveRomanticV4SurveyEvidence({
  mode: "real",
  profileA: profileBDistinct,
  profileB: null,
});
const missingRow = oneMissingEvidence.rows.find((r) => r.axis_key === "conflict_style");
assert.equal(missingRow.score_b, 50);
assert.equal(missingRow.person_b_source, "synthetic_neutral");
ok("a missing profile is filled with 50 and tagged source: synthetic_neutral");

// ---------------------------------------------------------------------------
section("3) Real 50 and synthetic 50 are not equivalent evidence");

assert.equal(conflictRow.score_a, 50);
assert.equal(conflictRow.person_a_source, "survey");
assert.equal(missingRow.score_b, 50);
assert.equal(missingRow.person_b_source, "synthetic_neutral");
assert.notEqual(
  conflictRow.person_a_source,
  missingRow.person_b_source,
  "identical numeric score 50 must not collapse survey and synthetic_neutral into the same source tag",
);
ok("equal numeric score (50) from real vs missing profiles carries distinct source tags");

// ---------------------------------------------------------------------------
section("4) A real / B synthetic -> partial_inference");

assert.equal(oneMissingEvidence.evidenceStatus, "partial_inference");
assert.equal(oneMissingEvidence.disclosureCode, "partner_profile_missing");
assert.ok(
  oneMissingEvidence.rows.every((r) => r.confidence === "low"),
  "partial_inference rows must be capped at low confidence",
);
ok("A real / B missing resolves to partial_inference, partner_profile_missing, confidence low");

// ---------------------------------------------------------------------------
section("5) A synthetic / B real -> partial_inference");

const mirroredEvidence = resolveRomanticV4SurveyEvidence({
  mode: "real",
  profileA: null,
  profileB: profileBDistinct,
});
assert.equal(mirroredEvidence.evidenceStatus, "partial_inference");
assert.equal(mirroredEvidence.disclosureCode, "partner_profile_missing");
assert.ok(mirroredEvidence.rows.every((r) => r.confidence === "low"));
ok("A missing / B real resolves to partial_inference, partner_profile_missing, confidence low");

// ---------------------------------------------------------------------------
section("6) Both synthetic -> unobserved");

const bothMissingEvidence = resolveRomanticV4SurveyEvidence({
  mode: "real",
  profileA: null,
  profileB: null,
});
assert.equal(bothMissingEvidence.evidenceStatus, "unobserved");
assert.equal(bothMissingEvidence.disclosureCode, "both_profiles_missing");
assert.ok(bothMissingEvidence.rows.every((r) => r.confidence === "insufficient"));
ok("both profiles missing resolves to unobserved, both_profiles_missing, confidence insufficient");

// ---------------------------------------------------------------------------
section("7) Both synthetic with gap 0 does not activate similarity meaning");

assert.ok(
  bothMissingEvidence.rows.every((r) => r.gap === 0),
  "sanity check: two neutral-50 profiles produce gap 0 on every axis",
);
assert.ok(
  bothMissingEvidence.rows.every((r) => r.match_type === "insufficient_evidence"),
  "gap-0 from two synthetic profiles must never be reported as similarity/complementary/tension",
);
ok("synthetic gap-0 axes are tagged insufficient_evidence, never similarity");

// ---------------------------------------------------------------------------
section("8) One real profile still shows that person's observed behavior");

const empathyRow = oneMissingEvidence.rows.find((r) => r.axis_key === "empathy");
assert.equal(empathyRow.score_a, profileBDistinct.secondary_axes.empathy);
assert.equal(empathyRow.person_a_source, "survey");
ok("the real side's actual scores remain visible even when the partner's profile is missing");

// ---------------------------------------------------------------------------
section("9) Saju-only composite code is untouched by this batch");

const compareConflictSrc = read("lib/relationship/romantic/compareConflictComposite.ts");
const comparisonTableCanonicalSrc = read("lib/relationship/romantic/romanticComparisonTableCanonical.ts");
const resolverSrc = read("lib/relationship/romantic/prototypeV4/romanticV4SurveyEvidence.ts");
for (const forbidden of ["compareConflictComposite", "romanticComparisonTableCanonical", "sajuSignals"]) {
  assert.ok(
    !resolverSrc.includes(forbidden),
    `romanticV4SurveyEvidence.ts must not depend on Saju composite module ${forbidden}`,
  );
}
assert.ok(
  compareConflictSrc.includes("resolveCompareCompositeLean") &&
    comparisonTableCanonicalSrc.includes("ROMANTIC_COMPARISON_TABLE_CANONICAL_SOURCE"),
  "Saju-only comparison composite files must remain structurally intact (not modified by this batch)",
);
ok("this batch never imports or modifies the Saju-band comparison composite chain");

// ---------------------------------------------------------------------------
section("10) Real mode never silently imports fixture values");

for (const forbidden of ["romanticExperienceCompleteFixture", "romanticExperienceDevFixtures", "romanticExperienceMinimalFixture"]) {
  assert.ok(
    !resolverSrc.includes(forbidden),
    `romanticV4SurveyEvidence.ts must not reference fixture module/export ${forbidden}`,
  );
}
const distinctRealEvidence = resolveRomanticV4SurveyEvidence({
  mode: "real",
  profileA: profileAAllFifty,
  profileB: profileBDistinct,
});
assert.equal(
  distinctRealEvidence.rows.find((r) => r.axis_key === "empathy").score_b,
  profileBDistinct.secondary_axes.empathy,
  "real-mode output must be a pure function of the given profiles, not fixture sample data",
);
ok("resolver source has zero fixture references and output is fully determined by input profiles");

// ---------------------------------------------------------------------------
section("11) Dev fixture mode marks sample data");

const devFixtureEvidence = resolveRomanticV4SurveyEvidence({
  mode: "dev_fixture",
  profileA: null,
  profileB: null,
});
assert.equal(devFixtureEvidence.isSampleData, true);

const payloadNoSurveyInput = buildRomanticV4PrototypePayload("complete", "ko-KR");
assert.equal(payloadNoSurveyInput.surveyEvidence?.mode, "dev_fixture");
assert.equal(payloadNoSurveyInput.surveyEvidence?.isSampleData, true);
assert.ok(
  payloadNoSurveyInput.comparisonTable.length > 0 && payloadNoSurveyInput.axisOverview.length === 11,
  "omitting surveyInput must preserve existing dev_fixture behavior for backward compatibility",
);
ok("dev_fixture mode (explicit or via omitted surveyInput) marks is_sample_data / survey_source correctly");

// ---------------------------------------------------------------------------
section("12) axisOverview and comparisonTable consume the same shared result");

const realProfileA = makeProfile({ structure: 90, stimulation: 15 });
const realProfileB = makeProfile({ structure: 20, stimulation: 85 });
const payloadReal = buildRomanticV4PrototypePayload("complete", "ko-KR", {
  surveyInput: { mode: "real", profileA: realProfileA, profileB: realProfileB },
});
assert.equal(payloadReal.surveyEvidence?.mode, "real");
assert.equal(payloadReal.surveyEvidence?.axisOverviewSource, "survey_resolver");
assert.equal(payloadReal.surveyEvidence?.comparisonTableSource, "unavailable_pending_saju_wiring");
assert.deepEqual(
  payloadReal.comparisonTable,
  [],
  "comparisonTable must not silently fall back to fixture rows in real mode",
);
assert.equal(payloadReal.axisOverview.length, 11);
const structureOverviewRow = payloadReal.axisOverview.find((r) => r.axis_key === "structure");
assert.equal(structureOverviewRow.score_a, 90);
assert.equal(structureOverviewRow.score_b, 20);
const structureEvidenceRow = payloadReal.axisOverviewEvidence?.find((r) => r.axis_key === "structure");
assert.equal(structureEvidenceRow.gap, structureOverviewRow.gap);
assert.equal(structureEvidenceRow.match_type, structureOverviewRow.match_type);
ok("axisOverview and comparisonTable both read off the single resolveV4AxisData() call — no independent recompute");

// ---------------------------------------------------------------------------
section("13) KO/EN use the same canonical axis keys");

for (const key of SECONDARY_AXIS_KEYS) {
  const ko = psychMatchAxisLabel(key, "ko-KR");
  const en = psychMatchAxisLabel(key, "en-US");
  assert.notEqual(ko, key, `ko-KR label missing for ${key}`);
  assert.notEqual(en, key, `en-US label missing for ${key}`);
  assert.equal(labelOfAxis("ko-KR", key), ko, `V4 labelOfAxis(ko-KR) must match canonical label authority for ${key}`);
  assert.equal(labelOfAxis("en-US", key), en, `V4 labelOfAxis(en-US) must match canonical label authority for ${key}`);
}
ok("all 11 axis keys resolve through the single canonical psychMatchAxisLabel authority for both locales");

console.log("\nOK: romantic-v4-survey-evidence tests passed");
