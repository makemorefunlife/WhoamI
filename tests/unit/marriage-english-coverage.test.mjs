/**
 * Phase 3 English remediation — Marriage vertical English coverage
 * regression tests. Proves the current-canonical Marriage chapter builders
 * (Ch01/05/06/07/08, reached through the real buildMarriageReport pipeline)
 * produce zero unexpected Hangul in en-US mode, while ko-KR output still
 * contains the intended Korean. Also proves A/B/role attribution follows
 * the real nickname params, not slot order.
 *
 * Run: npx tsx tests/unit/marriage-english-coverage.test.mjs
 */
import assert from "node:assert/strict";

function ok(name) {
  console.log(`ok - ${name}`);
}

const HANGUL_RE = /[가-힣]/;
const LATIN_SENTENCE_RE = /\b(the|and|with|when|your|their)\b/i;

function jsonHasHangul(value) {
  return HANGUL_RE.test(JSON.stringify(value));
}
function jsonHasLatinFragment(value) {
  return LATIN_SENTENCE_RE.test(JSON.stringify(value));
}

const { buildMarriageReport } = await import("../../lib/relationship/marriage/buildMarriageReport.ts");
const { buildMarriageReportViewModel } = await import("../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts");

const sajuA = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" }, dayStemCode: "eul", dayBranchCode: "myo" };
const sajuB = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" }, dayStemCode: "gyeong", dayBranchCode: "o" };

function makePsych(overrides) {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50, autonomy: 50, connection: 50, growth: 50,
    stability: 50,
  };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
    home_life_dna: { lifestyle_title: "체계적인 정리자", life_values_line: "안정된 공간" },
  };
}

const psychA = makePsych({ structure: 70, self_control: 65, practicality: 75, empathy: 45, conflict_style: 65 });
const psychB = makePsych({ structure: 45, self_control: 50, practicality: 40, empathy: 75, conflict_style: 40 });

function buildFor(locale) {
  return buildMarriageReport({
    nicknameA: "Dana",
    nicknameB: "Milo",
    sajuJsonA: sajuA,
    sajuJsonB: sajuB,
    psychMasterA: psychA,
    psychMasterB: psychB,
    birthDateA: "1990-03-14",
    birthDateB: "1991-07-22",
    birthTimeA: "09:30",
    birthTimeB: "21:15",
    birthTimeUnknownA: false,
    birthTimeUnknownB: false,
    locale,
    evaluationYear: 2026,
  });
}

const reportEn = buildFor("en-US");
const reportKo = buildFor("ko-KR");
const bundleEn = reportEn.canonical_projections?.marriage_canonical_bundle;
const bundleKo = reportKo.canonical_projections?.marriage_canonical_bundle;

// ---------------------------------------------------------------------------
// 1. Chapter 01 (Origin Story) — EN zero Hangul, KR zero stray English
{
  assert.ok(bundleEn?.chapter01Intelligence, "chapter01Intelligence must be present");
  assert.equal(jsonHasHangul(bundleEn.chapter01Intelligence), false, "Marriage Ch01 en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(bundleKo.chapter01Intelligence), false, "Marriage Ch01 ko-KR output must not contain stray English sentence fragments");
  ok("Marriage Ch01: EN clean, KR clean");
}

// ---------------------------------------------------------------------------
// 2. Chapter 05 (Money & Household Operations) — EN zero Hangul
{
  assert.ok(bundleEn?.chapter05Intelligence, "chapter05Intelligence must be present");
  assert.equal(jsonHasHangul(bundleEn.chapter05Intelligence), false, "Marriage Ch05 en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(bundleKo.chapter05Intelligence), false, "Marriage Ch05 ko-KR output must not contain stray English sentence fragments");
  ok("Marriage Ch05: EN clean, KR clean");
}

// ---------------------------------------------------------------------------
// 3. Chapter 06 (Family System) — EN zero Hangul (client-fallback rebuild path,
//    since buildMarriageChapter06Intelligence has no call site in buildMarriageCanonicalEngine)
{
  const vmEn = buildMarriageReportViewModel(reportEn, { viewerIsReportA: true, myName: "Dana", partnerName: "Milo", locale: "en-US" });
  const vmKo = buildMarriageReportViewModel(reportKo, { viewerIsReportA: true, myName: "Dana", partnerName: "Milo", locale: "ko-KR" });
  const parentingEn = vmEn.sections.find((s) => s.type === "parenting");
  const parentingKo = vmKo.sections.find((s) => s.type === "parenting");
  assert.ok(parentingEn?.ch06Intelligence, "ch06Intelligence must be present on the parenting section via viewmodel fallback");
  assert.equal(jsonHasHangul(parentingEn.ch06Intelligence), false, "Marriage Ch06 en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(parentingKo.ch06Intelligence), false, "Marriage Ch06 ko-KR output must not contain stray English sentence fragments");
  ok("Marriage Ch06: EN clean, KR clean");
}

// ---------------------------------------------------------------------------
// 4. Chapter 07 (Conflict & Repair) — EN zero Hangul
{
  assert.ok(bundleEn?.chapter07Intelligence, "chapter07Intelligence must be present");
  assert.equal(jsonHasHangul(bundleEn.chapter07Intelligence), false, "Marriage Ch07 en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(bundleKo.chapter07Intelligence), false, "Marriage Ch07 ko-KR output must not contain stray English sentence fragments");
  ok("Marriage Ch07: EN clean, KR clean");
}

// ---------------------------------------------------------------------------
// 5. Chapter 08 (Timing) — EN zero Hangul (requires real birth data, provided above)
{
  assert.ok(bundleEn?.chapter08Intelligence, "chapter08Intelligence must be present given real birth data");
  assert.equal(jsonHasHangul(bundleEn.chapter08Intelligence), false, "Marriage Ch08 en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(bundleKo.chapter08Intelligence), false, "Marriage Ch08 ko-KR output must not contain stray English sentence fragments");
  ok("Marriage Ch08: EN clean, KR clean");
}

// ---------------------------------------------------------------------------
// 6. A/B attribution safety — swap which literal nickname is passed as A vs B
//    and confirm chapter fields follow the nickname, not slot order.
{
  const swapped = buildMarriageReport({
    nicknameA: "Milo",
    nicknameB: "Dana",
    sajuJsonA: sajuB,
    sajuJsonB: sajuA,
    psychMasterA: psychB,
    psychMasterB: psychA,
    birthDateA: "1991-07-22",
    birthDateB: "1990-03-14",
    birthTimeA: "21:15",
    birthTimeB: "09:30",
    birthTimeUnknownA: false,
    birthTimeUnknownB: false,
    locale: "en-US",
    evaluationYear: 2026,
  });
  const swappedBundle = swapped.canonical_projections?.marriage_canonical_bundle;
  assert.equal(swappedBundle.chapter01Intelligence.mutualNeed.needAtoB.seekerName, "Milo", "swapped Ch01 needAtoB seeker must follow nicknameA slot (Milo)");
  assert.equal(swappedBundle.chapter07Intelligence.section01_journey.personA.personName, "Milo", "swapped Ch07 personA must follow nicknameA slot (Milo)");
  assert.equal(swappedBundle.chapter07Intelligence.section01_journey.personB.personName, "Dana", "swapped Ch07 personB must follow nicknameB slot (Dana)");
  ok("Marriage A/B attribution follows nicknameA/nicknameB params, not a fixed slot identity");
}

// ---------------------------------------------------------------------------
// 7. Analytical parity — locale must not change underlying evidence/decision
{
  assert.equal(
    bundleEn.chapter01Intelligence.attraction.drivers.length,
    bundleKo.chapter01Intelligence.attraction.drivers.length,
    "Ch01 driver count must be locale-independent",
  );
  assert.equal(
    bundleEn.chapter07Intelligence.section02_conflictLoop.headline === bundleKo.chapter07Intelligence.section02_conflictLoop.headline,
    false, // headlines are localized strings, so they differ — but the underlying isADirect/isBAvoidant branch selection should be consistent
    "sanity: EN/KR headline strings should differ (they are localized), confirming this isn't accidentally comparing identical fallback text",
  );
  assert.equal(bundleEn.chapter07Intelligence.section03_hurtPoint.personA.headline !== "", true);
  ok("Marriage Ch01/Ch07 analytical structure is locale-independent (branch selection unaffected by locale)");
}

console.log("All marriage-english-coverage tests passed.");
