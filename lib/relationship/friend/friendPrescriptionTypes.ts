import type { PairFriendshipSignals } from "@/lib/personCore/sajuSignals/pairTypes";

export type FriendPrescriptionTopic =
  | "energy_drain_prevention"
  | "communication_climate"
  | "friendship_baseline";

export type FriendPrescriptionEvidence = {
  source: "pair_friendship_signals";
  signal_paths: string[];
  summary: string;
  snapshot: Partial<{
    energy_drain_index: number;
    energy_drain_band: PairFriendshipSignals["energy_drain_band"];
    heat_gap: number;
    moisture_gap: number;
    temperature_mismatch: boolean;
    band_a: PairFriendshipSignals["johu_gap"]["band_a"];
    band_b: PairFriendshipSignals["johu_gap"]["band_b"];
  }>;
};

export type FriendPrescriptionItem = {
  topic: FriendPrescriptionTopic;
  headline: string;
  evidence: FriendPrescriptionEvidence;
  do_list: string[];
  dont_list: string[];
};

export const FRIEND_PRESCRIPTION_VERSION = "friend_prescription_v1" as const;

export type FriendPrescriptionPack = {
  schema_version: typeof FRIEND_PRESCRIPTION_VERSION;
  intro_line: string;
  items: FriendPrescriptionItem[];
};
