/**
 * Marriage CE — comparison_table + operating_cfo typed authority.
 * Run: npx tsx tests/unit/marriage-context-engine-canonical.test.mjs
 */
import assert from "node:assert/strict";
import { formatMarriageCompareBandLabel } from "../../lib/relationship/marriage/marriageSajuCompareTable.ts";
import {
  readMarriageComparisonTableCanonicalProjection,
  formatMarriageCompareCanonicalLabel,
} from "../../lib/relationship/marriage/marriageComparisonTableCanonical.ts";
import {
  operatingCfoJudgmentFields,
  readMarriageOperatingCfoCanonicalProjection,
  formatMarriageOperatingCfoCanonicalLabel,
} from "../../lib/relationship/marriage/marriageOperatingCfoCanonical.ts";
import { resolveMannerArchetype as resolveManner } from "../../lib/relationship/marriage/bedroomProfile.ts";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport.ts";
import { stripMarriageContextOutputForClient } from "../../lib/relationship/marriage/stripMarriageContextOutputForClient.ts";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { buildFriendReport } from "../../lib/relationship/friend/buildFriendReport.ts";
import { buildWorkColleagueReport } from "../../lib/relationship/workColleague/buildWorkColleagueReport.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function saju(date, time = "12:00") {
  const bundle = calculateSajuBundle({ birthDate: date, birthTime: time });
  return toV1SajuApiPayload(bundle);
}

function power(score, band = "high", dual = false) {
  return {
    wealth_count: 3,
    officer_count: 2,
    wealth_officer_total: 5,
    cfo_affinity_score: score,
    dual_power_risk: dual,
    economic_dominance_band: band,
  };
}

function cohabSignals(score, band) {
  return {
    wealth_officer_power: power(score, band),
  };
}

const sajuA = saju("1990-05-15", "14:30");
const sajuB = saju("1992-08-20", "09:00");
const ROW_IDS = [
  "household_stress",
  "marital_conflict",
  "bedroom_lead",
  "family_boundary",
  "asset_management",
  "parenting_style",
];

section("A) Compare — typed six rows");
const report = buildMarriageReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  cohabitationSignalsA: cohabSignals(80, "high"),
  cohabitationSignalsB: cohabSignals(20, "low"),
  locale: "ko-KR",
});
const typed = report.canonical_projections?.comparison_table;
assert.ok(typed);
assert.deepEqual(Object.keys(typed).sort(), [...ROW_IDS].sort());
for (const id of ROW_IDS) {
  const row = report.household.section_compare_table.find((r) => r.id === id);
  assert.equal(row.personA.band, typed[id].band_a);
  assert.equal(
    row.personA.shortLabel,
    formatMarriageCompareBandLabel(id, typed[id].band_a, "ko-KR"),
  );
}
ok("six typed rows; shortLabel from band");

section("B) Compare — A/B reverse");
const rev = buildMarriageReport({
  nicknameA: "Jordan",
  nicknameB: "Alex",
  sajuJsonA: sajuB,
  sajuJsonB: sajuA,
  cohabitationSignalsA: cohabSignals(20, "low"),
  cohabitationSignalsB: cohabSignals(80, "high"),
  locale: "ko-KR",
});
for (const id of ROW_IDS) {
  assert.equal(
    report.canonical_projections.comparison_table[id].band_a,
    rev.canonical_projections.comparison_table[id].band_b,
  );
}
ok("A/B reverse swaps compare bands");

section("C) Compare — projection wins over shortLabel");
const lied = structuredClone(report);
lied.household.section_compare_table[0].personA.shortLabel = "LLM LIE";
const vm = buildMarriageReportViewModel(lied, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
const cmp = vm.sections.find((s) => s.type === "compare_table");
const stress = cmp.rows.find((r) => r.id === "household_stress");
assert.notEqual(stress.personA.shortLabel, "LLM LIE");
assert.equal(
  stress.personA.shortLabel,
  formatMarriageCompareCanonicalLabel(
    "household_stress",
    report.canonical_projections.comparison_table.household_stress.band_a,
    "ko-KR",
  ),
);
ok("projection wins");

section("D) Malformed / legacy");
assert.equal(
  readMarriageComparisonTableCanonicalProjection({
    canonical_projections: {
      comparison_table: {
        household_stress: { band_a: "bogus", band_b: "self" },
      },
    },
  }),
  null,
);
const legacy = structuredClone(report);
delete legacy.canonical_projections;
const vmL = buildMarriageReportViewModel(legacy, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
assert.equal(
  vmL.sections.find((s) => s.type === "compare_table").rows[0].personA
    .shortLabel,
  legacy.household.section_compare_table[0].personA.shortLabel,
);
ok("malformed null; legacy fallback");

section("E) Operating CFO projection + strip");
const cfo = report.canonical_projections?.operating_cfo;
assert.ok(cfo);
assert.ok(cfo.side === "a" || cfo.side === "b");
const fields = operatingCfoJudgmentFields(
  report.household.section_money_chores.cfo_nickname
    ? {
        nickname: report.household.section_money_chores.cfo_nickname,
        reason: report.household.section_money_chores.cfo_reason,
        ...(report.household.section_money_chores.cfo_align
          ? { align: report.household.section_money_chores.cfo_align }
          : {}),
        ...(report.household.section_money_chores.cfo_confidence
          ? { confidence: report.household.section_money_chores.cfo_confidence }
          : {}),
        ...(report.household.section_money_chores.cfo_dual ? { dual: true } : {}),
      }
    : null,
);
assert.equal(
  fields.nickname,
  cfo.side === "a" ? "Alex" : "Jordan",
);
const stripped = stripMarriageContextOutputForClient({ report });
assert.equal(stripped.report.context_output, undefined);
assert.ok(stripped.report.canonical_projections.comparison_table);
assert.ok(stripped.report.canonical_projections.operating_cfo);
const money = buildMarriageReportViewModel(stripped.report, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
}).sections.find((s) => s.type === "money_chores");
assert.ok(money.cfoCanonicalLabel);
assert.match(money.cfoCanonicalLabel, /CFO|가정/);
ok("CFO projection survives strip");

section("F) CFO A/B reverse + malformed");
assert.equal(
  rev.canonical_projections.operating_cfo.side,
  cfo.side === "a" ? "b" : "a",
);
assert.equal(
  readMarriageOperatingCfoCanonicalProjection({
    canonical_projections: { operating_cfo: { side: "x" } },
  }),
  null,
);
ok("CFO reverse + malformed");

section("G) Locale identity");
const en = buildMarriageReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  cohabitationSignalsA: cohabSignals(80, "high"),
  cohabitationSignalsB: cohabSignals(20, "low"),
  locale: "en-US",
});
assert.deepEqual(
  en.canonical_projections.comparison_table,
  report.canonical_projections.comparison_table,
);
assert.equal(
  en.canonical_projections.operating_cfo.side,
  report.canonical_projections.operating_cfo.side,
);
assert.notEqual(
  formatMarriageOperatingCfoCanonicalLabel(cfo, {
    nameA: "Alex",
    nameB: "Jordan",
    locale: "ko-KR",
  }),
  formatMarriageOperatingCfoCanonicalLabel(cfo, {
    nameA: "Alex",
    nameB: "Jordan",
    locale: "en-US",
  }),
);
ok("locale-independent typed");

section("H) Semantic — operating CFO ≠ asset_management; manner fixed");
assert.notEqual(
  typeof report.canonical_projections.comparison_table.asset_management.band_a,
  "undefined",
);
assert.ok(["a", "b"].includes(cfo.side));
// Shangguan / Pianguan / Zhengyin / Pianyin do not collapse to one default
assert.equal(resolveManner({ 상관: 3 }), "sweet_guide");
assert.equal(resolveManner({ 편관: 3 }), "power_leader");
assert.equal(resolveManner({ 정인: 3 }), "sweet_guide");
assert.equal(resolveManner({ 편인: 3 }), "sweet_guide");
ok("boundaries + manner gods covered");

section("I) Frozen Friend/Work keys unchanged");
const friend = buildFriendReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  locale: "ko-KR",
});
assert.ok(friend.canonical_projections?.comparison_table?.daily_share_tempo);
assert.equal(friend.canonical_projections.comparison_table.household_stress, undefined);
const work = buildWorkColleagueReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  locale: "ko-KR",
});
assert.ok(work.canonical_projections?.comparison_table?.boundary);
assert.equal(work.canonical_projections.comparison_table.household_stress, undefined);
ok("Friend/Work frozen shapes intact");

console.log("\nAll marriage-context-engine-canonical tests passed.");
