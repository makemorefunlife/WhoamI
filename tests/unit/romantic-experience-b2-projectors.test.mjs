/**
 * Romantic Experience M1-M10 projector regression.
 * Run: npx tsx tests/unit/romantic-experience-b2-projectors.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel.ts";
import {
  makeCompleteRomanticReport,
  makeMinimalRomanticReport,
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

const __dir = dirname(fileURLToPath(import.meta.url));
const experienceUiPath = join(
  __dir,
  "../../components/relationship/romantic/experience/RomanticExperienceView.tsx",
);
const experienceModulesPath = join(
  __dir,
  "../../components/relationship/romantic/experience/RomanticExperienceModules.tsx",
);

console.log("\n=== 1) complete projection includes M1..M10 ===");
const complete = makeCompleteRomanticReport();
const vm = build(complete);
assert.equal(vm.opening.available, true);
assert.equal(vm.snapshot.available, true);
assert.equal(vm.differenceMap.available, true);
assert.equal(vm.flow.available, true);
assert.equal(vm.hiddenHeart.available, true);
assert.equal(vm.specialDynamics.available, true);
assert.equal(vm.conflictTranslation.available, true);
assert.equal(vm.repairGuide.available, true);
assert.equal(vm.doDont.available, true);
assert.equal(vm.nextStep.available, true);

console.log("\n=== 2) snapshot uses deterministic canonical projections ===");
assert.ok(vm.snapshot.signals.length >= 2);
const paths = vm.snapshot.signals.map((s) => s.sourcePath);
assert.ok(paths.some((p) => p.includes("balance_of_power")));
assert.ok(paths.some((p) => p.includes("recovery_speed")));
assert.ok(paths.some((p) => p.includes("reassurance_signal")));

console.log("\n=== 3) minimal fixture fallback remains safe ===");
const minimal = build(makeMinimalRomanticReport());
assert.equal(minimal.opening.available, true);
assert.equal(minimal.snapshot.available, false);
assert.equal(minimal.differenceMap.available, false);
assert.equal(minimal.flow.available, false);
assert.equal(minimal.hiddenHeart.available, false);
assert.equal(minimal.conflictTranslation.available, false);
assert.equal(minimal.repairGuide.available, false);
assert.equal(minimal.doDont.available, false);
assert.equal(minimal.nextStep.available, false);

console.log("\n=== 3.1) conflict translation uses safe reduced rows ===");
assert.ok(vm.conflictTranslation.rows.length > 0);
assert.ok(vm.conflictTranslation.rows.every((r) => r.meant === null && r.heard === null));

console.log("\n=== 4) VM excludes legacy score/formula fields ===");
const json = JSON.stringify(vm);
assert.equal(Object.hasOwn(vm, "grade"), false);
assert.equal(Object.hasOwn(vm, "scores"), false);
assert.equal(Object.hasOwn(vm, "event_scores"), false);
assert.equal(json.includes("relationship_formula"), false);
assert.equal(json.includes("ScoreBoard"), false);

console.log("\n=== 5) UI still keeps VM boundary only ===");
const uiSrc = readFileSync(experienceUiPath, "utf8");
const modulesSrc = readFileSync(experienceModulesPath, "utf8");
const uiCode = uiSrc
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");
const modulesCode = modulesSrc
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");
assert.equal(uiCode.includes("section_"), false);
assert.equal(modulesCode.includes("section_"), false);
assert.equal(uiCode.includes("ScoreBoard"), false);
assert.match(uiSrc, /buildRomanticExperienceViewModel/);

console.log("\nAll romantic-experience-b2-projectors tests passed.");

