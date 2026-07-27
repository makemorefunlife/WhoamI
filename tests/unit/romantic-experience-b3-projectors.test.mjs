/**
 * Romantic Experience V2 shell regression (legacy coexistence guard).
 * Run: npx tsx tests/unit/romantic-experience-b3-projectors.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel.ts";
import {
  isRomanticExperienceLegacyForced,
  shouldRenderRomanticExperienceV2,
} from "../../lib/relationship/romantic/experience/romanticExperienceFlag.ts";
import {
  makeCompleteRomanticReport,
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

const __dir = dirname(fileURLToPath(import.meta.url));
const premiumSectionPath = join(
  __dir,
  "../../components/relationship/detail/RelationshipPremiumSection.tsx",
);

console.log("\n=== 1) legacy remains default; flag behavior unchanged ===");
assert.equal(shouldRenderRomanticExperienceV2("romantic", {}), false);
assert.equal(
  shouldRenderRomanticExperienceV2("romantic", { ROMANTIC_EXPERIENCE_V2: "1" }),
  true,
);
assert.equal(isRomanticExperienceLegacyForced({}), false);
assert.equal(
  isRomanticExperienceLegacyForced({ ROMANTIC_EXPERIENCE_LEGACY: "1" }),
  true,
);

console.log("\n=== 2) V2 VM exposes M1-M10 (no Daily Life) ===");
const vm = build(makeCompleteRomanticReport());
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
assert.equal(Object.hasOwn(vm, "nextStep"), true);
assert.equal(Object.hasOwn(vm, "horizon"), false);
assert.equal(Object.hasOwn(vm, "dailyLife"), false);

console.log("\n=== 3) M7 Daily Life is suppressed in VM contract ===");
const vmPartial = build(makePartialRomanticReport());
assert.equal(Object.hasOwn(vmPartial, "dailyLife"), false);

console.log("\n=== 4) RelationshipPremiumSection still contains legacy + V2 side-by-side paths ===");
const premiumSrc = readFileSync(premiumSectionPath, "utf8");
assert.match(premiumSrc, /RomanticExperienceView/);
assert.match(premiumSrc, /RomanticSajuDeepReportView/);
assert.match(premiumSrc, /shouldRenderRomanticExperienceV2/);

console.log("\nAll romantic-experience-b3-projectors tests passed.");
