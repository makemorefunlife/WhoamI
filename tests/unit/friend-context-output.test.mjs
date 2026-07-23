/**
 * Friend Context Output — ctx/section 매핑 + DB 유지 vs 클라이언트 strip.
 * Run: npx tsx tests/unit/friend-context-output.test.mjs
 */
import assert from "node:assert/strict";
import { buildFriendReport } from "../../lib/relationship/friend/buildFriendReport.ts";
import { buildFriendRuleContext } from "../../lib/relationship/friend/buildFriendRuleContext.ts";
import {
  buildFriendContextOutput,
  FRIEND_CONTEXT_OUTPUT_SCHEMA_VERSION,
} from "../../lib/relationship/friend/friendContextOutput.ts";
import {
  omitFriendContextOutputFromReport,
  stripFriendContextOutputForClient,
} from "../../lib/relationship/friend/stripFriendContextOutputForClient.ts";
import { buildFriendReportViewModel } from "../../lib/relationship/friend/viewModel/buildFriendReportViewModel.ts";
import { FRIEND_SOCIAL_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/friendSocial/outputSchema.ts";
import { parseAnalysisLogSnapshot } from "../../lib/relationship/detail/parseAnalysisLogSnapshot.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

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

const sajuA = sajuFromBirth("1990-05-15");
const sajuB = sajuFromBirth("1992-08-20");

const baseParams = {
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  locale: "ko-KR",
};

const SECONDARY_KEYS = [
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

function samplePsych(overrides = {}) {
  const secondary_axes = Object.fromEntries(
    SECONDARY_KEYS.map((k) => [k, 50]),
  );
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

// ---------------------------------------------------------------------------
section("1) 생성 report에 context_output 존재");

const report = buildFriendReport(baseParams);
assert.ok(report.context_output);
assert.equal(report.context_output.schema_version, FRIEND_CONTEXT_OUTPUT_SCHEMA_VERSION);
assert.equal(report.context_output.domain, "friendship");
ok("context_output 존재 + schema/domain");

// ---------------------------------------------------------------------------
section("2) grade/scores/signals ≡ ctx · meta");

const ctx = buildFriendRuleContext(baseParams);
const mapped = buildFriendContextOutput(ctx, report.friend, {
  personCoreMeta: null,
});

assert.equal(mapped.grade, ctx.grade);
assert.deepEqual(mapped.scores, ctx.masterScores);
assert.deepEqual(mapped.signals, ctx.friendPairAnalysis.scoringSignals);
assert.equal(report.context_output.grade, report.meta.grade);
assert.equal(report.context_output.scores.connection, report.meta.connection_pct);
assert.equal(report.context_output.scores.banter, report.meta.banter_pct);
assert.equal(report.context_output.scores.risk, report.meta.risk_pct);
ok("grade/scores/signals ≡ ctx / meta");

// ---------------------------------------------------------------------------
section("3) dominant — dna mode·treasurer (재호출 없음)");

assert.equal(
  mapped.dominant_categories.tikitaka_a.category,
  ctx.friendPairAnalysis.dnaA.tikitakaMode,
);
assert.equal(
  mapped.dominant_categories.battery_b.category,
  ctx.friendPairAnalysis.dnaB.batteryMode,
);
assert.ok(
  mapped.dominant_categories.treasurer?.category === "a" ||
    mapped.dominant_categories.treasurer?.category === "b",
);
assert.equal(mapped.dominant_categories.guardian_a, undefined);
assert.deepEqual(
  {
    connection: mapped.axis_notes.connection,
    banter: mapped.axis_notes.banter,
    risk: mapped.axis_notes.risk,
  },
  { connection: null, banter: null, risk: null },
);
assert.equal(
  mapped.section_summaries.treasurer_reason,
  report.friend.section_play_money.treasurer_reason,
);
ok("dominant/dna/treasurer + axis null(무 psych) + treasurer_reason");

// ---------------------------------------------------------------------------
section("4) psych 시 guardian·vibe axis_notes·meta");

const withPsych = buildFriendReport({
  ...baseParams,
  psychMasterA: samplePsych({
    empathy: 75,
    stimulation: 70,
    thinking_style: 80,
    practicality: 40,
  }),
  psychMasterB: samplePsych({
    empathy: 72,
    stimulation: 65,
    conflict_style: 20,
  }),
  personCoreMeta: {
    reportIdA: "rep-a",
    reportIdB: "rep-b",
    inputFingerprintA: "fp-a",
    inputFingerprintB: "fp-b",
  },
});
assert.ok(withPsych.friend.section_social_dna_a.guardian_character?.key);
assert.equal(
  withPsych.context_output.dominant_categories.guardian_a.category,
  withPsych.friend.section_social_dna_a.guardian_character.key,
);
assert.ok(withPsych.friend.section_snapshot.vibe_axis_notes);
assert.equal(
  withPsych.context_output.axis_notes.connection,
  withPsych.friend.section_snapshot.vibe_axis_notes.connection_note,
);
assert.equal(
  withPsych.context_output.axis_notes.treasurer_confirm,
  withPsych.friend.section_play_money.psych_confirm_note ?? null,
);
const rhythm = withPsych.friend.section_compare_table?.find(
  (r) => r.id === "communication_rhythm",
);
assert.equal(
  withPsych.context_output.axis_notes.communication_rhythm,
  rhythm?.psych_note ?? null,
);
assert.equal(
  withPsych.context_output.section_summaries.travel_role,
  withPsych.friend.section_hidden_flow?.travel_style?.role_prescription ?? null,
);
assert.deepEqual(withPsych.context_output.meta, {
  reportIdA: "rep-a",
  reportIdB: "rep-b",
  inputFingerprintA: "fp-a",
  inputFingerprintB: "fp-b",
});
ok("guardian + vibe axis_notes + meta");

// ---------------------------------------------------------------------------
section("5) DB 유지 vs strip/omit · 비mutate · log snapshot");

const friendshipPayload = {
  format: FRIEND_SOCIAL_DEEP_FORMAT,
  report,
};
assert.ok(friendshipPayload.report.context_output);

const forClient = stripFriendContextOutputForClient(friendshipPayload);
assert.equal(forClient.report.context_output, undefined);
assert.ok(friendshipPayload.report.context_output);
assert.deepEqual(forClient.report.friend, report.friend);
assert.deepEqual(forClient.report.meta, report.meta);

const omitted = omitFriendContextOutputFromReport(report);
assert.equal(omitted.context_output, undefined);
assert.ok(report.context_output);

const logSnap = parseAnalysisLogSnapshot(
  {
    id: "log-1",
    analysis_level: "premium",
    relationship_kind: "friendship",
    result_format: FRIEND_SOCIAL_DEEP_FORMAT,
    created_at: "2026-07-23T00:00:00.000Z",
    summary_title: "t",
    summary_subtitle: "s",
    result_snapshot: { report },
  },
  "friendship",
);
assert.equal(logSnap.kind, "friendship");
assert.equal(logSnap.snapshot.friendshipDeep.context_output, undefined);
assert.ok(report.context_output);
ok("strip/omit/log — 클라이언트 비노출, 원본 유지");

// ---------------------------------------------------------------------------
section("6) context_output 제외 body 결정론");

const { context_output: _c1, ...body1 } = buildFriendReport(baseParams);
const { context_output: _c2, ...body2 } = buildFriendReport(baseParams);
assert.deepEqual(body1, body2);
assert.deepEqual(Object.keys(body1).sort(), [
  "friend",
  "headline",
  "meta",
  "one_line_friendship",
  "snapshot_panel",
  "summary_line",
].sort());
ok("기존 필드 세트 + 결정론");

// ---------------------------------------------------------------------------
section("7) ViewModel 비크래시");

const vm = buildFriendReportViewModel(report, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
assert.ok(vm);
assert.ok(Array.isArray(vm.sections));
ok("ViewModel context_output 미소비");

// ---------------------------------------------------------------------------
section("8) Phase 5-2 — treasurer_align/confidence composite · omit · strip");

assert.equal(
  report.context_output.dominant_categories.treasurer_align,
  undefined,
  "psych 없으면 treasurer_align omit",
);
assert.equal(
  report.context_output.dominant_categories.treasurer_confidence,
  undefined,
  "psych 없으면 treasurer_confidence omit",
);

const baseTreasurer = report.friend.section_play_money.treasurer_nickname;

const midFriend = buildFriendReport({
  ...baseParams,
  psychMasterA: samplePsych({ practicality: 50, structure: 50 }),
  psychMasterB: samplePsych({ practicality: 50, structure: 50 }),
});
assert.ok(
  midFriend.context_output.dominant_categories.treasurer_align?.category ===
    "confirms" ||
    midFriend.context_output.dominant_categories.treasurer_align?.category ===
      "caution",
);
assert.ok(
  midFriend.context_output.dominant_categories.treasurer_confidence
    ?.category === "high" ||
    midFriend.context_output.dominant_categories.treasurer_confidence
      ?.category === "low",
);
assert.equal(
  midFriend.friend.section_play_money.treasurer_nickname,
  baseTreasurer,
  "mid psych — pick 유지(약한 flip 조건 미충족)",
);

const highFriend = buildFriendReport({
  ...baseParams,
  psychMasterA: samplePsych({ practicality: 80, structure: 75 }),
  psychMasterB: samplePsych({ practicality: 30, structure: 25 }),
});
// A가 psych 우세 — base가 A면 confirms, B면 flip 가능(약한 saju일 때만)
assert.ok(
  highFriend.context_output.dominant_categories.treasurer_align?.category ===
    "confirms" ||
    highFriend.context_output.dominant_categories.treasurer_align?.category ===
      "caution",
);
assert.ok(
  highFriend.context_output.dominant_categories.treasurer_confidence
    ?.category === "high" ||
    highFriend.context_output.dominant_categories.treasurer_confidence
      ?.category === "low",
);
assert.equal(
  highFriend.friend.section_play_money.treasurer_align,
  highFriend.context_output.dominant_categories.treasurer_align.category,
);

const stripped = stripFriendContextOutputForClient({
  format: FRIEND_SOCIAL_DEEP_FORMAT,
  report: highFriend,
});
assert.equal(stripped.report.context_output, undefined);
assert.ok(highFriend.context_output.dominant_categories.treasurer_align);
ok("Phase 5-2 treasurer_align/confidence + strip 유지");

console.log("\nAll friend-context-output tests passed.");
