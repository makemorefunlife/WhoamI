/**
 * Smoke: context package v2 + deterministic baseline without LLM.
 * Run: npx tsx tests/scripts/work-narrative-pilot/smoke.test.mjs
 */
import assert from "node:assert/strict";
import { buildWorkColleagueReport } from "../../../lib/relationship/workColleague/buildWorkColleagueReport.ts";
import { buildWorkPilotContextPackage } from "./buildContextPackage.ts";
import { extractDeterministicBaseline } from "./extractDeterministicBaseline.ts";
import { PILOT_FIXTURES, sajuFromBirth } from "./fixtures.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

const fx = PILOT_FIXTURES.find((f) => f.pair_id === "complementary-01");
assert.ok(fx);

const sajuA = sajuFromBirth(fx.birthA, fx.timeA);
const sajuB = sajuFromBirth(fx.birthB, fx.timeB);
const report = buildWorkColleagueReport({
  nicknameA: fx.nicknameA,
  nicknameB: fx.nicknameB,
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  psychMasterA: fx.psychA,
  psychMasterB: fx.psychB,
  workSignalsA: fx.workSignalsA,
  workSignalsB: fx.workSignalsB,
  locale: fx.locale,
});

assert.ok(report.canonical_projections?.comparison_table);
assert.ok(report.canonical_projections?.leadership_split);
assert.equal(report.meta.psych_match?.axis_results?.length, 11);
ok("report has CE projections + 11 psych axes");

const baseline = extractDeterministicBaseline({
  pair_id: fx.pair_id,
  category: fx.category,
  nicknameA: fx.nicknameA,
  nicknameB: fx.nicknameB,
  locale: fx.locale,
  report,
});
assert.equal(baseline.pair_id, "complementary-01");
ok("variant A baseline extractable");

const pkgB = buildWorkPilotContextPackage({
  pair_id: fx.pair_id,
  category: fx.category,
  nicknameA: fx.nicknameA,
  nicknameB: fx.nicknameB,
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  psychMasterA: fx.psychA,
  psychMasterB: fx.psychB,
  workSignalsA: fx.workSignalsA,
  workSignalsB: fx.workSignalsB,
  locale: fx.locale,
  report,
  variant: "B",
});
assert.equal(pkgB.binding_truth, null);
assert.equal(pkgB.schema_version, "work_narrative_pilot_context_v2");
assert.equal(pkgB.psych_context.axes.length, 11);
assert.ok(pkgB.reference_copy.items.length > 0);
ok("Variant B: no binding_truth; v2 package + reference_copy");

const pkgC = buildWorkPilotContextPackage({
  pair_id: fx.pair_id,
  category: fx.category,
  nicknameA: fx.nicknameA,
  nicknameB: fx.nicknameB,
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
  psychMasterA: fx.psychA,
  psychMasterB: fx.psychB,
  workSignalsA: fx.workSignalsA,
  workSignalsB: fx.workSignalsB,
  locale: fx.locale,
  report,
  variant: "C",
});
assert.ok(pkgC.binding_truth);
assert.ok(pkgC.psych_context.pair_patterns.length >= 1);
assert.ok(pkgC.evidence_relationships.length >= 1);
assert.equal(pkgC.reference_copy.allowed_as_narrative_source, false);
assert.equal(
  pkgC.evidence_sources.communication_signals.stock_fast_vs_detail_allowed,
  false,
);
assert.ok(pkgC.narrative_routing?.identity?.use_exact_nicknames);
ok("Variant C: binding + pair_patterns + relationships");

assert.equal(PILOT_FIXTURES.length, 4);
ok("four category fixtures present");

console.log("\nAll smoke checks passed.");
