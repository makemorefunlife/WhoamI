/**
 * Part2 meaning must surface person A/B bucket differences (not pair-band-only).
 * Run: npx tsx tests/unit/family-part2-person-contrast-meaning.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { extractFamilySignals } from "../../lib/personCore/sajuSignals/extractFamilySignals.ts";
import { buildPairFamilySignals } from "../../lib/personCore/sajuSignals/pairFamilySignals.ts";
import { resolveGuidanceBalanceBucket } from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import {
  FAMILY_PARENT_CHILD_DEEP_FORMAT,
  isFamilyParentChildDeepReport,
} from "../../lib/prompts/relationshipPremium/familyParentChild/outputSchema.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

function fromBirth(birthDate) {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
  const payload = toV1SajuApiPayload(bundle);
  const counts = {};
  for (const t of payload.tenGods ?? []) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (name) counts[name] = (counts[name] ?? 0) + 1;
  }
  return {
    counts,
    familySignals: extractFamilySignals(bundle),
    sajuJson: {
      saju: payload.saju,
      dayStemData: payload.dayStemData,
      dayBranchData: payload.dayBranchData,
      hiddenStemsData: payload.hiddenStemsData,
      tenGods: payload.tenGods,
      twelveStageData: payload.twelveStageData,
      relations: payload.relations,
      shinsals: payload.shinsals,
    },
  };
}

function buildPair(parentBirth, childBirth, withSignals = true, names = null) {
  const parent = fromBirth(parentBirth);
  const child = fromBirth(childBirth);
  const famP = withSignals ? parent.familySignals : undefined;
  const famC = withSignals ? child.familySignals : undefined;
  const guideP = resolveGuidanceBalanceBucket(parent.counts);
  const guideC = resolveGuidanceBalanceBucket(child.counts);
  const pair =
    famP && famC
      ? buildPairFamilySignals(famP, famC, {
          modeA: guideP.bucket,
          modeB: guideC.bucket,
        })
      : null;
  const parentName = names?.parent ?? "Parent";
  const childName = names?.child ?? "Child";
  return buildFamilyParentReport({
    nicknameA: childName,
    nicknameB: parentName,
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
    sajuJsonA: child.sajuJson,
    sajuJsonB: parent.sajuJson,
    familySignalsA: famC,
    familySignalsB: famP,
    pairFamily: pair,
    locale: "ko-KR",
  });
}

function row(report, id) {
  return report.family.section_compare_table.find((r) => r.id === id);
}

console.log("\n=== person contrast appears in meaning when buckets differ ===");
{
  const r = buildPair("1988-08-20", "2014-05-15", true);
  const a = row(r, "correction_style");
  assert.notEqual(a.personParent.shortLabel, a.personChild.shortLabel);
  assert.ok(a.meaning.includes("Parent"));
  assert.ok(a.meaning.includes("Child"));
  assert.ok(a.meaning.includes(a.personParent.shortLabel));
  assert.ok(a.meaning.includes(a.personChild.shortLabel));

  const b = row(r, "bond_distance");
  assert.ok(b.meaning.includes(b.personParent.shortLabel));
  assert.ok(b.meaning.includes(b.personChild.shortLabel));

  const c = row(r, "guidance_balance");
  assert.ok(c.meaning.includes(c.personParent.shortLabel));
  assert.ok(c.meaning.includes(c.personChild.shortLabel));
  ok("A/B/C meaning names both person labels");
}

console.log("\n=== different person pairs → different meaning when labels differ ===");
{
  const r1 = buildPair("1988-08-20", "2014-05-15", true);
  const r2 = buildPair("1975-01-10", "2008-11-03", true);
  assert.notEqual(row(r1, "bond_distance").meaning, row(r2, "bond_distance").meaning);
  ok("bond_distance meanings diverge across fixtures with different person bonds");

  const a1 = row(r1, "correction_style").meaning;
  const a3 = row(buildPair("1990-03-22", "2016-07-07", true), "correction_style").meaning;
  assert.notEqual(a1, a3);
  ok("correction_style meanings diverge when person styles differ (even if nagging band same)");
}

console.log("\n=== same person buckets: meaning must not say ‘달라도’ ===");
{
  const r = buildPair("1975-01-10", "2008-11-03", true, {
    parent: "Sera",
    child: "다시고고",
  });
  const a = row(r, "correction_style");
  assert.equal(a.personParent.shortLabel, a.personChild.shortLabel);
  assert.ok(a.meaning.includes("Sera") && a.meaning.includes("다시고고"));
  assert.ok(a.meaning.includes("모두"));
  assert.ok(!a.meaning.includes("달라도"));
  assert.ok(a.meaning.includes("같은 반응"));
  ok("same correction labels → SAME friction copy (no ‘달라도’)");

  const rSameBond = buildPair("1990-03-22", "2016-07-07", true);
  const b2 = row(rSameBond, "bond_distance");
  assert.equal(b2.personParent.shortLabel, b2.personChild.shortLabel);
  assert.ok(b2.meaning.includes("모두"));
  assert.ok(!b2.meaning.includes("거리 감각이 달라"));
  assert.ok(b2.meaning.includes("같은 거리"));
  ok("same bond labels → SAME umbilical copy");
}

console.log("\n=== no familySignals: pair rebuilt from counts ===");
{
  const withSig = buildPair("1988-08-20", "2014-05-15", true);
  const noSig = buildPair("1988-08-20", "2014-05-15", false);
  const aNo = row(noSig, "correction_style");
  assert.ok(aNo.meaning.includes(aNo.personParent.shortLabel));
  assert.ok(aNo.meaning.includes(aNo.personChild.shortLabel));
  assert.ok(aNo.meaning.length > 40);
  const roles = noSig.family.section_household_roles;
  assert.ok(roles.complement.includes("Parent") || roles.complement.includes("Child"));
  ok("missing signals still produce person-contrast meaning + household pair from counts");
  void withSig;
}

console.log("\n=== cache validator requires v2 + person-contrast lead ===");
{
  const report = buildPair("1988-08-20", "2014-05-15", true);
  assert.equal(FAMILY_PARENT_CHILD_DEEP_FORMAT, "family_parent_child_deep_v2");
  assert.ok(
    isFamilyParentChildDeepReport({
      format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
      report,
    }),
  );
  assert.ok(
    !isFamilyParentChildDeepReport({
      format: "family_parent_child_deep_v1",
      report,
    }),
  );
  ok("v1 format / old meaning rejected → cache miss → regenerate");
}

console.log("\nAll family-part2-person-contrast-meaning checks passed.");
