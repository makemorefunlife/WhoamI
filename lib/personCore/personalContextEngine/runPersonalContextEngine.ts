import {
  getReferenceDictionary,
  REFERENCE_DICTIONARY_VERSION,
} from "../referenceDictionary";
import type { ReferenceDictionary } from "../referenceDictionary";
import {
  PERSONAL_CE_VERSION,
  PERSONAL_INNATE_LENS,
  type PersonalContextGroupId,
} from "./constants";
import {
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

/**
 * Personal Context Engine — personal_innate_v1.
 * Reads Individual SSOT + Dictionary; emits structured packets only.
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
    // Soft note via unresolved-style provenance mismatch is avoided; fail closed.
    throw new Error(
      `Dictionary version mismatch: input=${dictVersion} catalog=${dict.schema_version}`,
    );
  }

  const maxPerGroup = input.options?.max_packets_per_group ?? 8;
  const candidates = selectPersonalInnateCandidates(chart, {
    include_low_confidence: input.options?.include_low_confidence,
    include_unpossessed_specials: input.options?.include_unpossessed_specials,
  });

  const unresolved_references: UnresolvedReference[] = [];
  const exclusions: PersonalContextExclusion[] = [];
  const groups = emptyGroups();
  const packets: PersonalContextPacket[] = [];
  let packetSeq = 0;

  // Sort for determinism: group order, then -weight, then fact_path
  const groupRank = new Map(GROUP_ORDER.map((g, i) => [g, i]));
  const sorted = [...candidates].sort((a, b) => {
    const gr = (groupRank.get(a.group) ?? 99) - (groupRank.get(b.group) ?? 99);
    if (gr !== 0) return gr;
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.fact_path.localeCompare(b.fact_path);
  });

  const groupCounts: Record<PersonalContextGroupId, number> = {
    identity: 0,
    energy: 0,
    strengths: 0,
    cautions: 0,
    growth: 0,
  };

  for (const c of sorted) {
    if (c.exclude) {
      exclusions.push({
        fact_path: c.fact_path,
        reference_ids: c.reference_ids,
        reason: c.exclude.reason,
        detail: c.exclude.detail,
      });
      // Still record unresolved lookups for excluded refs (visibility)
      resolveMeanings(
        c.reference_ids,
        c.fact_path,
        dict,
        unresolved_references,
      );
      continue;
    }

    if (groupCounts[c.group] >= maxPerGroup) {
      exclusions.push({
        fact_path: c.fact_path,
        reference_ids: c.reference_ids,
        reason: "low_priority_cap",
        detail: `max_packets_per_group=${maxPerGroup}`,
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
      fact_path: c.fact_path,
      codes: c.codes.filter((x) => x !== ""),
      reference_ids: c.reference_ids,
      base_meanings: resolved,
      unresolved_reference_ids: unresolvedIds,
      weight: c.weight,
      confidence: c.confidence,
      evidence: c.evidence,
    };

    groups[c.group].push(packet);
    packets.push(packet);
    groupCounts[c.group] += 1;
  }

  // Dedupe unresolved by reference_id + fact_path; sort for determinism
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
    },
  };
}
