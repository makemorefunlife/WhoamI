/**
 * buildWorkReportViewModel() must reshape an existing WorkColleagueReportBody
 * into WorkReportSection[] without inventing data: optional sections/fields
 * are omitted (not filled with "" placeholders) when the source is missing,
 * and viewer-first swapping (pickViewerFirstPair / swapPsychAxisForViewer)
 * must stay correct in both directions. No DB, no LLM, no saju calculation —
 * pure fixture objects shaped like WorkColleagueReportBody.
 * Run: npx tsx tests/unit/work-report-viewmodel.test.mjs
 */
import assert from "node:assert/strict";
import { buildWorkReportViewModel } from "../../lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts";
import {
  fullWorkColleagueReportFixture as fullReport,
  minimalWorkColleagueReportFixture as minimalReport,
} from "../../lib/relationship/workColleague/viewModel/workColleagueReportFixtures.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function byType(vm, type) {
  return vm.sections.find((s) => s.type === type);
}

section("Full payload — viewerIsReportA=true, all 7 section types present");
const vmFull = buildWorkReportViewModel(fullReport, {
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});

assert.equal(vmFull.opening.headline, "황금 조합");
assert.equal(vmFull.opening.grade, "A");
assert.deepEqual(vmFull.opening.names, ["Alex", "Jordan"]);
ok("opening block resolved from headline/meta.grade");

assert.equal(vmFull.sections.length, 7);
const types = vmFull.sections.map((s) => s.type).sort();
assert.deepEqual(types, [
  "comparison",
  "prescription",
  "psych_radar",
  "relationship_loop",
  "role_matrix",
  "snapshot",
  "warning",
]);
ok("all 7 section types present for a fully-populated report");

const snap = byType(vmFull, "snapshot");
assert.deepEqual(snap.scores, { fitPct: 80, synergyPct: 75, riskPct: 20 });
assert.equal(snap.panel, fullReport.snapshot_panel, "panel passed through unchanged (same reference, no copy/reshape)");
assert.equal(snap.panel.narrative.topics.length, 3);
ok("snapshot section carries scores + the raw snapshot_panel object unchanged");

const psychA = byType(vmFull, "psych_radar");
assert.equal(psychA.axisResults[0].score_a, 70);
assert.equal(psychA.axisResults[0].score_b, 40);
ok("psych_radar not swapped when viewer is report A");

const cmpA = byType(vmFull, "comparison");
assert.equal(cmpA.dna.me.nickname, "Alex");
assert.equal(cmpA.dna.partner.nickname, "Jordan");
assert.equal(cmpA.boundary.me, "Alex 경계");
ok("comparison viewer-first pair correct for report A");

const roleA = byType(vmFull, "role_matrix");
assert.equal(roleA.idealFit.me.nickname, "Alex");
assert.equal(roleA.togetherCombo, "사업본부 × 기획팀 조합이 잘 맞아요.");
ok("role_matrix includes idealFit/togetherCombo when source present");

const loop = byType(vmFull, "relationship_loop");
assert.equal(loop.positiveLoop.length, 2, "2 non-warning topics (intimacy, stability)");
assert.equal(loop.frictionLoop.length, 2, "1 warning topic (conflict) + 1 conflict_trigger row");
assert.equal(loop.frictionLoop[1].title, "갈등 트리거");
ok("relationship_loop derived from existing topics + conflict_trigger, no new computation");

const warnA = byType(vmFull, "warning");
assert.equal(warnA.upset.me.nickname, "Alex");
assert.equal(warnA.upset.partner.nickname, "Jordan");
ok("warning section includes upset pair when section_upset present");

const presc = byType(vmFull, "prescription");
assert.equal(presc.items.length, 2);
assert.equal(presc.weeklyCheckIn.topic, "office_baseline");
ok("prescription section extracts weeklyCheckIn from office_baseline item");

section("Full payload — viewerIsReportA=false, viewer-first swap must flip");
const vmSwapped = buildWorkReportViewModel(fullReport, {
  viewerIsReportA: false,
  myName: "Jordan",
  partnerName: "Alex",
});

const cmpB = byType(vmSwapped, "comparison");
assert.equal(cmpB.dna.me.nickname, "Jordan");
assert.equal(cmpB.dna.partner.nickname, "Alex");
ok("comparison viewer-first pair swaps when viewer is report B");

const psychB = byType(vmSwapped, "psych_radar");
assert.equal(psychB.axisResults[0].score_a, 40, "score_a/b flip via swapPsychAxisForViewer");
assert.equal(psychB.axisResults[0].score_b, 70);
ok("psych_radar axis scores swap for report-B viewer");

const warnB = byType(vmSwapped, "warning");
assert.equal(warnB.upset.me.nickname, "Jordan");
ok("warning upset pair swaps for report-B viewer");

section("Minimal / legacy payload — missing optional sources are omitted, never fabricated");
const vmMinimal = buildWorkReportViewModel(minimalReport, {
  viewerIsReportA: true,
  myName: "Alex",
  partnerName: "Jordan",
});

const minimalTypes = vmMinimal.sections.map((s) => s.type).sort();
assert.deepEqual(minimalTypes, ["comparison", "relationship_loop", "role_matrix", "warning"]);
ok("snapshot/psych_radar/prescription omitted when their sources are empty/absent");

const cmpMin = byType(vmMinimal, "comparison");
assert.equal(cmpMin.boundary, undefined, "no section_respect -> boundary omitted, not \"\"");
ok("comparison.boundary omitted rather than filled with empty string");

const roleMin = byType(vmMinimal, "role_matrix");
assert.equal(roleMin.idealFit, undefined);
assert.equal(roleMin.togetherCombo, undefined);
ok("role_matrix.idealFit/togetherCombo omitted rather than fabricated");

const warnMin = byType(vmMinimal, "warning");
assert.equal(warnMin.upset, undefined, "no section_upset -> upset omitted");
ok("warning.upset omitted rather than fabricated");

const loopMin = byType(vmMinimal, "relationship_loop");
assert.equal(loopMin.positiveLoop.length, 0);
assert.equal(loopMin.frictionLoop.length, 1);
assert.equal(loopMin.frictionLoop[0].title, "갈등 트리거");
ok("relationship_loop still derives from conflict_trigger alone when topics are empty");

console.log("\nOK: work report viewmodel adapter tests passed");
