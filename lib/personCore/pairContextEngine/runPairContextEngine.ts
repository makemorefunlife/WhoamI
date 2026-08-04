import {
  getReferenceDictionary,
  REFERENCE_DICTIONARY_VERSION,
} from "../referenceDictionary";
import type { ReferenceDictionary } from "../referenceDictionary";
import { buildPairSajuFacts } from "../pairSaju";
import {
  PAIR_CE_VERSION,
  PAIR_POLICY_DEFAULTS,
  PAIR_SHARED_LENS,
  type PairContextGroupId,
  type PairSignalTier,
} from "./constants";
import { selectPairSharedCandidates } from "./selectPairShared";
import { buildCanonicalPairCapabilities } from "./canonicalPairCapabilities";
import type {
  PairContextEngineInput,
  PairContextEngineOutput,
  PairContextExclusion,
  PairContextPacket,
  ResolvedBaseMeaning,
  UnresolvedReference,
} from "./types";

const GROUP_ORDER: PairContextGroupId[] = [
  "bonding",
  "friction",
  "energy",
  "structure",
  "modifiers",
];

function emptyGroups(): Record<PairContextGroupId, PairContextPacket[]> {
  return {
    bonding: [],
    friction: [],
    energy: [],
    structure: [],
    modifiers: [],
  };
}

function resolveMeanings(
  referenceIds: string[],
  factPath: string,
  dict: ReferenceDictionary,
  unresolved: UnresolvedReference[],
): { resolved: ResolvedBaseMeaning[]; unresolvedIds: string[] } {
  const resolved: ResolvedBaseMeaning[] = [];
  const unresolvedIds: string[] = [];
  const seenMiss = new Set<string>();
  for (const id of referenceIds) {
    const hit = dict.by_id[id];
    if (!hit) {
      unresolvedIds.push(id);
      if (!seenMiss.has(id)) {
        seenMiss.add(id);
        unresolved.push({
          reference_id: id,
          fact_path: factPath,
          reason: "dictionary_miss",
        });
      }
      continue;
    }
    resolved.push({
      reference_id: id,
      text_ko: hit.base_meaning.ko,
      ...(hit.base_meaning.en ? { text_en: hit.base_meaning.en } : {}),
      resolved: true,
    });
  }
  return { resolved, unresolvedIds };
}

function canAdmitTier(
  tier: PairSignalTier,
  groupCounts: { total: number; t12: number },
  maxPerGroup: number,
  reservedT12: number,
): boolean {
  if (groupCounts.total >= maxPerGroup) return false;
  if (tier <= 2) return true;
  const remaining = maxPerGroup - groupCounts.total;
  const t12StillNeeded = Math.max(0, reservedT12 - groupCounts.t12);
  if (groupCounts.t12 >= reservedT12) return true;
  return remaining > t12StillNeeded;
}

/**
 * Pair Context Engine — pair_shared_v1.
 * Pair Fact Layer + Dictionary base meanings → context-neutral packets.
 */
export function runPairContextEngine(
  input: PairContextEngineInput,
): PairContextEngineOutput {
  const facts =
    input.facts ??
    (input.facts_input ? buildPairSajuFacts(input.facts_input) : null);
  if (!facts) {
    throw new Error("runPairContextEngine requires facts or facts_input");
  }

  const dict = getReferenceDictionary();
  const dictVersion =
    input.dictionary_version ?? dict.schema_version ?? REFERENCE_DICTIONARY_VERSION;
  if (dictVersion !== dict.schema_version) {
    throw new Error(
      `Dictionary version mismatch: input=${dictVersion} catalog=${dict.schema_version}`,
    );
  }

  const maxPerGroup =
    input.options?.max_packets_per_group ??
    PAIR_POLICY_DEFAULTS.max_packets_per_group;
  const reservedT12 =
    input.options?.reserved_t1_t2_per_group ??
    PAIR_POLICY_DEFAULTS.reserved_t1_t2_per_group;

  const { candidates, exclusions: dedupeExclusions } =
    selectPairSharedCandidates(facts);

  const unresolved: UnresolvedReference[] = [];
  const exclusions: PairContextExclusion[] = [
    ...facts.exclusions,
    ...dedupeExclusions,
  ];
  const groups = emptyGroups();
  const groupCounts: Record<PairContextGroupId, { total: number; t12: number }> =
    {
      bonding: { total: 0, t12: 0 },
      friction: { total: 0, t12: 0 },
      energy: { total: 0, t12: 0 },
      structure: { total: 0, t12: 0 },
      modifiers: { total: 0, t12: 0 },
    };

  const packets: PairContextPacket[] = [];
  let seq = 0;

  for (const c of candidates) {
    const counts = groupCounts[c.group];
    if (!canAdmitTier(c.tier, counts, maxPerGroup, reservedT12)) {
      exclusions.push({
        fact_path: c.fact_path,
        reason: "low_priority_cap",
        detail: `group=${c.group} tier=${c.tier}`,
      });
      continue;
    }

    const { resolved, unresolvedIds } = resolveMeanings(
      c.reference_ids,
      c.fact_path,
      dict,
      unresolved,
    );

    const packet: PairContextPacket = {
      packet_id: `pce_${String(++seq).padStart(3, "0")}`,
      group: c.group,
      role_in_lens: c.role_in_lens,
      tier: c.tier,
      fact_path: c.fact_path,
      fact_kind: c.fact_kind,
      codes: c.codes,
      parties: c.parties,
      directionality: c.directionality,
      ...(c.pillar_slots ? { pillar_slots: c.pillar_slots } : {}),
      reference_ids: c.reference_ids,
      base_meanings: resolved,
      unresolved_reference_ids: unresolvedIds,
      selection_priority: c.selection_priority,
      confidence: c.confidence,
      evidence: c.evidence,
    };

    packets.push(packet);
    groups[c.group].push(packet);
    counts.total += 1;
    if (c.tier <= 2) counts.t12 += 1;
  }

  // Deterministic global order: group → tier → selection_priority desc → fact_path
  packets.sort((a, b) => {
    const ga = GROUP_ORDER.indexOf(a.group);
    const gb = GROUP_ORDER.indexOf(b.group);
    if (ga !== gb) return ga - gb;
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (b.selection_priority !== a.selection_priority) {
      return b.selection_priority - a.selection_priority;
    }
    return a.fact_path.localeCompare(b.fact_path);
  });

  const hit_counts_by_kind: Record<string, number> = {};
  for (const p of packets) {
    hit_counts_by_kind[p.fact_kind] = (hit_counts_by_kind[p.fact_kind] ?? 0) + 1;
  }

  const canonical_capabilities = buildCanonicalPairCapabilities(
    facts,
    packets,
    input.profile_a,
    input.profile_b,
  );

  return {
    schema_version: PAIR_CE_VERSION,
    lens: PAIR_SHARED_LENS,
    packets,
    groups,
    aggregates: {
      birth_time_unknown_a: facts.birth_time_unknown_a,
      birth_time_unknown_b: facts.birth_time_unknown_b,
      hit_counts_by_kind,
      ssot_gaps: facts.ssot_gaps,
    },
    exclusions,
    unresolved_references: unresolved,
    provenance: {
      ce_version: PAIR_CE_VERSION,
      lens: PAIR_SHARED_LENS,
      dictionary_version: dict.schema_version,
      pair_fact_version: facts.schema_version,
      chart_a: {
        report_id: facts.report_id_a,
        schema_version: "chart_context",
        fingerprints: facts.report_id_a,
      },
      chart_b: {
        report_id: facts.report_id_b,
        schema_version: "chart_context",
        fingerprints: facts.report_id_b,
      },
      built_at: new Date().toISOString(),
      policy_id: "pair_context_engine_policy_v1",
    },
    facts,
    canonical_capabilities,
  };
}
