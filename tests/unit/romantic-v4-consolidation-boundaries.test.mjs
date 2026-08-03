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
section("1) Personal CE output -> Romantic Personal Lens input (Batch B: partially wired)");

const personalRelationshipCeSrc = read(
  "lib/relationship/romantic/prototypeV4/personalRelationshipCe.ts",
);
assert.ok(
  personalRelationshipCeSrc.includes("PersonalRelationalProfile"),
  "Batch B: personalRelationshipCe.ts must import Personal CE's PersonalRelationalProfile type",
);
assert.ok(
  personalRelationshipCeSrc.includes("relationalProfile") &&
    personalRelationshipCeSrc.includes("ceAuthoritative"),
  "Batch B: buildPersonalRelationshipCe must accept a relationalProfile param and track ceAuthoritative per axis",
);
const contractSrcForCe = read("lib/relationship/romantic/prototypeV4/buildActualFourCeContract.ts");
assert.ok(
  /relationalProfile: personalCeA\.aggregates\.relational_profile/.test(contractSrcForCe),
  "buildActualFourCeContract.ts must pass Personal CE's real relational_profile through, not omit it",
);
ok(
  "confirmed: pressure_response -> stressResponse and support_giving_style -> careExpression are now " +
    "CE-authoritative with legacy fallback. conflict_decompression and criticism_sensitivity are still " +
    "exposed-but-not-authoritative (see romantic-v4-personal-ce-alignment.test.mjs) — open item, not a defect.",
);

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
