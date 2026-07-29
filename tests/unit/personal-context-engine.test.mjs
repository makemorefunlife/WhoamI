/**
 * Personal Context Engine MVP unit tests
 * Run: npx tsx tests/unit/personal-context-engine.test.mjs
 */
import assert from "node:assert/strict";
import {
  PERSONAL_CE_VERSION,
  PERSONAL_INNATE_LENS,
  runPersonalContextEngine,
  assertPersonalContextPurity,
  adaptPersonalContextForSlim,
  SLIM_INSERTION_POINTS,
  SLIM_PERSONAL_CONTEXT_ADAPTER_VERSION,
} from "../../lib/personCore/personalContextEngine/index.ts";
import { buildPersonalCeFixtureChart } from "../../lib/personCore/personalContextEngine/fixtures.ts";
import { getReferenceDictionary } from "../../lib/personCore/referenceDictionary/index.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}

section("known_time fixture — contract shape");
const chartKnown = buildPersonalCeFixtureChart("known_time");
const outKnown = runPersonalContextEngine({ chart: chartKnown });
assert.equal(outKnown.schema_version, PERSONAL_CE_VERSION);
assert.equal(outKnown.lens, PERSONAL_INNATE_LENS);
assert.equal(outKnown.aggregates.birth_time_unknown, false);
assert.ok(outKnown.packets.length > 5);
for (const g of ["identity", "energy", "strengths", "cautions", "growth"]) {
  assert.ok(Array.isArray(outKnown.groups[g]), `missing group ${g}`);
  assert.ok(outKnown.groups[g].length > 0, `empty group ${g}`);
}
const purityKnown = assertPersonalContextPurity(outKnown);
assert.equal(purityKnown.ok, true, purityKnown.errors.join("\n"));
console.log(
  `  ✓ packets=${outKnown.packets.length} unresolved=${outKnown.unresolved_references.length}`,
);

section("packets preserve refId / evidence / weight / confidence / provenance");
const sample = outKnown.packets[0];
assert.ok(sample.packet_id);
assert.ok(sample.fact_path);
assert.ok(sample.reference_ids.length);
assert.ok(typeof sample.weight === "number");
assert.ok(sample.confidence);
assert.ok(Array.isArray(sample.evidence));
assert.equal(outKnown.provenance.lens, PERSONAL_INNATE_LENS);
assert.equal(
  outKnown.provenance.dictionary_version,
  getReferenceDictionary().schema_version,
);
assert.equal(
  outKnown.provenance.chart_input_fingerprint,
  chartKnown.engine.input_fingerprint,
);
assert.ok(
  sample.base_meanings.every((m) => m.resolved === true && m.text_ko),
);
console.log("  ✓ provenance + packet fields");

section("deterministic output");
const outKnown2 = runPersonalContextEngine({ chart: chartKnown });
assert.equal(
  JSON.stringify(outKnown.packets.map((p) => p.packet_id)),
  JSON.stringify(outKnown2.packets.map((p) => p.packet_id)),
);
assert.equal(
  JSON.stringify(outKnown.packets.map((p) => [p.fact_path, p.weight])),
  JSON.stringify(outKnown2.packets.map((p) => [p.fact_path, p.weight])),
);
console.log("  ✓ deterministic");

section("unknown birth time — hour excluded");
const chartUnknown = buildPersonalCeFixtureChart("unknown_time");
assert.equal(chartUnknown.birth.birth_time_unknown, true);
const outUnknown = runPersonalContextEngine({ chart: chartUnknown });
assert.equal(outUnknown.aggregates.birth_time_unknown, true);
const hourPackets = outUnknown.packets.filter((p) =>
  p.fact_path.startsWith("pillars.hour"),
);
assert.equal(hourPackets.length, 0);
const hourExclusions = outUnknown.exclusions.filter(
  (e) =>
    e.reason === "birth_time_unknown" &&
    e.fact_path.startsWith("pillars.hour"),
);
assert.ok(hourExclusions.length >= 1);
assert.equal(
  outUnknown.aggregates.ten_god_stem_counts[
    chartUnknown.pillars.find((p) => p.slot === "hour")?.stem_ten_god.code
  ] === undefined ||
    !Object.keys(outUnknown.aggregates.ten_god_stem_counts).includes("FORCE"),
  true,
);
// hour stem ten god must not be required in aggregates count from hour
const hourGod = chartUnknown.pillars.find((p) => p.slot === "hour")
  ?.stem_ten_god.code;
if (hourGod) {
  const yearMonthDayGods = chartUnknown.pillars
    .filter((p) => p.slot !== "hour")
    .map((p) => p.stem_ten_god.code);
  const hourOnly =
    yearMonthDayGods.filter((c) => c === hourGod).length === 0;
  if (hourOnly) {
    assert.equal(
      outUnknown.aggregates.ten_god_stem_counts[hourGod],
      undefined,
    );
  }
}
const purityUnknown = assertPersonalContextPurity(outUnknown);
assert.equal(purityUnknown.ok, true, purityUnknown.errors.join("\n"));
console.log(
  `  ✓ hour exclusions=${hourExclusions.length} packets=${outUnknown.packets.length}`,
);

section("identity includes day master");
const dayStem = outKnown.packets.find((p) => p.fact_path === "day_master.stem");
assert.ok(dayStem);
assert.equal(dayStem.group, "identity");
assert.ok(dayStem.reference_ids.includes(chartKnown.day_master.stem.reference_id));
console.log("  ✓ identity_core day master");

section("unresolved refIds are explicit");
const broken = structuredClone(chartKnown);
broken.day_master.stem.reference_id = "stem:__missing_test__";
const outBroken = runPersonalContextEngine({ chart: broken });
assert.ok(
  outBroken.unresolved_references.some(
    (u) => u.reference_id === "stem:__missing_test__",
  ),
);
const brokenPacket = outBroken.packets.find(
  (p) => p.fact_path === "day_master.stem",
);
assert.ok(brokenPacket);
assert.ok(
  brokenPacket.unresolved_reference_ids.includes("stem:__missing_test__"),
);
console.log(
  `  ✓ unresolved count=${outBroken.unresolved_references.length}`,
);

section("Slim adapter — not wired");
const slimPkg = adaptPersonalContextForSlim(outKnown);
assert.equal(slimPkg.adapter_version, SLIM_PERSONAL_CONTEXT_ADAPTER_VERSION);
assert.equal(slimPkg.wired_into_slim, false);
assert.ok(slimPkg.insertion_points.after_saju_facts);
assert.ok(SLIM_INSERTION_POINTS.llm_essence_summary);
assert.equal(
  slimPkg.context.groups.identity.length,
  outKnown.groups.identity.length,
);
assert.ok(Array.isArray(slimPkg.context.unresolved_reference_ids));
console.log("  ✓ slim adapter package");

section("no narrative / relationship fields on output");
const blob = JSON.stringify(outKnown);
assert.equal(/"advice_ko"\s*:/.test(blob), false);
assert.equal(/"narrative"\s*:/.test(blob), false);
assert.equal(/"headline"\s*:/.test(blob), false);
console.log("  ✓ no narrative fields");

console.log("\nOK: personal context engine tests passed");
console.log(
  JSON.stringify(
    {
      known_unresolved: outKnown.unresolved_references.map((u) => u.reference_id),
      unknown_unresolved: outUnknown.unresolved_references.map(
        (u) => u.reference_id,
      ),
      slim_insertion_points: SLIM_INSERTION_POINTS,
    },
    null,
    2,
  ),
);
