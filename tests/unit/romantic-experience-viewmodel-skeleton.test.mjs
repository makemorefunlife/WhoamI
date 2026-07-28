/**
 * Romantic Experience V2 shell regression.
 * Run: npx tsx tests/unit/romantic-experience-viewmodel-skeleton.test.mjs
 */
import assert from "node:assert/strict";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel.ts";
import {
  ROMANTIC_MODULE_ORDER,
  summarizeRomanticModuleSlots,
} from "../../lib/relationship/romantic/experience/romanticExperienceTypes.ts";
import {
  makeCompleteRomanticReport,
  makeMinimalRomanticReport,
  makePartialRomanticReport,
} from "../fixtures/romantic/minimal-report.mjs";

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

console.log("\n=== 1) module order locked to M1-M10 (no Daily Life) ===");
assert.deepEqual([...ROMANTIC_MODULE_ORDER], [
  "M1",
  "M2",
  "M3",
  "M4",
  "M5",
  "M6",
  "M7",
  "M8",
  "M9",
  "M10",
]);
const vmOrder = summarizeRomanticModuleSlots(build(makeMinimalRomanticReport()));
assert.deepEqual(
  vmOrder.map((s) => s.id),
  ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10"],
);

console.log("\n=== 2) build metadata + deterministic mapping ===");
const complete = makeCompleteRomanticReport();
const vm1 = build(complete);
const vm2 = build(complete);
assert.equal(vm1.meta.buildId, "b7-v2-production");
assert.equal(vm1.meta.accentToken, "#E2C4A8");
assert.deepEqual(vm1, vm2);

console.log("\n=== 3) M1-M10 surface fields exist ===");
assert.equal(vm1.opening.available, true);
assert.equal(vm1.snapshot.available, true);
assert.equal(vm1.differenceMap.available, true);
assert.equal(vm1.flow.available, true);
assert.equal(vm1.hiddenHeart.available, true);
assert.equal(vm1.specialDynamics.available, true);
assert.equal(vm1.conflictTranslation.available, true);
assert.equal(vm1.repairGuide.available, true);
assert.equal(vm1.doDont.available, true);
assert.equal(vm1.nextStep.available, true);
assert.equal(Object.hasOwn(vm1, "dailyLife"), false);
assert.equal(Object.hasOwn(vm1, "conflict"), false);
assert.equal(Object.hasOwn(vm1, "repair"), false);
assert.equal(vm1.horizon.available, true);
assert.equal(vm1.reflection.available, true);
assert.equal(vm1.saveShare.available, true);
assert.equal(vm1.deepRead, null);

console.log("\n=== 4) fallback behavior remains safe ===");
const vmPartial = build(makePartialRomanticReport());
assert.equal(vmPartial.opening.available, false);
assert.equal(vmPartial.snapshot.available, false);
assert.equal(vmPartial.differenceMap.available, false);
assert.equal(vmPartial.flow.available, false);
assert.equal(vmPartial.hiddenHeart.available, false);
assert.equal(vmPartial.specialDynamics.available, false);
assert.equal(vmPartial.conflictTranslation.available, false);
assert.equal(vmPartial.repairGuide.available, false);
assert.equal(vmPartial.doDont.available, false);
assert.equal(vmPartial.nextStep.available, false);
assert.equal(vmPartial.horizon.available, false);
assert.equal(vmPartial.reflection.available, false);
assert.equal(vmPartial.saveShare.available, false);

console.log("\n=== 5) source report not mutated ===");
const mutable = makeCompleteRomanticReport();
const before = JSON.stringify(mutable);
build(mutable);
assert.equal(JSON.stringify(mutable), before);

console.log("\nAll romantic-experience-viewmodel-skeleton tests passed.");
