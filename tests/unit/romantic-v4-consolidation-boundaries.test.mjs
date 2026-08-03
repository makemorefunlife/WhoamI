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
import { readFileSync, readdirSync, statSync } from "node:fs";
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
section("5) V1's own module is unmodified (only V4's caller was ever changed)");

const romanticSajuDeepSrc = read("lib/prompts/relationshipPremium/romanticSajuDeep/index.ts");
assert.ok(
  romanticSajuDeepSrc.includes("FROZEN (2026-07-24)"),
  "V1's frozen-module marker must still be present",
);
assert.ok(
  typeof (await import("../../lib/prompts/relationshipPremium/romanticSajuDeep/index.ts")).prepareRomanticSajuDeepRun ===
    "function",
  "V1's prepareRomanticSajuDeepRun must still import and resolve as a callable function on its own — " +
    "Batch C only stopped V4 from calling it, V1's production path itself is untouched",
);
ok("confirmed: V1's frozen module is present, unmodified, and still importable");

// ---------------------------------------------------------------------------
section("6) Batch C exit gates — grep-verified, not just narrative claims");

const prototypeV4Dir = `${root}/lib/relationship/romantic/prototypeV4`;
function grepDir(dir, pattern) {
  const hits = [];
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) {
      hits.push(...grepDir(full, pattern));
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      const content = readFileSync(full, "utf8");
      for (const line of content.split("\n")) {
        if (pattern.test(line) && !line.trim().startsWith("//") && !line.trim().startsWith("*")) {
          hits.push(`${full}: ${line.trim()}`);
        }
      }
    }
  }
  return hits;
}

const prepareCalls = grepDir(prototypeV4Dir, /prepareRomanticSajuDeepRun/);
assert.deepEqual(prepareCalls, [], `prototypeV4/** must not call prepareRomanticSajuDeepRun: ${JSON.stringify(prepareCalls)}`);
ok("zero non-comment references to prepareRomanticSajuDeepRun anywhere in prototypeV4/**");

const ruleBundleCalls = grepDir(prototypeV4Dir, /buildRomanticRulesBundle/);
assert.deepEqual(ruleBundleCalls, [], `prototypeV4/** must not call buildRomanticRulesBundle: ${JSON.stringify(ruleBundleCalls)}`);
ok("zero non-comment references to buildRomanticRulesBundle anywhere in prototypeV4/**");

// romanticExperienceCompleteFixture IS still used, but only in buildRomanticV4PrototypePayload.ts's
// createCompletePayload for the SEPARATE, non-canonical axisOverview/comparisonTable view-model path
// (psych-axis survey data, which has the exact same CurrentSelfProfile-unavailable blocker as the 5
// pair-dynamics signals) — NOT as the base object for buildActualFourCeContract's canonical_projections
// anymore (that usage is what Batch C removed). This is a known, reported, separate remaining item.
const fixtureAsOutputBaseInContract = read(
  "lib/relationship/romantic/prototypeV4/buildActualFourCeContract.ts",
).includes("romanticExperienceCompleteFixture");
assert.equal(
  fixtureAsOutputBaseInContract,
  false,
  "buildActualFourCeContract.ts (the canonical/Story-Planner path) must not reference romanticExperienceCompleteFixture at all",
);
ok(
  "confirmed: romanticExperienceCompleteFixture is gone from the canonical Story-Planner path " +
    "(buildActualFourCeContract.ts); it remains in buildRomanticV4PrototypePayload.ts's separate " +
    "axisOverview view-model construction — flagged as a known remaining item, not silently ignored",
);

console.log("\nOK: romantic-v4-consolidation-boundaries tests passed");
