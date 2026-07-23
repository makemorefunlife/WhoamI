/**
 * Phase 6-2b — Friend treasurer canonical consistency.
 * Architecture: one finalized judgment → section = CO = ViewModel play_money.
 * hangout_planning remains a separate product question (compare row).
 * Run: npx tsx tests/unit/friend-treasurer-canonical.test.mjs
 */
import assert from "node:assert/strict";
import {
  pickFriendTreasurer,
} from "../../lib/relationship/friend/friendDeEscalationPrescriptions.ts";
import { refineFriendTreasurer } from "../../lib/relationship/friend/friendPsychFit.ts";
import {
  buildFriendTreasurerCanonical,
  treasurerJudgmentFields,
  treasurerSideFromNickname,
  FRIEND_TREASURER_CANONICAL_SOURCE,
  FRIEND_TREASURER_PERSISTENCE_PATH,
  FRIEND_TREASURER_PSYCH_MODE_LEGACY,
  FRIEND_TREASURER_PSYCH_MODE_WITH_PSYCH,
} from "../../lib/relationship/friend/friendTreasurerCanonical.ts";
import {
  treasurerContextCategoriesFromPlayMoney,
} from "../../lib/relationship/friend/friendContextOutput.ts";
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

const countsStrongA = { 정재: 2, 정관: 1 };
const countsWeakB = { 편재: 1 };

const base = pickFriendTreasurer({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsStrongA,
  countsB: countsWeakB,
  locale: "ko-KR",
});
assert.equal(base.nickname, "Alex");

const psychA = samplePsych({ practicality: 85, structure: 80 });
const psychB = samplePsych({ practicality: 30, structure: 25 });

// ---------------------------------------------------------------------------
section("1) Canonical wrapper — wrap-only after refine");

const refinedNoPsych = refineFriendTreasurer({
  baseNickname: base.nickname,
  baseReason: base.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsStrongA,
  countsB: countsWeakB,
  psychA: null,
  psychB: null,
  locale: "ko-KR",
});
const canonicalNoPsych = buildFriendTreasurerCanonical(refinedNoPsych, {
  base,
});
assert.ok(canonicalNoPsych);
assert.equal(canonicalNoPsych.source, FRIEND_TREASURER_CANONICAL_SOURCE);
assert.equal(canonicalNoPsych.psychMode, FRIEND_TREASURER_PSYCH_MODE_LEGACY);
assert.equal(
  canonicalNoPsych.persistencePath,
  FRIEND_TREASURER_PERSISTENCE_PATH,
);
assert.equal(canonicalNoPsych.value, refinedNoPsych);
assert.deepEqual(
  treasurerJudgmentFields(canonicalNoPsych.value),
  treasurerJudgmentFields(refinedNoPsych),
);

const refinedWithPsych = refineFriendTreasurer({
  baseNickname: base.nickname,
  baseReason: base.reason,
  nicknameA: "Alex",
  nicknameB: "Jordan",
  countsA: countsStrongA,
  countsB: countsWeakB,
  psychA,
  psychB,
  locale: "ko-KR",
});
const canonicalWithPsych = buildFriendTreasurerCanonical(refinedWithPsych, {
  base,
});
assert.ok(canonicalWithPsych);
assert.equal(
  canonicalWithPsych.psychMode,
  FRIEND_TREASURER_PSYCH_MODE_WITH_PSYCH,
);
assert.equal(canonicalWithPsych.value, refinedWithPsych);
assert.equal(canonicalWithPsych.value.nickname, "Alex");
assert.equal(canonicalWithPsych.value.align, "confirms");
assert.equal(canonicalWithPsych.value.confidence, "high");
ok("canonical meta + soft/none psychMode (wrap-only)");

// ---------------------------------------------------------------------------
section("2) Cross-consumer equality — section = CO = ViewModel");

const sajuA = sajuFromBirth("1990-05-15");
const sajuB = sajuFromBirth("1992-08-20");
const report = buildFriendReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  psychMasterA: psychA,
  psychMasterB: psychB,
  locale: "ko-KR",
});

const money = report.friend.section_play_money;
assert.ok(money.treasurer_nickname);
const sectionFields = treasurerJudgmentFields({
  nickname: money.treasurer_nickname,
  reason: money.treasurer_reason,
  align: money.treasurer_align,
  confidence: money.treasurer_confidence,
});
assert.ok(sectionFields);

const coSide = report.context_output.dominant_categories.treasurer?.category;
assert.equal(
  coSide,
  treasurerSideFromNickname(
    money.treasurer_nickname,
    "Alex",
    "Jordan",
  ),
);
assert.equal(
  report.context_output.dominant_categories.treasurer_align?.category,
  sectionFields.align,
);
assert.equal(
  report.context_output.dominant_categories.treasurer_confidence?.category,
  sectionFields.confidence,
);
assert.equal(
  report.context_output.section_summaries.treasurer_reason,
  money.treasurer_reason,
);

const vm = buildFriendReportViewModel(report, {
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
  locale: "ko-KR",
});
const playMoney = vm.sections.find((s) => s.type === "play_money");
assert.ok(playMoney);
assert.equal(playMoney.treasurerNickname, money.treasurer_nickname);
assert.equal(playMoney.treasurerReason, money.treasurer_reason);
ok("section ≡ CO ≡ ViewModel treasurer judgment");

// ---------------------------------------------------------------------------
section("3) Consumer non-recalculation — CO maps section only");

const catsA = treasurerContextCategoriesFromPlayMoney(
  money,
  "Alex",
  "Jordan",
);
const moneyClone = structuredClone(money);
moneyClone.optimal_hangout = "MUTATED_HANGOUT_ONLY";
assert.deepEqual(
  treasurerContextCategoriesFromPlayMoney(moneyClone, "Alex", "Jordan"),
  catsA,
);

const friendClone = structuredClone(report.friend);
friendClone.section_play_money = moneyClone;
friendClone.section_social_dna_a = {
  ...friendClone.section_social_dna_a,
  guardian_character: {
    ...(friendClone.section_social_dna_a.guardian_character ?? {}),
    key: "mutated_guardian",
  },
};
const catsFromRebuild = treasurerContextCategoriesFromPlayMoney(
  friendClone.section_play_money,
  report.meta.nickname_a,
  report.meta.nickname_b,
);
assert.deepEqual(catsFromRebuild, catsA);

const vm2 = buildFriendReportViewModel(
  { ...report, friend: friendClone },
  {
    viewerIsReportA: true,
    myName: "Alex",
    partnerName: "Jordan",
    locale: "ko-KR",
  },
);
const pm2 = vm2.sections.find((s) => s.type === "play_money");
assert.equal(pm2.treasurerNickname, money.treasurer_nickname);
assert.equal(pm2.treasurerReason, money.treasurer_reason);
ok("non-recalculation — treasurer stable when unrelated fields change");

// ---------------------------------------------------------------------------
section("4) Locale — judgment identical; reason may differ");

const reportEn = buildFriendReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  psychMasterA: psychA,
  psychMasterB: psychB,
  locale: "en-US",
});
const moneyEn = reportEn.friend.section_play_money;
assert.deepEqual(
  treasurerJudgmentFields({
    nickname: moneyEn.treasurer_nickname,
    reason: moneyEn.treasurer_reason,
    align: moneyEn.treasurer_align,
    confidence: moneyEn.treasurer_confidence,
  }),
  sectionFields,
);
assert.equal(
  reportEn.context_output.dominant_categories.treasurer?.category,
  coSide,
);
ok("ko/en same treasurer judgment");

// ---------------------------------------------------------------------------
section("5) Product boundary — treasurer ≠ hangout_planning");

const hangoutRow = report.friend.section_compare_table?.find(
  (r) => r.id === "hangout_planning",
);
assert.ok(hangoutRow, "hangout_planning compare row present");
assert.equal(hangoutRow.id, "hangout_planning");
const hangoutCopy = [
  hangoutRow.label,
  hangoutRow.personA?.shortLabel,
  hangoutRow.personB?.shortLabel,
  hangoutRow.meaning,
].join(" ");
assert.ok(
  !/총무|treasurer/i.test(hangoutCopy),
  "hangout_planning copy must not say treasurer",
);
assert.ok(money.treasurer_nickname, "Part3 treasurer path populated");
assert.ok(
  report.context_output.dominant_categories.treasurer,
  "CO treasurer from section_play_money",
);
assert.equal(
  report.context_output.dominant_categories.hangout_planning,
  undefined,
  "CO must not invent hangout_planning from treasurer canonical",
);
// Canonicalizing treasurer must not remove or rewrite the planning row id
assert.ok(
  report.friend.section_compare_table.some((r) => r.id === "hangout_planning"),
);
ok("treasurer and hangout_planning remain separate product paths");


// ---------------------------------------------------------------------------
section("6) Persistence — serialize + strip");

const json = JSON.stringify({
  format: FRIEND_SOCIAL_DEEP_FORMAT,
  report,
});
const parsed = JSON.parse(json);
assert.equal(
  parsed.report.friend.section_play_money.treasurer_nickname,
  money.treasurer_nickname,
);
assert.equal(parsed.report.context_output.schema_version, "context_output_v1");
assert.equal(
  parsed.report.friend.section_play_money.treasurer_align,
  money.treasurer_align,
);

const stripped = stripFriendContextOutputForClient({
  format: FRIEND_SOCIAL_DEEP_FORMAT,
  report,
});
assert.equal(stripped.report.context_output, undefined);
assert.ok(stripped.report.friend.section_play_money.treasurer_nickname);
assert.ok(report.context_output.dominant_categories.treasurer);
ok("JSON round-trip + client strip; section treasurer retained");

console.log("\nAll friend-treasurer-canonical tests passed.");
