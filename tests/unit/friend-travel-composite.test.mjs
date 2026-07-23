/**
 * Phase 5-2 — Friend travel style composite (refineTravelStyleSplit).
 * Run: npx tsx tests/unit/friend-travel-composite.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveTravelStyleSplit,
  refineTravelStyleSplit,
} from "../../lib/relationship/friend/friendPsychFit.ts";
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

// A structure 70, B 50 → gap 20 (weak, ≥15 base, <25 lock)
const psychWeakA = samplePsych({ structure: 70, energy_style: 50 });
const psychWeakB = samplePsych({ structure: 50, energy_style: 50 });
// A 80, B 50 → gap 30 lock
const psychLockA = samplePsych({ structure: 80, energy_style: 50 });
const psychLockB = samplePsych({ structure: 50, energy_style: 50 });

const baseWeak = resolveTravelStyleSplit(
  psychWeakA,
  psychWeakB,
  "Alex",
  "Jordan",
  "ko-KR",
);
assert.ok(baseWeak);
assert.equal(baseWeak.planner.nickname, "Alex");

// ---------------------------------------------------------------------------
section("1) base null (gap<15) → refine null");

const noSplit = resolveTravelStyleSplit(
  samplePsych({ structure: 55 }),
  samplePsych({ structure: 50 }),
  "Alex",
  "Jordan",
  "ko-KR",
);
assert.equal(noSplit, null);
assert.equal(
  refineTravelStyleSplit({
    base: null,
    psychA: psychWeakA,
    psychB: psychWeakB,
    batteryModeA: "homebody",
    batteryModeB: "outdoor",
    tikitakaModeA: "silent",
    tikitakaModeB: "popcorn",
    nicknameA: "Alex",
    nicknameB: "Jordan",
    locale: "ko-KR",
  }),
  null,
);
ok("null base");

// ---------------------------------------------------------------------------
section("2) correction 동의 → confirms/high");

const confirms = refineTravelStyleSplit({
  base: baseWeak,
  psychA: psychWeakA,
  psychB: psychWeakB,
  batteryModeA: "homebody",
  batteryModeB: "outdoor",
  tikitakaModeA: "silent",
  tikitakaModeB: "popcorn",
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
assert.equal(confirms.planner.nickname, "Alex");
assert.equal(confirms.align, "confirms");
assert.equal(confirms.confidence, "high");
ok("confirms");

// ---------------------------------------------------------------------------
section("3) 약한 structure + 반대 보정 → flip");

const flipped = refineTravelStyleSplit({
  base: baseWeak,
  psychA: samplePsych({ structure: 70, energy_style: 80 }),
  psychB: samplePsych({ structure: 50, energy_style: 20 }),
  // A: outdoor+popcorn+high energy → flexible lean
  // B: homebody+silent+low energy → planner lean
  batteryModeA: "outdoor",
  batteryModeB: "homebody",
  tikitakaModeA: "popcorn",
  tikitakaModeB: "silent",
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
assert.equal(flipped.planner.nickname, "Jordan");
assert.equal(flipped.flexible.nickname, "Alex");
assert.equal(flipped.align, "caution");
assert.equal(flipped.confidence, "high");
ok("weak flip");

// ---------------------------------------------------------------------------
section("4) 강한 structure lock → pick 유지");

const baseLock = resolveTravelStyleSplit(
  psychLockA,
  psychLockB,
  "Alex",
  "Jordan",
  "ko-KR",
);
const locked = refineTravelStyleSplit({
  base: baseLock,
  psychA: samplePsych({ structure: 80, energy_style: 80 }),
  psychB: samplePsych({ structure: 50, energy_style: 20 }),
  batteryModeA: "outdoor",
  batteryModeB: "homebody",
  tikitakaModeA: "popcorn",
  tikitakaModeB: "silent",
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
assert.equal(locked.planner.nickname, "Alex");
assert.equal(locked.align, "caution");
assert.equal(locked.confidence, "low");
ok("structure lock");

// ---------------------------------------------------------------------------
section("5) 신호 충돌 → legacy pick + caution");

const conflicted = refineTravelStyleSplit({
  base: baseWeak,
  psychA: samplePsych({ structure: 70, energy_style: 80 }),
  psychB: psychWeakB,
  // A: homebody but popcorn + high energy → conflict
  batteryModeA: "homebody",
  batteryModeB: "outdoor",
  tikitakaModeA: "popcorn",
  tikitakaModeB: "popcorn",
  nicknameA: "Alex",
  nicknameB: "Jordan",
  locale: "ko-KR",
});
assert.equal(conflicted.planner.nickname, "Alex");
assert.equal(conflicted.align, "caution");
assert.equal(conflicted.confidence, "low");
ok("conflict legacy");

// ---------------------------------------------------------------------------
section("6) builder + CO · travel_role 확장");

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

const withPsych = buildFriendReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuFromBirth("1990-05-15"),
  sajuJsonB: sajuFromBirth("1992-08-20"),
  locale: "ko-KR",
  psychMasterA: samplePsych({ structure: 75, energy_style: 40 }),
  psychMasterB: samplePsych({ structure: 45, energy_style: 60 }),
});

const travel = withPsych.friend.section_hidden_flow?.travel_style;
assert.ok(travel);
assert.ok(travel.align);
assert.ok(travel.confidence);
assert.equal(
  withPsych.context_output.dominant_categories.travel_planner.category,
  travel.planner.nickname === "Alex" ? "a" : "b",
);
assert.equal(
  withPsych.context_output.dominant_categories.travel_align.category,
  travel.align,
);
assert.equal(
  withPsych.context_output.dominant_categories.travel_confidence.category,
  travel.confidence,
);
assert.equal(
  withPsych.context_output.section_summaries.travel_role,
  travel.role_prescription,
);

const noPsych = buildFriendReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuFromBirth("1990-05-15"),
  sajuJsonB: sajuFromBirth("1992-08-20"),
  locale: "ko-KR",
});
assert.equal(noPsych.friend.section_hidden_flow?.travel_style, null);
assert.equal(
  noPsych.context_output.dominant_categories.travel_planner,
  undefined,
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

console.log("\nAll friend-travel-composite tests passed.");
