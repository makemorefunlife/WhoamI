import type { PairWorkSignals } from "@/lib/personCore/sajuSignals/pairTypes";

export type WorkPrescriptionTopic =
  | "micromanaging_coordination"
  | "leadership_conflict"
  | "office_baseline";

export type WorkPrescriptionEvidence = {
  source: "pair_work_signals";
  signal_paths: string[];
  summary: string;
  snapshot: Partial<{
    micromanaging_poison_index: number;
    micromanaging_band: PairWorkSignals["micromanaging_band"];
    leadership_conflict_index: number;
    leadership_conflict_band: PairWorkSignals["leadership_conflict_band"];
    drive_clash_notes: string[];
  }>;
};

export type WorkPrescriptionItem = {
  topic: WorkPrescriptionTopic;
  headline: string;
  evidence: WorkPrescriptionEvidence;
  do_list: string[];
  dont_list: string[];
};

export const WORK_PRESCRIPTION_VERSION = "work_prescription_v1" as const;

export type WorkPrescriptionPack = {
  schema_version: typeof WORK_PRESCRIPTION_VERSION;
  intro_line: string;
  items: WorkPrescriptionItem[];
};
