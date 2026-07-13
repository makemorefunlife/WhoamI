import type { PairCohabitationSignals } from "@/lib/personCore/sajuSignals/pairTypes";

/** 동거·부부 처방전 주제 — pair.cohabitation 신호와 1:1 대응 */
export type CohabitationPrescriptionTopic =
  | "secret_affinity"
  | "cfo_power_struggle"
  | "day_palace_tension"
  | "home_baseline";

export type CohabitationPrescriptionEvidence = {
  source: "pair_cohabitation_signals";
  /** pair.cohabitation 내 근거 필드 경로 */
  signal_paths: string[];
  summary: string;
  snapshot: Partial<{
    dual_cfo_war: PairCohabitationSignals["cfo_power_struggle"]["dual_cfo_war"];
    struggle_score: number;
    struggle_band: PairCohabitationSignals["cfo_power_struggle"]["struggle_band"];
    leader_side: PairCohabitationSignals["cfo_power_struggle"]["leader_side"];
    secret_affinity_present: boolean;
    affinity_index: number;
    affinity_link_count: number;
    cross_relation_type: string | null;
    cross_tension_index: number;
    branch_a: string;
    branch_b: string;
  }>;
};

export type CohabitationPrescriptionItem = {
  topic: CohabitationPrescriptionTopic;
  /** 한 줄 핵심 — UI·캐시 호환용 */
  headline: string;
  evidence: CohabitationPrescriptionEvidence;
  do_list: string[];
  dont_list: string[];
};

export const COHABITATION_PRESCRIPTION_VERSION =
  "cohabitation_prescription_v1" as const;

export type CohabitationPrescriptionPack = {
  schema_version: typeof COHABITATION_PRESCRIPTION_VERSION;
  intro_line: string;
  items: CohabitationPrescriptionItem[];
};
