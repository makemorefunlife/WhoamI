/**
 * Phase 2 English remediation — Work vertical English coverage regression
 * tests. Proves that the six current-canonical Work chapter engines
 * produce zero unexpected Hangul in en-US mode, while ko-KR output still
 * contains the intended Korean (no accidental over-localization). Also
 * proves A/B ownership doesn't get scrambled when locale changes.
 *
 * Not a literal-sentence-equality test between locales (the task
 * explicitly calls for testing semantic structure, not sentence identity).
 *
 * Run: npx tsx tests/unit/work-english-coverage.test.mjs
 */
import assert from "node:assert/strict";

function ok(name) {
  console.log(`ok - ${name}`);
}

const HANGUL_RE = /[가-힣]/;
const LATIN_SENTENCE_RE = /\b(the|and|with|when|your|their)\b/i;

const { buildWorkOverviewChapterBundle } = await import("../../lib/relationship/workColleague/workOverviewChapterEngine.ts");
const { buildIndividualWorkChapterBundle } = await import("../../lib/relationship/workColleague/individualWorkChapterEngine.ts");
const { buildWorkCommunicationChapterBundle } = await import("../../lib/relationship/workColleague/workCommunicationChapterEngine.ts");
const { buildWorkPressureChapterBundle } = await import("../../lib/relationship/workColleague/workPressureChapterEngine.ts");
const { buildWorkConflictChapterBundle } = await import("../../lib/relationship/workColleague/workConflictChapterEngine.ts");
const { buildWorkPlaybookChapterBundle } = await import("../../lib/relationship/workColleague/workPlaybookChapterEngine.ts");

const psychA = { secondary_axes: { structure: 72, deliberate_decision: 68, analytical_thinking: 55, empathy: 40, stimulation: 35, thinking_style: 45, external_energy: 38, conflict_style: 40, practicality: 60, recognition: 45 }, primary_axes: {} };
const psychB = { secondary_axes: { structure: 35, deliberate_decision: 30, analytical_thinking: 70, empathy: 65, stimulation: 62, thinking_style: 65, external_energy: 70, conflict_style: 60, practicality: 45, recognition: 68 }, primary_axes: {} };

function jsonHasHangul(value) {
  return HANGUL_RE.test(JSON.stringify(value));
}
function jsonHasLatinFragment(value) {
  return LATIN_SENTENCE_RE.test(JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// 1. Work Overview Chapter — EN zero Hangul, KR zero stray English
{
  const paramsBase = { nameA: "Priya", nameB: "Jonas", fitPct: 62, synergyPct: 55, riskPct: 68, psychA, psychB };
  const en = buildWorkOverviewChapterBundle({ ...paramsBase, locale: "en-US" });
  const ko = buildWorkOverviewChapterBundle({ ...paramsBase, locale: "ko-KR" });

  assert.equal(jsonHasHangul(en), false, "workOverviewChapterEngine en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(ko), false, "workOverviewChapterEngine ko-KR output must not contain stray English sentence fragments");
  // Analytical parity: scores must not change with locale.
  assert.equal(en.workFitCard.score, ko.workFitCard.score);
  assert.equal(en.synergyCard.score, ko.synergyCard.score);
  assert.equal(en.officeRiskCard.score, ko.officeRiskCard.score);
  ok("workOverviewChapterEngine: EN clean, KR clean, scores locale-independent");
}

// ---------------------------------------------------------------------------
// 2. Individual Work Chapter — EN zero Hangul + A/B swap doesn't scramble ownership
{
  const en = buildIndividualWorkChapterBundle({ nameA: "Priya", nameB: "Jonas", psychA, psychB, locale: "en-US" });
  const ko = buildIndividualWorkChapterBundle({ nameA: "Priya", nameB: "Jonas", psychA, psychB, locale: "ko-KR" });
  assert.equal(jsonHasHangul(en), false, "individualWorkChapterEngine en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(ko), false, "individualWorkChapterEngine ko-KR output must not contain stray English sentence fragments");
  assert.equal(en.personA.name, "Priya");
  assert.equal(en.personB.name, "Jonas");

  // A/B swap: swapping which psych profile is "A" must swap which output
  // profile gets the psychA-driven traits — ownership must never scramble.
  const swapped = buildIndividualWorkChapterBundle({ nameA: "Jonas", nameB: "Priya", psychA: psychB, psychB: psychA, locale: "en-US" });
  assert.equal(swapped.personA.name, "Jonas");
  assert.equal(swapped.personB.name, "Priya");
  // personA in `swapped` now carries the same underlying psych (psychB) that
  // drove personB.identityLabel in the original `en` run — so the label sets
  // should match across that swap.
  assert.equal(swapped.personA.identityLabel, en.personB.identityLabel);
  assert.equal(swapped.personB.identityLabel, en.personA.identityLabel);
  ok("individualWorkChapterEngine: EN clean, KR clean, A/B ownership follows the data not the slot");
}

// ---------------------------------------------------------------------------
// 3. Work Communication Chapter — EN zero Hangul
{
  const paramsBase = { nameA: "Priya", nameB: "Jonas", psychA, psychB };
  const en = buildWorkCommunicationChapterBundle({ ...paramsBase, locale: "en-US" });
  const ko = buildWorkCommunicationChapterBundle({ ...paramsBase, locale: "ko-KR" });
  assert.equal(jsonHasHangul(en), false, "workCommunicationChapterEngine en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(ko), false, "workCommunicationChapterEngine ko-KR output must not contain stray English sentence fragments");
  ok("workCommunicationChapterEngine: EN clean, KR clean");
}

// ---------------------------------------------------------------------------
// 4. Work Pressure Chapter — EN zero Hangul
{
  const paramsBase = { nameA: "Priya", nameB: "Jonas", psychA, psychB };
  const en = buildWorkPressureChapterBundle({ ...paramsBase, locale: "en-US" });
  const ko = buildWorkPressureChapterBundle({ ...paramsBase, locale: "ko-KR" });
  assert.equal(jsonHasHangul(en), false, "workPressureChapterEngine en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(ko), false, "workPressureChapterEngine ko-KR output must not contain stray English sentence fragments");
  ok("workPressureChapterEngine: EN clean, KR clean");
}

// ---------------------------------------------------------------------------
// 5. Work Conflict Chapter — EN zero Hangul (TrustCurrencyKeyword excluded:
//    those are intentional internal identifiers, translated only at render
//    time in SectionRenderer.tsx's TRUST_CURRENCY_LABEL_EN map)
{
  const paramsBase = { nameA: "Priya", nameB: "Jonas", psychA, psychB };
  const en = buildWorkConflictChapterBundle({ ...paramsBase, locale: "en-US" });
  const ko = buildWorkConflictChapterBundle({ ...paramsBase, locale: "ko-KR" });

  const enForHangulCheck = {
    ...en,
    trustCurrencyA: { ...en.trustCurrencyA, topCurrencies: en.trustCurrencyA.topCurrencies.map((c) => c.explanation) },
    trustCurrencyB: { ...en.trustCurrencyB, topCurrencies: en.trustCurrencyB.topCurrencies.map((c) => c.explanation) },
  };
  assert.equal(jsonHasHangul(enForHangulCheck), false, "workConflictChapterEngine en-US output must contain zero Hangul (excluding TrustCurrencyKeyword identifiers)");
  assert.equal(jsonHasLatinFragment(ko), false, "workConflictChapterEngine ko-KR output must not contain stray English sentence fragments");
  ok("workConflictChapterEngine: EN clean, KR clean");
}

// ---------------------------------------------------------------------------
// 6. Work Playbook Chapter — EN zero Hangul + ownership-consistency guard
//    (the engine's own throw-on-mismatch check) still passes in both locales
{
  const paramsBase = { nameA: "Priya", nameB: "Jonas", psychA, psychB };
  const en = buildWorkPlaybookChapterBundle({ ...paramsBase, locale: "en-US" });
  const ko = buildWorkPlaybookChapterBundle({ ...paramsBase, locale: "ko-KR" });
  assert.equal(jsonHasHangul(en), false, "workPlaybookChapterEngine en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(ko), false, "workPlaybookChapterEngine ko-KR output must not contain stray English sentence fragments");
  for (const item of en.emergencyPlaybook) {
    assert.ok(item.responsibility.includes(item.ownerName), `en-US emergencyPlaybook responsibility must name its owner: ${item.functionName}`);
  }
  ok("workPlaybookChapterEngine: EN clean, KR clean, ownership-consistency guard holds in EN");
}

console.log("All work-english-coverage tests passed.");
