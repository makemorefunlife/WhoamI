/**
 * Romantic V4 — KO/EN parity for the real (production) mode.
 *
 * Same real fixture through ko-KR and en-US must produce the same canonical
 * meanings and section coverage — same visible chapterIds, same
 * comparisonTable row count/keys, same axisOverview axis keys — with only
 * the rendered copy differing per locale, and zero cross-locale text
 * leakage (no Hangul in the EN canonicalReport, no raw English sentence
 * fragments — undefined/[object Object]/NaN — leaking into either locale).
 *
 * Run: npx tsx tests/unit/romantic-v4-ko-en-parity.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { buildRomanticV4PrototypePayload } = await import(
  "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts"
);
const { buildNeutralV2Profile } = await import("../../lib/v2/survey/neutralProfile.ts");
const adapters = await import("../../components/relationship/romantic/v4/adaptCanonicalSection.ts");

function makeProfile(overrides) {
  const base = buildNeutralV2Profile();
  return { ...base, secondary_axes: { ...base.secondary_axes, ...overrides } };
}

const profileA = makeProfile({ conflict_style: 18, empathy: 22, structure: 12 });
const profileB = makeProfile({ conflict_style: 91, empathy: 85, structure: 93 });
const birthA = { birthDate: "1985-01-10", birthTime: "03:00", birthTimeUnknown: false };
const birthB = { birthDate: "1985-01-10", birthTime: "15:00", birthTimeUnknown: false };

function buildFor(locale) {
  return buildRomanticV4PrototypePayload("complete", locale, {
    surveyInput: { mode: "real", profileA, profileB },
    pairSajuInput: { mode: "real", birthA, birthB, nameA: "Priya", nameB: "Jonas" },
  });
}

const ko = buildFor("ko-KR");
const en = buildFor("en-US");

// ---------------------------------------------------------------------------
section("1) Both locales produce a canonicalReport with visible sections");

assert.ok(ko.canonicalReport, "ko-KR must produce a canonicalReport");
assert.ok(en.canonicalReport, "en-US must produce a canonicalReport");
const koVisible = ko.canonicalReport.sections.filter((s) => s.visible);
const enVisible = en.canonicalReport.sections.filter((s) => s.visible);
assert.ok(koVisible.length > 0 && enVisible.length > 0);
ok(`ko-KR: ${koVisible.length} visible sections, en-US: ${enVisible.length} visible sections`);

// ---------------------------------------------------------------------------
section("2) Same visible chapterIds — identical section coverage across locales");

const koChapterIds = koVisible.map((s) => s.chapterId).sort();
const enChapterIds = enVisible.map((s) => s.chapterId).sort();
assert.deepEqual(koChapterIds, enChapterIds, "the SAME set of chapters must be visible regardless of locale — only rendered copy should differ");
ok(`identical visible chapterId sets: [${koChapterIds.join(", ")}]`);

// ---------------------------------------------------------------------------
section("3) Same validation outcome and comparisonTable coverage");

assert.equal(ko.canonicalReport.validation.ok, en.canonicalReport.validation.ok);
assert.equal(ko.comparisonTable.length, en.comparisonTable.length);
assert.equal(ko.comparisonTable.length, 6);
assert.deepEqual(
  ko.comparisonTable.map((r) => r.rowId).sort(),
  en.comparisonTable.map((r) => r.rowId).sort(),
);
ok("same validation.ok and identical 6-row comparisonTable rowIds across locales");

// ---------------------------------------------------------------------------
section("4) Same axisOverview axis keys");

const koAxisKeys = ko.axisOverview.map((a) => a.axis_key).sort();
const enAxisKeys = en.axisOverview.map((a) => a.axis_key).sort();
assert.deepEqual(koAxisKeys, enAxisKeys, "the same underlying axis keys must be present in both locales — only labels differ");
ok(`${koAxisKeys.length} identical axis keys in both locales`);

// ---------------------------------------------------------------------------
section("5) Same numeric Gold Logic values (scores/gaps/confidence) — locale must never change computed values");

for (let i = 0; i < ko.comparisonTable.length; i++) {
  const koRow = ko.comparisonTable.find((r) => r.rowId === en.comparisonTable[i].rowId);
  const enRow = en.comparisonTable[i];
  assert.equal(koRow.confidence, enRow.confidence, `row ${enRow.rowId} confidence must match across locales`);
}
for (const enAxis of en.axisOverview) {
  const koAxis = ko.axisOverview.find((a) => a.axis_key === enAxis.axis_key);
  assert.equal(koAxis.score_a, enAxis.score_a);
  assert.equal(koAxis.score_b, enAxis.score_b);
  assert.equal(koAxis.gap, enAxis.gap);
  assert.equal(koAxis.match_type, enAxis.match_type);
}
ok("comparisonTable confidence and axisOverview scores/gaps/match_type are locale-independent");

// ---------------------------------------------------------------------------
section("6) comparisonTable prose and axis labels ARE locale-correct (localizeComparisonRowProse / psychMatchAxisLabel)");

const enComparisonText = JSON.stringify(
  en.comparisonTable.map((r) => [r.relationshipManifestation, r.understandingPoint]),
);
const hangulPattern = /[가-힣]/;
assert.equal(hangulPattern.test(enComparisonText), false, "en-US comparisonTable prose must contain zero Hangul — localizeComparisonRowProse is locale-branched");
ok("en-US comparisonTable manifestation/understanding prose contains zero Hangul");

// ---------------------------------------------------------------------------
section("7) canonicalReport chapter prose (c1-c12) is now fully locale-aware — zero Hangul leakage into en-US");

// composeCanonicalSectionNarratives.ts + buildCanonicalRelationshipStoryPlan.ts +
// chapterLensResolvers.ts + spousePalaceMatcher.ts + personalRelationshipCe.ts +
// tenGodRomanticProfiles.ts + axisStandoutInterpretations.ts were all threaded
// with locale and given English content. Only rendered fields matter here —
// every block's title/body (what CanonicalReportView/ChaptersA/B actually
// render), plus the section-level title/userQuestion. structuredData and
// expertSynthesis are deliberately excluded: neither is ever rendered by any
// UI component (confirmed by source grep — zero references in ChaptersA.tsx/
// ChaptersB.tsx/adaptCanonicalSection.ts), so the deterministic
// expertSynthesis generator (buildExpertSynthesis.ts) staying Korean-only is
// a real, separate, disclosed gap — but not a user-visible leak.
const enRenderedText = JSON.stringify(
  en.canonicalReport.sections.map((s) => ({
    title: s.title,
    userQuestion: s.userQuestion,
    blocks: s.blocks.map((b) => ({ title: b.title, body: b.body })),
  })),
);
assert.equal(
  hangulPattern.test(enRenderedText),
  false,
  "en-US canonicalReport's rendered title/body fields (section + block level) must contain zero Hangul",
);
ok("en-US canonicalReport rendered title/body fields (every chapter, every block) contain zero Hangul");

// ---------------------------------------------------------------------------
section("8) No Korean narrative leaks into ko-KR from an English source, and no stray leakage placeholders in either locale");

const latinSentencePattern = /\b(the|and|with|when|your|their)\b/i;
const koRenderedText = JSON.stringify(
  ko.canonicalReport.sections.map((s) => ({
    title: s.title,
    blocks: s.blocks.map((b) => ({ title: b.title, body: b.body })),
  })),
);
assert.equal(
  latinSentencePattern.test(koRenderedText),
  false,
  "ko-KR canonicalReport's rendered title/body fields must not contain stray English sentence fragments",
);

for (const [label, payload] of [["ko-KR", ko], ["en-US", en]]) {
  const text = JSON.stringify(payload.canonicalReport.sections);
  for (const needle of ["undefined", "[object Object]", "NaN"]) {
    assert.equal(text.includes(needle), false, `${label} canonicalReport must not contain the literal string "${needle}"`);
  }
}
ok("no English leaking into ko-KR rendered content, and no undefined/[object Object]/NaN leakage in either locale's canonicalReport");

// ---------------------------------------------------------------------------
section("9) Zero Hangul across every UI adapter's actual output (not just raw canonicalReport blocks)");

// Several adapters (adaptDynamics, adaptConflict, adaptDifference, adaptHiddenHearts,
// adaptStrength, adaptChoice) read structuredData/storyPlan directly instead of
// section.blocks[].body — this caught a real bug during development: adaptDifference
// had 6 hardcoded Korean axis labels ("감정 처리" etc.) regardless of locale, which
// section 7 above (raw canonicalReport blocks) could never have caught since those
// labels live in the adapter, not the engine. This is the only check that reflects
// what a real user actually sees.
const sectionFor = (id) => en.canonicalReport.sections.find((s) => s.chapterId === id);
const adaptedOutputs = {
  hero: adapters.adaptHero(sectionFor("c1_hero")),
  attraction: adapters.adaptAttraction(sectionFor("c2_attraction"), en),
  dynamics: adapters.adaptDynamics(sectionFor("c3_dynamics")),
  conflict: adapters.adaptConflict(sectionFor("c4_conflict"), en),
  difference: adapters.adaptDifference(sectionFor("c5_misunderstanding"), en),
  translatorPanels: adapters.adaptTranslatorPanels(en),
  radar: adapters.adaptRadarAxes(en),
  hiddenHearts: adapters.adaptHiddenHearts(sectionFor("c6_hidden_hearts")),
  repair: adapters.adaptRepair(sectionFor("c7_repair")),
  strength: adapters.adaptStrength(sectionFor("c8_strength_vulnerability"), en),
  dailyLife: adapters.adaptDailyLife(sectionFor("c9_daily_life")),
  reflection: adapters.adaptReflection(sectionFor("c11_reflection")),
  choice: adapters.adaptChoice(sectionFor("c12_choice"), en),
};
for (const [name, value] of Object.entries(adaptedOutputs)) {
  const json = JSON.stringify(value);
  assert.equal(hangulPattern.test(json), false, `adapt${name[0].toUpperCase()}${name.slice(1)}'s en-US output must contain zero Hangul`);
}
ok(`zero Hangul across all ${Object.keys(adaptedOutputs).length} chapter adapters' en-US output`);

// ---------------------------------------------------------------------------
section("10) adaptRadarHighlights (Phase 3 fix) — zero Hangul, both the primary path and the legacy fallback path");

const radarHighlights = adapters.adaptRadarHighlights(en, "Priya", "Jonas");
assert.equal(
  hangulPattern.test(JSON.stringify(radarHighlights)),
  false,
  "adaptRadarHighlights en-US output must contain zero Hangul",
);
ok("adaptRadarHighlights en-US output contains zero Hangul (primary selectedAxisInsights path)");

// Force the legacy fallback branch (no selectedAxisInsights, only axisOverview)
// by building a payload shape with selectedAxisInsights stripped — this is
// exactly the "old cached record" case the Phase 3 forensic trace flagged as
// a real, previously-Korean-only leak in the fallback synthesis.
const enForFallback = { ...en, selectedAxisInsights: [] };
const fallbackHighlights = adapters.adaptRadarHighlights(enForFallback, "Priya", "Jonas");
assert.ok(fallbackHighlights.length > 0, "the fallback path must still synthesize highlights from axisOverview");
assert.equal(
  hangulPattern.test(JSON.stringify(fallbackHighlights)),
  false,
  "adaptRadarHighlights en-US fallback-branch output must contain zero Hangul",
);
ok("adaptRadarHighlights en-US fallback branch (legacy cached record shape) contains zero Hangul");

// ---------------------------------------------------------------------------
section("11) romanticGapBatch (Phase 3 fix — computeRomanticV4GapBatchEngine) — zero Hangul, rendered directly by ChaptersA/B");

assert.ok(en.storyPlan?.romanticGapBatch, "en-US payload must include storyPlan.romanticGapBatch");
assert.ok(ko.storyPlan?.romanticGapBatch, "ko-KR payload must include storyPlan.romanticGapBatch");
const gapBatchText = JSON.stringify(en.storyPlan.romanticGapBatch);
assert.equal(hangulPattern.test(gapBatchText), false, "en-US storyPlan.romanticGapBatch must contain zero Hangul — this is rendered directly by ChaptersA.tsx/ChaptersB.tsx");
ok("en-US storyPlan.romanticGapBatch (longTermBond, wantedVsGivenLove, emergencySos, conflictTransitions, etc.) contains zero Hangul");

const koGapBatchText = JSON.stringify(ko.storyPlan.romanticGapBatch);
assert.equal(latinSentencePattern.test(koGapBatchText), false, "ko-KR storyPlan.romanticGapBatch must not contain stray English sentence fragments");
ok("ko-KR storyPlan.romanticGapBatch unaffected by the en-US locale threading");

// Role/ownership safety: chapter06's roleMatrix.roleA must always describe
// nameA (Priya) and roleMatrix.roleB must always describe nameB (Jonas) —
// i.e. the wantedVsGivenLove/emergencySos/etc. person-name fields must match
// the same person the role/scores were derived from, not get scrambled.
const gb = en.storyPlan.romanticGapBatch;
assert.equal(gb.wantedVsGivenLove.loveA.personName, "Priya", "wantedVsGivenLove.loveA must be attributed to nameA (Priya)");
assert.equal(gb.wantedVsGivenLove.loveB.personName, "Jonas", "wantedVsGivenLove.loveB must be attributed to nameB (Jonas)");
assert.equal(gb.emergencySos.sosAtoB.seekerName, "Priya", "emergencySos.sosAtoB seeker must be nameA (Priya)");
assert.equal(gb.emergencySos.sosAtoB.providerName, "Jonas", "emergencySos.sosAtoB provider must be nameB (Jonas)");
assert.equal(gb.conflictTransitions.transitionA.personName, "Priya", "conflictTransitions.transitionA must be attributed to nameA (Priya)");
assert.equal(gb.conflictTransitions.transitionB.personName, "Jonas", "conflictTransitions.transitionB must be attributed to nameB (Jonas)");
ok("romanticGapBatch fields stay correctly attributed to nameA/nameB (Priya/Jonas), not scrambled across the A/B split");

console.log("\nOK: romantic-v4-ko-en-parity tests passed");
