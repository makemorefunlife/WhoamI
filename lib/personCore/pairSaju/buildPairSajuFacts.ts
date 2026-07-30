/**
 * Canonical Pair Fact Layer.
 *
 * Assembler note: `lib/saju/sajuBlueprint.ts` remains the dual-person
 * orchestration/assembly layer (charts + ten-god + one pairAnalysis). This
 * module owns A×B fact emission for Pair CE — blueprint should eventually call
 * here once instead of only `analyzePairSaju`.
 */

import type { ChartContext, PillarSlot } from "@/lib/saju/chartContext";
import {
  ELEMENT_GENERATES,
  ELEMENT_OVERCOMES,
  elementInteraction,
  stemElement,
} from "@/lib/saju/elements";
import {
  analyzeCrossChartRelations,
  analyzeCrossChartStemCombines,
  analyzeCrossChartTrioCombines,
  type CrossChartHit,
  type CrossChartTrioHit,
} from "@/lib/saju/pairChartAnalysis";
import { crossHitPalaceWeight, weightedCrossPriority } from "@/lib/saju/palaceWeight";
import {
  analyzeCrossChartGongmang,
  analyzeCrossChartWonjinGuimun,
} from "@/lib/saju/workPairRiskSignals";
import { voidBranchesForDayPillar } from "../individualSaju/gongmang";
import {
  PAIR_FACT_PALACE_WEIGHT_SOURCE,
  PAIR_SAJU_FACTS_VERSION,
  PAIR_SSOT_GAPS,
} from "./constants";
import { isStemClash } from "./stemClash";
import type {
  PairElementFlowFact,
  PairGongmangSharedFact,
  PairJohuRelationFact,
  PairSajuFacts,
  PairSajuFactsInput,
  PairYongsinAlignmentFact,
} from "./types";

const KO_TO_EN: Record<string, "year" | "month" | "day" | "hour"> = {
  년주: "year",
  월주: "month",
  일주: "day",
  시주: "hour",
};

function hitInvolvesHour(hit: CrossChartHit): {
  aHour: boolean;
  bHour: boolean;
} {
  return {
    aHour: hit.personA_pillarSlot === "시주" || hit.personA_pillar.startsWith("시주"),
    bHour: hit.personB_pillarSlot === "시주" || hit.personB_pillar.startsWith("시주"),
  };
}

function trioInvolvesHour(hit: CrossChartTrioHit): {
  aHour: boolean;
  bHour: boolean;
} {
  let aHour = false;
  let bHour = false;
  for (const c of hit.contributedBranches) {
    if (c.pillarSlot !== "시주") continue;
    if (c.owner === "A") aHour = true;
    else bHour = true;
  }
  return { aHour, bHour };
}

function filterHourHits(
  hits: CrossChartHit[],
  unknownA: boolean,
  unknownB: boolean,
  exclusions: PairSajuFacts["exclusions"],
): CrossChartHit[] {
  const out: CrossChartHit[] = [];
  for (const hit of hits) {
    const { aHour, bHour } = hitInvolvesHour(hit);
    if ((unknownA && aHour) || (unknownB && bHour)) {
      exclusions.push({
        fact_path: `cross_hits:${hit.category ?? hit.type}:${hit.personA_pillar}×${hit.personB_pillar}`,
        reason: "birth_time_unknown",
        detail: "hour pillar excluded — synthetic noon must not count as real hour",
      });
      continue;
    }
    out.push(hit);
  }
  return out;
}

function filterHourTrios(
  hits: CrossChartTrioHit[],
  unknownA: boolean,
  unknownB: boolean,
  exclusions: PairSajuFacts["exclusions"],
): CrossChartTrioHit[] {
  const out: CrossChartTrioHit[] = [];
  for (const hit of hits) {
    const { aHour, bHour } = trioInvolvesHour(hit);
    if ((unknownA && aHour) || (unknownB && bHour)) {
      exclusions.push({
        fact_path: `trio_hits:${hit.label}:${hit.resultCode}`,
        reason: "birth_time_unknown",
        detail: "hour contribution excluded",
      });
      continue;
    }
    out.push(hit);
  }
  return out;
}

function analyzeCrossChartStemClashes(
  chartA: ChartContext,
  chartB: ChartContext,
): CrossChartHit[] {
  const hits: CrossChartHit[] = [];
  const seen = new Set<string>();

  for (const pa of chartA.pillars) {
    for (const pb of chartB.pillars) {
      if (!isStemClash(pa.stemCode, pb.stemCode)) continue;
      const dedupe = `${pa.name}:${pa.stemCode}-${pb.name}:${pb.stemCode}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      const basePriority = 85;
      const hit: CrossChartHit = {
        personA_pillar: `${pa.name}(${pa.pillar})`,
        personB_pillar: `${pb.name}(${pb.pillar})`,
        type: "천간충",
        interpretation: "천간충 — 두 천간이 서로 충돌하는 관계",
        priority: basePriority,
        palaceWeight: 0,
        weightedPriority: basePriority,
        category: "stem_clash",
        personA_pillarSlot: pa.name as PillarSlot,
        personA_code: pa.stemCode,
        personB_pillarSlot: pb.name as PillarSlot,
        personB_code: pb.stemCode,
        detail: "stem_clash",
      };
      hit.palaceWeight = crossHitPalaceWeight(hit);
      hit.weightedPriority = weightedCrossPriority(hit);
      hits.push(hit);
    }
  }
  return hits.sort((a, b) => b.weightedPriority - a.weightedPriority);
}

function buildElementFlow(
  chartA: ChartContext,
  chartB: ChartContext,
): PairElementFlowFact {
  const elA = stemElement.get(chartA.dayStemCode) ?? "unknown";
  const elB = stemElement.get(chartB.dayStemCode) ?? "unknown";
  const label = elementInteraction(elA, elB);

  let interaction_code: PairElementFlowFact["interaction_code"] = "weak";
  let direction: PairElementFlowFact["direction"] = "none";

  if (elA === elB && elA !== "unknown") {
    interaction_code = "same";
    direction = "symmetric";
  } else if (ELEMENT_GENERATES[elA] === elB) {
    interaction_code = "generates_a_to_b";
    direction = "a_to_b";
  } else if (ELEMENT_GENERATES[elB] === elA) {
    interaction_code = "generates_b_to_a";
    direction = "b_to_a";
  } else if (ELEMENT_OVERCOMES[elA] === elB) {
    interaction_code = "overcomes_a_to_b";
    direction = "a_to_b";
  } else if (ELEMENT_OVERCOMES[elB] === elA) {
    interaction_code = "overcomes_b_to_a";
    direction = "b_to_a";
  }

  return {
    day_stem_element_a: elA,
    day_stem_element_b: elB,
    interaction_code,
    interaction_label: label,
    direction,
  };
}

function buildJohuRelation(
  input: PairSajuFactsInput,
): PairJohuRelationFact | null {
  if (!input.johuA || !input.johuB) return null;
  const band_a = input.johuA.temperature_band;
  const band_b = input.johuB.temperature_band;
  const heat_gap = Math.abs(input.johuA.heat_score - input.johuB.heat_score);
  const moisture_gap = Math.abs(
    input.johuA.moisture_score - input.johuB.moisture_score,
  );
  const temperature_mismatch =
    (band_a === "cold" && band_b === "hot") ||
    (band_a === "hot" && band_b === "cold");
  const temperature_complement = temperature_mismatch;
  let relation: PairJohuRelationFact["relation"] = "neutral";
  if (band_a === band_b && band_a !== "neutral") relation = "aligned";
  else if (temperature_complement) relation = "complement";
  else if (temperature_mismatch) relation = "mismatch";

  return {
    band_a,
    band_b,
    heat_gap,
    moisture_gap,
    temperature_mismatch,
    temperature_complement,
    relation,
    confidence: "heuristic",
  };
}

function buildYongsinAlignment(
  input: PairSajuFactsInput,
  exclusions: PairSajuFacts["exclusions"],
): PairYongsinAlignmentFact | null {
  const a = input.yongsinA ?? [];
  const b = input.yongsinB ?? [];
  if (a.length === 0 || b.length === 0) return null;

  const confA = input.yongsinConfidenceA ?? "heuristic";
  const confB = input.yongsinConfidenceB ?? "heuristic";
  if (confA === "low" || confB === "low") {
    exclusions.push({
      fact_path: "yongsin_alignment",
      reason: "low_confidence_omitted",
      detail: "yongsin confidence low on at least one side",
    });
    return null;
  }

  const setB = new Set(b);
  const overlap = a.filter((e) => setB.has(e)).sort();
  return {
    overlap_elements: overlap,
    relation: overlap.length > 0 ? "overlap" : "none",
    confidence: "heuristic",
  };
}

function buildGongmangShared(
  chartA: ChartContext,
  chartB: ChartContext,
): PairGongmangSharedFact | null {
  const void_a = voidBranchesForDayPillar(chartA.dayStemCode, chartA.dayBranchCode);
  const void_b = voidBranchesForDayPillar(chartB.dayStemCode, chartB.dayBranchCode);
  const setB = new Set(void_b);
  const shared = void_a.filter((c) => setB.has(c)).sort();
  if (shared.length === 0) return null;
  return { shared_void_branches: shared, void_a, void_b };
}

/**
 * Build canonical Pair facts from two ChartContexts (+ optional Individual enrichments).
 * Does not invent unsupported facts (mutual 천을, cross ten-god roles, 격국).
 */
export function buildPairSajuFacts(input: PairSajuFactsInput): PairSajuFacts {
  const unknownA = Boolean(input.birthTimeUnknownA);
  const unknownB = Boolean(input.birthTimeUnknownB);
  const exclusions: PairSajuFacts["exclusions"] = [];

  const branchHits = analyzeCrossChartRelations(input.chartA, input.chartB);
  const stemCombines = analyzeCrossChartStemCombines(input.chartA, input.chartB);
  const stemClashes = analyzeCrossChartStemClashes(input.chartA, input.chartB);
  const wonjin = analyzeCrossChartWonjinGuimun(input.chartA, input.chartB);
  const gongmang = analyzeCrossChartGongmang(input.chartA, input.chartB);
  const triosRaw = analyzeCrossChartTrioCombines(input.chartA, input.chartB);

  const merged = [
    ...branchHits,
    ...stemCombines,
    ...stemClashes,
    ...wonjin,
    ...gongmang,
  ].sort((a, b) => b.weightedPriority - a.weightedPriority);

  const cross_hits = filterHourHits(merged, unknownA, unknownB, exclusions);
  const trio_hits = filterHourTrios(triosRaw, unknownA, unknownB, exclusions);

  const johu_relation = buildJohuRelation(input);
  const yongsin_alignment = buildYongsinAlignment(input, exclusions);
  const gongmang_shared = buildGongmangShared(input.chartA, input.chartB);

  return {
    schema_version: PAIR_SAJU_FACTS_VERSION,
    report_id_a: input.reportIdA ?? "a",
    report_id_b: input.reportIdB ?? "b",
    birth_time_unknown_a: unknownA,
    birth_time_unknown_b: unknownB,
    cross_hits,
    trio_hits,
    element_flow: buildElementFlow(input.chartA, input.chartB),
    johu_relation,
    yongsin_alignment,
    gongmang_shared,
    ssot_gaps: PAIR_SSOT_GAPS,
    exclusions,
    provenance: {
      pair_fact_version: PAIR_SAJU_FACTS_VERSION,
      palace_weight_source: PAIR_FACT_PALACE_WEIGHT_SOURCE,
      gongmang_method: "xunkong_by_day_pillar_v1",
      built_at: new Date().toISOString(),
    },
  };
}

/** Map Korean palace label → English slot used by Pair CE packets. */
export function koPalaceToEn(slot: string | undefined): "year" | "month" | "day" | "hour" | undefined {
  if (!slot) return undefined;
  return KO_TO_EN[slot] ?? KO_TO_EN[slot.slice(0, 2)];
}
