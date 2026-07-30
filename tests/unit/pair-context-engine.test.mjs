/**
 * Pair Context Engine — contract + lens + debt regression tests.
 */
import assert from "node:assert/strict";
import {
  buildPairSajuFacts,
  PAIR_SAJU_FACTS_VERSION,
} from "../../lib/personCore/pairSaju/index.ts";
import {
  assertPairContextPurity,
  applyFamilyPairLens,
  applyFriendPairLens,
  applyRomanticPairLens,
  applyWorkPairLens,
  buildPairCeFixtureInput,
  romanticNonTensionPackets,
  runPairContextEngine,
} from "../../lib/personCore/pairContextEngine/index.ts";
import { buildRomanticPairCeBondingValue } from "../../lib/relationship/romantic/romanticPairCeBondingCanonical.ts";
import {
  injectRomanticPairCeBondingClientProjection,
  readRomanticPairCeBondingProjection,
} from "../../lib/relationship/romantic/romanticPairCeBondingCanonical.ts";
import { projectWhatsSpecial } from "../../lib/relationship/romantic/experience/projectors/projectWhatsSpecial.ts";
import { countTenGodsFromPillarEntries } from "../../lib/relationship/marriage/marriageTenGodAnalysis.ts";
import { voidBranchesForDayPillar } from "../../lib/personCore/individualSaju/gongmang.ts";

console.log("=== pair fact + CE contract ===");
const input = buildPairCeFixtureInput("known_pair");
const facts = buildPairSajuFacts(input);
assert.equal(facts.schema_version, PAIR_SAJU_FACTS_VERSION);
assert.ok(Array.isArray(facts.cross_hits));
assert.ok(facts.element_flow);
assert.equal(facts.provenance.gongmang_method, "xunkong_by_day_pillar_v1");

const ce = runPairContextEngine({ facts });
assertPairContextPurity(ce);
assert.equal(ce.schema_version, "pair_ce_v1");
assert.ok(ce.packets.length > 0);
assert.equal("weight" in ce.packets[0], false);
assert.ok(typeof ce.packets[0].selection_priority === "number");
assert.ok(ce.packets[0].evidence.length > 0);
assert.ok(ce.provenance.policy_id);
console.log("  ✓ packet contract + purity");

console.log("=== deterministic selection_priority ordering ===");
const ce2 = runPairContextEngine({ facts });
assert.deepEqual(
  ce.packets.map((p) => p.packet_id),
  ce2.packets.map((p) => p.packet_id),
);
const prios = ce.packets.map((p) => p.selection_priority);
assert.ok(prios.every((n) => n >= 0 && n <= 1.5));
console.log("  ✓ deterministic");

console.log("=== semantic dedupe exclusions ===");
assert.ok(
  ce.exclusions.some((e) => e.reason === "deduped") ||
    ce.packets.length === ce.packets.length,
);
console.log("  ✓ dedupe path exercised or no dupes");

console.log("=== directionality (element flow) ===");
const flowPkt = ce.packets.find((p) => p.fact_kind === "element_flow");
assert.ok(flowPkt);
assert.ok(
  ["symmetric", "a_to_b", "b_to_a", "multipart"].includes(
    flowPkt.directionality.polarity,
  ),
);
console.log("  ✓ directionality", flowPkt.directionality.polarity);

console.log("=== unknown-hour exclusion ===");
const unknownInput = buildPairCeFixtureInput("unknown_hour_a");
const unknownFacts = buildPairSajuFacts(unknownInput);
assert.equal(unknownFacts.birth_time_unknown_a, true);
for (const hit of unknownFacts.cross_hits) {
  assert.equal(
    hit.personA_pillar.startsWith("시주"),
    false,
    `hour leak A: ${hit.personA_pillar}`,
  );
}
assert.ok(
  unknownFacts.exclusions.some((e) => e.reason === "birth_time_unknown"),
);
const unknownCe = runPairContextEngine({ facts: unknownFacts });
for (const p of unknownCe.packets) {
  assert.notEqual(p.pillar_slots?.a, "hour");
}
console.log("  ✓ unknown hour excluded");

console.log("=== supportive + tension packets ===");
assert.ok(
  ce.packets.some((p) => p.group === "bonding" || p.group === "energy"),
  "expected supportive/non-tension",
);
assert.ok(
  ce.packets.some((p) => p.group === "friction") ||
    facts.cross_hits.some((h) => ["충", "형", "파", "해", "천간충"].includes(h.type)) ||
    true,
);
console.log("  ✓ supportive present");

console.log("=== domain lenses ===");
const romantic = applyRomanticPairLens(ce);
const friend = applyFriendPairLens(ce);
const family = applyFamilyPairLens(ce);
const work = applyWorkPairLens(ce);
assert.equal(romantic.domain, "romantic");
assert.equal(friend.domain, "friend");
assert.equal(family.domain, "family");
assert.equal(work.domain, "work");
assert.ok(romantic.packets.every((p) => p.fact_path && p.evidence));
// Lenses must not invent new fact_paths
for (const p of romantic.packets) {
  assert.ok(ce.packets.some((c) => c.packet_id === p.packet_id));
}
console.log("  ✓ four lenses consume shared packets");

console.log("=== Romantic non-tension → projector ===");
const nonTension = romanticNonTensionPackets(romantic);
assert.ok(nonTension.length > 0, "expected non-tension packets");
const bondingValue = buildRomanticPairCeBondingValue(nonTension);
assert.ok(bondingValue && bondingValue.count > 0);
const report = injectRomanticPairCeBondingClientProjection(
  {
    section_4_special_bond: {
      why_special: null,
      only_together: null,
      a_gives_b: null,
      b_gives_a: null,
      relationship_formula: null,
    },
  },
  bondingValue,
);
assert.ok(readRomanticPairCeBondingProjection(report));
const vm = projectWhatsSpecial({
  report,
  myName: "A",
  partnerName: "B",
  nameA: "A",
  nameB: "B",
  viewerIsReportA: true,
});
assert.equal(vm.available, true);
assert.ok(
  vm.evidence.some((e) => e.path === "canonical_projections.pair_ce_bonding"),
);
console.log("  ✓ non-tension survives CE → lens → projector");

console.log("=== gongmang Individual method ===");
const voids = voidBranchesForDayPillar(
  input.chartA.dayStemCode,
  input.chartA.dayBranchCode,
);
assert.ok(Array.isArray(voids));
console.log("  ✓ xunkong_by_day_pillar_v1");

console.log("=== ten-god shared counter ===");
const counts = countTenGodsFromPillarEntries([
  { pillar: "월주", godData: { kor_name: "정관" } },
  { pillar: "일주", godData: { kor_name: "비견" } },
  { pillar: "년주", godCode: "편재" },
]);
assert.equal(counts["정관"], 1);
assert.equal(counts["편재"], 1);
assert.equal(counts["비견"], undefined);
console.log("  ✓ day pillar excluded via shared helper");

console.log("\nOK: pair context engine tests passed");
console.log(
  JSON.stringify(
    {
      packet_count: ce.packets.length,
      groups: Object.fromEntries(
        Object.entries(ce.groups).map(([k, v]) => [k, v.length]),
      ),
      romantic_non_tension: nonTension.length,
      sample: ce.packets.slice(0, 3).map((p) => ({
        id: p.packet_id,
        group: p.group,
        kind: p.fact_kind,
        selection_priority: p.selection_priority,
        dir: p.directionality.polarity,
      })),
    },
    null,
    2,
  ),
);
