/**
 * Work Colleague CE — comparison_table + leadership_split typed authority.
 * Run: npx tsx tests/unit/work-context-engine-canonical.test.mjs
 */
import assert from "node:assert/strict";
import {
  formatWorkCompareBandLabel,
} from "../../lib/relationship/workColleague/sajuCompareTable.ts";
import {
  readWorkComparisonTableCanonicalProjection,
  formatWorkCompareCanonicalLabel,
} from "../../lib/relationship/workColleague/workComparisonTableCanonical.ts";
import {
  leadershipJudgmentFields,
  readWorkLeadershipCanonicalProjection,
  leadershipClientValueForViewer,
  formatWorkLeadershipCanonicalLabel,
} from "../../lib/relationship/workColleague/workLeadershipCanonical.ts";
import { buildWorkColleagueReport } from "../../lib/relationship/workColleague/buildWorkColleagueReport.ts";
import { stripWorkContextOutputForClient } from "../../lib/relationship/workColleague/stripWorkContextOutputForClient.ts";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { buildFriendReport } from "../../lib/relationship/friend/buildFriendReport.ts";

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

function fabricateSignals({ officer, self, seal, wealth }) {
  return {
    month_geokguk: {
      month_stem_ten_god_ko: null,
      month_stem_category: "officer",
      geokguk_label_ko: "",
      month_branch_element: "earth",
      day_master_element_support: false,
    },
    drive_stubborn: {
      food_count: 0,
      self_count: self,
      officer_count: officer,
      wealth_count: wealth,
      seal_count: seal,
      food_intensity: 0,
      self_intensity: 0,
      drive_band: "balanced",
      stubborn_band: "balanced",
    },
    literary_noble: {
      has_munchang_guin: false,
      has_jangseong_sal: false,
      has_cheoneul_guin: false,
      noble_star_hits: [],
      work_support_index: 0,
    },
    johu_profile: {
      heat_score: 50,
      moisture_score: 50,
      temperature_band: "neutral",
      dominant_element: "earth",
    },
  };
}

const sajuA = saju("1990-05-15", "14:30");
const sajuB = saju("1992-08-20", "09:00");
const signalsExtA = fabricateSignals({
  officer: 4,
  self: 3,
  seal: 0,
  wealth: 0,
});
const signalsIntB = fabricateSignals({
  officer: 0,
  self: 0,
  seal: 4,
  wealth: 3,
});

const ROW_IDS = [
  "boundary",
  "feedback",
  "synergy_position",
  "burnout",
  "risk_taking",
  "reporting_rhythm",
];

section("A) Compare — typed six rows; shortLabel from bands");
const report = buildWorkColleagueReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  workSignalsA: signalsExtA,
  workSignalsB: signalsIntB,
  locale: "ko-KR",
});
const typed = report.canonical_projections?.comparison_table;
assert.ok(typed);
assert.deepEqual(Object.keys(typed).sort(), [...ROW_IDS].sort());
for (const id of ROW_IDS) {
  assert.ok(typed[id].band_a);
  assert.ok(typed[id].band_b);
  const row = report.office.section_compare_table.find((r) => r.id === id);
  assert.equal(row.personA.band, typed[id].band_a);
  assert.equal(row.personB.band, typed[id].band_b);
  assert.equal(
    row.personA.shortLabel,
    formatWorkCompareBandLabel(id, typed[id].band_a, "ko-KR"),
  );
}
ok("six typed rows; shortLabel derived from band");

section("B) Compare — A/B reverse swaps bands");
const rev = buildWorkColleagueReport({
  nicknameA: "Jordan",
  nicknameB: "Alex",
  sajuJsonA: sajuB,
  sajuJsonB: sajuA,
  workSignalsA: signalsIntB,
  workSignalsB: signalsExtA,
  locale: "ko-KR",
});
const t1 = report.canonical_projections.comparison_table;
const t2 = rev.canonical_projections.comparison_table;
for (const id of ROW_IDS) {
  assert.equal(t1[id].band_a, t2[id].band_b);
  assert.equal(t1[id].band_b, t2[id].band_a);
}
ok("A/B reverse swaps compare bands");

section("C) Compare — projection wins over conflicting shortLabel");
const lied = structuredClone(report);
lied.office.section_compare_table[0].personA.shortLabel = "LLM LIE PROSE";
lied.office.section_compare_table[0].personA.band = "식상";
const read = readWorkComparisonTableCanonicalProjection(lied);
assert.equal(
  read.boundary.band_a,
  report.canonical_projections.comparison_table.boundary.band_a,
);
const vm = buildWorkReportViewModel(lied, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
const cmp = vm.sections.find((s) => s.type === "compare_table");
const boundary = cmp.rows.find((r) => r.id === "boundary");
assert.notEqual(boundary.me.shortLabel, "LLM LIE PROSE");
assert.equal(
  boundary.me.shortLabel,
  formatWorkCompareCanonicalLabel(
    "boundary",
    report.canonical_projections.comparison_table.boundary.band_a,
    "ko-KR",
  ),
);
ok("projection wins over conflicting prose");

section("D) Compare — malformed → null; legacy shortLabel fallback");
assert.equal(
  readWorkComparisonTableCanonicalProjection({
    canonical_projections: {
      comparison_table: {
        boundary: { band_a: "bogus", band_b: "관성" },
      },
    },
  }),
  null,
);
const legacy = structuredClone(report);
delete legacy.canonical_projections;
const vmLegacy = buildWorkReportViewModel(legacy, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
const cmpLegacy = vmLegacy.sections.find((s) => s.type === "compare_table");
assert.equal(
  cmpLegacy.rows[0].me.shortLabel,
  legacy.office.section_compare_table[0].personA.shortLabel,
);
ok("malformed null; legacy uses section shortLabel");

section("E) Leadership — client projection + strip survival");
const leadProj = report.canonical_projections?.leadership_split;
assert.ok(leadProj);
assert.deepEqual(
  leadershipJudgmentFields(report.office.section_roles.leadership_split),
  {
    external_lead: leadProj.external_lead,
    internal_qa_lead: leadProj.internal_qa_lead,
    ...(leadProj.confidence ? { confidence: leadProj.confidence } : {}),
    ...(leadProj.align ? { align: leadProj.align } : {}),
  },
);
const stripped = stripWorkContextOutputForClient({ report });
assert.equal(stripped.report.context_output, undefined);
assert.ok(stripped.report.canonical_projections.comparison_table);
assert.ok(stripped.report.canonical_projections.leadership_split);
const roleVm = buildWorkReportViewModel(stripped.report, {
  locale: "ko-KR",
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});
const role = roleVm.sections.find((s) => s.type === "role_matrix");
assert.ok(role.leadershipCanonicalLabel);
assert.match(role.leadershipCanonicalLabel, /대외|검수/);
ok("leadership projection survives strip; VM typed label");

section("F) Leadership — A/B reverse + viewer flip helper");
const leadRev = rev.canonical_projections.leadership_split;
if (leadProj.external_lead !== "balanced") {
  assert.equal(
    leadRev.external_lead,
    leadProj.external_lead === "a" ? "b" : "a",
  );
} else {
  assert.equal(leadRev.external_lead, "balanced");
}
if (leadProj.internal_qa_lead !== "balanced") {
  assert.equal(
    leadRev.internal_qa_lead,
    leadProj.internal_qa_lead === "a" ? "b" : "a",
  );
} else {
  assert.equal(leadRev.internal_qa_lead, "balanced");
}
const flipped = leadershipClientValueForViewer(leadProj, false);
if (leadProj.external_lead !== "balanced") {
  assert.equal(
    flipped.external_lead,
    leadProj.external_lead === "a" ? "b" : "a",
  );
}
assert.equal(
  readWorkLeadershipCanonicalProjection({
    canonical_projections: { leadership_split: { external_lead: "nope" } },
  }),
  null,
);
ok("leadership reverse + malformed null");

section("G) Locale — identical typed identity");
const reportEn = buildWorkColleagueReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  workSignalsA: signalsExtA,
  workSignalsB: signalsIntB,
  locale: "en-US",
});
assert.deepEqual(
  reportEn.canonical_projections.comparison_table,
  report.canonical_projections.comparison_table,
);
assert.deepEqual(
  {
    external_lead: reportEn.canonical_projections.leadership_split.external_lead,
    internal_qa_lead:
      reportEn.canonical_projections.leadership_split.internal_qa_lead,
  },
  {
    external_lead: leadProj.external_lead,
    internal_qa_lead: leadProj.internal_qa_lead,
  },
);
const labelKo = formatWorkLeadershipCanonicalLabel(leadProj, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "ko-KR",
});
const labelEn = formatWorkLeadershipCanonicalLabel(leadProj, {
  nameA: "Alex",
  nameB: "Jordan",
  locale: "en-US",
});
assert.notEqual(labelKo, labelEn);
ok("locale-independent typed; localized labels differ");

section("H) Semantic boundary — Leadership ≠ every compare row");
assert.notEqual(
  report.canonical_projections.comparison_table.risk_taking.band_a,
  leadProj.external_lead,
);
assert.ok(
  ["yang", "yin"].includes(
    report.canonical_projections.comparison_table.reporting_rhythm.band_a,
  ),
);
assert.ok(
  ["a", "b", "balanced"].includes(leadProj.external_lead),
);
ok("leadership enum distinct from compare row bands");

section("I) Frozen Friendship projections unchanged shape");
const friend = buildFriendReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  locale: "ko-KR",
});
const friendCompare = friend.canonical_projections?.comparison_table;
assert.ok(friendCompare?.daily_share_tempo);
assert.ok(friendCompare?.upset_expression);
assert.equal(friendCompare.boundary, undefined);
assert.equal(friendCompare.reporting_rhythm, undefined);
ok("Friendship compare keys unchanged (not Work rows)");

console.log("\nAll work-context-engine-canonical tests passed.");
