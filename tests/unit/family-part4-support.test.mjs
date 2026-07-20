/**
 * Family Part4 — parentSupportsSeal/Wealth child day-stem fix.
 * Run: npx tsx tests/unit/family-part4-support.test.mjs
 */
import assert from "node:assert/strict";
import { buildChartContext } from "../../lib/saju/chartContext.ts";
import {
  parentSupportsSeal,
  parentSupportsWealth,
  analyzeFamilyPairSaju,
} from "../../lib/saju/familyAnalysis.ts";
import { computeFamilyMasterScores } from "../../lib/relationship/familyParent/familyEventScores.ts";
import { analyzeFamilyParentTenGod } from "../../lib/relationship/familyParent/familyParentTenGodAnalysis.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}

/** Fixed pillars — day stem 갑(wood) vs 병(fire) vs 임(water). */
const parentWood = buildChartContext({
  yearPillar: "갑자",
  monthPillar: "을축",
  dayPillar: "갑인",
  hourPillar: "병인",
});
const childFire = buildChartContext({
  yearPillar: "무진",
  monthPillar: "기사",
  dayPillar: "병오",
  hourPillar: "정미",
});
const childWater = buildChartContext({
  yearPillar: "무진",
  monthPillar: "기사",
  dayPillar: "임자",
  hourPillar: "계축",
});
/** Same day stem as parent (wood) — old bug made childEl === parentEl always. */
const childWoodSameAsParent = buildChartContext({
  yearPillar: "무진",
  monthPillar: "기사",
  dayPillar: "갑술",
  hourPillar: "을해",
});

section("1) Different child day stems → support results can differ");
{
  // fire's seal element = wood; parent wood === sealEl → true
  assert.equal(parentSupportsSeal(parentWood, childFire, true), true);
  // water's seal element = metal; wood does not generate/equal metal → false
  assert.equal(parentSupportsSeal(parentWood, childWater, true), false);
  assert.notEqual(
    parentSupportsSeal(parentWood, childFire, true),
    parentSupportsSeal(parentWood, childWater, true),
  );
  ok("seal support differs by child day stem");
}

section("2) Parent stem-only change must not be the sole driver when child fixed");
{
  const parentMetal = buildChartContext({
    yearPillar: "갑자",
    monthPillar: "을축",
    dayPillar: "경신",
    hourPillar: "신유",
  });
  // Child fire fixed: seal=wood. Parent wood supports; parent metal may differ.
  const withWoodParent = parentSupportsSeal(parentWood, childFire, true);
  const withMetalParent = parentSupportsSeal(parentMetal, childFire, true);
  // Both should use childFire day stem (fire→seal wood). Wood parent equals seal; metal does not.
  assert.equal(withWoodParent, true);
  assert.equal(withMetalParent, false);
  // Old bug used parent day for childEl: wood parent → seal=water, wood≠water → false even for fire child.
  // After fix, wood parent + fire child → true. Regression guard:
  assert.equal(parentSupportsSeal(parentWood, childFire, true), true);
  ok("child stem drives sealEl; parent alone is not childEl");
}

section("3) Same parent+child stems: result matches intentional same-element case");
{
  // When child day stem truly equals parent, sealEl = generating(parent).
  // wood seal = water; wood generates water? no; wood === water? no → false
  assert.equal(parentSupportsSeal(parentWood, childWoodSameAsParent, true), false);
  ok("identical day stems evaluated with real child chart");
}

section("4) childSealStrong false → always false");
{
  assert.equal(parentSupportsSeal(parentWood, childFire, false), false);
  assert.equal(parentSupportsWealth(parentWood, childFire, false), false);
  ok("gate on childSealStrong / childWealthStrong");
}

section("5) Wealth path uses child day stem");
{
  // fire's wealth element = metal; parent wood vs metal
  const parentMetal = buildChartContext({
    yearPillar: "갑자",
    monthPillar: "을축",
    dayPillar: "경신",
    hourPillar: "신유",
  });
  assert.equal(parentSupportsWealth(parentMetal, childFire, true), true);
  assert.equal(parentSupportsWealth(parentWood, childFire, true), false);
  ok("wealth support differs by parent vs child day stems correctly");
}

section("6) mother/father support_strength via tenGod + real births");
{
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
  const childJson = sajuFromBirth("2014-05-15");
  const parentJson = sajuFromBirth("1988-08-20");
  const childCounts = countsFrom(childJson);
  const parentCounts = countsFrom(parentJson);
  const motherPair = analyzeFamilyPairSaju(
    parentJson.saju,
    childJson.saju,
    "mother",
    childCounts,
    parentCounts,
  );
  const fatherPair = analyzeFamilyPairSaju(
    parentJson.saju,
    childJson.saju,
    "father",
    childCounts,
    parentCounts,
  );

  assert.equal(
    motherPair.scoringSignals.parentSupportsChildSeal,
    fatherPair.scoringSignals.parentSupportsChildSeal,
  );
  assert.equal(
    motherPair.scoringSignals.parentSupportsChildWealth,
    fatherPair.scoringSignals.parentSupportsChildWealth,
  );

  const tenMother = analyzeFamilyParentTenGod({
    parentRole: "mother",
    sajuJsonParent: parentJson,
    sajuJsonChild: childJson,
    familyPairAnalysis: motherPair,
    childNickname: "Alex",
    locale: "ko-KR",
  });
  const tenFather = analyzeFamilyParentTenGod({
    parentRole: "father",
    sajuJsonParent: parentJson,
    sajuJsonChild: childJson,
    familyPairAnalysis: fatherPair,
    childNickname: "Alex",
    locale: "ko-KR",
  });
  assert.ok(["strong", "moderate", "developing"].includes(tenMother.parentProfile.support_strength));
  assert.ok(["strong", "moderate", "developing"].includes(tenFather.parentProfile.support_strength));

  const masterM = computeFamilyMasterScores(motherPair);
  const masterF = computeFamilyMasterScores(fatherPair);
  assert.equal(masterM.risk, masterF.risk);
  assert.ok(Math.abs(masterM.bond - masterF.bond) <= 5);
  assert.ok(Math.abs(masterM.synergy - masterF.synergy) <= 5);
  ok("mother/father: support flags chart-invariant; strength/master within role lens bounds");
}

console.log("\nAll family-part4-support checks passed.");
