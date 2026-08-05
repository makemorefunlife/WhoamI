/**
 * Smoke: enrichment fields appear on Friend/Partner/Family CE bodies.
 * Run: npx tsx tests/unit/relationship-enrichment-fields.test.mjs
 */
import assert from "node:assert/strict";
import { buildEnrichmentReviewPackage } from "../../lib/relationship/enrichment/buildEnrichmentReviewPackage.ts";

const friend = buildEnrichmentReviewPackage({
  domain: "friend",
  caseId: "strong",
  locale: "ko-KR",
});
const shine = friend.current.report.friend?.section_snapshot?.shine_when_best;
assert.ok(typeof shine === "string" && shine.length > 20, "friend shine_when_best");

const partner = buildEnrichmentReviewPackage({
  domain: "partner",
  caseId: "psych_saju_conflict",
  locale: "ko-KR",
});
const mental =
  partner.current.report.household?.section_money_chores?.mental_load_note;
assert.ok(typeof mental === "string" && mental.length > 20, "partner mental_load_note");

const family = buildEnrichmentReviewPackage({
  domain: "family",
  caseId: "psych_saju_agree",
  locale: "ko-KR",
});
const praise = family.current.report.family?.section_child_dna?.praise_trigger_note;
assert.ok(typeof praise === "string" && praise.length > 20, "family praise_trigger_note");

assert.ok(friend.dev.lenses.length >= 8, "friend lenses");
assert.ok(friend.dev.narrative?.scenes?.length === 7, "friend 7 scenes");

console.log("ok - relationship enrichment fields smoke");
