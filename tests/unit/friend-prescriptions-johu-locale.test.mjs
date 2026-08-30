/**
 * Phase 3 English remediation — Friend residual fix regression test.
 *
 * buildFriendPrescriptions.ts previously leaked the romanized Saju term
 * "johu" (조후, hot/cold seasonal balance) into English prescription copy
 * at 5 call sites (2 of them directly rendered/blocking: dont_list entries
 * in the energy-drain and communication prescriptions). Fixed by describing
 * the underlying behavioral meaning in plain English instead of the jargon
 * term. This test proves the fix and guards against regression.
 *
 * Run: npx tsx tests/unit/friend-prescriptions-johu-locale.test.mjs
 */
import assert from "node:assert/strict";

function ok(name) {
  console.log(`ok - ${name}`);
}

const HANGUL_RE = /[가-힣]/;

function jsonHasHangul(value) {
  return HANGUL_RE.test(JSON.stringify(value));
}
function jsonHasJohu(value) {
  return /johu/i.test(JSON.stringify(value));
}

const { buildFriendPrescriptions } = await import("../../lib/relationship/friend/buildFriendPrescriptions.ts");

// A pair fixture engineered to trigger BOTH the energy-drain prescription
// (energy_drain_band !== "low" or index >= 40) and the communication
// prescription (temperature_mismatch true or heat_gap >= 25) — the two
// call sites that previously leaked "johu" into rendered dont_list copy.
const pair = {
  johu_gap: {
    heat_gap: 30,
    moisture_gap: 15,
    temperature_mismatch: true,
    band_a: "cold",
    band_b: "hot",
  },
  energy_drain_index: 55,
  energy_drain_band: "medium",
};

// ---------------------------------------------------------------------------
// 1. English mode — zero Hangul, zero "johu" leakage in any USER-FACING field.
//    evidence.signal_paths (e.g. "johu_gap.heat_gap") is an internal field-path
//    reference, not rendered copy, and is correctly exempt from this check.
{
  const en = buildFriendPrescriptions({ pair, nicknameA: "Dana", nicknameB: "Milo", locale: "en-US" });
  assert.equal(jsonHasHangul(en), false, "buildFriendPrescriptions en-US output must contain zero Hangul");

  const energyItem = en.items.find((i) => i.topic === "energy_drain_prevention");
  const commItem = en.items.find((i) => i.topic === "communication_climate");
  assert.ok(energyItem, "energy_drain_prevention item should be present for this fixture");
  assert.ok(commItem, "communication_climate item should be present for this fixture");

  const renderedFields = (item) => [item.headline, item.evidence.summary, ...item.do_list, ...item.dont_list];
  for (const item of en.items) {
    assert.equal(jsonHasJohu(renderedFields(item)), false, `${item.topic}: rendered copy must not contain "johu"`);
  }
  assert.equal(jsonHasJohu(energyItem.dont_list), false, "energy_drain_prevention dont_list must not contain \"johu\"");
  assert.equal(jsonHasJohu(commItem.dont_list), false, "communication_climate dont_list must not contain \"johu\"");
  ok("buildFriendPrescriptions en-US: zero Hangul, zero \"johu\" leakage in rendered fields");
}

// ---------------------------------------------------------------------------
// 2. Korean mode — the original term "조후" is still present (fix must not
//    have accidentally stripped the Korean-locale content too)
{
  const ko = buildFriendPrescriptions({ pair, nicknameA: "다나", nicknameB: "마일로", locale: "ko-KR" });
  assert.ok(jsonHasHangul(ko), "buildFriendPrescriptions ko-KR output should still contain Hangul");
  assert.ok(JSON.stringify(ko).includes("조후"), 'buildFriendPrescriptions ko-KR output should still contain "조후"');
  ok("buildFriendPrescriptions ko-KR: unaffected by the en-US wording fix");
}

console.log("All friend-prescriptions-johu-locale tests passed.");
