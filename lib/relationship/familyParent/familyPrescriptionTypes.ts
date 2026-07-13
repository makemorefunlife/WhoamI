import type { PairFamilySignals } from "@/lib/personCore/sajuSignals/pairTypes";

export type FamilyPrescriptionTopic =
  | "umbilical_independence"
  | "nagging_karma_avoidance"
  | "family_baseline";

export type FamilyPrescriptionEvidence = {
  source: "pair_family_signals";
  signal_paths: string[];
  summary: string;
  snapshot: Partial<{
    umbilical_separation_index: number;
    umbilical_band: PairFamilySignals["umbilical_band"];
    nagging_trigger_index: number;
    nagging_band: PairFamilySignals["nagging_band"];
    combined_karma_tension: number;
  }>;
};

export type FamilyPrescriptionItem = {
  topic: FamilyPrescriptionTopic;
  headline: string;
  evidence: FamilyPrescriptionEvidence;
  do_list: string[];
  dont_list: string[];
};

export const FAMILY_PRESCRIPTION_VERSION = "family_prescription_v1" as const;

export type FamilyPrescriptionPack = {
  schema_version: typeof FAMILY_PRESCRIPTION_VERSION;
  intro_line: string;
  items: FamilyPrescriptionItem[];
};
