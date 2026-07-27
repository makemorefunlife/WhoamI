/**
 * Deep Read — shared normalized view-model adapter (lib/relationship/shared/deepReadViewModel.ts).
 * Covers the fail-closed / swap / partial-content contract shared by all four
 * non-Romantic saju-deep overlays (friend/business/married/family).
 * Run: npx tsx tests/unit/deep-read-viewmodel.test.mjs
 */
import assert from "node:assert/strict";
import { buildDeepReadViewModel } from "../../lib/relationship/shared/deepReadViewModel.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

// ---------------------------------------------------------------------------
console.log("\n=== 1) fully absent overlay -> null (fail-closed) ===");
assert.equal(buildDeepReadViewModel({}), null);
assert.equal(
  buildDeepReadViewModel({
    natureA: undefined,
    natureB: null,
    gapSignal: undefined,
    adviceA: undefined,
    adviceB: null,
    together: "",
    togetherStarter: "   ",
  }),
  null,
);
ok("empty/whitespace-only input returns null");

// ---------------------------------------------------------------------------
console.log("\n=== 2) malformed advice items are dropped, not crashed on ===");
const malformed = buildDeepReadViewModel({
  adviceA: [
    { action_title: "  ", saju_reason: "  " }, // both blank -> dropped
    { action_title: "Speak up first", saju_reason: "" }, // has title -> kept
    null,
    undefined,
    "not an object",
  ],
});
assert.ok(malformed);
assert.equal(malformed.adviceForMe.length, 1);
assert.equal(malformed.adviceForMe[0].actionTitle, "Speak up first");
ok("malformed/blank advice tips filtered safely, valid one survives");

// ---------------------------------------------------------------------------
console.log("\n=== 3) partial content is preserved, not discarded ===");
const onlyTogether = buildDeepReadViewModel({ together: "Try a 10-minute check-in." });
assert.ok(onlyTogether);
assert.equal(onlyTogether.together, "Try a 10-minute check-in.");
assert.equal(onlyTogether.meNature, undefined);
assert.equal(onlyTogether.adviceForMe.length, 0);
ok("together-only overlay still renders (not discarded for missing nature/advice)");

// ---------------------------------------------------------------------------
console.log("\n=== 4) swap=false -> A is 'me' ===");
const noSwap = buildDeepReadViewModel({
  natureA: { first_person_voice: "A voice", description: "A desc" },
  natureB: { first_person_voice: "B voice", description: "B desc" },
  gapSignal: { a_body: "A gap", b_body: "B gap", match_note: "note" },
  adviceA: [{ action_title: "For A" }],
  adviceB: [{ action_title: "For B" }],
  swap: false,
});
assert.equal(noSwap.meNature.voice, "A voice");
assert.equal(noSwap.partnerNature.voice, "B voice");
assert.equal(noSwap.gapSignal.meBody, "A gap");
assert.equal(noSwap.gapSignal.partnerBody, "B gap");
assert.equal(noSwap.adviceForMe[0].actionTitle, "For A");
assert.equal(noSwap.adviceForPartner[0].actionTitle, "For B");
ok("swap=false keeps A in the 'me' slot");

// ---------------------------------------------------------------------------
console.log("\n=== 5) swap=true -> B is 'me' (viewer is B) ===");
const swapped = buildDeepReadViewModel({
  natureA: { first_person_voice: "A voice" },
  natureB: { first_person_voice: "B voice" },
  gapSignal: { a_body: "A gap", b_body: "B gap" },
  adviceA: [{ action_title: "For A" }],
  adviceB: [{ action_title: "For B" }],
  swap: true,
});
assert.equal(swapped.meNature.voice, "B voice");
assert.equal(swapped.partnerNature.voice, "A voice");
assert.equal(swapped.gapSignal.meBody, "B gap");
assert.equal(swapped.gapSignal.partnerBody, "A gap");
assert.equal(swapped.adviceForMe[0].actionTitle, "For B");
assert.equal(swapped.adviceForPartner[0].actionTitle, "For A");
ok("swap=true flips A/B into partner/me correctly");

// ---------------------------------------------------------------------------
console.log("\n=== 6) family parent-first fallback (a_nature/b_nature aliasing) ===");
// Family adapter maps parent_nature/child_nature (or legacy a_nature/b_nature)
// into natureA/natureB before calling the shared builder, with swap always false.
const familyStyle = buildDeepReadViewModel({
  natureA: { description: "parent desc" }, // caller already resolved parent_nature ?? a_nature
  natureB: { description: "child desc" },
  swap: false,
});
assert.equal(familyStyle.meNature.description, "parent desc");
assert.equal(familyStyle.partnerNature.description, "child desc");
ok("fixed parent-first order (no viewer toggle) works through the same shared shape");

// ---------------------------------------------------------------------------
console.log("\n=== 7) output never leaks raw domain field names ===");
const full = buildDeepReadViewModel({
  natureA: { first_person_voice: "v", description: "d" },
  gapSignal: { a_body: "x", match_note: "y" },
  adviceA: [{ action_title: "t", saju_reason: "r", real_speech_tip: "s" }],
  together: "z",
});
const serialized = JSON.stringify(full);
for (const rawKey of [
  "a_body",
  "b_body",
  "match_note",
  "action_title",
  "saju_reason",
  "real_speech_tip",
  "first_person_voice",
  "section_2_nature",
  "section_5_action",
]) {
  assert.ok(!serialized.includes(`"${rawKey}"`), `leaked raw key: ${rawKey}`);
}
ok("normalized VM uses only its own field names (actionTitle/reason/speechTip/meBody/...)");

console.log("\nAll deep-read-viewmodel tests passed.");
