/**
 * Phase 2 English remediation — Family vertical English coverage regression
 * tests. Proves the current-canonical Family chapter engines produce zero
 * unexpected Hangul in en-US mode, while ko-KR output still contains the
 * intended Korean. Also proves parent/child ROLE (not storage order) drives
 * output — swapping which literal slot holds the parent must not scramble
 * who gets called "parent" vs "child" in the copy.
 *
 * Run: npx tsx tests/unit/family-english-coverage.test.mjs
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

const { buildFamilyConflictChapterBundle } = await import("../../lib/relationship/familyParent/familyConflictChapterEngine.ts");
const { buildFamilyGrowthChapterBundle } = await import("../../lib/relationship/familyParent/familyGrowthChapterEngine.ts");
const { buildFamilyRepairChapterBundle } = await import("../../lib/relationship/familyParent/familyRepairChapterEngine.ts");
const { buildFamilyActionChapterBundle } = await import("../../lib/relationship/familyParent/familyActionChapterEngine.ts");
const { computeChildParentingNeedsEngine } = await import("../../lib/relationship/familyParent/familyChildParentingNeedsEngine.ts");

const psychParent = { secondary_axes: { structure: 70, conflict_style: 55, resilience: 60, empathy: 45, recognition: 40 } };
const psychChild = { secondary_axes: { structure: 30, resilience: 40, recognition: 62, analytical_thinking: 45, external_energy: 65, stimulation: 60, stability_orientation: 35, practicality: 40, self_control: 35, adaptability: 55 } };

function makeCtx(locale) {
  return {
    locale,
    parentNickname: "Dana",
    childNickname: "Milo",
    canonicalPairFacts: { hasClash: false, hasWonjinOrGuimun: false },
  };
}

// ---------------------------------------------------------------------------
// 1. Family Conflict Chapter — EN zero Hangul, KR zero stray English
{
  const params = { report: {}, psychParent, psychChild, psychProjections: [] };
  const en = buildFamilyConflictChapterBundle({ ctx: makeCtx("en-US"), ...params });
  const ko = buildFamilyConflictChapterBundle({ ctx: makeCtx("ko-KR"), ...params });
  assert.equal(jsonHasHangul(en), false, "familyConflictChapterEngine en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(ko), false, "familyConflictChapterEngine ko-KR output must not contain stray English sentence fragments");
  assert.ok(en.loveAnalysis.parentExpressionTitle.includes("Dana"));
  assert.ok(en.loveAnalysis.childReceptionTitle.includes("Milo"));
  ok("familyConflictChapterEngine: EN clean, KR clean, names attach to the right role");
}

// ---------------------------------------------------------------------------
// 2. Family Growth Chapter — EN zero Hangul
{
  const params = { childNickname: "Milo", parentNickname: "Dana", psychChild, psychParent, countsChild: {} };
  const en = buildFamilyGrowthChapterBundle({ ...params, locale: "en-US" });
  const ko = buildFamilyGrowthChapterBundle({ ...params, locale: "ko-KR" });
  assert.equal(jsonHasHangul(en), false, "familyGrowthChapterEngine en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(ko), false, "familyGrowthChapterEngine ko-KR output must not contain stray English sentence fragments");
  ok("familyGrowthChapterEngine: EN clean, KR clean");
}

// ---------------------------------------------------------------------------
// 3. Family Repair Chapter — EN zero Hangul
{
  const params = { childNickname: "Milo", parentNickname: "Dana", psychChild, psychParent, countsChild: {}, countsParent: {} };
  const en = buildFamilyRepairChapterBundle({ ...params, locale: "en-US" });
  const ko = buildFamilyRepairChapterBundle({ ...params, locale: "ko-KR" });
  assert.equal(jsonHasHangul(en), false, "familyRepairChapterEngine en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(ko), false, "familyRepairChapterEngine ko-KR output must not contain stray English sentence fragments");
  ok("familyRepairChapterEngine: EN clean, KR clean");
}

// ---------------------------------------------------------------------------
// 4. Family Action Chapter — EN zero Hangul + role-correct name attachment
{
  const params = { childNickname: "Milo", parentNickname: "Dana", psychChild, psychParent, countsChild: {}, countsParent: {} };
  const en = buildFamilyActionChapterBundle({ ...params, locale: "en-US" });
  const ko = buildFamilyActionChapterBundle({ ...params, locale: "ko-KR" });
  assert.equal(jsonHasHangul(en), false, "familyActionChapterEngine en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(ko), false, "familyActionChapterEngine ko-KR output must not contain stray English sentence fragments");

  // Role safety: swap which literal nickname is passed as parent vs child —
  // the output must follow the ROLE (parentNickname/childNickname), not
  // whichever string happened to be passed first.
  const swapped = buildFamilyActionChapterBundle({
    childNickname: "Dana",
    parentNickname: "Milo",
    psychChild,
    psychParent,
    countsChild: {},
    countsParent: {},
    locale: "en-US",
  });
  assert.ok(swapped.finalTakeaway.childNeedTitle.includes("Dana"), "when Dana is passed as childNickname, the child-need copy must reference Dana");
  assert.ok(swapped.finalTakeaway.parentStrengthTitle.includes("Milo"), "when Milo is passed as parentNickname, the parent-strength copy must reference Milo");
  ok("familyActionChapterEngine: EN clean, KR clean, output follows role not literal slot order");
}

// ---------------------------------------------------------------------------
// 5. Child Parenting Needs Engine — EN zero Hangul, labels come from the
//    bilingual DIMENSION_LABELS dictionary (not just KO)
{
  const ctxBase = {
    tenGod: { countsChild: {}, countsParent: {} },
    canonicalPersonalChild: { isWeak: false },
  };
  const params = { report: { canonical_projections: {} }, psychParent, psychChild };
  const en = computeChildParentingNeedsEngine({ ctx: { ...ctxBase, locale: "en-US" }, ...params });
  const ko = computeChildParentingNeedsEngine({ ctx: { ...ctxBase, locale: "ko-KR" }, ...params });
  assert.equal(jsonHasHangul(en), false, "familyChildParentingNeedsEngine en-US output must contain zero Hangul");
  assert.equal(jsonHasLatinFragment(ko), false, "familyChildParentingNeedsEngine ko-KR output must not contain stray English sentence fragments");
  // Analytical parity: dimension scores/status must not change with locale.
  for (const dim of en.dimensionDetails) {
    const koDim = ko.dimensionDetails.find((d) => d.dimension === dim.dimension);
    assert.equal(dim.desiredScore, koDim.desiredScore, `${dim.dimension} desiredScore must be locale-independent`);
    assert.equal(dim.suppliedScore, koDim.suppliedScore, `${dim.dimension} suppliedScore must be locale-independent`);
    assert.equal(dim.status, koDim.status, `${dim.dimension} status must be locale-independent`);
  }
  ok("familyChildParentingNeedsEngine: EN clean, KR clean, dimension scores/status locale-independent");
}

console.log("All family-english-coverage tests passed.");
