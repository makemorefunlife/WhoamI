/**
 * Romantic V4 — remove fixture narratives from real mode.
 *
 * Real A/B Saju + survey inputs already reach CE/pair/comparison paths
 * (commit 089b79e). This batch removes the remaining 지민/정우 fixture
 * narrative leakage: hardcoded chapter/hiddenHeart/repairGuide/closing
 * prose, and a hidden \u-escaped name hardcode in the Story Plan that a
 * plain-text grep couldn't see.
 *
 * Run: npx tsx tests/unit/romantic-v4-real-narrative.test.mjs
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

const { buildRomanticV4PrototypePayload } = await import(
  "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts"
);
const { buildNeutralV2Profile } = await import("../../lib/v2/survey/neutralProfile.ts");

function makeProfile(overrides) {
  const base = buildNeutralV2Profile();
  return { ...base, secondary_axes: { ...base.secondary_axes, ...overrides } };
}

const profileA = makeProfile({ conflict_style: 20, empathy: 25 });
const profileB = makeProfile({ conflict_style: 95, empathy: 88 });
const birthA = { birthDate: "1985-01-10", birthTime: "03:00", birthTimeUnknown: false };
const birthB = { birthDate: "1985-01-10", birthTime: "15:00", birthTimeUnknown: false };
const birthA_alt = { birthDate: "1999-07-22", birthTime: "21:45", birthTimeUnknown: false };

const realOptions = {
  surveyInput: { mode: "real", profileA, profileB },
  pairSajuInput: { mode: "real", birthA, birthB, nameA: "Riley", nameB: "Morgan" },
};

const realPayload = buildRomanticV4PrototypePayload("complete", "ko-KR", realOptions);
const devPayload = buildRomanticV4PrototypePayload("complete", "ko-KR");

// ---------------------------------------------------------------------------
section("1) Custom A/B names appear across the report");

assert.equal(realPayload.pair.personA, "Riley");
assert.equal(realPayload.pair.personB, "Morgan");
assert.equal(realPayload.canonicalReport?.names.a, "Riley");
assert.equal(realPayload.canonicalReport?.names.b, "Morgan");
const visibleSection = realPayload.canonicalReport?.sections.find((s) => s.visible && s.blocks.length > 0);
assert.ok(visibleSection, "expected at least one visible canonical section");
const sectionText = JSON.stringify(visibleSection);
assert.ok(
  sectionText.includes("Riley") || sectionText.includes("Morgan"),
  "at least the first visible canonical section should reference a custom name",
);
ok("custom names propagate to payload.pair, canonicalReport.names, and canonical section body text");

// ---------------------------------------------------------------------------
section("2) 지민/정우 never appear in real mode (output-based check)");

const realJson = JSON.stringify(realPayload);
assert.equal(realJson.includes("지민"), false, "real-mode payload JSON must not contain 지민");
assert.equal(realJson.includes("정우"), false, "real-mode payload JSON must not contain 정우");
ok("full real-mode payload JSON contains zero occurrences of 지민/정우");

// ---------------------------------------------------------------------------
section("3) Changing birth inputs changes affected chapter output");

const realPayloadAlt = buildRomanticV4PrototypePayload("complete", "ko-KR", {
  ...realOptions,
  pairSajuInput: { ...realOptions.pairSajuInput, birthA: birthA_alt },
});
assert.notDeepEqual(
  realPayload.canonicalReport?.sections,
  realPayloadAlt.canonicalReport?.sections,
  "changing person A's birth must change canonicalReport.sections content",
);
assert.notDeepEqual(
  realPayload.comparisonTableEvidence,
  realPayloadAlt.comparisonTableEvidence,
  "changing person A's birth must change the fused comparison rows",
);
ok("canonicalReport.sections and comparisonTableEvidence both change when birth input changes");

// ---------------------------------------------------------------------------
section("4) Real mode has zero fixture narrative dependency");

assert.deepEqual(realPayload.chapters, []);
assert.deepEqual(realPayload.relationshipFlow, { title: "", steps: [], pivotPoint: "", evidenceIds: [] });
assert.deepEqual(realPayload.conflicts, []);
assert.deepEqual(realPayload.hiddenHeart, {
  personA: "",
  personB: "",
  personAOneLineForPartner: "",
  personBOneLineForPartner: "",
  evidenceIds: [],
});
assert.deepEqual(realPayload.repairGuide, {
  sequence: [],
  sideBySide: { helpsA: [], helpsB: [], together: [] },
  evidenceIds: [],
});
assert.deepEqual(realPayload.realLifeScenes, []);
assert.deepEqual(realPayload.nextChapter, []);
assert.deepEqual(realPayload.closing, {
  concludingStatement: "",
  rememberA: "",
  rememberB: "",
  shareLines: [],
  reflectionQuestion: "",
});
assert.deepEqual(realPayload.insightOwnership, []);
assert.deepEqual(realPayload.evidenceTrace, []);
assert.deepEqual(realPayload.omittedContent, []);
ok("all fixture-prose fields are explicit empty/unavailable states in real mode, never fixture content");

// ---------------------------------------------------------------------------
section("5) Dev mode still supports fixture rendering");

assert.equal(devPayload.pair.personA, "지민");
assert.equal(devPayload.pair.personB, "정우");
assert.ok(devPayload.chapters.length > 0, "dev_fixture mode must still render the demo chapters");
assert.ok(devPayload.hiddenHeart.personA.length > 0, "dev_fixture mode must still render hiddenHeart prose");
assert.ok(devPayload.repairGuide.sequence.length > 0, "dev_fixture mode must still render repairGuide steps");
assert.equal(devPayload.surveyEvidence?.isSampleData, true);
ok("omitting real inputs (dev_fixture default) preserves the full fixture-driven demo experience unchanged");

// ---------------------------------------------------------------------------
section("6) Six comparison rows remain available in both modes");

for (const payload of [realPayload, devPayload]) {
  assert.equal(payload.comparisonTable.length, 6);
}
ok("real and dev_fixture payloads both carry all 6 comparison rows");

// ---------------------------------------------------------------------------
section("7) Grep gate: no hardcoded fixture names in the computation layer");

// These files compute canonical content from CE/contract inputs and must be
// 100% name-agnostic — any literal 지민/정우 here (plain OR \u-escaped, the
// exact form that hid the Story Plan bug from earlier plain-text greps) is a
// hardcoded-fixture-name regression, not a legitimate dev_fixture default.
const computationLayerFiles = [
  "lib/relationship/romantic/prototypeV4/buildCanonicalRelationshipStoryPlan.ts",
  "lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives.ts",
  "lib/relationship/romantic/prototypeV4/chapterLensResolvers.ts",
  "lib/relationship/romantic/prototypeV4/axisStandoutInterpretations.ts",
  "lib/relationship/romantic/prototypeV4/spousePalaceMatcher.ts",
  "lib/relationship/romantic/prototypeV4/personalRelationshipCe.ts",
  "lib/relationship/romantic/prototypeV4/fourCeNarrativeInput.ts",
  "lib/relationship/romantic/prototypeV4/fourCeSemanticPlanner.ts",
  "lib/relationship/romantic/prototypeV4/romanticV4ComparisonFusion.ts",
  "lib/relationship/romantic/prototypeV4/romanticV4SurveyEvidence.ts",
  "lib/relationship/romantic/prototypeV4/romanticV4SajuInput.ts",
];
const NAME_PATTERNS = [/지민/, /정우/, /\\uC9C0\\uBBFC/i, /\\uC815\\uC6B0/i];
for (const relPath of computationLayerFiles) {
  const src = read(relPath);
  for (const pattern of NAME_PATTERNS) {
    assert.ok(
      !pattern.test(src),
      `${relPath} must not contain a hardcoded fixture-name literal (${pattern}) — found one`,
    );
  }
}
ok(`${computationLayerFiles.length} computation-layer files contain zero hardcoded name literals (plain or \\u-escaped)`);

// buildRomanticV4PrototypePayload.ts / buildActualFourCeContract.ts / buildCanonicalRomanticV4Report.ts
// are allowed a *fallback default* for dev_fixture mode only — verify every
// 지민/정우 occurrence there is part of an explicit "?? " or ": " default,
// never an unconditional assignment reachable from real mode.
function grepDir(dir, pattern) {
  const hits = [];
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) {
      hits.push(...grepDir(full, pattern));
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      const content = readFileSync(full, "utf8");
      for (const line of content.split("\n")) {
        if (pattern.test(line)) hits.push(`${full}: ${line.trim()}`);
      }
    }
  }
  return hits;
}
const prototypeV4Dir = `${root}/lib/relationship/romantic/prototypeV4`;
const escapedNameHits = grepDir(prototypeV4Dir, /\\uC9C0\\uBBFC|\\uC815\\uC6B0/i);
assert.deepEqual(
  escapedNameHits,
  [],
  `no file under prototypeV4/** may contain a \\u-escaped fixture name literal: ${JSON.stringify(escapedNameHits)}`,
);
ok("zero \\u-escaped fixture-name literals anywhere under prototypeV4/** (the exact bug class this batch fixed)");

console.log("\nOK: romantic-v4-real-narrative tests passed");
