/**
 * Package contract — Batch IV structured evidence (no finished prose in primary).
 * Run: npx tsx tests/scripts/work-narrative-pilot/package-contract.test.mjs
 */
import assert from "node:assert/strict";
import { buildWorkColleagueReport } from "../../../lib/relationship/workColleague/buildWorkColleagueReport.ts";
import { buildWorkPilotContextPackage } from "./buildContextPackage.ts";
import { PILOT_FIXTURES, sajuFromBirth } from "./fixtures.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

function pkgFor(pairId) {
  const fx = PILOT_FIXTURES.find((f) => f.pair_id === pairId);
  assert.ok(fx, pairId);
  const report = buildWorkColleagueReport({
    nicknameA: fx.nicknameA,
    nicknameB: fx.nicknameB,
    sajuJsonA: sajuFromBirth(fx.birthA, fx.timeA),
    sajuJsonB: sajuFromBirth(fx.birthB, fx.timeB),
    psychMasterA: fx.psychA,
    psychMasterB: fx.psychB,
    workSignalsA: fx.workSignalsA,
    workSignalsB: fx.workSignalsB,
    locale: fx.locale,
  });
  return buildWorkPilotContextPackage({
    pair_id: fx.pair_id,
    category: fx.category,
    nicknameA: fx.nicknameA,
    nicknameB: fx.nicknameB,
    sajuJsonA: sajuFromBirth(fx.birthA, fx.timeA),
    sajuJsonB: sajuFromBirth(fx.birthB, fx.timeB),
    psychMasterA: fx.psychA,
    psychMasterB: fx.psychB,
    workSignalsA: fx.workSignalsA,
    workSignalsB: fx.workSignalsB,
    locale: fx.locale,
    report,
    variant: "C",
  });
}

const similar = pkgFor("similar-01");
assert.equal(similar.schema_version, "work_narrative_pilot_context_v2");
assert.equal(
  similar.evidence_sources.communication_signals.contrast_supported,
  false,
  "similar reporting styles must not claim contrast",
);
assert.ok(!("deterministic_excerpts" in similar.evidence_sources));
assert.equal(similar.reference_copy.allowed_as_narrative_source, false);
assert.ok(
  similar.reference_copy.items.some((i) => i.key === "communication_fit"),
);
assert.equal(
  similar.evidence_sources.communication_signals.stock_fast_vs_detail_allowed,
  false,
);
assert.equal(similar.narrative_routing.identity.nickname_a, "Kim");
assert.equal(
  similar.narrative_routing.leadership_split?.provisional,
  true,
  "similar leadership should be provisional",
);
assert.ok(
  similar.psych_context.pair_patterns.every(
    (p) =>
      !p.supports_contrast ||
      p.pattern === "high_gap" ||
      (p.pattern === "moderate_gap" && p.gap >= 15),
  ),
  "tiny gaps must not support_contrast",
);
ok("similar: contrast_supported false; excerpts isolated in reference_copy");

const conflict = pkgFor("conflict-heavy-01");
const bothHigh = conflict.psych_context.pair_patterns.filter(
  (p) => p.pattern === "both_high" || p.pattern === "similar_high",
);
assert.ok(
  bothHigh.some((p) => p.axis_key === "recognition" || p.axis_key === "conflict_style"),
);
assert.ok(
  conflict.psych_context.pair_patterns.some(
    (p) =>
      p.axis_key === "self_control" &&
      (p.pattern === "both_low" || p.pattern === "similar_low"),
  ),
);
assert.ok(
  conflict.evidence_relationships.some((r) =>
    r.interpretation_prompt.includes("same-drive"),
  ),
);
ok("conflict-heavy: absolute patterns + same-drive relationship");

const hiDiff = pkgFor("highly-different-01");
assert.ok(
  hiDiff.psych_context.pair_patterns.some(
    (p) =>
      p.pattern === "high_gap" &&
      ["structure", "practicality", "recognition"].includes(p.axis_key),
  ),
);
ok("highly-different: high_gap on key axes");

const comp = pkgFor("complementary-01");
assert.ok(comp.binding_truth?.leadership_split);
assert.equal(
  comp.narrative_routing.leadership_split?.home_section,
  "decision_and_execution_dynamics",
);
assert.ok(
  comp.narrative_routing.leadership_split?.forbidden_sections.includes(
    "pair_snapshot",
  ),
);
assert.equal(
  comp.evidence_sources.communication_signals.stock_fast_vs_detail_allowed,
  false,
);
if (comp.evidence_sources.communication_signals.contrast_supported) {
  assert.ok(
    comp.evidence_sources.communication_signals.contrast_means?.includes(
      "NOT",
    ),
  );
}
assert.ok(
  comp.evidence_relationships.some((r) =>
    r.sources.includes("leadership_split"),
  ),
);
assert.ok(
  !comp.evidence_sources.ten_god_complement.complements.some(
    (c) => "note" in c && c.note,
  ),
);
ok("complementary: leadership relationship; ten_god without prose notes");

const dna = similar.evidence_sources.dna_signals;
assert.ok(dna.a.supporting_axes.length >= 1);
assert.ok(!("character_title" in dna.a));
ok("dna_signals exposes raw traits without titles");

console.log("\nAll package-contract checks passed.");
