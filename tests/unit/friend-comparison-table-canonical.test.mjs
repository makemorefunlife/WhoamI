/**
 * Friendship CE — comparison_table typed authority.
 * Run: npx tsx tests/unit/friend-comparison-table-canonical.test.mjs
 */
import assert from "node:assert/strict";
import {
  resolveFriendComparisonTableTyped,
  buildFriendSajuCompareTable,
  formatFriendCompareBandLabel,
} from "../../lib/relationship/friend/friendSajuCompareTable.ts";
import {
  buildFriendComparisonTableCanonical,
  buildFriendComparisonTableClientProjection,
  injectFriendComparisonTableClientProjection,
  readFriendComparisonTableCanonicalProjection,
  formatFriendCompareCanonicalLabel,
} from "../../lib/relationship/friend/friendComparisonTableCanonical.ts";
import { buildFriendReport } from "../../lib/relationship/friend/buildFriendReport.ts";
import { stripFriendContextOutputForClient } from "../../lib/relationship/friend/stripFriendContextOutputForClient.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { buildFriendReportViewModel } from "../../lib/relationship/friend/viewModel/buildFriendReportViewModel.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function saju(date, time) {
  const bundle = calculateSajuBundle({ birthDate: date, birthTime: time });
  return toV1SajuApiPayload(bundle);
}

const birthA = { date: "1990-05-15", time: "14:30" };
const birthB = { date: "1992-08-20", time: "09:00" };
const sajuA = saju(birthA.date, birthA.time);
const sajuB = saju(birthB.date, birthB.time);

section("A) Typed six rows + labels from bands");
const report = buildFriendReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  locale: "ko-KR",
});
const typed = report.canonical_projections?.comparison_table;
assert.ok(typed);
assert.deepEqual(Object.keys(typed).sort(), [
  "affection_language",
  "battery_recharge",
  "communication_rhythm",
  "daily_share_tempo",
  "hangout_planning",
  "upset_expression",
].sort());
for (const id of Object.keys(typed)) {
  assert.ok(typed[id].band_a);
  assert.ok(typed[id].band_b);
  const row = report.friend.section_compare_table.find((r) => r.id === id);
  assert.equal(row.personA.band, typed[id].band_a);
  assert.equal(row.personB.band, typed[id].band_b);
  assert.equal(
    row.personA.shortLabel,
    formatFriendCompareBandLabel(id, typed[id].band_a, "ko-KR"),
  );
}
ok("six typed rows; shortLabel derived from band");

section("B) A/B reverse swaps bands");
const rev = buildFriendReport({
  nicknameA: "Jordan",
  nicknameB: "Alex",
  sajuJsonA: sajuB,
  sajuJsonB: sajuA,
  locale: "ko-KR",
});
const t1 = report.canonical_projections.comparison_table;
const t2 = rev.canonical_projections.comparison_table;
for (const id of Object.keys(t1)) {
  assert.equal(t1[id].band_a, t2[id].band_b);
  assert.equal(t1[id].band_b, t2[id].band_a);
}
ok("A/B reverse swaps");

section("C) Conflicting shortLabel cannot change typed read");
const lied = structuredClone(report);
lied.friend.section_compare_table[0].personA.shortLabel = "LLM LIE PROSE";
lied.friend.section_compare_table[0].personA.band = "steady";
// projection still authoritative
const read = readFriendComparisonTableCanonicalProjection(lied);
assert.equal(
  read.daily_share_tempo.band_a,
  report.canonical_projections.comparison_table.daily_share_tempo.band_a,
);
const vm = buildFriendReportViewModel(lied, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
const cmp = vm.sections.find((s) => s.type === "compare_table");
const daily = cmp.rows.find((r) => r.id === "daily_share_tempo");
assert.notEqual(daily.personA.shortLabel, "LLM LIE PROSE");
assert.equal(
  daily.personA.band,
  report.canonical_projections.comparison_table.daily_share_tempo.band_a,
);
ok("projection wins over conflicting prose");

section("D) Malformed projection → null; legacy fallback");
assert.equal(
  readFriendComparisonTableCanonicalProjection({
    canonical_projections: {
      comparison_table: {
        daily_share_tempo: { band_a: "bogus", band_b: "steady" },
      },
    },
  }),
  null,
);
const legacy = structuredClone(report);
delete legacy.canonical_projections;
const vmLegacy = buildFriendReportViewModel(legacy, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
assert.ok(vmLegacy.sections.find((s) => s.type === "compare_table").rows.length === 6);
ok("malformed null; legacy prose rows render");

section("E) Strip keeps projections; locale labels differ");
const stripped = stripFriendContextOutputForClient({
  format: "friend_social_deep_v1",
  report,
});
assert.equal(stripped.report.context_output, undefined);
assert.ok(stripped.report.canonical_projections.comparison_table);
const ko = formatFriendCompareCanonicalLabel(
  "upset_expression",
  "food",
  "ko-KR",
);
const en = formatFriendCompareCanonicalLabel(
  "upset_expression",
  "food",
  "en-US",
);
assert.notEqual(ko, en);
assert.equal(
  buildFriendComparisonTableCanonical(typed).source,
  "resolveFriendComparisonTableTyped",
);
ok("strip + locale");

section("F) Hangout ≠ treasurer boundary still");
assert.ok(report.friend.section_play_money.treasurer_nickname);
assert.ok(
  !JSON.stringify(
    report.friend.section_compare_table.find((r) => r.id === "hangout_planning"),
  ).match(/총무|treasurer/i),
);
ok("hangout independent of treasurer copy");

console.log("\nOK: friend comparison-table canonical tests passed");
