import type { Confidence, EvidenceRef } from "../individualSaju/types";
import type {
  PERSONAL_CE_VERSION,
  PERSONAL_INNATE_LENS,
  PersonalContextGroupId,
  PersonalRoleInLens,
} from "./constants";

export type ResolvedBaseMeaning = {
  reference_id: string;
  text_ko: string;
  text_en?: string;
  resolved: true;
};

export type UnresolvedReference = {
  reference_id: string;
  fact_path: string;
  reason: "dictionary_miss";
};

export type PersonalContextPacket = {
  packet_id: string;
  group: PersonalContextGroupId;
  role_in_lens: PersonalRoleInLens;
  /** Dot path into IndividualSajuChart, e.g. day_master.stem */
  fact_path: string;
  codes: string[];
  reference_ids: string[];
  base_meanings: ResolvedBaseMeaning[];
  unresolved_reference_ids: string[];
  weight: number;
  confidence: Confidence;
  evidence: EvidenceRef[];
  /** Hour pillar suppressed when birth time unknown. */
  excluded?: false;
};

export type PersonalContextExclusion = {
  fact_path: string;
  reference_ids: string[];
  reason:
    | "birth_time_unknown"
    | "not_possessed"
    | "low_priority_cap"
    | "empty_fact";
  detail?: string;
};

export type PersonalContextAggregates = {
  ten_god_stem_counts: Record<string, number>;
  dominant_element: string | null;
  weakest_element: string | null;
  strength_token: string | null;
  birth_time_unknown: boolean;
};

export type PersonalContextProvenance = {
  ce_version: typeof PERSONAL_CE_VERSION | string;
  lens: typeof PERSONAL_INNATE_LENS | string;
  dictionary_version: string;
  chart_schema_version: string;
  chart_engine_id: string;
  chart_input_fingerprint: string;
  chart_ref_data_fingerprint: string;
  report_id: string;
  built_at: string;
};

export type PersonalContextEngineInput = {
  chart: import("../individualSaju/types").IndividualSajuChart;
  lens?: typeof PERSONAL_INNATE_LENS;
  locale?: "ko" | "en";
  dictionary_version?: string;
  options?: {
    max_packets_per_group?: number;
    include_low_confidence?: boolean;
    include_unpossessed_specials?: boolean;
  };
};

export type PersonalContextEngineOutput = {
  schema_version: typeof PERSONAL_CE_VERSION | string;
  lens: typeof PERSONAL_INNATE_LENS | string;
  groups: Record<PersonalContextGroupId, PersonalContextPacket[]>;
  packets: PersonalContextPacket[];
  aggregates: PersonalContextAggregates;
  exclusions: PersonalContextExclusion[];
  unresolved_references: UnresolvedReference[];
  provenance: PersonalContextProvenance;
};
