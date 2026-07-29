/**
 * Personal Context Engine — policy-aligned unit tests
 * Run: npx tsx tests/unit/personal-context-engine.test.mjs
 */
import assert from "node:assert/strict";
import {
  PERSONAL_CE_VERSION,
  PERSONAL_INNATE_LENS,
  DOCUMENTED_SSOT_GAPS,
  COMBINE_RELATION_TYPES,
  TENSION_RELATION_TYPES,
  runPersonalContextEngine,
  assertPersonalContextPurity,
  adaptPersonalContextForSlim,
  selectPersonalInnateCandidates,
  buildPersonalCeFixtureChart,
} from "../../lib/personCore/personalContextEngine/index.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}

const chartKnown = buildPersonalCeFixtureChart("known_time");
const outKnown = runPersonalContextEngine({ chart: chartKnown });
const chartUnknown = buildPersonalCeFixtureChart("unknown_time");
const outUnknown = runPersonalContextEngine({ chart: chartUnknown });

section("contract + ssot gaps documented");
assert.equal(outKnown.schema_version, PERSONAL_CE_VERSION);
assert.equal(outKnown.lens, PERSONAL_INNATE_LENS);
assert.equal(outKnown.provenance.policy_id, "personal_context_engine_policy_v1");
assert.deepEqual([...outKnown.aggregates.ssot_gaps], [...DOCUMENTED_SSOT_GAPS]);
assert.ok(!("yin_yang_balance" in chartKnown));
assert.equal(chartKnown.luck_cycles.computed, false);
console.log("  ✓ gaps listed, not fabricated");

section("deterministic ordering");
const again = runPersonalContextEngine({ chart: chartKnown });
assert.equal(
  JSON.stringify(outKnown.packets.map((p) => [p.packet_id, p.fact_path, p.tier, p.selection_priority])),
  JSON.stringify(again.packets.map((p) => [p.packet_id, p.fact_path, p.tier, p.selection_priority])),
);
console.log("  ✓ deterministic");

section("self ten-god excluded");
assert.equal(
  outKnown.packets.some((p) => p.fact_path === "pillars.day.stem_ten_god"),
  false,
);
assert.equal(
  selectPersonalInnateCandidates(chartKnown).some(
    (c) => c.fact_path === "pillars.day.stem_ten_god" && !c.exclude,
  ),
  false,
);
console.log("  ✓ day stem self ten-god removed");

section("non-day stem ten-gods present");
assert.ok(
  outKnown.packets.some((p) => p.fact_path === "pillars.month.stem_ten_god"),
);
assert.ok(
  outKnown.packets.some((p) => p.fact_path === "pillars.year.stem_ten_god"),
);
console.log("  ✓ Y/M stem ten-gods vs day master");

section("separate relation handling");
const combinePackets = outKnown.packets.filter((p) =>
  COMBINE_RELATION_TYPES.has(p.codes[p.codes.length - 1]),
);
const tensionPackets = outKnown.packets.filter((p) =>
  TENSION_RELATION_TYPES.has(p.codes[p.codes.length - 1]),
);
for (const p of combinePackets) {
  assert.equal(p.group, "energy", `${p.fact_path} should be energy`);
}
for (const p of tensionPackets) {
  assert.equal(p.group, "cautions", `${p.fact_path} should be cautions`);
}
console.log(
  `  ✓ combines=${combinePackets.length} tensions=${tensionPackets.length}`,
);

section("rootedness signed");
const root = outKnown.packets.find((p) => p.fact_path === "rootedness");
assert.ok(root);
if (root.codes.includes("not_rooted")) {
  assert.equal(root.group, "cautions");
} else {
  assert.equal(root.group, "strengths");
}
console.log(`  ✓ rootedness → ${root.group}`);

section("modifier limits — nobles");
const noblePackets = outKnown.packets.filter((p) =>
  p.fact_path.startsWith("nobles."),
);
assert.ok(noblePackets.length <= 2, `nobles ${noblePackets.length}`);
for (const p of noblePackets) {
  assert.ok(p.selection_priority <= 0.45);
  assert.equal(p.role_in_lens, "modifier_signal");
  assert.ok(p.tier >= 3);
}
const nobleExcluded = outKnown.exclusions.filter((e) =>
  e.fact_path.startsWith("nobles."),
);
assert.ok(
  chartKnown.nobles.noble_hits.length <= 2 || nobleExcluded.length > 0,
);
console.log(
  `  ✓ nobles packets=${noblePackets.length} excluded=${nobleExcluded.length}`,
);

section("yongsin directional / low-conf omitted by default");
const yongPackets = outKnown.packets.filter(
  (p) => p.fact_path === "favorable_elements.yongsin",
);
const yongOmit = outKnown.exclusions.filter(
  (e) =>
    e.fact_path === "favorable_elements.yongsin" &&
    (e.reason === "low_confidence_omitted" || e.reason === "deduped"),
);
assert.equal(yongPackets.length, 0);
assert.ok(yongOmit.length >= 1);
const withLow = runPersonalContextEngine({
  chart: chartKnown,
  options: { include_low_confidence: true },
});
// may still dedupe against weakest
for (const p of withLow.packets.filter(
  (x) => x.fact_path === "favorable_elements.yongsin",
)) {
  assert.equal(p.role_in_lens, "directional_guidance");
  assert.ok(p.codes.includes("directional_only"));
  assert.ok(p.selection_priority <= 0.35);
}
console.log("  ✓ yongsin gated + directional");

section("priority — T1 before T3 within group");
for (const g of Object.keys(outKnown.groups)) {
  const tiers = outKnown.groups[g].map((p) => p.tier);
  for (let i = 1; i < tiers.length; i++) {
    assert.ok(tiers[i] >= tiers[i - 1], `${g} tier order ${tiers}`);
  }
}
console.log("  ✓ tier order within groups");

section("selection_priority is ordering-only field name");
for (const p of outKnown.packets) {
  assert.equal("weight" in p, false);
  assert.equal(typeof p.selection_priority, "number");
  assert.notEqual(p.selection_priority, p.confidence);
}
console.log("  ✓ no weight field; selection_priority present");

for (const p of outKnown.packets) {
  assert.ok(p.confidence);
  assert.ok(Array.isArray(p.evidence));
  assert.ok(typeof p.tier === "number");
}
const purity = assertPersonalContextPurity(outKnown);
assert.equal(purity.ok, true, purity.errors.join("\n"));
console.log("  ✓ evidence preserved");

section("unknown hour");
assert.equal(outUnknown.aggregates.birth_time_unknown, true);
assert.equal(
  outUnknown.packets.some((p) => p.fact_path.startsWith("pillars.hour")),
  false,
);
assert.ok(
  outUnknown.exclusions.some(
    (e) =>
      e.reason === "birth_time_unknown" &&
      e.fact_path.startsWith("pillars.hour"),
  ),
);
console.log("  ✓ hour excluded without inference");

section("dedup — unresolved explicit");
const broken = structuredClone(chartKnown);
broken.day_master.stem.reference_id = "stem:__missing_test__";
const outBroken = runPersonalContextEngine({ chart: broken });
assert.ok(
  outBroken.unresolved_references.some(
    (u) => u.reference_id === "stem:__missing_test__",
  ),
);
console.log("  ✓ unresolved explicit");

section("slim adapter preserves evidence");
const slim = adaptPersonalContextForSlim(outKnown);
assert.equal(slim.wired_into_slim, false);
assert.ok(slim.context.groups.identity[0].evidence.length >= 1);
assert.ok("kind" in slim.context.groups.identity[0].evidence[0]);
assert.ok(Array.isArray(slim.context.aggregates.ssot_gaps));
console.log("  ✓ slim adapter");

section("day twelve_stage present");
assert.ok(
  outKnown.packets.some((p) => p.fact_path === "pillars.day.twelve_stage"),
);
console.log("  ✓ day twelve_stage");

console.log("\nOK: personal context engine policy tests passed");
console.log(
  JSON.stringify(
    {
      packet_count: outKnown.packets.length,
      groups: Object.fromEntries(
        Object.entries(outKnown.groups).map(([k, v]) => [k, v.length]),
      ),
      sample: outKnown.packets.slice(0, 3).map((p) => ({
        id: p.packet_id,
        group: p.group,
        tier: p.tier,
        path: p.fact_path,
        selection_priority: p.selection_priority,
        confidence: p.confidence,
        refs: p.reference_ids,
        meanings: p.base_meanings.map((m) => m.text_ko.slice(0, 60)),
        evidence: p.evidence,
      })),
    },
    null,
    2,
  ),
);
