/**
 * Romantic V4 — production birth-hour evidence classification + confidence cap.
 *
 * Characterizes productionAdapter/romanticV4HourEvidence.ts: the 12:00
 * fallback must never be treated as "observed" evidence, and confidence on
 * comparisonTable rows must be capped by exactly one tier when hour evidence
 * isn't fully observed for both people.
 *
 * Run: npx tsx tests/unit/romantic-v4-hour-evidence.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const {
  computeBirthHourEvidence,
  capConfidenceForHourEvidence,
  capConfidenceLevelForHourEvidence,
  applyHourEvidenceCapToComparisonTable,
} = await import(
  "../../lib/relationship/romantic/prototypeV4/productionAdapter/romanticV4HourEvidence.ts"
);

// ---------------------------------------------------------------------------
section("1) computeBirthHourEvidence — both known -> observed");

const bothKnown = computeBirthHourEvidence(false, false);
assert.equal(bothKnown.status, "observed");
assert.equal(bothKnown.disclosureCode, "none");
assert.equal(bothKnown.hourUnknownA, false);
assert.equal(bothKnown.hourUnknownB, false);
ok("both known -> observed / none, matching computeSurveyPairEvidence's both-known rule");

// ---------------------------------------------------------------------------
section("2) computeBirthHourEvidence — one unknown -> partial, never 'observed'");

const oneUnknownA = computeBirthHourEvidence(true, false);
assert.equal(oneUnknownA.status, "partial");
assert.equal(oneUnknownA.disclosureCode, "partner_hour_unknown");

const oneUnknownB = computeBirthHourEvidence(false, true);
assert.equal(oneUnknownB.status, "partial");
assert.equal(oneUnknownB.disclosureCode, "partner_hour_unknown");
ok("a single unknown hour on either side downgrades the pair to 'partial' — the 12:00 fallback is never counted as observed");

// ---------------------------------------------------------------------------
section("3) computeBirthHourEvidence — both unknown -> unobserved");

const bothUnknown = computeBirthHourEvidence(true, true);
assert.equal(bothUnknown.status, "unobserved");
assert.equal(bothUnknown.disclosureCode, "both_hours_unknown");
ok("both unknown -> unobserved / both_hours_unknown");

// ---------------------------------------------------------------------------
section("4) capConfidenceForHourEvidence — 3-tier scale, one-step cap only when not observed");

assert.equal(capConfidenceForHourEvidence("high", "observed"), "high");
assert.equal(capConfidenceForHourEvidence("high", "partial"), "low");
assert.equal(capConfidenceForHourEvidence("high", "unobserved"), "low");
assert.equal(capConfidenceForHourEvidence("low", "partial"), "low");
assert.equal(capConfidenceForHourEvidence("insufficient", "unobserved"), "insufficient");
ok("high->low when not observed, low/insufficient unaffected, observed never altered");

// ---------------------------------------------------------------------------
section("5) capConfidenceLevelForHourEvidence — 5-tier ConfidenceLevel scale, one-tier downgrade");

assert.equal(capConfidenceLevelForHourEvidence("deterministic", "observed"), "deterministic");
assert.equal(capConfidenceLevelForHourEvidence("deterministic", "partial"), "high");
assert.equal(capConfidenceLevelForHourEvidence("high", "partial"), "medium");
assert.equal(capConfidenceLevelForHourEvidence("medium", "unobserved"), "low");
assert.equal(capConfidenceLevelForHourEvidence("low", "unobserved"), "tentative");
assert.equal(capConfidenceLevelForHourEvidence("tentative", "unobserved"), "tentative");
ok("every tier steps down exactly once when hour evidence isn't observed; tentative floors out; observed never alters any tier");

// ---------------------------------------------------------------------------
section("6) applyHourEvidenceCapToComparisonTable — observed pair returns the same payload reference");

function fakePayload(confidences) {
  return {
    comparisonTable: confidences.map((confidence, i) => ({
      rowId: `compare.row${i}`,
      confidence,
    })),
  };
}

const observedPayload = fakePayload(["high", "medium", "low"]);
const observedResult = applyHourEvidenceCapToComparisonTable(observedPayload, bothKnown);
assert.equal(observedResult, observedPayload, "observed pair must return the exact same object reference — no needless copy");
ok("fully-observed hour evidence leaves the payload untouched (same reference)");

// ---------------------------------------------------------------------------
section("7) applyHourEvidenceCapToComparisonTable — partial/unobserved caps every row by one tier");

const partialPayload = fakePayload(["deterministic", "high", "medium", "low", "tentative"]);
const partialResult = applyHourEvidenceCapToComparisonTable(partialPayload, oneUnknownA);
assert.deepEqual(
  partialResult.comparisonTable.map((r) => r.confidence),
  ["high", "medium", "low", "tentative", "tentative"],
);
assert.notEqual(partialResult, partialPayload, "a capped payload must be a new object, not a mutation of the input");
assert.deepEqual(
  partialPayload.comparisonTable.map((r) => r.confidence),
  ["deterministic", "high", "medium", "low", "tentative"],
  "the original payload object must be untouched (no in-place mutation)",
);
ok("partial hour evidence downgrades every comparisonTable row by exactly one tier, without mutating the input payload");

console.log("\nOK: romantic-v4-hour-evidence tests passed");
