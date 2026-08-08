/**
 * One-off verification — Chapter 8 prescriptions (A/B/C) must always appear,
 * unconditionally, even with the weakest possible pair signals.
 */
import { buildCohabitationPrescriptions } from "../../lib/relationship/marriage/buildCohabitationPrescriptions";
import type { PairCohabitationSignals } from "../../lib/personCore/sajuSignals/pairTypes";

const weakSignals: PairCohabitationSignals = {
  secret_affinity: { present: false, links: [], affinity_index: 0 },
  cfo_power_struggle: {
    dual_cfo_war: false,
    struggle_score: 0,
    struggle_band: "low",
    leader_side: null,
    a_cfo_affinity: 0,
    b_cfo_affinity: 0,
  },
  day_palace_cross: {
    branch_a: "ja",
    branch_b: "o",
    cross_relation_type: null,
    cross_tension_index: 0,
  },
};

const pack = buildCohabitationPrescriptions({
  pair: weakSignals,
  nicknameA: "동글",
  nicknameB: "Sera",
  locale: "ko-KR",
});

console.log("topics:", pack.items.map((i) => i.topic));
console.log("has day_palace_tension:", pack.items.some((i) => i.topic === "day_palace_tension"));
console.log("has secret_affinity:", pack.items.some((i) => i.topic === "secret_affinity"));
console.log("has home_baseline:", pack.items.some((i) => i.topic === "home_baseline"));
for (const item of pack.items) {
  console.log(`\n[${item.topic}] ${item.headline}`);
  console.log("do_list:", item.do_list.length, "items");
  console.log("dont_list:", item.dont_list.length, "items");
}
