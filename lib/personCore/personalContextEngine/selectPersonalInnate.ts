import type { IndividualSajuChart, PillarFact } from "../individualSaju/types";
import type { PersonalContextGroupId, PersonalRoleInLens } from "./constants";
import type { Confidence, EvidenceRef } from "../individualSaju/types";

export type CandidateFact = {
  fact_path: string;
  group: PersonalContextGroupId;
  role_in_lens: PersonalRoleInLens;
  codes: string[];
  reference_ids: string[];
  weight: number;
  confidence: Confidence;
  evidence: EvidenceRef[];
  /** When true, emit as exclusion instead of packet. */
  exclude?: {
    reason: "birth_time_unknown" | "not_possessed" | "empty_fact";
    detail?: string;
  };
};

function pillarBySlot(
  chart: IndividualSajuChart,
  slot: PillarFact["slot"],
): PillarFact | undefined {
  return chart.pillars.find((p) => p.slot === slot);
}

function downgradeConfidence(c: Confidence): Confidence {
  if (c === "deterministic") return "high";
  if (c === "high") return "medium";
  if (c === "medium") return "low";
  return c;
}

/**
 * Deterministic candidate selection for personal_innate_v1.
 * Does not recalculate Saju facts — only reads IndividualSajuChart.
 */
export function selectPersonalInnateCandidates(
  chart: IndividualSajuChart,
  options?: {
    include_low_confidence?: boolean;
    include_unpossessed_specials?: boolean;
  },
): CandidateFact[] {
  const unknownHour = chart.birth.birth_time_unknown === true;
  const includeLow = options?.include_low_confidence !== false;
  const includeUnpossessed = options?.include_unpossessed_specials === true;
  const out: CandidateFact[] = [];

  const day = pillarBySlot(chart, "day");
  const month = pillarBySlot(chart, "month");
  const year = pillarBySlot(chart, "year");
  const hour = pillarBySlot(chart, "hour");

  // —— identity ——
  out.push({
    fact_path: "day_master.stem",
    group: "identity",
    role_in_lens: "identity_core",
    codes: [chart.day_master.stem.code, chart.day_master.element],
    reference_ids: [
      chart.day_master.stem.reference_id,
      `element:${chart.day_master.element}`,
      "pillar_slot:day",
    ],
    weight: 1.0,
    confidence: "deterministic",
    evidence: [
      {
        kind: "stem",
        pillar_slot: "day",
        codes: [chart.day_master.stem.code],
        detail: "day_master",
      },
    ],
  });

  out.push({
    fact_path: "day_master.day_branch",
    group: "identity",
    role_in_lens: "identity_core",
    codes: [chart.day_master.day_branch.code],
    reference_ids: [chart.day_master.day_branch.reference_id],
    weight: 0.92,
    confidence: "deterministic",
    evidence: [
      {
        kind: "branch",
        pillar_slot: "day",
        codes: [chart.day_master.day_branch.code],
        detail: "day_branch",
      },
    ],
  });

  if (day) {
    out.push({
      fact_path: "pillars.day.stem_ten_god",
      group: "identity",
      role_in_lens: "identity_support",
      codes: [day.stem_ten_god.code],
      reference_ids: [day.stem_ten_god.reference_id],
      weight: 0.55,
      confidence: "deterministic",
      evidence: [
        {
          kind: "stem",
          pillar_slot: "day",
          codes: [day.stem_ten_god.code],
          detail: "day_stem_ten_god",
        },
      ],
    });
    out.push({
      fact_path: "pillars.day.branch_ten_god",
      group: "identity",
      role_in_lens: "identity_support",
      codes: [day.branch_ten_god.code],
      reference_ids: [day.branch_ten_god.reference_id],
      weight: 0.5,
      confidence: "high",
      evidence: [
        {
          kind: "branch",
          pillar_slot: "day",
          codes: [day.branch_ten_god.code],
          detail: day.branch_ten_god_method,
        },
      ],
    });
  }

  // —— energy ——
  if (month) {
    out.push({
      fact_path: "pillars.month.twelve_stage",
      group: "energy",
      role_in_lens: "energy_pattern",
      codes: [month.twelve_stage.code, month.twelve_stage.energy_level ?? ""],
      reference_ids: [month.twelve_stage.reference_id],
      weight: 0.88,
      confidence: "deterministic",
      evidence: [
        {
          kind: "branch",
          pillar_slot: "month",
          codes: [month.twelve_stage.code],
          detail: "month_twelve_stage",
        },
      ],
    });
  }

  out.push({
    fact_path: "seasonal_strength",
    group: "energy",
    role_in_lens: "energy_pattern",
    codes: [
      chart.seasonal_strength.month_branch_code,
      chart.seasonal_strength.in_season ? "in_season" : "out_of_season",
      String(chart.seasonal_strength.season_score),
    ],
    reference_ids: [
      `branch:${chart.seasonal_strength.month_branch_code}`,
      `pillar_slot:month`,
    ],
    weight: 0.7,
    confidence: chart.seasonal_strength.confidence,
    evidence: chart.seasonal_strength.evidence,
  });

  out.push({
    fact_path: "johu.temperature_band",
    group: "energy",
    role_in_lens: "energy_pattern",
    codes: [chart.johu.temperature_band, String(chart.johu.heat_score)],
    reference_ids: [`johu_temp:${chart.johu.temperature_band}`],
    weight: 0.62,
    confidence: chart.johu.confidence,
    evidence: chart.johu.evidence,
  });

  out.push({
    fact_path: "johu.moisture_band",
    group: "energy",
    role_in_lens: "energy_pattern",
    codes: [chart.johu.moisture_band, String(chart.johu.moisture_score)],
    reference_ids: [`johu_moist:${chart.johu.moisture_band}`],
    weight: 0.55,
    confidence: chart.johu.confidence,
    evidence: chart.johu.evidence,
  });

  out.push({
    fact_path: "five_elements.dominant",
    group: "energy",
    role_in_lens: "energy_pattern",
    codes: [chart.five_elements.dominant],
    reference_ids: [`element:${chart.five_elements.dominant}`],
    weight: 0.72,
    confidence: chart.five_elements.confidence,
    evidence: chart.five_elements.evidence,
  });

  // —— strengths ——
  out.push({
    fact_path: "strength.label_token",
    group: "strengths",
    role_in_lens: "strength_signal",
    codes: [chart.strength.label_token, chart.strength.label_code],
    reference_ids: [`strength:${chart.strength.label_token}`],
    weight: 0.8,
    confidence: chart.strength.confidence,
    evidence: chart.strength.evidence,
  });

  out.push({
    fact_path: "rootedness",
    group: "strengths",
    role_in_lens: "strength_signal",
    codes: [
      chart.rootedness.day_stem_rooted_in_day_branch ? "rooted" : "not_rooted",
      String(chart.rootedness.rootedness_index),
    ],
    reference_ids: [chart.day_master.stem.reference_id],
    weight: 0.68,
    confidence: chart.rootedness.confidence,
    evidence: chart.rootedness.evidence,
  });

  for (const nobleId of chart.nobles.noble_hits) {
    out.push({
      fact_path: `nobles.${nobleId}`,
      group: "strengths",
      role_in_lens: "strength_signal",
      codes: [nobleId],
      reference_ids: [`noble:${nobleId}`],
      weight: 0.64,
      confidence: "high",
      evidence: [
        { kind: "shinsal", codes: [nobleId], detail: "noble_hit" },
      ],
    });
  }

  // possessed special signals that read as affinity / mobility (not caution)
  for (const sig of chart.special_signals) {
    if (sig.signal_id === "dohwa" || sig.signal_id === "yeokma") {
      if (!sig.possessed && !includeUnpossessed) continue;
      out.push({
        fact_path: `special_signals.${sig.signal_id}`,
        group: sig.possessed ? "strengths" : "cautions",
        role_in_lens: sig.possessed ? "strength_signal" : "caution_signal",
        codes: [sig.signal_id, sig.possessed ? "possessed" : "absent"],
        reference_ids: [`special:${sig.signal_id}`],
        weight: sig.possessed ? 0.58 : 0.2,
        confidence: sig.possessed ? "high" : "low",
        evidence: sig.evidence,
        exclude: sig.possessed
          ? undefined
          : { reason: "not_possessed", detail: sig.signal_id },
      });
    }
  }

  // —— cautions ——
  out.push({
    fact_path: "five_elements.weakest",
    group: "cautions",
    role_in_lens: "caution_signal",
    codes: [chart.five_elements.weakest],
    reference_ids: [`element:${chart.five_elements.weakest}`],
    weight: 0.7,
    confidence: chart.five_elements.confidence,
    evidence: chart.five_elements.evidence,
  });

  if (chart.gongmang.void_branch_codes.length > 0) {
    out.push({
      fact_path: "gongmang",
      group: "cautions",
      role_in_lens: "caution_signal",
      codes: [...chart.gongmang.void_branch_codes],
      reference_ids: [
        "gongmang:void",
        ...chart.gongmang.void_branch_codes.map((c) => `branch:${c}`),
      ],
      weight: 0.66,
      confidence: chart.gongmang.confidence,
      evidence: chart.gongmang.evidence,
    });
  }

  for (const sig of chart.special_signals) {
    if (sig.signal_id === "wonjin" || sig.signal_id === "guimun") {
      if (!sig.possessed && !includeUnpossessed) {
        out.push({
          fact_path: `special_signals.${sig.signal_id}`,
          group: "cautions",
          role_in_lens: "caution_signal",
          codes: [sig.signal_id],
          reference_ids: [`special:${sig.signal_id}`],
          weight: 0,
          confidence: "low",
          evidence: [],
          exclude: { reason: "not_possessed", detail: sig.signal_id },
        });
        continue;
      }
      if (!sig.possessed) continue;
      out.push({
        fact_path: `special_signals.${sig.signal_id}`,
        group: "cautions",
        role_in_lens: "caution_signal",
        codes: [sig.signal_id, "possessed"],
        reference_ids: [`special:${sig.signal_id}`],
        weight: 0.74,
        confidence: "high",
        evidence: sig.evidence,
      });
    }
  }

  // top intra relations by priority (cap 3)
  const relations = [...chart.relations_intra].sort(
    (a, b) => b.priority - a.priority,
  );
  for (const rel of relations.slice(0, 3)) {
    const refs = [
      `relation_type:${rel.type_id}`,
      ...(rel.reference_id ? [rel.reference_id] : []),
    ];
    out.push({
      fact_path: `relations_intra.${rel.type_id}.${rel.codes.join("+")}`,
      group: "cautions",
      role_in_lens: "caution_signal",
      codes: [...rel.codes, rel.type_id],
      reference_ids: refs,
      weight: Math.min(0.75, 0.4 + rel.priority / 200),
      confidence: "high",
      evidence: rel.evidence,
    });
  }

  // —— growth ——
  if (includeLow || chart.favorable_elements.confidence !== "low") {
    for (const el of chart.favorable_elements.yongsin) {
      out.push({
        fact_path: "favorable_elements.yongsin",
        group: "growth",
        role_in_lens: "growth_signal",
        codes: [el, chart.favorable_elements.method],
        reference_ids: [`element:${el}`],
        weight: 0.6,
        confidence: chart.favorable_elements.confidence,
        evidence: chart.favorable_elements.evidence,
      });
    }
    for (const el of chart.favorable_elements.huisin) {
      out.push({
        fact_path: "favorable_elements.huisin",
        group: "growth",
        role_in_lens: "growth_signal",
        codes: [el],
        reference_ids: [`element:${el}`],
        weight: 0.48,
        confidence: chart.favorable_elements.confidence,
        evidence: chart.favorable_elements.evidence,
      });
    }
  }

  if (year) {
    out.push({
      fact_path: "pillars.year.twelve_stage",
      group: "growth",
      role_in_lens: "growth_signal",
      codes: [year.twelve_stage.code],
      reference_ids: [year.twelve_stage.reference_id],
      weight: 0.42,
      confidence: "high",
      evidence: [
        {
          kind: "branch",
          pillar_slot: "year",
          codes: [year.twelve_stage.code],
          detail: "year_twelve_stage",
        },
      ],
    });
  }

  // —— hour pillar: exclude or include with unknown-time policy ——
  if (hour) {
    const hourFacts: CandidateFact[] = [
      {
        fact_path: "pillars.hour.stem",
        group: "identity",
        role_in_lens: "identity_support",
        codes: [hour.stem.code],
        reference_ids: [hour.stem.reference_id],
        weight: 0.45,
        confidence: "deterministic",
        evidence: [
          {
            kind: "stem",
            pillar_slot: "hour",
            codes: [hour.stem.code],
            detail: "hour_stem",
          },
        ],
      },
      {
        fact_path: "pillars.hour.twelve_stage",
        group: "energy",
        role_in_lens: "energy_pattern",
        codes: [hour.twelve_stage.code],
        reference_ids: [hour.twelve_stage.reference_id],
        weight: 0.4,
        confidence: "deterministic",
        evidence: [
          {
            kind: "branch",
            pillar_slot: "hour",
            codes: [hour.twelve_stage.code],
            detail: "hour_twelve_stage",
          },
        ],
      },
    ];

    for (const hf of hourFacts) {
      if (unknownHour) {
        out.push({
          ...hf,
          weight: 0,
          confidence: downgradeConfidence(hf.confidence),
          exclude: {
            reason: "birth_time_unknown",
            detail: "hour pillar not used when birth time unknown",
          },
        });
      } else {
        out.push(hf);
      }
    }
  }

  // Remaining shinsal hits (skip names already covered as nobles)
  const nobleSlugs = new Set(
    chart.nobles.noble_hits.map((id) => id.replace(/_/g, "")),
  );
  for (const hit of chart.shinsal_hits) {
    if (hit.slug.includes("귀인")) continue;
    if (nobleSlugs.has(hit.slug.replace(/_/g, ""))) continue;
    const cat = hit.category ?? "";
    const isCaution =
      cat === "misfortune" || cat === "relationship" || cat === "personality";
    out.push({
      fact_path: `shinsal_hits.${hit.reference_id}`,
      group: isCaution ? "cautions" : "strengths",
      role_in_lens: isCaution ? "caution_signal" : "strength_signal",
      codes: [hit.slug, cat],
      reference_ids: [hit.reference_id],
      weight: isCaution ? 0.52 : 0.5,
      confidence: "high",
      evidence: hit.evidence,
    });
  }

  return out;
}

/** Surface stem ten-god counts from chart pillars (no recalculation of gods). */
export function aggregateTenGodStemCounts(
  chart: IndividualSajuChart,
  birthTimeUnknown: boolean,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of chart.pillars) {
    if (birthTimeUnknown && p.slot === "hour") continue;
    const code = p.stem_ten_god.code;
    counts[code] = (counts[code] ?? 0) + 1;
  }
  return counts;
}
