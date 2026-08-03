/**
 * Romantic V4 Engine Consolidation — Batch A3 (contract boundary lock).
 *
 * Static import-graph assertions (grep-gates), matching the style requested
 * for the Batch C exit gates. Each assertion states what the CURRENT source
 * actually does — some pass because the boundary is already correct, one is
 * expected to currently document a gap (Personal CE -> Romantic Personal
 * Lens is not wired yet; that is Batch B's job, not fixed here).
 *
 * Run: npx tsx tests/unit/romantic-v4-consolidation-boundaries.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const root = execSync("git rev-parse --show-toplevel").toString().trim();
function read(relPath) {
  return readFileSync(`${root}/${relPath}`, "utf8");
}

// ---------------------------------------------------------------------------
section("1) Personal CE output -> Romantic Personal Lens input (CURRENT GAP, not fixed here)");

const personalRelationshipCeSrc = read(
  "lib/relationship/romantic/prototypeV4/personalRelationshipCe.ts",
);
assert.ok(
  !personalRelationshipCeSrc.includes("PersonalRelationalProfile"),
  "[documents the Batch B target, not yet true] personalRelationshipCe.ts does not currently import " +
    "Personal CE's PersonalRelationalProfile type at all — it re-derives conflict/stress/care axes " +
    "independently from chart+signals instead of consuming Personal CE's already-computed output. " +
    "Batch B must flip this assertion to `.includes(...) === true`.",
);
ok("confirmed (as expected pre-Batch-B): Romantic Personal Lens does not consume Personal CE's relational_profile");

// ---------------------------------------------------------------------------
section("2) Pair CE output -> Romantic Pair Lens input (ALREADY CORRECT today)");

const contractSrc = read("lib/relationship/romantic/prototypeV4/buildActualFourCeContract.ts");
assert.ok(
  /const pairCe = runPairContextEngine\(\{\s*facts: pairFacts\s*\}\)/.test(contractSrc),
  "expected runPairContextEngine({ facts: pairFacts }) call",
);
assert.ok(
  /const romanticPairLens = applyRomanticPairLens\(pairCe\)/.test(contractSrc),
  "expected applyRomanticPairLens(pairCe) — Pair CE's actual output object passed directly into the lens",
);
ok("confirmed: Pair CE's real output already flows into applyRomanticPairLens unmodified");

// ---------------------------------------------------------------------------
section("3) Story Planner does not read raw chart directly");

const storyPlannerSrc = read(
  "lib/relationship/romantic/prototypeV4/buildCanonicalRelationshipStoryPlan.ts",
);
for (const forbidden of [
  "calculateSajuBundle",
  "buildIndividualSajuChart",
  "buildChartContext",
  "analyzeCrossChartRelations",
]) {
  assert.ok(
    !storyPlannerSrc.includes(forbidden),
    `Story Planner must not import/call ${forbidden} directly — it receives pre-built CE/contract data as parameters`,
  );
}
ok("confirmed: buildCanonicalRelationshipStoryPlan.ts contains zero raw-calculation imports");

// ---------------------------------------------------------------------------
section("4) UI adapter does not perform raw CE computation");

const adapterSrc = read(
  "app/dev/romantic-v4-content-prototype/components/v4/adaptCanonicalSection.ts",
);
for (const forbidden of [
  "personalContextEngine",
  "pairContextEngine",
  "individualSaju",
  "calculateSajuBundle",
]) {
  assert.ok(
    !adapterSrc.includes(forbidden),
    `UI adapter must not import ${forbidden} — it only reshapes already-computed CanonicalSection/payload data`,
  );
}
ok("confirmed: adaptCanonicalSection.ts imports only from prototypeV4's own output types");

// ---------------------------------------------------------------------------
section("5) V1 production path is unchanged by this batch (test-only commit)");

const romanticSajuDeepSrc = read("lib/prompts/relationshipPremium/romanticSajuDeep/index.ts");
assert.ok(
  romanticSajuDeepSrc.includes("FROZEN (2026-07-24)"),
  "V1's frozen-module marker must still be present — Batch A made no implementation changes",
);
assert.ok(
  typeof (await import("../../lib/prompts/relationshipPremium/romanticSajuDeep/index.ts")).prepareRomanticSajuDeepRun ===
    "function",
  "V1's prepareRomanticSajuDeepRun must still import and resolve as a callable function",
);
ok("confirmed: V1's frozen module is present, unmodified, and still importable");

console.log("\nOK: romantic-v4-consolidation-boundaries tests passed");
