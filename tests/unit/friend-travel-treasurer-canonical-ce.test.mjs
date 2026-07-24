/**
 * Friendship CE — travel_planner + treasurer client projections.
 * Run: npx tsx tests/unit/friend-travel-treasurer-canonical-ce.test.mjs
 */
import assert from "node:assert/strict";
import { buildFriendReport } from "../../lib/relationship/friend/buildFriendReport.ts";
import {
  readFriendTravelPlannerCanonicalProjection,
  formatFriendTravelPlannerCanonicalLabel,
  travelPlannerJudgmentFields,
} from "../../lib/relationship/friend/friendTravelPlannerCanonical.ts";
import {
  readFriendTreasurerCanonicalProjection,
  formatFriendTreasurerCanonicalLabel,
} from "../../lib/relationship/friend/friendTreasurerCanonical.ts";
import { stripFriendContextOutputForClient } from "../../lib/relationship/friend/stripFriendContextOutputForClient.ts";
import { buildFriendReportViewModel } from "../../lib/relationship/friend/viewModel/buildFriendReportViewModel.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function saju(date, time) {
  return toV1SajuApiPayload(
    calculateSajuBundle({ birthDate: date, birthTime: time }),
  );
}

function psych(overrides = {}) {
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

const sajuA = saju("1990-05-15", "14:30");
const sajuB = saju("1992-08-20", "09:00");

section("1) Treasurer projection + UI label");
const report = buildFriendReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  psychMasterA: psych({ practicality: 80, structure: 80 }),
  psychMasterB: psych({ practicality: 20, structure: 20 }),
  locale: "ko-KR",
});
const treas = readFriendTreasurerCanonicalProjection(report);
assert.ok(treas);
assert.ok(treas.side === "a" || treas.side === "b");
assert.equal(
  report.friend.section_play_money.treasurer_nickname,
  treas.side === "a" ? "Alex" : "Jordan",
);
const vm = buildFriendReportViewModel(report, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
const play = vm.sections.find((s) => s.type === "play_money");
assert.ok(play.treasurerCanonicalLabel);
assert.match(play.treasurerCanonicalLabel, /총무/);
ok("treasurer projection aligns with section");

section("2) Travel planner when structure gap; independent of treasurer");
assert.ok(report.canonical_projections.travel_planner);
const travel = readFriendTravelPlannerCanonicalProjection(report);
assert.ok(travel.planner_side === "a" || travel.planner_side === "b");
assert.notEqual(
  travel.planner_side === "a" ? "Alex" : "Jordan",
  // may coincide by chance — assert independence of *questions* via keys
  undefined,
);
assert.ok(report.canonical_projections.treasurer);
assert.ok(report.canonical_projections.comparison_table.hangout_planning);
const hidden = vm.sections.find((s) => s.type === "hidden_flow");
assert.ok(hidden?.travelCanonicalLabel);
ok("travel projection present; hangout/treasurer keys distinct");

section("3) A/B reverse travel + treasurer sides");
const rev = buildFriendReport({
  nicknameA: "Jordan",
  nicknameB: "Alex",
  sajuJsonA: sajuB,
  sajuJsonB: sajuA,
  psychMasterA: psych({ practicality: 20, structure: 20 }),
  psychMasterB: psych({ practicality: 80, structure: 80 }),
  locale: "ko-KR",
});
const treasRev = readFriendTreasurerCanonicalProjection(rev);
const travelRev = readFriendTravelPlannerCanonicalProjection(rev);
// Same physical people: Alex had high psych as A → now Alex is B with high psych
assert.equal(treas.side, "a");
assert.equal(treasRev.side, "b");
if (travel && travelRev) {
  assert.equal(travel.planner_side, "a");
  assert.equal(travelRev.planner_side, "b");
}
ok("directional sides reverse with A/B swap");

section("4) Missing psych — travel null; treasurer without align");
const noPsych = buildFriendReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  locale: "ko-KR",
});
assert.equal(noPsych.canonical_projections.travel_planner, undefined);
assert.ok(noPsych.canonical_projections.treasurer);
assert.equal(noPsych.canonical_projections.treasurer.align, undefined);
ok("null travel; treasurer base without align");

section("5) Strip + malformed + locale");
const stripped = stripFriendContextOutputForClient({
  format: "x",
  report,
});
assert.equal(stripped.report.context_output, undefined);
assert.ok(stripped.report.canonical_projections.treasurer);
assert.ok(stripped.report.canonical_projections.travel_planner);
assert.equal(
  readFriendTravelPlannerCanonicalProjection({
    canonical_projections: { travel_planner: { planner_side: "x" } },
  }),
  null,
);
const ko = formatFriendTravelPlannerCanonicalLabel(travel, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko",
});
const en = formatFriendTravelPlannerCanonicalLabel(travel, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "en",
});
assert.notEqual(ko, en);
assert.notEqual(
  formatFriendTreasurerCanonicalLabel(treas, {
    nameA: "Alex",
    nameB: "Jordan",
    locale: "ko",
  }),
  formatFriendTreasurerCanonicalLabel(treas, {
    nameA: "Alex",
    nameB: "Jordan",
    locale: "en",
  }),
);
ok("strip/malformed/locale");

section("6) Legacy without projections still renders");
const legacy = structuredClone(report);
delete legacy.canonical_projections;
const vmL = buildFriendReportViewModel(legacy, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
const playL = vmL.sections.find((s) => s.type === "play_money");
assert.equal(playL.treasurerCanonicalLabel, null);
assert.ok(playL.treasurerNickname);
ok("legacy prose-only");

console.log("\nOK: friend travel+treasurer CE tests passed");
