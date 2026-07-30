import type { ChartContext, PillarSlot as KoPillarSlot } from "@/lib/saju/chartContext";
import type {
  CrossChartHit,
  CrossChartTrioHit,
} from "@/lib/saju/pairChartAnalysis";
import type { PAIR_SAJU_FACTS_VERSION, PairSsotGap } from "./constants";

export type EnPillarSlot = "year" | "month" | "day" | "hour";

export type PairPartyId = "A" | "B";

export type PairElementFlowFact = {
  day_stem_element_a: string;
  day_stem_element_b: string;
  /** Raw elementInteraction string — structural, not domain copy. */
  interaction_code:
    | "generates_a_to_b"
    | "generates_b_to_a"
    | "overcomes_a_to_b"
    | "overcomes_b_to_a"
    | "same"
    | "weak";
  interaction_label: string;
  direction: "a_to_b" | "b_to_a" | "symmetric" | "none";
};

export type PairJohuRelationFact = {
  band_a: "cold" | "neutral" | "hot";
  band_b: "cold" | "neutral" | "hot";
  heat_gap: number;
  moisture_gap: number;
  temperature_mismatch: boolean;
  temperature_complement: boolean;
  relation:
    | "aligned"
    | "complement"
    | "mismatch"
    | "neutral";
  confidence: "deterministic" | "heuristic";
};

export type PairYongsinAlignmentFact = {
  overlap_elements: string[];
  relation: "overlap" | "none";
  confidence: "heuristic" | "low";
};

export type PairGongmangSharedFact = {
  shared_void_branches: string[];
  void_a: string[];
  void_b: string[];
};

export type PairSajuFactsInput = {
  chartA: ChartContext;
  chartB: ChartContext;
  reportIdA?: string;
  reportIdB?: string;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  /** Optional johu bands/scores from Individual / PersonCore. */
  johuA?: {
    temperature_band: "cold" | "neutral" | "hot";
    moisture_band?: string;
    heat_score: number;
    moisture_score: number;
  };
  johuB?: {
    temperature_band: "cold" | "neutral" | "hot";
    moisture_band?: string;
    heat_score: number;
    moisture_score: number;
  };
  /** Optional favorable element codes from Individual. */
  yongsinA?: string[];
  yongsinB?: string[];
  yongsinConfidenceA?: "deterministic" | "heuristic" | "low" | string;
  yongsinConfidenceB?: "deterministic" | "heuristic" | "low" | string;
};

export type PairSajuFacts = {
  schema_version: typeof PAIR_SAJU_FACTS_VERSION;
  report_id_a: string;
  report_id_b: string;
  birth_time_unknown_a: boolean;
  birth_time_unknown_b: boolean;
  /** Unified cross hits (branch + stem combine + stem clash + wonjin/guimun + gongmang). Hour-filtered. */
  cross_hits: CrossChartHit[];
  trio_hits: CrossChartTrioHit[];
  element_flow: PairElementFlowFact | null;
  johu_relation: PairJohuRelationFact | null;
  yongsin_alignment: PairYongsinAlignmentFact | null;
  gongmang_shared: PairGongmangSharedFact | null;
  ssot_gaps: readonly PairSsotGap[];
  exclusions: Array<{
    fact_path: string;
    reason: "birth_time_unknown" | "empty_fact" | "low_confidence_omitted";
    detail?: string;
  }>;
  provenance: {
    pair_fact_version: typeof PAIR_SAJU_FACTS_VERSION;
    palace_weight_source: string;
    gongmang_method: "xunkong_by_day_pillar_v1";
    built_at: string;
  };
};

export type { CrossChartHit, CrossChartTrioHit, KoPillarSlot };
