/**
 * Family Part5 — de-escalation ↔ Part2 A correction_style SSOT.
 * Run: npx tsx tests/unit/family-part5-ssot.test.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildChildDeEscalationCard } from "../../lib/relationship/familyParent/childDeEscalationPrescriptions.ts";
import { resolveCorrectionStyleBucket } from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}

function sajuFromBirth(birthDate) {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
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

function countsFrom(json) {
  const counts = {};
  for (const t of json.tenGods ?? []) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

section("Five categories align with resolveCorrectionStyleBucket");
{
  const categories = [
    ["food", { 상관: 4 }],
    ["self", { 비견: 4 }],
    ["seal", { 정인: 4 }],
    ["officer", { 정관: 4 }],
    ["wealth", { 정재: 4 }],
  ];
  for (const [expected, counts] of categories) {
    const bucket = resolveCorrectionStyleBucket(counts).bucket;
    const card = buildChildDeEscalationCard({
      childNickname: "Alex",
      parentNickname: "Jordan",
      parentRole: "mother",
      childCounts: counts,
      locale: "ko-KR",
    });
    assert.equal(bucket, expected);
    assert.equal(card.category, expected);
  }
  ok("food/self/seal/officer/wealth");
}

section("Live report child A bucket === de-escalation category");
{
  const child = sajuFromBirth("2014-05-15");
  const parent = sajuFromBirth("1988-08-20");
  const report = buildFamilyParentReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
    sajuJsonA: child,
    sajuJsonB: parent,
    locale: "ko-KR",
  });
  const expected = resolveCorrectionStyleBucket(countsFrom(child)).bucket;
  assert.equal(report.family.section_de_escalation.category, expected);
  ok("report SSOT");
}

section("mother/father category identical");
{
  const child = sajuFromBirth("2014-05-15");
  const parent = sajuFromBirth("1988-08-20");
  const base = {
    nicknameA: "Alex",
    nicknameB: "Jordan",
    sajuJsonA: child,
    sajuJsonB: parent,
    locale: "ko-KR",
  };
  const mother = buildFamilyParentReport({
    ...base,
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
  });
  const father = buildFamilyParentReport({
    ...base,
    roles: { roleA: "child", roleB: "father" },
    parentType: "father",
  });
  assert.equal(
    mother.family.section_de_escalation.category,
    father.family.section_de_escalation.category,
  );
  ok("role-invariant category");
}

console.log("\nAll family-part5-ssot checks passed.");
