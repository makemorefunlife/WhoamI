#!/usr/bin/env node
/**
 * Relationship type-safety boundary (Phase 2I).
 *
 * The full repo has `typescript.ignoreBuildErrors: true` (next.config.ts) —
 * `npm run build` never fails on a type error anywhere, including
 * Relationship code. That's how the Family fake-Saju fallback's
 * `buildFamilyRoleIntelligence` (called without being imported — a live
 * ReferenceError) shipped and stayed unnoticed (see the Fallback
 * Remediation Phase 1 report).
 *
 * This script does NOT attempt to fix the ~500 pre-existing Relationship
 * type errors, and does NOT flip ignoreBuildErrors — the rest of the repo
 * (and much of Relationship code itself) is not ready for a hard gate. It
 * only enforces a ratchet: the number of `tsc --noEmit` errors under
 * app/api/relationship, app/relationship, components/relationship, and
 * lib/relationship must not INCREASE beyond the checked-in baseline. Fixing
 * existing errors and lowering the baseline is always welcome; the script
 * only fails when someone adds a *new* one.
 *
 * Usage: node tests/scripts/check-relationship-typecheck-baseline.mjs
 * Exit 0: at or under baseline. Exit 1: over baseline (new error(s) introduced).
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const baselinePath = path.join(__dirname, "relationship-typecheck-baseline.json");

const RELATIONSHIP_PATH_RE =
  /^(app[\\/]api[\\/]relationship|app[\\/]relationship|components[\\/]relationship|lib[\\/]relationship)[\\/]/;

function countRelationshipErrors() {
  let output = "";
  try {
    execSync("npx tsc --noEmit -p tsconfig.json", { cwd: root, encoding: "utf8" });
  } catch (err) {
    // tsc exits non-zero whenever there are any errors anywhere in the repo
    // (expected — the repo has ~700 pre-existing, unrelated to this script).
    output = /** @type {{ stdout?: string }} */ (err).stdout ?? "";
  }
  const lines = output.split(/\r?\n/);
  const relationshipErrorLines = lines.filter(
    (line) => RELATIONSHIP_PATH_RE.test(line) && line.includes("): error TS"),
  );
  return { count: relationshipErrorLines.length, lines: relationshipErrorLines };
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const { count, lines } = countRelationshipErrors();

console.log(`[relationship-typecheck] current: ${count}, baseline: ${baseline.maxErrorCount}`);

if (count > baseline.maxErrorCount) {
  console.error(
    `\n[relationship-typecheck] FAILED — ${count} Relationship type errors, baseline allows at most ${baseline.maxErrorCount}.`,
  );
  console.error(
    `This means a change introduced a NEW type error under app/api/relationship, app/relationship, components/relationship, or lib/relationship.`,
  );
  console.error(`Full list from this run has been narrowed to Relationship paths only:\n`);
  for (const line of lines) console.error("  " + line);
  console.error(
    `\nIf this is a genuinely new, intentional error you've confirmed is safe (rare), update maxErrorCount in tests/scripts/relationship-typecheck-baseline.json.`,
  );
  process.exit(1);
}

if (count < baseline.maxErrorCount) {
  console.log(
    `[relationship-typecheck] ${baseline.maxErrorCount - count} error(s) fixed since baseline — consider lowering maxErrorCount in tests/scripts/relationship-typecheck-baseline.json to lock in the improvement.`,
  );
}

console.log("[relationship-typecheck] OK");
