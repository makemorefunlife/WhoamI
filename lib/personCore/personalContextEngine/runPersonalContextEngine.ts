import {
  getReferenceDictionary,
  REFERENCE_DICTIONARY_VERSION,
} from "../referenceDictionary";
import type { ReferenceDictionary } from "../referenceDictionary";
import {
  DOCUMENTED_SSOT_GAPS,
  PERSONAL_CE_VERSION,
  PERSONAL_INNATE_LENS,
  POLICY_DEFAULTS,
  type PersonalContextGroupId,
  type PersonalSignalTier,
} from "./constants";
import {
  aggregatePersonalRelationalProfile,
  aggregateTenGodStemCounts,
  selectPersonalInnateCandidates,
} from "./selectPersonalInnate";
import type {
  PersonalContextEngineInput,
  PersonalContextEngineOutput,
  PersonalContextExclusion,
  PersonalContextPacket,
  ResolvedBaseMeaning,
  UnresolvedReference,
} from "./types";

const GROUP_ORDER: PersonalContextGroupId[] = [
  "identity",
  "energy",
  "strengths",
  "cautions",
  "growth",
];

function emptyGroups(): Record<
  PersonalContextGroupId,
  PersonalContextPacket[]
> {
  return {
    identity: [],
    energy: [],
    strengths: [],
    cautions: [],
    growth: [],
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
  tier: PersonalSignalTier,
  groupCounts: { total: number; t12: number },
  maxPerGroup: number,
  reservedT12: number,
): boolean {
  if (groupCounts.total >= maxPerGroup) return false;
  if (tier <= 2) return true;
  // T3/T4 only after reserved T1–T2 slots filled OR remaining slots exceed reserve need
  const remaining = maxPerGroup - groupCounts.total;
  const t12StillNeeded = Math.max(0, reservedT12 - groupCounts.t12);
  // Allow T3/T4 only if we still leave room for unmet T1–T2 reserve,
  // OR reserve already satisfied.
  if (groupCounts.t12 >= reservedT12) return true;
  return remaining > t12StillNeeded;
}

/**
 * Personal Context Engine — personal_innate_v1.
 * Individual SSOT facts + Dictionary base meanings → structured packets.
 */
export function runPersonalContextEngine(
  input: PersonalContextEngineInput,
): PersonalContextEngineOutput {
  const lens = input.lens ?? PERSONAL_INNATE_LENS;
  if (lens !== PERSONAL_INNATE_LENS) {
    throw new Error(`Unsupported personal lens: ${lens}`);
  }

  const chart = input.chart;
  const dict = getReferenceDictionary();
  const dictVersion =
    input.dictionary_version ?? dict.schema_version ?? REFERENCE_DICTIONARY_VERSION;
  if (dictVersion !== dict.schema_version) {
    throw new Error(
      `Dictionary version mismatch: input=${dictVersion} catalog=${dict.schema_version}`,
    );
  }

  const maxPerGroup =
    input.options?.max_packets_per_group ?? POLICY_DEFAULTS.max_packets_per_group;
  const reservedT12 =
    input.options?.reserved_t1_t2_per_group ??
    POLICY_DEFAULTS.reserved_t1_t2_per_group;

  const candidates = selectPersonalInnateCandidates(chart, {
    include_low_confidence: input.options?.include_low_confidence,
    include_unpossessed_specials: input.options?.include_unpossessed_specials,
    max_nobles: input.options?.max_nobles,
    max_non_noble_shinsal: input.options?.max_non_noble_shinsal,
  });

  const unresolved_references: UnresolvedReference[] = [];
  const exclusions: PersonalContextExclusion[] = [];
  const groups = emptyGroups();
  const packets: PersonalContextPacket[] = [];
  let packetSeq = 0;

  const groupRank = new Map(GROUP_ORDER.map((g, i) => [g, i]));
  // Sort: group → tier asc → selection_priority desc → fact_path
  const sorted = [...candidates].sort((a, b) => {
    const gr = (groupRank.get(a.group) ?? 99) - (groupRank.get(b.group) ?? 99);
    if (gr !== 0) return gr;
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (b.selection_priority !== a.selection_priority) {
      return b.selection_priority - a.selection_priority;
    }
    return a.fact_path.localeCompare(b.fact_path);
  });

  const groupState: Record<
    PersonalContextGroupId,
    { total: number; t12: number }
  > = {
    identity: { total: 0, t12: 0 },
    energy: { total: 0, t12: 0 },
    strengths: { total: 0, t12: 0 },
    cautions: { total: 0, t12: 0 },
    growth: { total: 0, t12: 0 },
  };

  for (const c of sorted) {
    if (c.exclude) {
      exclusions.push({
        fact_path: c.fact_path,
        reference_ids: c.reference_ids,
        reason: c.exclude.reason,
        detail: c.exclude.detail,
      });
      resolveMeanings(
        c.reference_ids,
        c.fact_path,
        dict,
        unresolved_references,
      );
      continue;
    }

    const state = groupState[c.group];
    if (!canAdmitTier(c.tier, state, maxPerGroup, reservedT12)) {
      exclusions.push({
        fact_path: c.fact_path,
        reference_ids: c.reference_ids,
        reason: "low_priority_cap",
        detail: `tier=${c.tier} max=${maxPerGroup} reserved_t12=${reservedT12}`,
      });
      continue;
    }

    const { resolved, unresolvedIds } = resolveMeanings(
      c.reference_ids,
      c.fact_path,
      dict,
      unresolved_references,
    );

    packetSeq += 1;
    const packet: PersonalContextPacket = {
      packet_id: `pce_${String(packetSeq).padStart(3, "0")}`,
      group: c.group,
      role_in_lens: c.role_in_lens,
      tier: c.tier,
      fact_path: c.fact_path,
      codes: c.codes.filter((x) => x !== ""),
      reference_ids: c.reference_ids,
      base_meanings: resolved,
      unresolved_reference_ids: unresolvedIds,
      selection_priority: c.selection_priority,
      confidence: c.confidence,
      evidence: c.evidence,
    };

    groups[c.group].push(packet);
    packets.push(packet);
    state.total += 1;
    if (c.tier <= 2) state.t12 += 1;
  }

  const unresolvedSeen = new Set<string>();
  const unresolvedDeduped: UnresolvedReference[] = [];
  for (const u of unresolved_references) {
    const key = `${u.reference_id}::${u.fact_path}`;
    if (unresolvedSeen.has(key)) continue;
    unresolvedSeen.add(key);
    unresolvedDeduped.push(u);
  }
  unresolvedDeduped.sort((a, b) => {
    const id = a.reference_id.localeCompare(b.reference_id);
    if (id !== 0) return id;
    return a.fact_path.localeCompare(b.fact_path);
  });
  exclusions.sort((a, b) => a.fact_path.localeCompare(b.fact_path));

  const birthUnknown = chart.birth.birth_time_unknown === true;

  return {
    schema_version: PERSONAL_CE_VERSION,
    lens: PERSONAL_INNATE_LENS,
    groups,
    packets,
    aggregates: {
      ten_god_stem_counts: aggregateTenGodStemCounts(chart, birthUnknown),
      dominant_element: chart.five_elements.dominant,
      weakest_element: chart.five_elements.weakest,
      strength_token: chart.strength.label_token,
      birth_time_unknown: birthUnknown,
      relational_profile: aggregatePersonalRelationalProfile(chart, birthUnknown),
      ssot_gaps: [...DOCUMENTED_SSOT_GAPS],
    },
    exclusions,
    unresolved_references: unresolvedDeduped,
    provenance: {
      ce_version: PERSONAL_CE_VERSION,
      lens: PERSONAL_INNATE_LENS,
      dictionary_version: dict.schema_version,
      chart_schema_version: chart.engine.schema_version,
      chart_engine_id: chart.engine.engine_id,
      chart_input_fingerprint: chart.engine.input_fingerprint,
      chart_ref_data_fingerprint: chart.engine.ref_data_fingerprint,
      report_id: chart.birth.report_id,
      built_at: chart.engine.built_at,
      policy_id: "personal_context_engine_policy_v1",
    },
  };
}
