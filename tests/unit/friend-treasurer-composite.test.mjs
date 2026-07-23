/**
 * Phase 5-2 — Friend treasurer composite (refineFriendTreasurer).
 * Run: npx tsx tests/unit/friend-treasurer-composite.test.mjs
 */
import assert from "node:assert/strict";
import {
  refineFriendTreasurer,
} from "../../lib/relationship/friend/friendPsychFit.ts";
import {
  pickFriendTreasurer,
  friendTreasurerScore,
} from "../../lib/relationship/friend/friendDeEscalationPrescriptions.ts";
import { buildFriendReport } from "../../lib/relationship/friend/buildFriendReport.ts";
import { buildFriendReportViewModel } from "../../lib/relationship/friend/viewModel/buildFriendReportViewModel.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { FRIEND_SOCIAL_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/friendSocial/outputSchema.ts";
import { stripFriendContextOutputForClient } from "../../lib/relationship/friend/stripFriendContextOutputForClient.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function samplePsych(overrides = {}) {
  const keys = [
    "stimulation",
    "self_control",
    "practicality",
    "structure",
    "empathy",
    "conflict_style",
    "resilience",
    "recognition",
    "energy_style",
    "thinking_style",
    "decision_style",
  ];
  const secondary_axes = Object.fromEntries(keys.map((k) => [k, 50]));
  Object.assign(secondary_axes, overrides);
  return {
    schema_version: "psych_master_v1",
    secondary_axes,
    survey_source: "v2_10q",
    survey_completed_at: null,
    survey_input_fingerprint: null,
    home_life_dna: {
      lifestyle_title: "t",
      family_identity_category: "balanced",
      family_identity_line: "l",
      life_values_line: "v",
      private_home_self_line: "p",
      energy_battery_line: "e",
    },
  };
}

const countsStrongA = { 정재: 2, 정관: 1 }; // 6+2=8
const countsWeakB = { 편재: 1 }; // 1
const countsNearA = { 정재: 1 }; // 3
const countsNearB = { 정관: 1 }; // 2  → |diff|=1 < lock 2

assert.ok(friendTreasurerScore(countsStrongA) - friendTreasurerScore(countsWeakB) >= 2);
assert.ok(
  Math.abs(
    friendTreasurerScore(countsNearA) - friendTreasurerScore(countsNearB),
  ) < 2,
);

const strongBase = pickFriendTreasurer({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsStrongA,
  countsB: countsWeakB,
  locale: "ko-KR",
});
assert.equal(strongBase.nickname, "Alex");

// ---------------------------------------------------------------------------
section("1) psych 누락 → legacy");

const legacy = refineFriendTreasurer({
  baseNickname: strongBase.nickname,
  baseReason: strongBase.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsStrongA,
  countsB: countsWeakB,
  psychA: null,
  psychB: null,
  locale: "ko-KR",
});
assert.equal(legacy.nickname, "Alex");
assert.equal(legacy.reason, strongBase.reason);
assert.equal(legacy.align, undefined);
assert.equal(legacy.confidence, undefined);
ok("legacy");

// ---------------------------------------------------------------------------
section("2) psych 동의 → confirms/high");

const confirms = refineFriendTreasurer({
  baseNickname: strongBase.nickname,
  baseReason: strongBase.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsStrongA,
  countsB: countsWeakB,
  psychA: samplePsych({ practicality: 85, structure: 80 }),
  psychB: samplePsych({ practicality: 30, structure: 25 }),
  locale: "ko-KR",
});
assert.equal(confirms.nickname, "Alex");
assert.equal(confirms.align, "confirms");
assert.equal(confirms.confidence, "high");
assert.equal(confirms.reason, strongBase.reason);
ok("confirms");

// ---------------------------------------------------------------------------
section("3) 약한 saju + psych 반대 → flip");

const weakBase = pickFriendTreasurer({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsNearA,
  countsB: countsNearB,
  locale: "ko-KR",
});
assert.equal(weakBase.nickname, "Alex");

const flipped = refineFriendTreasurer({
  baseNickname: weakBase.nickname,
  baseReason: weakBase.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsNearA,
  countsB: countsNearB,
  psychA: samplePsych({ practicality: 20, structure: 15 }),
  psychB: samplePsych({ practicality: 90, structure: 85 }),
  locale: "ko-KR",
});
assert.equal(flipped.nickname, "Jordan");
assert.equal(flipped.align, "caution");
assert.equal(flipped.confidence, "high");
assert.ok(
  flipped.reason.includes("굳히지") || flipped.reason.includes("flexible"),
);
ok("weak flip");

// ---------------------------------------------------------------------------
section("4) 강한 saju lock → pick 유지");

const locked = refineFriendTreasurer({
  baseNickname: strongBase.nickname,
  baseReason: strongBase.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsStrongA,
  countsB: countsWeakB,
  psychA: samplePsych({ practicality: 15, structure: 20 }),
  psychB: samplePsych({ practicality: 90, structure: 88 }),
  locale: "ko-KR",
});
assert.equal(locked.nickname, "Alex");
assert.equal(locked.align, "caution");
assert.equal(locked.confidence, "low");
ok("saju lock");

// ---------------------------------------------------------------------------
section("5) builder + CO 키 재사용");

function sajuFromBirth(birthDate, birthTime = "12:00") {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };
}

const baseParams = {
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuFromBirth("1990-05-15"),
  sajuJsonB: sajuFromBirth("1992-08-20"),
  locale: "ko-KR",
};

const noPsych = buildFriendReport(baseParams);
assert.equal(
  noPsych.context_output.dominant_categories.treasurer_align,
  undefined,
);

const withPsych = buildFriendReport({
  ...baseParams,
  psychMasterA: samplePsych({ practicality: 80, structure: 75 }),
  psychMasterB: samplePsych({ practicality: 30, structure: 25 }),
});
assert.ok(withPsych.friend.section_play_money.treasurer_align);
assert.ok(withPsych.friend.section_play_money.treasurer_confidence);
assert.equal(
  withPsych.context_output.dominant_categories.treasurer_align.category,
  withPsych.friend.section_play_money.treasurer_align,
);
assert.equal(
  withPsych.context_output.dominant_categories.treasurer_confidence.category,
  withPsych.friend.section_play_money.treasurer_confidence,
);
assert.ok(
  withPsych.context_output.dominant_categories.treasurer_confidence
    .category === "high" ||
    withPsych.context_output.dominant_categories.treasurer_confidence
      .category === "low",
);
assert.equal(
  withPsych.context_output.scores.connection,
  noPsych.context_output.scores.connection,
);

const vm = buildFriendReportViewModel(withPsych, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
assert.ok(vm);

const stripped = stripFriendContextOutputForClient({
  format: FRIEND_SOCIAL_DEEP_FORMAT,
  report: withPsych,
});
assert.equal(stripped.report.context_output, undefined);
ok("builder CO + strip");

console.log("\nAll friend-treasurer-composite tests passed.");
