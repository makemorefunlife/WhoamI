import type { HiddenStemEntry } from "../types/sajuMaster";
import type { DomainSajuSignalsPack } from "./types";
import {
  clampScore,
  crossBranchRelation,
  findStemCombine,
  intensityBand3,
} from "./intraPalaceRelations";
import type { PairCohabitationSignals, SecretAffinityLink } from "./pairTypes";

const TENSION_BRANCH_TYPES = new Set(["충", "형", "해", "파"]);

function hiddenStemCodes(stems: HiddenStemEntry[]): string[] {
  const seen = new Set<string>();
  for (const row of stems) {
    if (row.stem_code?.trim()) seen.add(row.stem_code.trim());
  }
  return [...seen];
}

function collectCrossSecretAffinity(params: {
  hiddenA: HiddenStemEntry[];
  hiddenB: HiddenStemEntry[];
  dayStemA: string;
  dayStemB: string;
}): SecretAffinityLink[] {
  const links: SecretAffinityLink[] = [];
  const codesA = hiddenStemCodes(params.hiddenA);
  const codesB = hiddenStemCodes(params.hiddenB);

  for (const ha of codesA) {
    for (const hb of codesB) {
      if (!findStemCombine(ha, hb)) continue;
      links.push({
        side: "hidden_a_hidden_b",
        stem_code_a: ha,
        stem_code_b: hb,
      });
    }
  }

  for (const ha of codesA) {
    if (!params.dayStemB || !findStemCombine(ha, params.dayStemB)) continue;
    links.push({
      side: "hidden_a_day_stem_b",
      stem_code_a: ha,
      stem_code_b: params.dayStemB,
    });
  }

  for (const hb of codesB) {
    if (!params.dayStemA || !findStemCombine(params.dayStemA, hb)) continue;
    links.push({
      side: "day_stem_a_hidden_b",
      stem_code_a: params.dayStemA,
      stem_code_b: hb,
    });
  }

  if (
    params.dayStemA &&
    params.dayStemB &&
    findStemCombine(params.dayStemA, params.dayStemB)
  ) {
    links.push({
      side: "day_stem_a_day_stem_b",
      stem_code_a: params.dayStemA,
      stem_code_b: params.dayStemB,
    });
  }

  return links;
}

function dedupeAffinityLinks(links: SecretAffinityLink[]): SecretAffinityLink[] {
  const seen = new Set<string>();
  const out: SecretAffinityLink[] = [];
  for (const link of links) {
    const key = `${link.side}|${[link.stem_code_a, link.stem_code_b].sort().join("-")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(link);
  }
  return out;
}

export function pairCohabitationSignals(params: {
  signalsA: DomainSajuSignalsPack;
  signalsB: DomainSajuSignalsPack;
  hiddenStemsA: HiddenStemEntry[];
  hiddenStemsB: HiddenStemEntry[];
  dayStemA: string;
  dayStemB: string;
}): PairCohabitationSignals {
  const cohA = params.signalsA.cohabitation_signals;
  const cohB = params.signalsB.cohabitation_signals;

  const affinityLinks = dedupeAffinityLinks(
    collectCrossSecretAffinity({
      hiddenA: params.hiddenStemsA,
      hiddenB: params.hiddenStemsB,
      dayStemA: params.dayStemA,
      dayStemB: params.dayStemB,
    }),
  );

  let affinityIndex = 25;
  if (affinityLinks.length > 0) affinityIndex += 35;
  affinityIndex += Math.min(30, affinityLinks.length * 12);
  if (cohA.hidden_stem_intimacy.day_stem_rooted_in_spouse_palace) {
    affinityIndex += 8;
  }
  if (cohB.hidden_stem_intimacy.day_stem_rooted_in_spouse_palace) {
    affinityIndex += 8;
  }

  const aCfo = cohA.wealth_officer_power;
  const bCfo = cohB.wealth_officer_power;
  const dualCfoWar =
    aCfo.dual_power_risk && bCfo.dual_power_risk;

  let struggleScore = 20;
  if (dualCfoWar) struggleScore += 45;
  if (
    aCfo.economic_dominance_band === "high" &&
    bCfo.economic_dominance_band === "high"
  ) {
    struggleScore += 25;
  }
  struggleScore += Math.abs(aCfo.cfo_affinity_score - bCfo.cfo_affinity_score) * 0.15;
  struggleScore = clampScore(struggleScore);

  let leaderSide: PairCohabitationSignals["cfo_power_struggle"]["leader_side"] =
    "even";
  if (aCfo.cfo_affinity_score > bCfo.cfo_affinity_score + 12) {
    leaderSide = "a";
  } else if (bCfo.cfo_affinity_score > aCfo.cfo_affinity_score + 12) {
    leaderSide = "b";
  }
  if (dualCfoWar) leaderSide = "even";

  const branchA = cohA.day_palace.branch_code;
  const branchB = cohB.day_palace.branch_code;
  const crossRel = crossBranchRelation(branchA, branchB);
  let crossTension = 15;
  if (crossRel && TENSION_BRANCH_TYPES.has(crossRel.type)) {
    crossTension += 55;
  } else if (crossRel?.type === "육합") {
    crossTension = Math.max(5, crossTension - 15);
  }
  crossTension += Math.round(
    (cohA.day_palace.tension_index + cohB.day_palace.tension_index) * 0.12,
  );
  crossTension = clampScore(crossTension);

  return {
    secret_affinity: {
      present: affinityLinks.length > 0,
      links: affinityLinks,
      affinity_index: clampScore(affinityIndex),
    },
    cfo_power_struggle: {
      dual_cfo_war: dualCfoWar,
      struggle_score: struggleScore,
      struggle_band: intensityBand3(struggleScore),
      leader_side: leaderSide,
      a_cfo_affinity: aCfo.cfo_affinity_score,
      b_cfo_affinity: bCfo.cfo_affinity_score,
    },
    day_palace_cross: {
      branch_a: branchA,
      branch_b: branchB,
      cross_relation_type: crossRel?.type ?? null,
      cross_tension_index: crossTension,
    },
  };
}
