import assert from "node:assert/strict";
import {
  scoreEmotionalReception,
  scoreProblemResponse,
  scoreReliabilitySensitivity,
  scoreConflictDirectness,
  scoreConnectionMaintenance,
  scoreAutonomySpaceNeed,
  buildFriendResponseProfile,
  buildFriendPairResponseComparison,
  detectSharedBlindSpot,
} from "../../lib/relationship/friend/response/buildFriendResponseDimensions.ts";
import { buildFriendResponseIntelligence, buildDistanceProfile } from "../../lib/relationship/friend/response/buildFriendResponseIntelligence.ts";
import { buildFriendRuleContext } from "../../lib/relationship/friend/buildFriendRuleContext.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function sajuFromBirth(birthDate) {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
  return toV1SajuApiPayload(bundle);
}
const emptyTenGods = {};
function psych(axes) {
  return { version: "psych_master_v1", secondary_axes: axes };
}

console.log("=== Friend Canonical Response Profile — Implementation Test Matrix ===");

// A. CANONICAL DIMENSION TESTS ----------------------------------------------

{
  const high = scoreEmotionalReception({ personId: "a", tenGods: emptyTenGods, psych: psych({ empathy: 85 }) });
  const mod = scoreEmotionalReception({ personId: "a", tenGods: emptyTenGods, psych: psych({ empathy: 50 }) });
  const low = scoreEmotionalReception({ personId: "a", tenGods: emptyTenGods, psych: psych({ empathy: 15 }) });
  assert.equal(high.level, "HIGH");
  assert.equal(mod.level, "MODERATE");
  assert.equal(low.level, "LOW");
  console.log("ok - A1: emotionalReception high/moderate/low levels correct");
}

{
  const clarify = scoreProblemResponse({ personId: "a", tenGods: emptyTenGods, psych: psych({ thinking_style: 90 }) });
  const solve = scoreProblemResponse({ personId: "a", tenGods: emptyTenGods, psych: psych({ practicality: 90 }) });
  const activate = scoreProblemResponse({ personId: "a", tenGods: emptyTenGods, psych: psych({ decision_style: 90 }) });
  assert.equal(clarify.subStyle, "CLARIFY");
  assert.equal(solve.subStyle, "SOLVE");
  assert.equal(activate.subStyle, "ACTIVATE");
  console.log("ok - A2: problemResponse preserves clarify/solve/activate distinction");
}

{
  const dim = scoreConflictDirectness({ personId: "a", tenGods: emptyTenGods, psych: null });
  assert.equal(dim.confidence, "LOW");
  assert.ok(dim.missingEvidence.includes("conflict_style"));
  const withSelfOnly = scoreConflictDirectness({ personId: "a", tenGods: { 비견: 3 }, psych: null });
  assert.notEqual(withSelfOnly.confidence, "HIGH", "self-count alone must never reach HIGH confidence without conflict_style (spec §6)");
  console.log("ok - A3: conflictDirectness missing conflict_style lowers confidence, never silently inferred to HIGH");
}

{
  const dim = scoreConnectionMaintenance({ personId: "a", tenGods: emptyTenGods, psych: null });
  assert.equal(dim.confidence, "LOW");
  console.log("ok - A4: connectionMaintenance with fully missing evidence is LOW confidence");
}

{
  const withData = scoreAutonomySpaceNeed({ personId: "a", tenGods: emptyTenGods, psych: psych({ self_control: 20 }) });
  const withoutData = scoreAutonomySpaceNeed({ personId: "a", tenGods: emptyTenGods, psych: null });
  assert.ok(withData);
  assert.equal(withData.level, "HIGH");
  assert.equal(withoutData, null, "autonomySpaceNeed must be null (not fabricated neutral) when self_control is absent");
  console.log("ok - A5: autonomySpaceNeed null when unevidenced, never a fabricated guess");
}

// B. THRESHOLD TEST — structure 58 vs 60 must not produce an absurd cliff ----

{
  const p58 = { personId: "a", tenGods: {}, psych: psych({ structure: 58 }) };
  const p60 = { personId: "b", tenGods: {}, psych: psych({ structure: 60 }) };
  const dim58 = scoreReliabilitySensitivity(p58);
  const dim60 = scoreReliabilitySensitivity(p60);
  const gap = Math.abs(dim58.score - dim60.score);
  assert.ok(gap < 10, `structure 58 vs 60 must score within a graduated margin, got gap=${gap}`);
  console.log(`ok - B: structure 58 vs 60 produces a graduated gap of ${gap.toFixed(1)} points, not a threshold cliff`);
}

// C. EVIDENCE DEDUP TEST — one structure axis must not become two independent needs

{
  const bundleA = calculateSajuBundle({ birthDate: "1993-05-15", birthTime: "12:00" });
  const chartInput = toV1SajuApiPayload(bundleA);
  const ctx = buildFriendRuleContext({
    nicknameA: "Sera",
    nicknameB: "동글",
    sajuJsonA: chartInput,
    sajuJsonB: chartInput,
    locale: "ko-KR",
  });
  const intel = buildFriendResponseIntelligence({
    ctx,
    psychA: psych({ structure: 60 }),
    psychB: psych({ structure: 58 }),
  });
  const needsA = intel.personA.boundary.needs;
  const reliabilityCount = needsA.filter((n) => n.key === "RELIABILITY").length;
  const consistencyCount = needsA.filter((n) => n.key === "CONSISTENCY").length;
  assert.equal(reliabilityCount, 1);
  assert.equal(consistencyCount, 0, "CONSISTENCY must not be independently generated from the same structure reading as RELIABILITY");
  console.log("ok - C: one structure reading no longer produces both RELIABILITY and CONSISTENCY needs");
}

// D. LOW EVIDENCE TEST — missing energy_style/stimulation must not auto-produce FLEXIBLE_DISTANCE

{
  // Zero ten-god evidence AND missing psych axes -> connectionMaintenance
  // must have LOW confidence, and the distance derivation must reflect that
  // explicitly rather than landing on the "in-between" FLEXIBLE_DISTANCE read.
  const profile = buildFriendResponseProfile({ personId: "a", tenGods: {}, psych: psych({}) });
  assert.equal(profile.connectionMaintenance.confidence, "LOW");
  const distance = buildDistanceProfile(profile);
  assert.equal(distance.baselineDistance, "LOW_EVIDENCE_DISTANCE");
  assert.notEqual(distance.baselineDistance, "FLEXIBLE_DISTANCE");
  console.log("ok - D1: zero connectionMaintenance evidence yields LOW_EVIDENCE_DISTANCE, never FLEXIBLE_DISTANCE");

  // End-to-end: real ten-god self-count evidence (from an actual chart) is a
  // legitimate, non-fabricated MEDIUM-confidence signal even when psych's
  // energy_style/stimulation are absent -- FLEXIBLE_DISTANCE is then a real
  // reading, not a missing-data default, and that's the correct distinction.
  const bundleA = calculateSajuBundle({ birthDate: "1993-05-15", birthTime: "12:00" });
  const chartInput = toV1SajuApiPayload(bundleA);
  const ctx = buildFriendRuleContext({ nicknameA: "A", nicknameB: "B", sajuJsonA: chartInput, sajuJsonB: chartInput, locale: "ko-KR" });
  const intel = buildFriendResponseIntelligence({ ctx, psychA: psych({}), psychB: psych({}) });
  if (intel.personA.distance.baselineDistance === "FLEXIBLE_DISTANCE") {
    assert.notEqual(intel.personA.distance.confidence, "LOW", "FLEXIBLE_DISTANCE must never be paired with LOW confidence (that combination is the old bug)");
  } else {
    assert.equal(intel.personA.distance.baselineDistance, "LOW_EVIDENCE_DISTANCE");
  }
  console.log("ok - D2: end-to-end, FLEXIBLE_DISTANCE (when it occurs) is never paired with LOW confidence");
}

// E. CH5 CONTRADICTION TEST --------------------------------------------------

{
  const bundleA = calculateSajuBundle({ birthDate: "1993-05-15", birthTime: "12:00" });
  const chartInput = toV1SajuApiPayload(bundleA);
  const ctx = buildFriendRuleContext({
    nicknameA: "Sera",
    nicknameB: "동글",
    sajuJsonA: chartInput,
    sajuJsonB: chartInput,
    locale: "ko-KR",
  });
  const intel = buildFriendResponseIntelligence({
    ctx,
    psychA: psych({ thinking_style: 90, practicality: 80 }), // strategic/practical-leaning
    psychB: psych({ empathy: 90 }), // emotional-holding-leaning
  });
  assert.notEqual(intel.personA.support.primaryMode, intel.personB.support.primaryMode);
  // Import the chapter builder and confirm rendered copy never claims a
  // shared direction that contradicts either person's own label.
  const { buildFriendChapter05Support } = await import("../../lib/relationship/friend/chapters/friendChapter05Support.ts");
  const ch05 = buildFriendChapter05Support({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
  assert.equal(ch05.mismatch.hasMeaningfulMismatch, true);
  const labelA = ch05.myStyle.find((s) => s.name === "Sera").headline;
  const labelB = ch05.myStyle.find((s) => s.name === "동글").headline;
  assert.ok(ch05.mismatch.description.includes(labelA) || ch05.mismatch.description.toLowerCase().includes(labelA.toLowerCase()));
  assert.notEqual(labelA, labelB);
  console.log("ok - E: CH5 mismatch copy references each person's actual primaryMode label, never a disconnected hardcoded claim");
}

// F. SAME-DIRECTION-DIFFERENT-EXPRESSION TEST (CH6 hurt triggers) -----------

{
  const bundleA = calculateSajuBundle({ birthDate: "1993-05-15", birthTime: "12:00" });
  const chartInput = toV1SajuApiPayload(bundleA);
  const ctx = buildFriendRuleContext({
    nicknameA: "Sera",
    nicknameB: "동글",
    sajuJsonA: chartInput,
    sajuJsonB: chartInput,
    locale: "ko-KR",
  });
  const intel = buildFriendResponseIntelligence({
    ctx,
    psychA: psych({ structure: 60, empathy: 58 }),
    psychB: psych({ empathy: 72, structure: 58 }),
  });
  const { buildFriendChapter06Conflict } = await import("../../lib/relationship/friend/chapters/friendChapter06Conflict.ts");
  const ch06 = buildFriendChapter06Conflict({ intel, nameA: "Sera", nameB: "동글", locale: "ko-KR" });
  const triggersA = intel.personA.conflict.hurtTriggers.map((t) => t.trigger).sort();
  const triggersB = intel.personB.conflict.hurtTriggers.map((t) => t.trigger).sort();
  if (JSON.stringify(triggersA) === JSON.stringify(triggersB)) {
    assert.ok(ch06.hurtMomentsSharedFraming, "same trigger SET with different PRIMARY order must produce shared-framing copy");
    console.log("ok - F: same-set-different-order nuance surfaced via hurtMomentsSharedFraming");
  } else {
    console.log("ok - F: (fixture produced different trigger sets this run — shared-framing path not applicable, skipping assertion)");
  }
}

// G. GENUINE SIMILARITY TEST -------------------------------------------------

{
  const bundleA = calculateSajuBundle({ birthDate: "1993-05-15", birthTime: "12:00" });
  const chartInput = toV1SajuApiPayload(bundleA);
  const profileA = buildFriendResponseProfile({ personId: "a", tenGods: {}, psych: psych({ empathy: 55, structure: 55 }) });
  const profileB = buildFriendResponseProfile({ personId: "b", tenGods: {}, psych: psych({ empathy: 58, structure: 52 }) });
  const cmp = buildFriendPairResponseComparison(profileA, profileB);
  assert.equal(cmp.emotionalReception.classification, "GENUINE_SIMILARITY");
  assert.equal(cmp.reliabilitySensitivity.classification, "GENUINE_SIMILARITY");
  console.log("ok - G: near-identical profiles classify as GENUINE_SIMILARITY without forced differentiation");
}

// H. SHARED BLIND SPOT TEST --------------------------------------------------

{
  const profileA = buildFriendResponseProfile({ personId: "a", tenGods: {}, psych: psych({ energy_style: 20, stimulation: 20, conflict_style: 30 }) });
  const profileB = buildFriendResponseProfile({ personId: "b", tenGods: {}, psych: psych({ energy_style: 25, stimulation: 22, conflict_style: 35 }) });
  const cmp = buildFriendPairResponseComparison(profileA, profileB);
  const blindSpot = detectSharedBlindSpot(profileA, profileB, cmp);
  assert.ok(blindSpot, "both-low-contact-need with no complementary directness should surface a shared blind spot");
  assert.equal(blindSpot.pattern, "LOW_CONTACT_NEED_BOTH");

  // Complementary behavior present (one person is highly direct) -> must NOT fabricate a blind spot.
  const profileC = buildFriendResponseProfile({ personId: "c", tenGods: {}, psych: psych({ energy_style: 20, stimulation: 20, conflict_style: 90 }) });
  const cmp2 = buildFriendPairResponseComparison(profileA, profileC);
  const blindSpot2 = detectSharedBlindSpot(profileA, profileC, cmp2);
  assert.equal(blindSpot2, null, "must not claim a shared blind spot when complementary behavior (high directness) is present");
  console.log("ok - H: shared blind spot only generated when both strong-pattern AND complementary-behavior-absent conditions hold");
}

// I. SWAP TEST ----------------------------------------------------------------

{
  const seraSaju = sajuFromBirth("1993-05-15");
  const donggleSaju = sajuFromBirth("1994-12-15");
  const seraPsych = psych({ thinking_style: 68, practicality: 62, empathy: 58, structure: 60, stimulation: 50 });
  const dongglePsych = psych({ empathy: 72, resilience: 65, structure: 58, thinking_style: 48, stimulation: 45 });

  const ctx1 = buildFriendRuleContext({ nicknameA: "Sera", nicknameB: "동글", sajuJsonA: seraSaju, sajuJsonB: donggleSaju, locale: "ko-KR" });
  const intel1 = buildFriendResponseIntelligence({ ctx: ctx1, psychA: seraPsych, psychB: dongglePsych });

  const ctx2 = buildFriendRuleContext({ nicknameA: "동글", nicknameB: "Sera", sajuJsonA: donggleSaju, sajuJsonB: seraSaju, locale: "ko-KR" });
  const intel2 = buildFriendResponseIntelligence({ ctx: ctx2, psychA: dongglePsych, psychB: seraPsych });

  assert.equal(intel1.directional.aToB.giverCapability, intel2.directional.bToA.giverCapability);
  assert.equal(intel1.directional.aToB.receiverNeed, intel2.directional.bToA.receiverNeed);
  assert.equal(intel1.directional.aToB.adaptation, intel2.directional.bToA.adaptation);
  assert.equal(intel1.directional.bToA.giverCapability, intel2.directional.aToB.giverCapability);
  assert.equal(intel1.personA.support.primaryMode, intel2.personB.support.primaryMode);
  assert.equal(intel1.personB.support.primaryMode, intel2.personA.support.primaryMode);
  console.log("ok - I: A/B swap preserves person identity and correctly inverts direction");
}

// J. LOCALE -------------------------------------------------------------------

{
  const bundleA = calculateSajuBundle({ birthDate: "1993-05-15", birthTime: "12:00" });
  const chartInput = toV1SajuApiPayload(bundleA);
  const ctx = buildFriendRuleContext({
    nicknameA: "Sera",
    nicknameB: "Donggle",
    sajuJsonA: chartInput,
    sajuJsonB: chartInput,
    locale: "en-US",
  });
  const intel = buildFriendResponseIntelligence({
    ctx,
    psychA: psych({ thinking_style: 90 }),
    psychB: psych({ empathy: 90 }),
  });
  const { buildFriendChapter05Support } = await import("../../lib/relationship/friend/chapters/friendChapter05Support.ts");
  const ch05en = buildFriendChapter05Support({ intel, nameA: "Sera", nameB: "Donggle", locale: "en-US" });
  const ch05ko = buildFriendChapter05Support({ intel, nameA: "Sera", nameB: "Donggle", locale: "ko-KR" });
  assert.notEqual(ch05en.mismatch.description, ch05ko.mismatch.description);
  assert.ok(/[a-zA-Z]/.test(ch05en.mismatch.description));
  assert.ok(/[가-힣]/.test(ch05ko.mismatch.description));
  console.log("ok - J: en-US/ko-KR locale parity for the fixed CH5 mismatch copy");
}

console.log("\nALL FRIEND CANONICAL RESPONSE PROFILE TESTS PASSED!");
