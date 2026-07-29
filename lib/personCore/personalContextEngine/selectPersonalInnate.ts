/**
 * personal_innate_v1 candidate selection — policy-aligned.
 * Reads IndividualSajuChart only; no Saju recalculation.
 */

import type { IndividualSajuChart, PillarFact } from "../individualSaju/types";
import type { Confidence, EvidenceRef } from "../individualSaju/types";
import {
  COMBINE_RELATION_TYPES,
  POLICY_DEFAULTS,
  TENSION_RELATION_TYPES,
  type PersonalContextGroupId,
  type PersonalRoleInLens,
  type PersonalSignalTier,
} from "./constants";

export type CandidateFact = {
  fact_path: string;
  group: PersonalContextGroupId;
  role_in_lens: PersonalRoleInLens;
  tier: PersonalSignalTier;
  codes: string[];
  reference_ids: string[];
  selection_priority: number;
  confidence: Confidence;
  evidence: EvidenceRef[];
  exclude?: {
    reason:
      | "birth_time_unknown"
      | "not_possessed"
      | "empty_fact"
      | "deduped"
      | "low_confidence_omitted";
    detail?: string;
  };
};

function pillarBySlot(
  chart: IndividualSajuChart,
  slot: PillarFact["slot"],
): PillarFact | undefined {
  return chart.pillars.find((p) => p.slot === slot);
}

function pushStemTenGod(
  out: CandidateFact[],
  pillar: PillarFact,
  selection_priority: number,
  unknownHour: boolean,
): void {
  const path = `pillars.${pillar.slot}.stem_ten_god`;
  // Day stem vs itself is NEVER an interpretation packet.
  if (pillar.slot === "day") return;

  if (pillar.slot === "hour" && unknownHour) {
    out.push({
      fact_path: path,
      group: "identity",
      role_in_lens: "identity_support",
      tier: 2,
      codes: [pillar.stem_ten_god.code],
      reference_ids: [pillar.stem_ten_god.reference_id],
      selection_priority: 0,
      confidence: "deterministic",
      evidence: [
        {
          kind: "stem",
          pillar_slot: "hour",
          codes: [pillar.stem_ten_god.code],
          detail: "hour_stem_ten_god",
        },
      ],
      exclude: {
        reason: "birth_time_unknown",
        detail: "hour stem ten-god omitted when birth time unknown",
      },
    });
    return;
  }

  out.push({
    fact_path: path,
    group: "identity",
    role_in_lens: "identity_support",
    tier: 2,
    codes: [pillar.stem_ten_god.code, pillar.slot],
    reference_ids: [pillar.stem_ten_god.reference_id],
    selection_priority,
    confidence: "deterministic",
    evidence: [
      {
        kind: "stem",
        pillar_slot: pillar.slot,
        codes: [pillar.stem_ten_god.code],
        detail: `${pillar.slot}_stem_ten_god_vs_day_master`,
      },
    ],
  });
}

function pushRelationFamily(
  out: CandidateFact[],
  chart: IndividualSajuChart,
  typeSet: Set<string>,
  group: PersonalContextGroupId,
  role: PersonalRoleInLens,
  maxN: number,
): void {
  const rows = chart.relations_intra
    .filter((r) => typeSet.has(r.type_id))
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.type_id.localeCompare(b.type_id) || a.codes.join().localeCompare(b.codes.join());
    });

  for (const rel of rows.slice(0, maxN)) {
    const refs = [
      `relation_type:${rel.type_id}`,
      ...(rel.reference_id ? [rel.reference_id] : []),
    ];
    out.push({
      fact_path: `relations_intra.${rel.type_id}.${rel.codes.join("+")}`,
      group,
      role_in_lens: role,
      tier: 2,
      codes: [...rel.codes, rel.type_id],
      reference_ids: refs,
      selection_priority: Math.min(0.78, 0.55 + rel.priority / 400),
      confidence: "high",
      evidence: rel.evidence,
    });
  }
}

/**
 * Deterministic candidate selection for personal_innate_v1 (policy-aligned).
 */
export function selectPersonalInnateCandidates(
  chart: IndividualSajuChart,
  options?: {
    include_low_confidence?: boolean;
    include_unpossessed_specials?: boolean;
    max_nobles?: number;
    max_non_noble_shinsal?: number;
    max_combine_relations?: number;
    max_tension_relations?: number;
  },
): CandidateFact[] {
  const unknownHour = chart.birth.birth_time_unknown === true;
  const includeLow =
    options?.include_low_confidence ?? POLICY_DEFAULTS.include_low_confidence;
  const maxNobles = options?.max_nobles ?? POLICY_DEFAULTS.max_nobles;
  const maxShinsal =
    options?.max_non_noble_shinsal ?? POLICY_DEFAULTS.max_non_noble_shinsal;
  const maxCombine =
    options?.max_combine_relations ?? POLICY_DEFAULTS.max_combine_relations;
  const maxTension =
    options?.max_tension_relations ?? POLICY_DEFAULTS.max_tension_relations;

  const out: CandidateFact[] = [];
  const day = pillarBySlot(chart, "day");
  const month = pillarBySlot(chart, "month");
  const year = pillarBySlot(chart, "year");
  const hour = pillarBySlot(chart, "hour");

  // —— T1 identity core ——
  out.push({
    fact_path: "day_master.stem",
    group: "identity",
    role_in_lens: "identity_core",
    tier: 1,
    codes: [chart.day_master.stem.code, chart.day_master.element],
    reference_ids: [
      chart.day_master.stem.reference_id,
      `element:${chart.day_master.element}`,
      "pillar_slot:day",
    ],
    selection_priority: 1.0,
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
    tier: 1,
    codes: [chart.day_master.day_branch.code],
    reference_ids: [chart.day_master.day_branch.reference_id],
    selection_priority: 0.92,
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

  // Day branch ten-god vs 일간 (valid). Day stem ten-god intentionally omitted.
  if (day) {
    out.push({
      fact_path: "pillars.day.branch_ten_god",
      group: "identity",
      role_in_lens: "identity_support",
      tier: 2,
      codes: [day.branch_ten_god.code],
      reference_ids: [day.branch_ten_god.reference_id],
      selection_priority: 0.68,
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

    out.push({
      fact_path: "pillars.day.twelve_stage",
      group: "energy",
      role_in_lens: "energy_pattern",
      tier: 1,
      codes: [day.twelve_stage.code, day.twelve_stage.energy_level ?? ""],
      reference_ids: [day.twelve_stage.reference_id],
      selection_priority: 0.9,
      confidence: "deterministic",
      evidence: [
        {
          kind: "branch",
          pillar_slot: "day",
          codes: [day.twelve_stage.code],
          detail: "day_twelve_stage",
        },
      ],
    });
  }

  if (year) pushStemTenGod(out, year, 0.7, unknownHour);
  if (month) pushStemTenGod(out, month, 0.74, unknownHour);
  if (hour) pushStemTenGod(out, hour, 0.58, unknownHour);

  // —— T1/T2 energy ——
  if (month) {
    out.push({
      fact_path: "pillars.month.twelve_stage",
      group: "energy",
      role_in_lens: "energy_pattern",
      tier: 1,
      codes: [month.twelve_stage.code, month.twelve_stage.energy_level ?? ""],
      reference_ids: [month.twelve_stage.reference_id],
      selection_priority: 0.88,
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
    fact_path: "five_elements.dominant",
    group: "energy",
    role_in_lens: "energy_pattern",
    tier: 1,
    codes: [chart.five_elements.dominant],
    reference_ids: [`element:${chart.five_elements.dominant}`],
    selection_priority: 0.86,
    confidence: chart.five_elements.confidence,
    evidence: chart.five_elements.evidence,
  });

  out.push({
    fact_path: "seasonal_strength",
    group: "energy",
    role_in_lens: "energy_pattern",
    tier: 2,
    codes: [
      chart.seasonal_strength.month_branch_code,
      chart.seasonal_strength.in_season ? "in_season" : "out_of_season",
      String(chart.seasonal_strength.season_score),
    ],
    reference_ids: [
      `branch:${chart.seasonal_strength.month_branch_code}`,
      "pillar_slot:month",
    ],
    selection_priority: 0.72,
    confidence: chart.seasonal_strength.confidence,
    evidence: chart.seasonal_strength.evidence,
  });

  // 조후 — documented T3 priority within energy (above nobles/modifiers)
  out.push({
    fact_path: "johu.temperature_band",
    group: "energy",
    role_in_lens: "energy_pattern",
    tier: 3,
    codes: [chart.johu.temperature_band, String(chart.johu.heat_score)],
    reference_ids: [`johu_temp:${chart.johu.temperature_band}`],
    selection_priority: 0.54,
    confidence: chart.johu.confidence,
    evidence: chart.johu.evidence,
  });
  out.push({
    fact_path: "johu.moisture_band",
    group: "energy",
    role_in_lens: "energy_pattern",
    tier: 3,
    codes: [chart.johu.moisture_band, String(chart.johu.moisture_score)],
    reference_ids: [`johu_moist:${chart.johu.moisture_band}`],
    selection_priority: 0.52,
    confidence: chart.johu.confidence,
    evidence: chart.johu.evidence,
  });

  // 합 → energy; 충/형/파/해/원진/귀문 → cautions
  pushRelationFamily(
    out,
    chart,
    COMBINE_RELATION_TYPES,
    "energy",
    "energy_pattern",
    maxCombine,
  );
  pushRelationFamily(
    out,
    chart,
    TENSION_RELATION_TYPES,
    "cautions",
    "caution_signal",
    maxTension,
  );

  const hasWonjinRel = chart.relations_intra.some((r) => r.type_id === "wonjin");
  const hasGuimunRel = chart.relations_intra.some((r) => r.type_id === "guimun");

  // —— strengths / cautions core ——
  out.push({
    fact_path: "strength.label_token",
    group: "strengths",
    role_in_lens: "strength_signal",
    tier: 1,
    codes: [chart.strength.label_token, chart.strength.label_code],
    reference_ids: [`strength:${chart.strength.label_token}`],
    selection_priority: 0.88,
    confidence: chart.strength.confidence,
    evidence: chart.strength.evidence,
  });

  const rooted = chart.rootedness.day_stem_rooted_in_day_branch;
  out.push({
    fact_path: "rootedness",
    group: rooted ? "strengths" : "cautions",
    role_in_lens: rooted ? "strength_signal" : "caution_signal",
    tier: 2,
    codes: [
      rooted ? "rooted" : "not_rooted",
      String(chart.rootedness.rootedness_index),
    ],
    reference_ids: [chart.day_master.stem.reference_id],
    selection_priority: 0.7,
    confidence: chart.rootedness.confidence,
    evidence: chart.rootedness.evidence,
  });

  out.push({
    fact_path: "five_elements.weakest",
    group: "cautions",
    role_in_lens: "caution_signal",
    tier: 2,
    codes: [chart.five_elements.weakest],
    reference_ids: [`element:${chart.five_elements.weakest}`],
    selection_priority: 0.7,
    confidence: chart.five_elements.confidence,
    evidence: chart.five_elements.evidence,
  });

  if (chart.gongmang.void_branch_codes.length > 0) {
    out.push({
      fact_path: "gongmang",
      group: "cautions",
      role_in_lens: "modifier_signal",
      tier: 2,
      codes: [...chart.gongmang.void_branch_codes],
      reference_ids: [
        "gongmang:void",
        ...chart.gongmang.void_branch_codes.map((c) => `branch:${c}`),
      ],
      selection_priority: 0.66,
      confidence: chart.gongmang.confidence,
      evidence: chart.gongmang.evidence,
    });
  }

  const nobles = [...chart.nobles.noble_hits].sort();
  for (const [i, nobleId] of nobles.entries()) {
    if (i >= maxNobles) {
      out.push({
        fact_path: `nobles.${nobleId}`,
        group: "strengths",
        role_in_lens: "modifier_signal",
        tier: 4,
        codes: [nobleId],
        reference_ids: [`noble:${nobleId}`],
        selection_priority: 0,
        confidence: "high",
        evidence: [{ kind: "shinsal", codes: [nobleId], detail: "noble_hit" }],
        exclude: {
          reason: "deduped",
          detail: `noble_cap max=${maxNobles}`,
        },
      });
      continue;
    }
    out.push({
      fact_path: `nobles.${nobleId}`,
      group: "strengths",
      role_in_lens: "modifier_signal",
      tier: 3,
      codes: [nobleId],
      reference_ids: [`noble:${nobleId}`],
      selection_priority: POLICY_DEFAULTS.noble_selection_priority,
      confidence: "high",
      evidence: [{ kind: "shinsal", codes: [nobleId], detail: "noble_hit" }],
    });
  }

  // —— non-noble shinsal (cap); skip relationship/personality categories ——
  const nobleNameHints = new Set(
    chart.nobles.noble_hits.map((id) => id.replace(/_/g, "")),
  );
  let shinsalKept = 0;
  for (const hit of [...chart.shinsal_hits].sort((a, b) =>
    a.reference_id.localeCompare(b.reference_id),
  )) {
    if (hit.slug.includes("귀인")) continue;
    if (nobleNameHints.has(hit.slug.replace(/_/g, ""))) continue;
    const cat = hit.category ?? "";
    if (cat === "relationship" || cat === "personality") {
      out.push({
        fact_path: `shinsal_hits.${hit.reference_id}`,
        group: "cautions",
        role_in_lens: "modifier_signal",
        tier: 4,
        codes: [hit.slug, cat],
        reference_ids: [hit.reference_id],
        selection_priority: 0,
        confidence: "high",
        evidence: hit.evidence,
        exclude: {
          reason: "deduped",
          detail: `category_${cat}_out_of_personal_scope_pending_product_decision`,
        },
      });
      continue;
    }
    if (shinsalKept >= maxShinsal) {
      out.push({
        fact_path: `shinsal_hits.${hit.reference_id}`,
        group: cat === "misfortune" ? "cautions" : "strengths",
        role_in_lens: "modifier_signal",
        tier: 4,
        codes: [hit.slug, cat],
        reference_ids: [hit.reference_id],
        selection_priority: 0,
        confidence: "high",
        evidence: hit.evidence,
        exclude: {
          reason: "deduped",
          detail: `shinsal_cap max=${maxShinsal}`,
        },
      });
      continue;
    }
    shinsalKept += 1;
    const isCaution = cat === "misfortune";
    out.push({
      fact_path: `shinsal_hits.${hit.reference_id}`,
      group: isCaution ? "cautions" : "strengths",
      role_in_lens: "modifier_signal",
      tier: 3,
      codes: [hit.slug, cat],
      reference_ids: [hit.reference_id],
      selection_priority: POLICY_DEFAULTS.shinsal_selection_priority,
      confidence: "high",
      evidence: hit.evidence,
    });
  }

  // —— specials: modifiers / exclusions; dedupe wonjin/guimun vs relations ——
  for (const sig of chart.special_signals) {
    const id = sig.signal_id;
    if (id === "wonjin" || id === "guimun") {
      const covered =
        (id === "wonjin" && hasWonjinRel) || (id === "guimun" && hasGuimunRel);
      if (covered) {
        out.push({
          fact_path: `special_signals.${id}`,
          group: "cautions",
          role_in_lens: "caution_signal",
          tier: 2,
          codes: [id],
          reference_ids: [`special:${id}`],
          selection_priority: 0,
          confidence: "high",
          evidence: sig.evidence,
          exclude: {
            reason: "deduped",
            detail: "prefer_relations_intra_channel",
          },
        });
        continue;
      }
      if (!sig.possessed) {
        out.push({
          fact_path: `special_signals.${id}`,
          group: "cautions",
          role_in_lens: "caution_signal",
          tier: 2,
          codes: [id],
          reference_ids: [`special:${id}`],
          selection_priority: 0,
          confidence: "low",
          evidence: [],
          exclude: { reason: "not_possessed", detail: id },
        });
        continue;
      }
      out.push({
        fact_path: `special_signals.${id}`,
        group: "cautions",
        role_in_lens: "caution_signal",
        tier: 2,
        codes: [id, "possessed"],
        reference_ids: [`special:${id}`],
        selection_priority: 0.72,
        confidence: "high",
        evidence: sig.evidence,
      });
      continue;
    }

    if (id === "dohwa" || id === "yeokma") {
      if (!sig.possessed) {
        out.push({
          fact_path: `special_signals.${id}`,
          group: "strengths",
          role_in_lens: "modifier_signal",
          tier: 4,
          codes: [id],
          reference_ids: [`special:${id}`],
          selection_priority: 0,
          confidence: "low",
          evidence: [],
          exclude: { reason: "not_possessed", detail: id },
        });
        continue;
      }
      out.push({
        fact_path: `special_signals.${id}`,
        group: "strengths",
        role_in_lens: "modifier_signal",
        tier: 4,
        codes: [id, "possessed"],
        reference_ids: [`special:${id}`],
        selection_priority: 0.32,
        confidence: "high",
        evidence: sig.evidence,
      });
    }
  }

  // —— growth / directional guidance ——
  if (year) {
    out.push({
      fact_path: "pillars.year.twelve_stage",
      group: "growth",
      role_in_lens: "growth_signal",
      tier: 3,
      codes: [year.twelve_stage.code],
      reference_ids: [year.twelve_stage.reference_id],
      selection_priority: 0.45,
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

  const fav = chart.favorable_elements;
  const weakEl = chart.five_elements.weakest;
  const lowConf = fav.confidence === "low" || fav.confidence === "heuristic";
  if (lowConf && !includeLow) {
    for (const el of fav.yongsin) {
      out.push({
        fact_path: "favorable_elements.yongsin",
        group: "growth",
        role_in_lens: "directional_guidance",
        tier: 4,
        codes: [el, fav.method, "directional_only"],
        reference_ids: [`element:${el}`],
        selection_priority: 0,
        confidence: fav.confidence,
        evidence: fav.evidence,
        exclude: {
          reason: "low_confidence_omitted",
          detail: "yongsin_default_omit_unless_include_low_confidence",
        },
      });
    }
    for (const el of fav.huisin) {
      out.push({
        fact_path: "favorable_elements.huisin",
        group: "growth",
        role_in_lens: "directional_guidance",
        tier: 4,
        codes: [el, "directional_only"],
        reference_ids: [`element:${el}`],
        selection_priority: 0,
        confidence: fav.confidence,
        evidence: fav.evidence,
        exclude: {
          reason: "low_confidence_omitted",
          detail: "huisin_default_omit_unless_include_low_confidence",
        },
      });
    }
  } else {
    for (const el of fav.yongsin) {
      if (el === weakEl) {
        out.push({
          fact_path: "favorable_elements.yongsin",
          group: "growth",
          role_in_lens: "directional_guidance",
          tier: 4,
          codes: [el, fav.method, "directional_only"],
          reference_ids: [`element:${el}`],
          selection_priority: 0,
          confidence: fav.confidence,
          evidence: fav.evidence,
          exclude: {
            reason: "deduped",
            detail: "prefer_five_elements.weakest_over_yongsin",
          },
        });
        continue;
      }
      out.push({
        fact_path: "favorable_elements.yongsin",
        group: "growth",
        role_in_lens: "directional_guidance",
        tier: 4,
        codes: [el, fav.method, "directional_only"],
        reference_ids: [`element:${el}`],
        selection_priority: POLICY_DEFAULTS.yongsin_selection_priority,
        confidence: fav.confidence,
        evidence: fav.evidence,
      });
    }
    for (const el of fav.huisin) {
      out.push({
        fact_path: "favorable_elements.huisin",
        group: "growth",
        role_in_lens: "directional_guidance",
        tier: 4,
        codes: [el, "directional_only"],
        reference_ids: [`element:${el}`],
        selection_priority: 0.3,
        confidence: fav.confidence,
        evidence: fav.evidence,
      });
    }
  }

  // —— hour stem / stage ——
  if (hour) {
    const hourStem: CandidateFact = {
      fact_path: "pillars.hour.stem",
      group: "identity",
      role_in_lens: "identity_support",
      tier: 3,
      codes: [hour.stem.code],
      reference_ids: [hour.stem.reference_id],
      selection_priority: 0.4,
      confidence: "deterministic",
      evidence: [
        {
          kind: "stem",
          pillar_slot: "hour",
          codes: [hour.stem.code],
          detail: "hour_stem",
        },
      ],
    };
    const hourStage: CandidateFact = {
      fact_path: "pillars.hour.twelve_stage",
      group: "energy",
      role_in_lens: "energy_pattern",
      tier: 3,
      codes: [hour.twelve_stage.code],
      reference_ids: [hour.twelve_stage.reference_id],
      selection_priority: 0.4,
      confidence: "deterministic",
      evidence: [
        {
          kind: "branch",
          pillar_slot: "hour",
          codes: [hour.twelve_stage.code],
          detail: "hour_twelve_stage",
        },
      ],
    };
    if (unknownHour) {
      out.push({
        ...hourStem,
        selection_priority: 0,
        exclude: {
          reason: "birth_time_unknown",
          detail: "hour pillar not used when birth time unknown",
        },
      });
      out.push({
        ...hourStage,
        selection_priority: 0,
        exclude: {
          reason: "birth_time_unknown",
          detail: "hour pillar not used when birth time unknown",
        },
      });
    } else {
      out.push(hourStem);
      out.push(hourStage);
    }
  }

  return out;
}

/** Surface stem ten-god counts — skips hour when birth time unknown. No recalculation. */
export function aggregateTenGodStemCounts(
  chart: IndividualSajuChart,
  birthTimeUnknown: boolean,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of chart.pillars) {
    if (birthTimeUnknown && p.slot === "hour") continue;
    if (p.slot === "day") continue; // day stem ten-god is self-ref; not counted as interpreted signal
    const code = p.stem_ten_god.code;
    counts[code] = (counts[code] ?? 0) + 1;
  }
  return counts;
}
