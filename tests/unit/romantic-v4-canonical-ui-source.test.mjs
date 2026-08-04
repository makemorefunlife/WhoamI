/**
 * Romantic V4 — canonicalReport.sections as the authoritative UI ViewModel.
 *
 * Verifies the presentation adapters (adaptCanonicalSection.ts) and the
 * dev route's PrototypeClient.tsx only ever read canonicalReport/comparisonTable/
 * axisOverview — never the legacy fixture-shaped fields that are now explicit
 * empty states in real mode (romantic-v4-real-narrative.test.mjs, prior batch).
 *
 * Run: npx tsx tests/unit/romantic-v4-canonical-ui-source.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
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
const { adaptHero, adaptRadarAxes, adaptDifference } = await import(
  "../../app/dev/romantic-v4-content-prototype/components/v4/adaptCanonicalSection.ts"
);

function makeProfile(overrides) {
  const base = buildNeutralV2Profile();
  return { ...base, secondary_axes: { ...base.secondary_axes, ...overrides } };
}

const profileA = makeProfile({ conflict_style: 18, empathy: 22, structure: 12 });
const profileB = makeProfile({ conflict_style: 91, empathy: 85, structure: 93 });
const birthA = { birthDate: "1985-01-10", birthTime: "03:00", birthTimeUnknown: false };
const birthB = { birthDate: "1985-01-10", birthTime: "15:00", birthTimeUnknown: false };

const realOptions = {
  surveyInput: { mode: "real", profileA, profileB },
  pairSajuInput: { mode: "real", birthA, birthB, nameA: "Priya", nameB: "Jonas" },
};
const realPayload = buildRomanticV4PrototypePayload("complete", "ko-KR", realOptions);
const devPayload = buildRomanticV4PrototypePayload("complete", "ko-KR");

// ---------------------------------------------------------------------------
section("1) Real mode renders non-empty canonical sections");

assert.ok(realPayload.canonicalReport, "real mode must produce a canonicalReport");
const visibleReal = realPayload.canonicalReport.sections.filter((s) => s.visible);
assert.ok(visibleReal.length > 0, "at least one canonical section must be visible in real mode");
for (const s of visibleReal) {
  assert.ok(s.blocks.length > 0, `visible section ${s.chapterId} must have non-empty blocks`);
}
ok(`${visibleReal.length} visible canonical sections, all with non-empty blocks`);

// ---------------------------------------------------------------------------
section("2) Custom A/B names render correctly through the presentation adapters");

const heroSection = realPayload.canonicalReport.sections.find((s) => s.chapterId === "c1_hero");
const hero = adaptHero(heroSection);
assert.ok(hero.essence.length > 0 && hero.definition.length > 0);
assert.ok(
  hero.essence.includes("Priya") || hero.essence.includes("Jonas") ||
    hero.definition.includes("Priya") || hero.definition.includes("Jonas"),
  "adaptHero's output should reference at least one custom name",
);
const radar = adaptRadarAxes(realPayload);
assert.equal(radar.length, 11);
assert.ok(radar.every((r) => typeof r.a === "number" && typeof r.b === "number"));
ok("adaptHero and adaptRadarAxes surface real, name-bearing, real-scored content");

// ---------------------------------------------------------------------------
section("3) No 지민/정우 or fixture prose through the adapters");

const diffSection = realPayload.canonicalReport.sections.find((s) => s.chapterId === "c5_misunderstanding");
const diff = adaptDifference(diffSection, realPayload);
const adaptedJson = JSON.stringify({ hero, radar, diff });
assert.equal(adaptedJson.includes("지민"), false);
assert.equal(adaptedJson.includes("정우"), false);
ok("adapter output (hero/radar/difference) contains zero 지민/정우");

// ---------------------------------------------------------------------------
section("4) Dev fixture preview still works");

assert.ok(devPayload.canonicalReport, "dev_fixture mode must still produce a canonicalReport");
const devHeroSection = devPayload.canonicalReport.sections.find((s) => s.chapterId === "c1_hero");
const devHero = adaptHero(devHeroSection);
assert.ok(devHero.essence.includes("지민") || devHero.essence.includes("정우") || devHero.definition.length > 0);
ok("dev_fixture mode's canonicalReport still renders through the same adapters");

// ---------------------------------------------------------------------------
section("5) No duplicate interpretation between canonicalReport and legacy fields");

// Legacy fixture-shaped fields must be the explicit empty state in real mode —
// canonicalReport is the only populated interpretation source.
for (const [key, empty] of [
  ["chapters", []],
  ["conflicts", []],
  ["realLifeScenes", []],
  ["nextChapter", []],
  ["insightOwnership", []],
]) {
  assert.deepEqual(realPayload[key], empty, `${key} must be empty in real mode (canonicalReport is the sole source)`);
}
ok("legacy fixture-shaped fields carry no content alongside the real canonicalReport");

// ---------------------------------------------------------------------------
section("6) All six comparison rows remain available");

assert.equal(realPayload.comparisonTable.length, 6);
assert.equal(devPayload.comparisonTable.length, 6);
ok("real and dev_fixture payloads both carry all 6 comparison rows");

// ---------------------------------------------------------------------------
section("7) UI source-level grep gate: presentation layer never reads legacy fixture-shaped fields");

const uiFiles = [
  "app/dev/romantic-v4-content-prototype/components/v4/adaptCanonicalSection.ts",
  "app/dev/romantic-v4-content-prototype/components/v4/ChaptersA.tsx",
  "app/dev/romantic-v4-content-prototype/components/v4/ChaptersB.tsx",
  "app/dev/romantic-v4-content-prototype/CanonicalReportView.tsx",
  "app/dev/romantic-v4-content-prototype/PrototypeClient.tsx",
];
const forbidden = [
  "payload.chapters",
  "payload.hiddenHeart",
  "payload.repairGuide",
  "payload.conflicts",
  "payload.realLifeScenes",
  "payload.closing",
  "payload.nextChapter",
  "payload.relationshipFlow",
];
for (const relPath of uiFiles) {
  const src = read(relPath);
  for (const needle of forbidden) {
    assert.ok(
      !src.includes(needle),
      `${relPath} must not reference legacy fixture-shaped field ${needle}`,
    );
  }
}
ok(`${uiFiles.length} presentation-layer files reference zero legacy fixture-shaped payload fields`);

// The old fixture-shaped ReportSections.tsx (dead: zero importers once
// PrototypeClient.tsx stopped rendering it) has been removed, not just
// disconnected — regression guard against silently reintroducing it.
assert.equal(
  existsSync(`${root}/app/dev/romantic-v4-content-prototype/components/ReportSections.tsx`),
  false,
  "ReportSections.tsx (legacy fixture-shaped duplicate ViewModel) must stay removed",
);
ok("ReportSections.tsx stays removed");

console.log("\nOK: romantic-v4-canonical-ui-source tests passed");
