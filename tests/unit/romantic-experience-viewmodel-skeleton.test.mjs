/**
 * Romantic Experience VM skeleton (Batch B1).
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

console.log("\n=== 1) deterministic skeleton mapping ===");
const report = makeMinimalRomanticReport();
const vm1 = build(report);
const vm2 = build(report);
assert.equal(vm1.meta.buildId, "b1-skeleton");
assert.equal(vm1.meta.accentToken, "#E2C4A8");
assert.equal(vm1.meta.myName, "Mina");
assert.equal(vm1.meta.partnerName, "Jun");
assert.deepEqual(
  summarizeRomanticModuleSlots(vm1),
  summarizeRomanticModuleSlots(vm2),
);
assert.deepEqual(
  summarizeRomanticModuleSlots(vm1).map((s) => s.id),
  [...ROMANTIC_MODULE_ORDER],
);
ok("deterministic meta + module order");

console.log("\n=== 2) all modules unavailable (B1 placeholders) ===");
for (const slot of summarizeRomanticModuleSlots(vm1)) {
  assert.equal(slot.available, false, slot.id);
}
assert.equal(vm1.deepRead, null);
assert.equal(vm1.saveShare, null);
assert.equal(vm1.doDont.pack, null);
assert.equal(vm1.repair.stages.length, 0);
assert.equal(Object.is(vm1.deepRead, null), true);
ok("omit-empty: every module available=false; deepRead always null in B1");

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
assert.equal(vmPartial.meta.buildId, "b1-skeleton");
assert.equal(
  summarizeRomanticModuleSlots(vmPartial).every((s) => !s.available),
  true,
);
ok("partial report → skeleton");

console.log("\n=== 5) no grade / ScoreBoard / formula ownership on VM ===");
const json = JSON.stringify(vm1);
assert.equal(Object.hasOwn(vm1, "grade"), false);
assert.equal(Object.hasOwn(vm1.meta, "grade"), false);
assert.equal(Object.hasOwn(vm1, "scores"), false);
assert.equal(Object.hasOwn(vm1, "event_scores"), false);
assert.equal(Object.hasOwn(vm1.opening, "grade"), false);
assert.equal(Object.hasOwn(vm1.whySpecial, "relationship_formula"), false);
assert.equal(Object.hasOwn(vm1.whySpecial, "formula"), false);
assert.equal(json.includes("A+"), false);
assert.equal(json.includes("destiny"), false);
assert.equal(json.includes("should-not-appear-on-vm"), false);
assert.equal(json.includes("ScoreBoard"), false);
assert.equal(json.includes("section_1"), false);
assert.equal(json.includes("section_5"), false);
ok("grade/formula/sections absent from VM JSON");

console.log("\n=== 6) source report is not mutated ===");
const mutable = makeMinimalRomanticReport();
const gradeBefore = mutable.section_1_summary.grade;
const formulaBefore = mutable.section_4_special_bond.relationship_formula;
Object.freeze(mutable.section_1_summary);
build(mutable);
assert.equal(mutable.section_1_summary.grade, gradeBefore);
assert.equal(
  mutable.section_4_special_bond.relationship_formula,
  formulaBefore,
);
mutable.section_1_summary; // still frozen
assert.throws(() => {
  mutable.section_1_summary.grade = "Z";
}, TypeError);
ok("builder does not mutate source report");

console.log("\n=== 7) viewer flag preserved ===");
const vmB = build(report, { viewerIsReportA: false });
assert.equal(vmB.meta.viewerIsReportA, false);
ok("viewerIsReportA mapped");

console.log("\nAll romantic-experience-viewmodel-skeleton tests passed.");
