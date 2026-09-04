/**
 * Marriage A/B evidence-integrity regression suite.
 *
 * Permanent coverage for the personalization-architecture defect found in
 * Proof Case #1 (relationship_report_id 1d5ab4ff-2aba-4512-b4e8-beb566714d23):
 * `sortReportPair.ts` assigns report_id_a/report_id_b by lexicographic UUID
 * order, which carries zero personality meaning — yet several Marriage
 * intelligence fields used to assign fixed personas by that slot (A always
 * "decisive", B always "calm/receptive") regardless of either person's
 * actual Saju/Psych evidence.
 *
 * This suite asserts PROPERTIES, not fixed sentences:
 *  - A/B swap invariance: the same human's own characterization must not
 *    flip to its opposite purely because they moved from slot A to slot B.
 *  - CH05/CH06 path integrity: the real, evidence-driven builders must be
 *    what actually reaches the ViewModel, not the generic default.
 *  - Fallback safety: default/fallback builders must not invent
 *    person-specific personality when they have no evidence.
 *  - Psych axis key validity: no code may read a PRIMARY-axis name
 *    (adaptability/growth/stability/autonomy/connection) directly off
 *    `secondary_axes` — that key doesn't exist there and silently resolves
 *    to `undefined ?? 50` for everyone.
 *  - Life-stage safety: no fabricated relationship stage.
 *  - Distinctiveness: evidence-driven fields must actually respond to
 *    different underlying data, not stay byte-identical.
 *
 * Run: npx tsx tests/unit/marriage-ab-integrity-regression.test.mjs
 */
import assert from "node:assert/strict";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport.ts";
import { SECONDARY_AXIS_KEYS } from "../../lib/v2/survey/types.ts";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function makePsych(overrides) {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
    home_life_dna: { lifestyle_title: "test", life_values_line: "test" },
  };
}

// Two materially different, clearly-labeled synthetic people. Person1 here
// mirrors the real Sera chart facts supplied in the forensic audit (Day
// Master 丁/jeong, day branch 亥/hae) — this is Proof Case #1's inspiration,
// not the real tester's data (her partner's real chart isn't available to
// this suite).
const person1 = { saju: { yearPillar: "정묘", monthPillar: "계축", dayPillar: "정해", hourPillar: "을사" }, dayStemCode: "jeong", dayBranchCode: "hae" };
const person1Psych = makePsych({ practicality: 70, thinking_style: 65, structure: 55, empathy: 45, decision_style: 60 });
const person2 = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "무진", hourPillar: "경신" }, dayStemCode: "mu", dayBranchCode: "jin" };
const person2Psych = makePsych({ empathy: 70, structure: 40, practicality: 40, decision_style: 40 });

function buildAs(p1IsA) {
  const nicknameA = p1IsA ? "Person1" : "Person2";
  const nicknameB = p1IsA ? "Person2" : "Person1";
  const sajuJsonA = p1IsA ? person1 : person2;
  const sajuJsonB = p1IsA ? person2 : person1;
  const psychMasterA = p1IsA ? person1Psych : person2Psych;
  const psychMasterB = p1IsA ? person2Psych : person1Psych;
  return buildMarriageReport({ nicknameA, nicknameB, sajuJsonA, sajuJsonB, psychMasterA, psychMasterB });
}

const reportP1isA = buildAs(true);
const reportP1isB = buildAs(false);
const bundleP1isA = reportP1isA.canonical_projections.marriage_canonical_bundle;
const bundleP1isB = reportP1isB.canonical_projections.marriage_canonical_bundle;

function containsAny(text, words) {
  return words.some((w) => text.includes(w));
}

// ---------------------------------------------------------------------------
section("1. A/B SWAP INVARIANCE — CH01 attraction (respect_trust driver)");
{
  const rtP1isA = bundleP1isA.chapter01Intelligence.attraction.drivers.find((d) => d.category === "respect_trust");
  const rtP1isB = bundleP1isB.chapter01Intelligence.attraction.drivers.find((d) => d.category === "respect_trust");
  if (rtP1isA && rtP1isB) {
    // Praise ABOUT Person1: when Person1=A, that's whatDrawsB (B praising A);
    // when Person1=B, that's whatDrawsA (A praising B).
    const praiseOfPerson1WhenA = rtP1isA.whatDrawsB;
    const praiseOfPerson1WhenB = rtP1isB.whatDrawsA;
    const CALM_WORDS = ["차분", "다정", "수용"];
    const DECISIVE_WORDS = ["소신", "결단력"];
    const calmWhenA = containsAny(praiseOfPerson1WhenA, CALM_WORDS);
    const calmWhenB = containsAny(praiseOfPerson1WhenB, CALM_WORDS);
    const decisiveWhenA = containsAny(praiseOfPerson1WhenA, DECISIVE_WORDS);
    const decisiveWhenB = containsAny(praiseOfPerson1WhenB, DECISIVE_WORDS);
    assert.equal(calmWhenA, calmWhenB, "Person1 must not gain/lose calm/receptive language purely from an A/B slot swap");
    assert.equal(decisiveWhenA, decisiveWhenB, "Person1 must not gain/lose decisive language purely from an A/B slot swap");
    ok("CH01 respect_trust driver: Person1's own characterization is slot-invariant");
  } else {
    ok("CH01 respect_trust driver did not fire in one or both runs (peer_camaraderie branch used) — invariance trivially holds");
  }
}

section("2. A/B SWAP INVARIANCE — CH03 roleLockIn");
{
  const roleOfPerson1WhenA = bundleP1isA.chapter03Intelligence.roleLockIn.personARole.roleTitle;
  const roleOfPerson1WhenB = bundleP1isB.chapter03Intelligence.roleLockIn.personBRole.roleTitle;
  assert.equal(roleOfPerson1WhenA, roleOfPerson1WhenB, "Person1's roleLockIn title must not change purely because of A/B slot");
  ok(`CH03 roleLockIn is slot-invariant for Person1 (role: "${roleOfPerson1WhenA}")`);
}

section("3. A/B SWAP INVARIANCE — CH03 assets[0] title");
{
  // assets[0] no longer names a fixed "direction guide" vs "acceptance"
  // pairing by slot — assert Person1's OWN mention (if named at all) is
  // consistent regardless of slot.
  const titleWhenA = bundleP1isA.chapter03Intelligence.assets[0].title;
  const titleWhenB = bundleP1isB.chapter03Intelligence.assets[0].title;
  const person1NamedAsDirectionWhenA = titleWhenA.includes("Person1") && titleWhenA.indexOf("Person1") < titleWhenA.indexOf("포용력");
  const person1NamedAsDirectionWhenB = titleWhenB.includes("Person1") && titleWhenB.indexOf("Person1") < titleWhenB.indexOf("포용력");
  // Only meaningful to compare when a real complementary split was found in BOTH runs;
  // otherwise both fall back to the neutral/shared title, which is itself slot-invariant.
  if (titleWhenA.includes("방향 감각") && titleWhenB.includes("방향 감각")) {
    assert.equal(person1NamedAsDirectionWhenA, person1NamedAsDirectionWhenB, "Person1 must not flip between 'direction' and 'acceptance' roles purely from slot");
  }
  ok("CH03 assets[0] title is slot-consistent (or both runs used the neutral/shared framing)");
}

section("4. A/B SWAP INVARIANCE — expectationsAndNeeds.needGaps direction");
{
  const gapsWhenA = bundleP1isA.expectationsAndNeeds.needGaps;
  const gapsWhenB = bundleP1isB.expectationsAndNeeds.needGaps;
  for (let i = 0; i < gapsWhenA.length; i++) {
    const person1IsReceiverWhenA = gapsWhenA[i].receiverName === "Person1";
    const person1IsReceiverWhenB = gapsWhenB[i].receiverName === "Person1";
    assert.equal(
      person1IsReceiverWhenA,
      person1IsReceiverWhenB,
      `needGaps[${i}] (${gapsWhenA[i].category}): Person1's receiver/giver direction must not flip purely from slot`,
    );
  }
  ok("expectationsAndNeeds.needGaps direction follows evidence, not slot, for every category");
}

section("5. KNOWN-GOOD CONTROL — crisisRole stays evidence-based across the swap");
{
  const person1CrisisWhenA = bundleP1isA.crisisRole.roleA;
  const person1CrisisWhenB = bundleP1isB.crisisRole.roleB;
  assert.equal(person1CrisisWhenA, person1CrisisWhenB, "crisisRole must remain attached to Person1 regardless of slot (already-good pattern)");
  ok(`crisisRole is slot-invariant for Person1 (${person1CrisisWhenA})`);
}

section("6. KNOWN-GOOD CONTROL — economicPartnership stays evidence-based across the swap");
{
  const person1RoleWhenA = bundleP1isA.economicPartnership.profileA.primaryRole;
  const person1RoleWhenB = bundleP1isB.economicPartnership.profileB.primaryRole;
  assert.equal(person1RoleWhenA, person1RoleWhenB, "economicPartnership.primaryRole must remain attached to Person1 regardless of slot (already-good pattern)");
  ok(`economicPartnership is slot-invariant for Person1 (${person1RoleWhenA})`);
}

// ---------------------------------------------------------------------------
section("7. CH05 PATH INTEGRITY — ViewModel receives the REAL chapter05Intelligence, not the default");
{
  const realTeamType = bundleP1isA.chapter05Intelligence.coupleOperatingSystem.teamTypeTitle;
  // The default fallback's teamType is always exactly "역할 분담형 시너지" /
  // "Role-sharing synergy" UNLESS the real capability comparisons produce a
  // more specific complementary/dual-lead label — so instead of asserting
  // inequality (fragile), assert the ViewModel's card actually references
  // the same object identity content as the canonical bundle's real CH05.
  const vmModule = await import("../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts");
  const vm = vmModule.buildMarriageReportViewModel(reportP1isA, { myName: "Person1", partnerName: "Person2" });
  const moneySection = vm.sections.find((s) => "ch05Intelligence" in s);
  assert.ok(moneySection, "money_chores section must exist");
  assert.deepEqual(
    moneySection.ch05Intelligence.coupleOperatingSystem.capabilities.map((c) => c.actor),
    bundleP1isA.chapter05Intelligence.coupleOperatingSystem.capabilities.map((c) => c.actor),
    "ViewModel's ch05Intelligence must be the real canonical-bundle CH05 (same capability actors), not createDefaultMarriageChapter05Intelligence",
  );
  ok("CH05 reaches the ViewModel from marriage_canonical_bundle, confirmed by matching real capability data");
}

section("8. CH06 WIRING — real chapter06Intelligence exists in the bundle and reaches the ViewModel");
{
  assert.ok(bundleP1isA.chapter06Intelligence, "buildMarriageCanonicalEngine must produce chapter06Intelligence");
  const vmModule = await import("../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts");
  const vm = vmModule.buildMarriageReportViewModel(reportP1isA, { myName: "Person1", partnerName: "Person2" });
  const familySection = vm.sections.find((s) => "ch06Intelligence" in s);
  assert.ok(familySection, "parenting/family section must exist");
  assert.equal(
    familySection.ch06Intelligence.coupleBoundary.profileA.narrative,
    bundleP1isA.chapter06Intelligence.coupleBoundary.profileA.narrative,
    "ViewModel's ch06Intelligence must be the real canonical-bundle CH06, not createDefaultMarriageChapter06Intelligence",
  );
  ok("CH06 is wired into the engine and reaches the ViewModel from marriage_canonical_bundle");
}

// ---------------------------------------------------------------------------
section("9. FALLBACK SAFETY — CH03/CH06 defaults never assign a fixed A=X/B=Y persona");
{
  const { createDefaultMarriageChapter03Intelligence } = await import("../../lib/relationship/marriage/marriageChapter03Intelligence.ts");
  const defaultCh03 = createDefaultMarriageChapter03Intelligence("NameA", "NameB", false);
  assert.equal(
    defaultCh03.roleLockIn.personARole.roleTitle,
    defaultCh03.roleLockIn.personBRole.roleTitle,
    "createDefaultMarriageChapter03Intelligence must give both people the SAME neutral role title, never a fixed complementary split",
  );

  const { createDefaultMarriageChapter06Intelligence } = await import("../../lib/relationship/marriage/marriageChapter06Intelligence.ts");
  const defaultCh06 = createDefaultMarriageChapter06Intelligence({ nameA: "NameA", nameB: "NameB", locale: "ko-KR" });
  assert.equal(
    defaultCh06.coupleBoundary.profileA.editorialLabel,
    defaultCh06.coupleBoundary.profileB.editorialLabel,
    "createDefaultMarriageChapter06Intelligence must give both people the SAME neutral label, never a fixed complementary split",
  );
  ok("CH03/CH06 fallbacks are symmetric — no invented persona split when evidence is absent");
}

// ---------------------------------------------------------------------------
section("10. PSYCH AXIS KEY VALIDITY — no PRIMARY-axis name is read directly off secondary_axes");
{
  const INVALID_SECONDARY_KEYS = ["adaptability", "growth", "stability", "autonomy", "connection"];
  const filesToScan = [
    "lib/relationship/marriage/marriageChapter05Intelligence.ts",
    "lib/relationship/marriage/marriageChapter06Intelligence.ts",
  ];
  for (const rel of filesToScan) {
    const src = fs.readFileSync(path.join(root, rel), "utf8");
    for (const key of INVALID_SECONDARY_KEYS) {
      // Matches e.g. `axesA.growth` / `psychAxesB.autonomy` — a direct property
      // read off a secondary_axes-shaped object using an invalid primary-axis name.
      const pattern = new RegExp(`(axes|psychAxes)[AB]\\.${key}\\b`);
      assert.ok(!pattern.test(src), `${rel} must not read .${key} directly off a secondary_axes object (use resolvePrimaryAxisValue instead)`);
    }
  }
  // Positive control: confirm SECONDARY_AXIS_KEYS really doesn't include these.
  for (const key of INVALID_SECONDARY_KEYS) {
    assert.ok(!SECONDARY_AXIS_KEYS.includes(key), `${key} must not be a real SecondaryAxisKey (sanity check on the test itself)`);
  }
  ok("No CH05/CH06 code reads a primary-axis name directly off secondary_axes");
}

// ---------------------------------------------------------------------------
section("11. LIFE STAGE SAFETY — no fabricated currentStage");
{
  const { buildMarriageLifeStageTransition } = await import("../../lib/relationship/marriage/marriageLifeStageTransition.ts");
  const bundle = buildMarriageLifeStageTransition(person1Psych, person2Psych, "Person1", "Person2", "ko-KR");
  assert.equal(bundle.currentStage, null, "currentStage must be null — no real stage-detection evidence exists in this product yet");
  ok("marriageLifeStageTransition does not fabricate EARLY_MARRIAGE or any other stage");
}

// ---------------------------------------------------------------------------
section("12. DISTINCTIVENESS — evidence-driven fields actually respond to different data");
{
  // A third, near-identical-axes pair should differ from the two
  // materially-different people above on at least the genuinely
  // evidence-driven fields.
  const reportSimilar = buildMarriageReport({
    nicknameA: "SimA", nicknameB: "SimB",
    sajuJsonA: person1, sajuJsonB: person1, // identical chart on purpose
    psychMasterA: makePsych({}), psychMasterB: makePsych({}),
  });
  const bundleSimilar = reportSimilar.canonical_projections.marriage_canonical_bundle;
  const distinct =
    JSON.stringify(bundleP1isA.economicPartnership.profileA) !== JSON.stringify(bundleSimilar.economicPartnership.profileA) ||
    bundleP1isA.crisisRole.roleA !== bundleSimilar.crisisRole.roleA;
  assert.ok(distinct, "Materially different evidence must produce a different economicPartnership/crisisRole outcome than a near-identical pair");
  ok("Evidence-driven fields are not byte-identical across materially different inputs");
}

console.log("\nAll Marriage A/B integrity regression tests passed.");
