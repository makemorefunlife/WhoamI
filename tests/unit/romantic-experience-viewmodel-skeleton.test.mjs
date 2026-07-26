/**
 * Romantic Experience VM skeleton / B2 regression (formerly B1-only).
 * Run: npx tsx tests/unit/romantic-experience-viewmodel-skeleton.test.mjs
 */
import assert from "node:assert/strict";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel.ts";
import {
  ROMANTIC_MODULE_ORDER,
  summarizeRomanticModuleSlots,
} from "../../lib/relationship/romantic/experience/romanticExperienceTypes.ts";
import {
  makeMinimalRomanticReport,
  makePartialRomanticReport,
} from "../fixtures/romantic/minimal-report.mjs";

function ok(name) {
  console.log(`ok - ${name}`);
}

function build(report, extra = {}) {
  return buildRomanticExperienceViewModel({
    report,
    viewerIsReportA: true,
    myName: "Mina",
    partnerName: "Jun",
    nameA: "A-Name",
    nameB: "B-Name",
    locale: "ko-KR",
    ...extra,
  });
}

console.log("\n=== 1) deterministic mapping ===");
const report = makeMinimalRomanticReport();
const vm1 = build(report);
const vm2 = build(report);
assert.equal(vm1.meta.buildId, "b2-content-projectors");
assert.equal(vm1.meta.accentToken, "#E2C4A8");
assert.equal(vm1.meta.myName, "Mina");
assert.deepEqual(
  summarizeRomanticModuleSlots(vm1),
  summarizeRomanticModuleSlots(vm2),
);
assert.deepEqual(
  summarizeRomanticModuleSlots(vm1).map((s) => s.id),
  [...ROMANTIC_MODULE_ORDER],
);
ok("deterministic meta + module order");

console.log("\n=== 2) deepRead null; deferred modules unavailable ===");
assert.equal(vm1.deepRead, null);
assert.equal(vm1.saveShare, null);
assert.equal(vm1.doDont.pack, null);
assert.equal(vm1.differenceMap.available, false);
assert.equal(vm1.flow.available, false);
assert.equal(vm1.repair.available, false);
assert.equal(vm1.nextStep.available, false);
ok("deepRead null; M4/M5/M7/M8/M9-class slots empty on minimal");

console.log("\n=== 3) missing optional / empty names fallback ===");
const vmNames = build(report, {
  myName: "  ",
  partnerName: "",
  nameA: " ",
  nameB: null,
  locale: "  ",
});
assert.equal(vmNames.meta.myName, "A");
assert.equal(vmNames.meta.partnerName, "B");
assert.equal(vmNames.meta.nameA, "A");
assert.equal(vmNames.meta.nameB, "B");
assert.equal(vmNames.meta.locale, "ko-KR");
ok("empty names/locale fall back safely");

console.log("\n=== 4) partial report does not throw ===");
const vmPartial = build(makePartialRomanticReport());
assert.equal(vmPartial.meta.buildId, "b2-content-projectors");
assert.equal(
  summarizeRomanticModuleSlots(vmPartial).every((s) => !s.available),
  true,
);
ok("partial report → all unavailable");

console.log("\n=== 5) no grade / ScoreBoard / formula ownership on VM ===");
const json = JSON.stringify(vm1);
assert.equal(Object.hasOwn(vm1, "grade"), false);
assert.equal(Object.hasOwn(vm1.meta, "grade"), false);
assert.equal(Object.hasOwn(vm1, "scores"), false);
assert.equal(Object.hasOwn(vm1, "event_scores"), false);
assert.equal(Object.hasOwn(vm1.opening, "grade"), false);
assert.equal(Object.hasOwn(vm1.whySpecial, "relationship_formula"), false);
assert.equal(json.includes("A+"), false);
assert.equal(json.includes("destiny"), false);
assert.equal(json.includes("should-not-appear-on-vm"), false);
assert.equal(json.includes("ScoreBoard"), false);
assert.equal(json.includes("section_1"), false);
ok("grade/formula/sections absent from VM JSON");

console.log("\n=== 6) source report is not mutated ===");
const mutable = makeMinimalRomanticReport();
const gradeBefore = mutable.section_1_summary.grade;
Object.freeze(mutable.section_1_summary);
build(mutable);
assert.equal(mutable.section_1_summary.grade, gradeBefore);
assert.throws(() => {
  mutable.section_1_summary.grade = "Z";
}, TypeError);
ok("builder does not mutate source report");

console.log("\n=== 7) viewer flag preserved ===");
const vmB = build(report, { viewerIsReportA: false });
assert.equal(vmB.meta.viewerIsReportA, false);
ok("viewerIsReportA mapped");

console.log("\nAll romantic-experience-viewmodel-skeleton tests passed.");
