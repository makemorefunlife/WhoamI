/**
 * Romantic Experience B2 content projectors.
 * Run: npx tsx tests/unit/romantic-experience-b2-projectors.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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

const __dir = dirname(fileURLToPath(import.meta.url));
const experienceUiPath = join(
  __dir,
  "../../components/relationship/romantic/experience/RomanticExperienceView.tsx",
);

console.log("\n=== 1) complete report projection ===");
const complete = makeCompleteRomanticReport();
const vm = build(complete);
assert.equal(vm.meta.buildId, "b2-content-projectors");
assert.equal(vm.opening.available, true);
assert.ok(vm.opening.signature);
assert.equal(Object.hasOwn(vm.opening, "grade"), false);
assert.equal(vm.hiddenHeart.available, true);
assert.ok(vm.hiddenHeart.me?.need);
assert.equal(vm.whySpecial.available, true);
assert.ok(vm.whySpecial.gifts.length >= 1);
assert.equal(vm.whySpecial.relationship_formula, undefined);
assert.equal(vm.conflict.available, true);
assert.ok(vm.conflict.rows.length >= 1);
assert.equal(vm.conflict.rows[0].meant, null);
assert.equal(vm.horizon.available, true);
assert.ok(vm.horizon.waypoints.length >= 1);
ok("M1/M2/M3/M6/M10 available from complete fixture");

console.log("\n=== 2) deferred modules stay unavailable ===");
assert.equal(vm.differenceMap.available, false);
assert.equal(vm.flow.available, false);
assert.equal(vm.doDont.available, false);
assert.equal(vm.repair.available, false);
assert.equal(vm.nextStep.available, false);
assert.equal(vm.deepRead, null);
const byId = Object.fromEntries(
  summarizeRomanticModuleSlots(vm).map((s) => [s.id, s.available]),
);
assert.equal(byId.M4, false);
assert.equal(byId.M5, false);
assert.equal(byId.M7, false);
assert.equal(byId.M8, false);
assert.equal(byId.M9, false);
ok("M4/M5/M7/M8/M9 unavailable; deepRead null");

console.log("\n=== 3) partial / missing optional sections ===");
const partial = build(makePartialRomanticReport());
assert.equal(partial.opening.available, false);
assert.equal(partial.hiddenHeart.available, false);
assert.equal(partial.whySpecial.available, false);
assert.equal(partial.conflict.available, false);
assert.equal(partial.horizon.available, false);
ok("empty partial → all B2 modules unavailable");

const minimal = build(makeMinimalRomanticReport());
assert.equal(minimal.opening.available, true);
assert.equal(minimal.hiddenHeart.available, false);
assert.equal(minimal.conflict.available, false);
assert.equal(minimal.horizon.available, false);
// special_bond only_together "together" is too short/generic → unavailable
assert.equal(minimal.whySpecial.available, false);
ok("minimal: opening only");

console.log("\n=== 4) deterministic output ===");
assert.deepEqual(build(complete), build(complete));
assert.deepEqual(
  summarizeRomanticModuleSlots(vm).map((s) => s.id),
  [...ROMANTIC_MODULE_ORDER],
);
ok("deterministic deep equality");

console.log("\n=== 5) source immutability ===");
const mutable = makeCompleteRomanticReport();
const gradeBefore = mutable.section_1_summary.grade;
const formulaBefore = mutable.section_4_special_bond.relationship_formula;
const tableBefore = JSON.stringify(
  mutable.section_3_conversation_patterns.conflict_situation.dialogue_table,
);
Object.freeze(mutable.section_1_summary);
build(mutable);
assert.equal(mutable.section_1_summary.grade, gradeBefore);
assert.equal(
  mutable.section_4_special_bond.relationship_formula,
  formulaBefore,
);
assert.equal(
  JSON.stringify(
    mutable.section_3_conversation_patterns.conflict_situation.dialogue_table,
  ),
  tableBefore,
);
assert.throws(() => {
  mutable.section_1_summary.grade = "Z";
}, TypeError);
ok("source report not mutated");

console.log("\n=== 6) no grade / ScoreBoard / formula / event_scores on VM ===");
const json = JSON.stringify(vm);
assert.equal(Object.hasOwn(vm, "grade"), false);
assert.equal(Object.hasOwn(vm, "scores"), false);
assert.equal(Object.hasOwn(vm, "event_scores"), false);
assert.equal(json.includes("A+"), false);
assert.equal(json.includes("destiny"), false);
assert.equal(json.includes("촛불"), false);
assert.equal(json.includes("ScoreBoard"), false);
assert.equal(json.includes('"event_scores"'), false);
assert.equal(json.includes("section_1"), false);
ok("forbidden fields absent from VM JSON");

console.log("\n=== 7) UI does not access legacy section_* fields ===");
const uiSrc = readFileSync(experienceUiPath, "utf8");
const uiCode = uiSrc
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");
assert.equal(uiCode.includes("section_"), false);
assert.equal(uiCode.includes("ScoreBoard"), false);
assert.equal(uiCode.includes("event_scores"), false);
assert.equal(uiCode.includes("relationship_formula"), false);
assert.match(uiSrc, /buildRomanticExperienceViewModel/);
ok("RomanticExperienceView stays on VM boundary");

console.log("\n=== 8) formula dropped; gifts kept ===");
assert.ok(vm.whySpecial.gifts.some((g) => g.body?.includes("계획을 구체화")));
assert.equal(
  JSON.stringify(vm.whySpecial).includes("운명적 방정식"),
  false,
);
ok("what's special keeps gifts, drops formula");

console.log("\n=== 9) fortune note alone does not create horizon ===");
const fortuneOnly = build(
  makeCompleteRomanticReport({
    section_6_timeline: {},
    meta: { romantic_fortune_flow: { note: "상생으로 서로를 살리는 흐름" } },
  }),
);
assert.equal(fortuneOnly.horizon.available, false);
assert.equal(fortuneOnly.horizon.waypoints.length, 0);
ok("fortune prose is not a waypoint");

console.log("\nAll romantic-experience-b2-projectors tests passed.");

