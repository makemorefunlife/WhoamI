/**
 * Romantic V4 — production adapter (productionAdapter/buildRomanticV4ProductionInput.ts).
 *
 * Verifies the thin reshaping layer the production analyze route calls:
 * real inputs map to real pairSajuInput/surveyInput, an already-computed
 * usable Saju master is reused by REFERENCE (no duplicate calculation), and
 * a legacy/unusable master safely falls back to "recompute inside
 * buildActualFourCeContract" rather than ever touching fixture data.
 *
 * Run: npx tsx tests/unit/romantic-v4-production-adapter.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { buildRomanticV4ProductionInput } = await import(
  "../../lib/relationship/romantic/prototypeV4/productionAdapter/buildRomanticV4ProductionInput.ts"
);

function usableMaster(tag) {
  return { domain_signals: { romantic_signals: { tag } } };
}

const basePersonA = {
  reportId: "report-a",
  name: "Priya",
  birthDate: "1985-01-10",
  birthTime: "03:00",
  birthTimeUnknown: false,
  surveyProfile: { secondary_axes: { conflict_style: 18 } },
  sajuMaster: usableMaster("a"),
};
const basePersonB = {
  reportId: "report-b",
  name: "Jonas",
  birthDate: "1985-01-10",
  birthTime: "15:00",
  birthTimeUnknown: false,
  surveyProfile: { secondary_axes: { conflict_style: 91 } },
  sajuMaster: usableMaster("b"),
};

// ---------------------------------------------------------------------------
section("1) Real mode: pairSajuInput/surveyInput are correctly reshaped");

const result = buildRomanticV4ProductionInput({
  personA: basePersonA,
  personB: basePersonB,
  locale: "ko-KR",
});

assert.equal(result.pairSajuInput.mode, "real");
assert.equal(result.pairSajuInput.birthA.birthDate, "1985-01-10");
assert.equal(result.pairSajuInput.birthA.birthTime, "03:00");
assert.equal(result.pairSajuInput.birthA.birthTimeUnknown, false);
assert.equal(result.pairSajuInput.nameA, "Priya");
assert.equal(result.pairSajuInput.nameB, "Jonas");
assert.equal(result.surveyInput.mode, "real");
assert.equal(result.surveyInput.profileA, basePersonA.surveyProfile);
assert.equal(result.surveyInput.profileB, basePersonB.surveyProfile);
assert.equal(result.locale, "ko-KR");
ok("real birth/survey/name/locale data is reshaped without alteration");

// ---------------------------------------------------------------------------
section("2) No duplicate calculation: a usable Saju master is reused by reference, not recomputed");

assert.equal(result.precomputed.masterA, basePersonA.sajuMaster, "masterA must be the exact same object reference the caller supplied");
assert.equal(result.precomputed.masterB, basePersonB.sajuMaster, "masterB must be the exact same object reference the caller supplied");
assert.equal(result.precomputed.bundleA, undefined, "adapter never has a reconstructable full SajuBundle from bundlePersonCoreForPremium, so bundleA/B stay omitted");
ok("already-computed master JSON is passed through by reference — buildActualFourCeContract will skip recomputation entirely");

// ---------------------------------------------------------------------------
section("3) Legacy/unusable master (missing domain_signals.romantic_signals) never reused — and never faked");

const legacyMaster = { domain_signals: {} };
const legacyResult = buildRomanticV4ProductionInput({
  personA: { ...basePersonA, sajuMaster: legacyMaster },
  personB: basePersonB,
  locale: "en-US",
});
assert.equal(legacyResult.precomputed, undefined, "when either side's master isn't usable, precomputed must be entirely omitted (not a half-filled object) so buildActualFourCeContract recomputes both sides fresh and consistently");
ok("a legacy snapshot without romantic_signals safely falls through to fresh computation, not a fixture and not a partially-precomputed contract");

// ---------------------------------------------------------------------------
section("4) null Saju master (never computed) behaves the same as a legacy/unusable one");

const nullMasterResult = buildRomanticV4ProductionInput({
  personA: { ...basePersonA, sajuMaster: null },
  personB: basePersonB,
  locale: "en-US",
});
assert.equal(nullMasterResult.precomputed, undefined);
ok("null sajuMaster is treated the same as an unusable one — omits precomputed rather than throwing");

// ---------------------------------------------------------------------------
section("5) birthHourEvidence is derived from each person's own birthTimeUnknown flag");

const mixedHourResult = buildRomanticV4ProductionInput({
  personA: { ...basePersonA, birthTimeUnknown: true, birthTime: null },
  personB: basePersonB,
  locale: "ko-KR",
});
assert.equal(mixedHourResult.birthHourEvidence.status, "partial");
assert.equal(mixedHourResult.birthHourEvidence.hourUnknownA, true);
assert.equal(mixedHourResult.birthHourEvidence.hourUnknownB, false);
ok("birthHourEvidence reflects the real per-person birthTimeUnknown flags passed in, independent of precomputed status");

console.log("\nOK: romantic-v4-production-adapter tests passed");
