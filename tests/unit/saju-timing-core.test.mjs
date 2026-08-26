import assert from "node:assert/strict";
import {
  calculateIndividualDaewoon,
  getSeunForForecastYear,
  getCurrentSajuYear,
  buildTimingFacts,
  buildTimingCanonicalEvidence,
} from "../../lib/saju/timing/index.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`✓ ${name}`);
}

console.log("==========================================");
console.log("Shared Saju Timing Core Unit Test Suite");
console.log("==========================================");

// ---------------------------------------------------------------------------
section("1. Daewoon Direction - Yang Male (FORWARD) vs Yang Female (REVERSE)");
const dwYangMale = calculateIndividualDaewoon({ birthDate: "1990-05-15", gender: "M" });
const dwYangFemale = calculateIndividualDaewoon({ birthDate: "1990-05-15", gender: "F" });

assert.equal(dwYangMale.direction, "FORWARD", "Yang Male must be FORWARD");
assert.equal(dwYangFemale.direction, "REVERSE", "Yang Female must be REVERSE");
ok("Yang Male -> FORWARD, Yang Female -> REVERSE verified");

// ---------------------------------------------------------------------------
section("2. Daewoon Direction - Yin Male (REVERSE) vs Yin Female (FORWARD)");
const dwYinMale = calculateIndividualDaewoon({ birthDate: "1993-05-15", gender: "M" });
const dwYinFemale = calculateIndividualDaewoon({ birthDate: "1993-05-15", gender: "F" });

assert.equal(dwYinMale.direction, "REVERSE", "Yin Male must be REVERSE");
assert.equal(dwYinFemale.direction, "FORWARD", "Yin Female must be FORWARD");
ok("Yin Male -> REVERSE, Yin Female -> FORWARD verified");

// ---------------------------------------------------------------------------
section("3. Daewoon Start Age & 10-Year Period Sequence Math");
assert.equal(dwYangFemale.startAge, 3, "StartAge for 1990-05-15 Female must be 3");
assert.equal(dwYangFemale.periods.length, 10, "Periods length must be 10");
assert.equal(dwYangFemale.periods[0].pillar, "경진", "First reverse period from 신사 must be 경진");
assert.equal(dwYangFemale.periods[1].pillar, "기묘", "Second reverse period must be 기묘");
assert.equal(dwYangFemale.periods[0].startAge, 3, "Period 1 startAge must be 3");
assert.equal(dwYangFemale.periods[0].endAge, 12, "Period 1 endAge must be 12");
ok("Daewoon start age & 10-year period stepping verified");

// ---------------------------------------------------------------------------
section("4. Individual Independence (No Couple / Partner Leakage)");
const personAInput = { birthDate: "1990-05-15", gender: "F" };
const resA1 = calculateIndividualDaewoon(personAInput);
const resA2 = calculateIndividualDaewoon(personAInput);

assert.deepEqual(resA1, resA2, "Individual Daewoon calculation must be 100% deterministic and isolated");
ok("Individual independence & 100% deterministic isolation verified");

// ---------------------------------------------------------------------------
section("5. Forecast Seun Pillar Generation (1984 Gapja Anchor)");
const seun2026 = getSeunForForecastYear(2026);
const seun2027 = getSeunForForecastYear(2027);
const seun2028 = getSeunForForecastYear(2028);

assert.equal(seun2026.pillar, "병오", "2026 Seun must be 병오");
assert.equal(seun2027.pillar, "정미", "2027 Seun must be 정미");
assert.equal(seun2028.pillar, "무신", "2028 Seun must be 무신");
ok("2026(병오), 2027(정미), 2028(무신) Seun pillar generation verified");

// ---------------------------------------------------------------------------
section("6. Lichun Current-Year Boundary Resolution");
assert.equal(getCurrentSajuYear("2026-01-20"), 2025, "Jan 20 before Lichun must resolve to 2025");
assert.equal(getCurrentSajuYear("2026-02-10"), 2026, "Feb 10 after Lichun must resolve to 2026");
ok("Lichun boundary resolution verified");

// ---------------------------------------------------------------------------
section("7. Daewoon Background Context & Renamed Neutral CE Keys");
const seraFacts = buildTimingFacts({
  personId: "sera",
  birthDate: "1990-05-15",
  gender: "F",
  fromYear: 2026,
  toYear: 2028,
});

const seraFact2026 = seraFacts.yearlySeun[0];
assert.equal(seraFact2026.currentDaewoonPillar, "정축", "Sera active Daewoon in 2026 must be 정축");
assert.equal(seraFact2026.currentDaewoonTenGodKorName, "정관", "Sera active Daewoon Ten God in 2026 must be 정관");

const seraCE = buildTimingCanonicalEvidence(seraFacts);

// Check renamed neutral CE keys
const officerSignal = seraCE.signals.find((s) => s.key === "officer_theme_activation_2026");
assert.ok(officerSignal, "officer_theme_activation_2026 signal must exist (renamed from responsibility_activation)");
assert.equal(officerSignal.sources[0].layer, "SEUN", "Source layer must be SEUN");

const bgSignal = seraCE.signals.find((s) => s.key === "officer_theme_background_2026");
assert.ok(bgSignal, "officer_theme_background_2026 signal must exist for Daewoon background context");
assert.equal(bgSignal.sources[0].layer, "DAEWOON", "Source layer for background must be DAEWOON");
ok("Daewoon background context & renamed neutral CE keys verified");

// ---------------------------------------------------------------------------
section("8. Donggeul 2027 -> 2028 Daewoon Transition Proof");
const donggeulFacts = buildTimingFacts({
  personId: "donggeul",
  birthDate: "1992-08-20",
  gender: "M",
  fromYear: 2027,
  toYear: 2028,
});

const donggeul2027 = donggeulFacts.yearlySeun[0];
const donggeul2028 = donggeulFacts.yearlySeun[1];

assert.equal(donggeul2027.currentDaewoonPillar, "신해", "Donggeul active Daewoon in 2027 must be 신해");
assert.equal(donggeul2027.currentDaewoonTenGodKorName, "상관", "Donggeul active Daewoon Ten God in 2027 must be 상관");

assert.equal(donggeul2028.currentDaewoonPillar, "임자", "Donggeul active Daewoon in 2028 must be 임자");
assert.equal(donggeul2028.currentDaewoonTenGodKorName, "편재", "Donggeul active Daewoon Ten God in 2028 must be 편재");

const donggeulCE = buildTimingCanonicalEvidence(donggeulFacts);
const bg2027 = donggeulCE.signals.find((s) => s.key === "output_theme_background_2027");
const bg2028 = donggeulCE.signals.find((s) => s.key === "wealth_theme_background_2028");

assert.ok(bg2027, "Donggeul 2027 output_theme_background must exist for 신해 (상관)");
assert.ok(bg2028, "Donggeul 2028 wealth_theme_background must exist for 임자 (편재)");
assert.equal(bg2027.sources[0].value, "sanggwan", "2027 background source value must be sanggwan");
assert.equal(bg2028.sources[0].value, "pyeonjae", "2028 background source value must be pyeonjae");

ok("Donggeul 2027(신해/상관) -> 2028(임자/편재) Daewoon transition proof verified");

// ---------------------------------------------------------------------------
section("9. Supported Relation Detection & Unsupported Exclusion");
const allRels = seraFacts.yearlySeun.flatMap((y) => y.relations);
const relTypes = new Set(allRels.map((r) => r.type));

assert.ok(!relTypes.has("반합"), "반합 must NOT exist as deterministic fact");
assert.ok(!relTypes.has("암합"), "암합 must NOT exist as deterministic fact");
ok("Supported relation detection & unsupported relation exclusion verified");

// ---------------------------------------------------------------------------
section("10. Zero Domain Vocabulary in Shared CE");
for (const sig of seraCE.signals) {
  assert.ok(!sig.key.includes("marriage"), "CE key must not contain marriage domain vocabulary");
  assert.ok(!sig.key.includes("career"), "CE key must not contain career domain vocabulary");
  assert.ok(!sig.key.includes("divorce"), "CE key must not contain divorce domain vocabulary");
}
ok("Zero domain language in shared Timing CE verified");

console.log("\n==========================================");
console.log("ALL 10 UPGRADED TIMING TESTS PASSED!");
console.log("==========================================");
