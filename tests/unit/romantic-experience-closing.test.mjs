/**
 * Romantic Experience closing modules (Horizon / Reflection / SaveShare).
 * Run: npx tsx tests/unit/romantic-experience-closing.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel.ts";
import { projectHorizon } from "../../lib/relationship/romantic/experience/projectors/projectHorizon.ts";
import { projectReflection } from "../../lib/relationship/romantic/experience/projectors/projectReflection.ts";
import {
  makeCompleteRomanticReport,
  makeMinimalRomanticReport,
} from "../fixtures/romantic/minimal-report.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const uiPath = join(
  __dir,
  "../../components/relationship/romantic/experience/RomanticExperienceView.tsx",
);

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

console.log("\n=== 1) horizon projector uses section_6 only ===");
const complete = makeCompleteRomanticReport();
const horizon = projectHorizon({ report: complete });
assert.equal(horizon.available, true);
assert.ok(horizon.waypoints.length >= 2);
assert.equal(horizon.id, "M11");
assert.equal(projectHorizon({ report: makeMinimalRomanticReport() }).available, false);

console.log("\n=== 2) reflection is sourced from Repair Guide's interrupt, not Opening/Do-Don't ===");
const vm = build(complete);
assert.equal(vm.reflection.available, true);
assert.ok(vm.reflection.realization);
assert.equal(vm.reflection.realization, vm.repairGuide.interrupt?.label);
assert.notEqual(vm.reflection.realization, vm.opening.signature);
assert.notEqual(vm.reflection.realization, vm.opening.paradox);
assert.ok(vm.reflection.prompt?.includes("Jun"));
assert.equal(Object.hasOwn(vm.reflection, "carryForward"), false);

const directReflection = projectReflection({
  repairGuide: vm.repairGuide,
  partnerName: "Jun",
});
assert.deepEqual(directReflection, vm.reflection);

console.log("\n=== 3) save/share has no grade/score, and no duplicate insight text ===");
assert.equal(vm.saveShare.available, true);
assert.ok(vm.saveShare.signatureLine?.includes("Mina"));
assert.ok(vm.saveShare.signatureLine?.includes("Jun"));
assert.deepEqual(vm.saveShare.insightLines, []);
const saveJson = JSON.stringify(vm.saveShare);
assert.equal(saveJson.includes("grade"), false);
assert.equal(saveJson.includes("total_score"), false);

console.log("\n=== 4) UI renders closing sections ===");
const uiSrc = readFileSync(uiPath, "utf8");
assert.match(uiSrc, /RomanticHorizonSection/);
assert.match(uiSrc, /RomanticReflectionSection/);
assert.match(uiSrc, /RomanticSaveShareSection/);
assert.doesNotMatch(uiSrc, /Feature-flag shell/);
assert.doesNotMatch(uiSrc, /Ready modules:/);

console.log("\nAll romantic-experience-closing tests passed.");
