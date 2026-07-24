/**
 * Family CE — comparison_table typed authority (band_parent / band_child).
 * Run: npx tsx tests/unit/family-context-engine-canonical.test.mjs
 */
import assert from "node:assert/strict";
import { formatFamilyCompareBandLabel } from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import {
  readFamilyComparisonTableCanonicalProjection,
  formatFamilyCompareCanonicalLabel,
} from "../../lib/relationship/familyParent/familyComparisonTableCanonical.ts";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { stripFamilyContextOutputForClient } from "../../lib/relationship/familyParent/stripFamilyContextOutputForClient.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { buildFriendReport } from "../../lib/relationship/friend/buildFriendReport.ts";
import { buildWorkColleagueReport } from "../../lib/relationship/workColleague/buildWorkColleagueReport.ts";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport.ts";

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

const sajuChild = saju("2014-05-15", "14:30");
const sajuParent = saju("1988-08-20", "09:00");
const ROW_IDS = [
  "correction_style",
  "bond_distance",
  "affection_expression",
  "guidance_balance",
  "gathering_recovery",
  "home_climate",
];

section("A) Typed six rows — parent/child bands");
const report = buildFamilyParentReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  roles: { roleA: "child", roleB: "mother" },
  parentType: "mother",
  sajuJsonA: sajuChild,
  sajuJsonB: sajuParent,
  locale: "ko-KR",
});
const typed = report.canonical_projections?.comparison_table;
assert.ok(typed);
assert.deepEqual(Object.keys(typed).sort(), [...ROW_IDS].sort());
for (const id of ROW_IDS) {
  const row = report.family.section_compare_table.find((r) => r.id === id);
  assert.equal(row.personParent.band, typed[id].band_parent);
  assert.equal(row.personChild.band, typed[id].band_child);
  assert.equal(
    row.personParent.shortLabel,
    formatFamilyCompareBandLabel(id, typed[id].band_parent, "ko-KR"),
  );
}
assert.equal(report.meta.parent_nickname, "Jordan");
assert.equal(report.meta.child_nickname, "Alex");
ok("six typed rows; parent/child oriented");

section("B) Parent/child role swap flips typed sides");
const swapped = buildFamilyParentReport({
  nicknameA: "Jordan",
  nicknameB: "Alex",
  roles: { roleA: "mother", roleB: "child" },
  parentType: "mother",
  sajuJsonA: sajuParent,
  sajuJsonB: sajuChild,
  locale: "ko-KR",
});
for (const id of ROW_IDS) {
  assert.equal(
    report.canonical_projections.comparison_table[id].band_parent,
    swapped.canonical_projections.comparison_table[id].band_parent,
  );
  assert.equal(
    report.canonical_projections.comparison_table[id].band_child,
    swapped.canonical_projections.comparison_table[id].band_child,
  );
}
ok("same people keep parent/child bands when roles map correctly");

section("C) Projection wins + parentRole copy-only");
const lied = structuredClone(report);
lied.family.section_compare_table[0].personParent.shortLabel = "LLM LIE";
const father = buildFamilyParentReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  roles: { roleA: "child", roleB: "father" },
  parentType: "father",
  sajuJsonA: sajuChild,
  sajuJsonB: sajuParent,
  locale: "ko-KR",
});
assert.deepEqual(
  father.canonical_projections.comparison_table,
  report.canonical_projections.comparison_table,
);
const vm = buildFamilyReportViewModel(lied, { locale: "ko-KR" });
const cmp = vm.sections.find((s) => s.type === "compare_table");
const correction = cmp.rows.find((r) => r.id === "correction_style");
assert.notEqual(correction.personParent.shortLabel, "LLM LIE");
assert.equal(
  correction.personParent.shortLabel,
  formatFamilyCompareCanonicalLabel(
    "correction_style",
    report.canonical_projections.comparison_table.correction_style.band_parent,
    "ko-KR",
  ),
);
ok("projection wins; mother/father same typed bands");

section("D) Malformed / legacy / strip");
assert.equal(
  readFamilyComparisonTableCanonicalProjection({
    canonical_projections: {
      comparison_table: {
        correction_style: { band_parent: "bogus", band_child: "self" },
      },
    },
  }),
  null,
);
const legacy = structuredClone(report);
delete legacy.canonical_projections;
const vmL = buildFamilyReportViewModel(legacy, { locale: "ko-KR" });
assert.equal(
  vmL.sections.find((s) => s.type === "compare_table").rows[0].personParent
    .shortLabel,
  legacy.family.section_compare_table.find((r) => r.id === "correction_style")
    .personParent.shortLabel,
);
const stripped = stripFamilyContextOutputForClient({ report });
assert.equal(stripped.report.context_output, undefined);
assert.ok(stripped.report.canonical_projections.comparison_table);
ok("malformed/legacy/strip");

section("E) Locale identity");
const en = buildFamilyParentReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  roles: { roleA: "child", roleB: "mother" },
  parentType: "mother",
  sajuJsonA: sajuChild,
  sajuJsonB: sajuParent,
  locale: "en-US",
});
assert.deepEqual(
  en.canonical_projections.comparison_table,
  report.canonical_projections.comparison_table,
);
ok("locale-independent typed");

section("F) Semantic boundaries vs frozen domains");
assert.ok(
  ["receptive", "explanatory", "standards", "mixed"].includes(
    typed.guidance_balance.band_parent,
  ),
);
assert.ok(["distant", "balanced", "smothering"].includes(typed.bond_distance.band_parent));
assert.equal(typed.bond_distance.separation_task, undefined);
const friend = buildFriendReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuParent,
  sajuJsonB: sajuChild,
  locale: "ko-KR",
});
assert.ok(friend.canonical_projections?.comparison_table?.daily_share_tempo);
assert.equal(friend.canonical_projections.comparison_table.correction_style, undefined);
const work = buildWorkColleagueReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuParent,
  sajuJsonB: sajuChild,
  locale: "ko-KR",
});
assert.ok(work.canonical_projections?.comparison_table?.boundary);
assert.equal(work.canonical_projections.comparison_table.guidance_balance, undefined);
const marriage = buildMarriageReport({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: sajuParent,
  sajuJsonB: sajuChild,
  locale: "ko-KR",
});
assert.ok(marriage.canonical_projections?.comparison_table?.household_stress);
assert.equal(
  marriage.canonical_projections.comparison_table.correction_style,
  undefined,
);
ok("boundaries + frozen domains intact");

console.log("\nAll family-context-engine-canonical tests passed.");
