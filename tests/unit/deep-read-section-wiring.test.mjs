/**
 * Deep Read — per-domain ViewModel wiring (friend/work/marriage/family).
 * Verifies the deep_read section is included exactly when the corresponding
 * meta.*_saju_deep overlay has usable content, is absent otherwise, other
 * sections are unaffected, and the card title follows locale.
 * Run: npx tsx tests/unit/deep-read-section-wiring.test.mjs
 */
import assert from "node:assert/strict";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts";
import { buildFriendReportViewModel } from "../../lib/relationship/friend/viewModel/buildFriendReportViewModel.ts";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

function findDeepRead(sections) {
  return sections.find((s) => s.type === "deep_read") ?? null;
}

const richOverlayFor = (natureKeyA, natureKeyB, framesKey, gapKey, adviceAKey, adviceBKey) => ({
  section_2_nature: {
    [natureKeyA]: { first_person_voice: "voice A", description: "desc A" },
    [natureKeyB]: { first_person_voice: "voice B", description: "desc B" },
  },
  [framesKey]: {
    [gapKey]: { a_body: "gap A", b_body: "gap B", match_note: "note" },
  },
  section_5_action: {
    [adviceAKey]: [{ action_title: "Do X", saju_reason: "because Y" }],
    [adviceBKey]: [{ action_title: "Do Z", saju_reason: "because W" }],
    together: "Try this together",
    together_starter: "starter line",
  },
});

// ---------------------------------------------------------------------------
console.log("\n=== Work (business_saju_deep) ===");
{
  const richReport = {
    meta: {
      business_saju_deep: richOverlayFor(
        "a_nature",
        "b_nature",
        "section_4_business_frames",
        "role_gap_signal",
        "advice_for_a",
        "advice_for_b",
      ),
    },
  };
  const paramsEn = { viewerIsReportA: true, myName: "Alex", partnerName: "Jordan", locale: "en-US" };
  const vmEn = buildWorkReportViewModel(richReport, paramsEn);
  const deepReadEn = findDeepRead(vmEn.sections);
  assert.ok(deepReadEn, "deep_read section present when overlay has content");
  assert.match(deepReadEn.title, /Deep Read/);
  assert.equal(deepReadEn.vm.meNature.voice, "voice A");
  assert.equal(deepReadEn.vm.adviceForMe[0].actionTitle, "Do X");
  ok("en-US: renders with English title + correct viewer-first content");

  const vmKo = buildWorkReportViewModel(richReport, { ...paramsEn, locale: "ko-KR" });
  const deepReadKo = findDeepRead(vmKo.sections);
  assert.ok(deepReadKo);
  assert.match(deepReadKo.title, /심층/);
  ok("ko-KR: renders with Korean title (locale preserved, not translated)");

  const absentReport = { meta: {} };
  const vmAbsent = buildWorkReportViewModel(absentReport, paramsEn);
  assert.equal(findDeepRead(vmAbsent.sections), null);
  assert.ok(vmAbsent.sections.length === 0 || !vmAbsent.sections.some((s) => s.type === "deep_read"));
  ok("overlay absent -> no deep_read section, no crash");

  const emptyOverlayReport = { meta: { business_saju_deep: { section_2_nature: {}, section_5_action: {} } } };
  const vmEmpty = buildWorkReportViewModel(emptyOverlayReport, paramsEn);
  assert.equal(findDeepRead(vmEmpty.sections), null);
  ok("malformed/empty overlay fails closed (no section, no throw)");
}

// ---------------------------------------------------------------------------
console.log("\n=== Friendship (friend_saju_deep) ===");
{
  const richReport = {
    meta: {
      friend_saju_deep: richOverlayFor(
        "a_nature",
        "b_nature",
        "section_4_friend_frames",
        "friendship_gap_signal",
        "advice_for_a",
        "advice_for_b",
      ),
    },
  };
  const params = { viewerIsReportA: true, myName: "Alex", partnerName: "Jordan", locale: "en-US" };
  const vm = buildFriendReportViewModel(richReport, params);
  const deepRead = findDeepRead(vm.sections);
  assert.ok(deepRead);
  assert.match(deepRead.title, /Deep Read/);
  ok("en-US: friendship deep_read renders with content");

  const vmAbsent = buildFriendReportViewModel({ meta: {} }, params);
  assert.equal(findDeepRead(vmAbsent.sections), null);
  ok("overlay absent -> no section");
}

// ---------------------------------------------------------------------------
console.log("\n=== Life Partner / Cohabitation (married_saju_deep) ===");
{
  const richReport = {
    meta: {
      married_saju_deep: richOverlayFor(
        "a_nature",
        "b_nature",
        "section_4_household_frames",
        "role_balance_signal",
        "advice_for_a",
        "advice_for_b",
      ),
    },
  };
  const params = { viewerIsReportA: false, myName: "Alex", partnerName: "Jordan", locale: "ko-KR" };
  const vm = buildMarriageReportViewModel(richReport, params);
  const deepRead = findDeepRead(vm.sections);
  assert.ok(deepRead);
  assert.match(deepRead.title, /심층/);
  // viewerIsReportA=false -> B ("voice B"/"desc B") should be in the "me" slot.
  assert.equal(deepRead.vm.meNature.voice, "voice B");
  ok("viewer-swap applied correctly (viewerIsReportA=false -> B is 'me')");

  const vmAbsent = buildMarriageReportViewModel({ meta: {} }, params);
  assert.equal(findDeepRead(vmAbsent.sections), null);
  ok("overlay absent -> no section");
}

// ---------------------------------------------------------------------------
console.log("\n=== Family (family_saju_deep) — no viewer swap ===");
{
  const richReport = {
    meta: {
      family_saju_deep: {
        section_2_nature: {
          parent_nature: { first_person_voice: "parent voice", description: "parent desc" },
          child_nature: { first_person_voice: "child voice", description: "child desc" },
        },
        section_4_family_frames: {
          generation_gap_signal: { parent_body: "parent gap", child_body: "child gap", match_note: "note" },
        },
        section_5_action: {
          advice_for_parent: [{ action_title: "Parent tip" }],
          advice_for_child: [{ action_title: "Child tip" }],
          together: "family together",
        },
      },
    },
  };
  const vm = buildFamilyReportViewModel(richReport, { locale: "en-US" });
  const deepRead = findDeepRead(vm.sections);
  assert.ok(deepRead);
  assert.equal(deepRead.vm.meNature.voice, "parent voice");
  assert.equal(deepRead.vm.partnerNature.voice, "child voice");
  assert.equal(deepRead.vm.adviceForMe[0].actionTitle, "Parent tip");
  assert.equal(deepRead.vm.adviceForPartner[0].actionTitle, "Child tip");
  ok("parent always first slot, child always second (fixed order, no toggle)");

  // Legacy a_nature/b_nature fallback when parent_nature/child_nature are absent.
  const legacyReport = {
    meta: {
      family_saju_deep: {
        section_2_nature: {
          a_nature: { description: "legacy parent desc" },
          b_nature: { description: "legacy child desc" },
        },
        section_5_action: {
          advice_for_a: [{ action_title: "legacy parent tip" }],
          advice_for_b: [{ action_title: "legacy child tip" }],
        },
      },
    },
  };
  const vmLegacy = buildFamilyReportViewModel(legacyReport, { locale: "en-US" });
  const deepReadLegacy = findDeepRead(vmLegacy.sections);
  assert.ok(deepReadLegacy);
  assert.equal(deepReadLegacy.vm.meNature.description, "legacy parent desc");
  assert.equal(deepReadLegacy.vm.partnerNature.description, "legacy child desc");
  ok("legacy a_nature/b_nature (no parent_nature/child_nature) still works");

  const vmAbsent = buildFamilyReportViewModel({ meta: {} }, { locale: "en-US" });
  assert.equal(findDeepRead(vmAbsent.sections), null);
  ok("overlay absent -> no section");
}

console.log("\nAll deep-read-section-wiring tests passed.");
