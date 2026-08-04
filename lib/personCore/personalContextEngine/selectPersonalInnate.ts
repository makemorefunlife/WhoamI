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
import type {
  PersonalRelationalProfile,
  RelationalDimensionEvaluation,
} from "./types";

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


/**
 * Aggregate evidence-bounded relational profile for downstream Pair CE & Domain Lenses.
 * Purely derived from chart facts (stems, branches, 12 stages, intra-relations).
 */
function getBranchElement(branchCode: string): string {
  switch (branchCode) {
    case "인":
    case "묘":
      return "wood";
    case "사":
    case "오":
      return "fire";
    case "진":
    case "술":
    case "축":
    case "미":
      return "earth";
    case "신":
    case "유":
      return "metal";
    case "해":
    case "자":
      return "water";
    default:
      return "earth";
  }
}

function isElementRooted(targetElement: string, branches: string[]): boolean {
  const rootMap: Record<string, string[]> = {
    wood: ["인", "묘", "진", "미", "해"],
    fire: ["사", "오", "미", "술", "인"],
    earth: ["진", "술", "축", "미", "사", "오"],
    metal: ["신", "유", "술", "축", "사"],
    water: ["해", "자", "축", "진", "신"],
  };
  const validRoots = rootMap[targetElement] ?? [];
  return branches.some((b) => validRoots.includes(b));
}

/**
 * Aggregate evidence-bounded relational profile for downstream Pair CE & Domain Lenses.
 * Purely derived from chart facts (stems, branches, 12 stages, intra-relations, rootedness).
 */
export function aggregatePersonalRelationalProfile(
  chart: IndividualSajuChart,
  birthTimeUnknown: boolean,
): PersonalRelationalProfile {
  const stemCounts = aggregateTenGodStemCounts(chart, birthTimeUnknown);
  const dayMaster = chart.day_master.stem.code;
  const dayMasterElement = chart.day_master.stem.element;
  const dominantElement = chart.five_elements?.dominant ?? null;
  const stages: string[] = chart.pillars.map((p) => p.twelve_stage.code);
  const relations = chart.relations_intra.map((r) => r.type_id);
  const stars: string[] = chart.shinsal_hits?.map((s) => s.slug) ?? [];
  const dayPillar = chart.pillars.find((p) => p.slot === "day");
  const monthPillar = chart.pillars.find((p) => p.slot === "month");
  const yearPillar = chart.pillars.find((p) => p.slot === "year");
  const hourPillar = birthTimeUnknown ? undefined : chart.pillars.find((p) => p.slot === "hour");

  const dayBranchTenGod = dayPillar?.branch_ten_god?.code;
  const monthBranchTenGod = monthPillar?.branch_ten_god?.code;
  const monthStemTenGod = monthPillar?.stem_ten_god?.code;
  const yearStemTenGod = yearPillar?.stem_ten_god?.code;
  const hourStemTenGod = hourPillar?.stem_ten_god?.code;

  const allBranches = chart.pillars
    .filter((p) => !birthTimeUnknown || p.slot !== "hour")
    .map((p) => p.branch.code);

  const isDayMasterRooted = isElementRooted(dayMasterElement, allBranches);
  const isStrongDayMaster =
    isDayMasterRooted &&
    stages.some((s) => ["건록", "제왕", "장생", "관대"].includes(s));

  const foodStemCount = (stemCounts["식신"] ?? 0) + (stemCounts["상관"] ?? 0);
  const foodBranchCount =
    (dayBranchTenGod === "식신" || dayBranchTenGod === "상관" ? 1 : 0) +
    (monthBranchTenGod === "식신" || monthBranchTenGod === "상관" ? 1.5 : 0);
  const totalFood = foodStemCount + foodBranchCount;

  const wealthStemCount = (stemCounts["정재"] ?? 0) + (stemCounts["편재"] ?? 0);
  const wealthBranchCount =
    (dayBranchTenGod === "정재" || dayBranchTenGod === "편재" ? 1 : 0) +
    (monthBranchTenGod === "정재" || monthBranchTenGod === "편재" ? 1.5 : 0);
  const totalWealth = wealthStemCount + wealthBranchCount;

  const inseongStemCount = (stemCounts["정인"] ?? 0) + (stemCounts["편인"] ?? 0);
  const inseongBranchCount =
    (dayBranchTenGod === "정인" || dayBranchTenGod === "편인" ? 1 : 0) +
    (monthBranchTenGod === "정인" || monthBranchTenGod === "편인" ? 1.5 : 0);
  const totalInseong = inseongStemCount + inseongBranchCount;

  const gwanStemCount = (stemCounts["정관"] ?? 0) + (stemCounts["편관"] ?? 0);
  const gwanBranchCount =
    (dayBranchTenGod === "정관" || dayBranchTenGod === "편관" ? 1 : 0) +
    (monthBranchTenGod === "정관" || monthBranchTenGod === "편관" ? 1.5 : 0);
  const totalGwan = gwanStemCount + gwanBranchCount;

  const peerStemCount = (stemCounts["비견"] ?? 0) + (stemCounts["겁재"] ?? 0);
  const peerBranchCount =
    (dayBranchTenGod === "비견" || dayBranchTenGod === "겁재" ? 1 : 0) +
    (monthBranchTenGod === "비견" || monthBranchTenGod === "겁재" ? 1.5 : 0);
  const totalPeer = peerStemCount + peerBranchCount;

  const hasWonjin = relations.some((r) => r.includes("wonjin") || r.includes("guimun"));
  const hasClash = relations.some((r) => r.includes("clash") || r.includes("punishment"));
  const hasCombine = relations.some((r) => r.includes("combine") || r.includes("trio"));
  const hasDohwa = stars.some((s: string) => s.includes("dohwa") || s.includes("peach"));
  const hasGwaegang = stars.some((s: string) => s.includes("gwaegang") || s.includes("baekho"));

  const dimension_evaluations: Record<string, RelationalDimensionEvaluation> = {};

  function computeDimConfidence(params: {
    signalsCount: number;
    hasStrongSignal: boolean;
    hasContradiction?: boolean;
    hourMaterial?: boolean;
  }): "high" | "medium" | "low" | "insufficient" {
    if (params.signalsCount === 0) return "insufficient";
    if (params.hourMaterial && birthTimeUnknown && params.signalsCount < 2) return "low";
    if (params.signalsCount >= 2 && params.hasStrongSignal) return "high";
    if (params.signalsCount >= 1 && (params.hasStrongSignal || !params.hasContradiction)) return "medium";
    return "low";
  }

  // 1. expression_style
  let expression_style: PersonalRelationalProfile["expression_style"] = "neutral_unspecified";
  if (totalFood >= 1.5 && (totalWealth >= 1.5 || totalGwan >= 1.5)) {
    expression_style = "mixed_expressive_pragmatic";
    dimension_evaluations["expression_style"] = {
      value: expression_style,
      status: "mixed",
      canonical_meaning_id: "mixed_expressive_pragmatic",
      confidence: computeDimConfidence({ signalsCount: 2, hasStrongSignal: true, hasContradiction: true }),
      is_mixed: true,
      is_abstaining: false,
      evidence_summary: "창의적 표현(식상)과 현실적 실행(재관)의 균형 공존",
      contributing_sources: ["ten_god_food", "ten_god_wealth_gwan"],
    };
  } else if (totalFood >= 1) {
    expression_style = "expressive_creator";
    dimension_evaluations["expression_style"] = {
      value: expression_style,
      status: "supported",
      canonical_meaning_id: "expressive_creator",
      confidence: computeDimConfidence({ signalsCount: (stemCounts["식신"] ?? 0) + (stemCounts["상관"] ?? 0) + (foodBranchCount > 0 ? 1 : 0), hasStrongSignal: totalFood >= 1.5 }),
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "식상 구조에 기반한 발산형 소통 및 창작 표현",
      contributing_sources: ["ten_god_food"],
    };
  } else if (totalWealth >= 1 || totalGwan >= 1) {
    expression_style = "pragmatic_doer";
    dimension_evaluations["expression_style"] = {
      value: expression_style,
      status: "supported",
      canonical_meaning_id: "pragmatic_doer",
      confidence: computeDimConfidence({ signalsCount: (stemCounts["정재"] ?? 0) + (stemCounts["편재"] ?? 0) + (stemCounts["정관"] ?? 0) + (stemCounts["편관"] ?? 0), hasStrongSignal: totalWealth >= 1.5 || totalGwan >= 1.5 }),
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "재관 구조에 기반한 목표 지향적 실용 소통",
      contributing_sources: ["ten_god_wealth_gwan"],
    };
  } else if (totalInseong >= 2.0 && totalFood === 0 && totalWealth === 0 && totalGwan === 0) {
    expression_style = "reserved_observer";
    dimension_evaluations["expression_style"] = {
      value: expression_style,
      status: "supported",
      canonical_meaning_id: "reserved_observer",
      confidence: "medium",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "인성 주도 및 식재관 결여에 따른 내향 관찰형 표현",
      contributing_sources: ["ten_god_inseong_dominant"],
    };
  } else {
    expression_style = "neutral_unspecified";
    dimension_evaluations["expression_style"] = {
      value: expression_style,
      status: "abstained",
      canonical_meaning_id: null,
      confidence: "insufficient",
      is_mixed: false,
      is_abstaining: true,
      evidence_summary: "표현 양식을 특정할 식상/재관/인성 신호 부재",
      contributing_sources: [],
    };
  }

  // 2. recognition_need
  let recognition_need: PersonalRelationalProfile["recognition_need"] = "neutral_unspecified";
  if (totalInseong >= 1.5 && totalGwan >= 1.5) {
    recognition_need = "mixed_recognition_need";
    dimension_evaluations["recognition_need"] = {
      value: recognition_need,
      status: "mixed",
      canonical_meaning_id: "mixed_recognition_need",
      confidence: computeDimConfidence({ signalsCount: 2, hasStrongSignal: true, hasContradiction: true }),
      is_mixed: true,
      is_abstaining: false,
      evidence_summary: "정서적 공감(인성)과 원칙적 기준(관성) 인정 욕구의 복합",
      contributing_sources: ["ten_god_inseong", "ten_god_gwan"],
    };
  } else if (totalInseong >= 1) {
    recognition_need = "empathy_seeking";
    dimension_evaluations["recognition_need"] = {
      value: recognition_need,
      status: "supported",
      canonical_meaning_id: "empathy_seeking",
      confidence: computeDimConfidence({ signalsCount: (stemCounts["정인"] ?? 0) + (stemCounts["편인"] ?? 0) + (inseongBranchCount > 0 ? 1 : 0), hasStrongSignal: totalInseong >= 1.5 }),
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "인성 기반의 정서적 수용과 헌신에 대한 인정 추구",
      contributing_sources: ["ten_god_inseong"],
    };
  } else if (totalGwan >= 1) {
    recognition_need = "standards_driven";
    dimension_evaluations["recognition_need"] = {
      value: recognition_need,
      status: "supported",
      canonical_meaning_id: "standards_driven",
      confidence: computeDimConfidence({ signalsCount: (stemCounts["정관"] ?? 0) + (stemCounts["편관"] ?? 0) + (gwanBranchCount > 0 ? 1 : 0), hasStrongSignal: totalGwan >= 1.5 }),
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "관성 기반의 성과 및 책임감에 대한 사회적 인정 추구",
      contributing_sources: ["ten_god_gwan"],
    };
  } else if (totalPeer >= 1.5) {
    recognition_need = "autonomous_independent";
    dimension_evaluations["recognition_need"] = {
      value: recognition_need,
      status: "supported",
      canonical_meaning_id: "autonomous_independent",
      confidence: computeDimConfidence({ signalsCount: (stemCounts["비견"] ?? 0) + (stemCounts["겁재"] ?? 0) + (peerBranchCount > 0 ? 1 : 0), hasStrongSignal: totalPeer >= 2.0 }),
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "비겁 기반의 독립적 자아존중감 형성",
      contributing_sources: ["ten_god_peer"],
    };
  } else {
    recognition_need = "neutral_unspecified";
    dimension_evaluations["recognition_need"] = {
      value: recognition_need,
      status: "abstained",
      canonical_meaning_id: null,
      confidence: "insufficient",
      is_mixed: false,
      is_abstaining: true,
      evidence_summary: "인정 욕구를 특정할 인성/관성/비겁 신호 부재",
      contributing_sources: [],
    };
  }

  // 3. decision_pace
  let decision_pace: PersonalRelationalProfile["decision_pace"] = "neutral_unspecified";
  const hasSwiftIndicators =
    ["갑", "병", "경", "무"].includes(dayMaster) ||
    stages.some((s) => ["건록", "제왕", "장생"].includes(s));
  const hasDeliberateIndicators =
    ["계", "기", "신", "을"].includes(dayMaster) ||
    dominantElement === "water" ||
    dominantElement === "earth" ||
    stages.some((s) => ["사", "묘", "절"].includes(s));
  const hasAnchorIndicators = dominantElement === "earth" && isStrongDayMaster;

  if (hasSwiftIndicators && hasDeliberateIndicators) {
    decision_pace = "mixed_adaptive_pace";
    dimension_evaluations["decision_pace"] = {
      value: decision_pace,
      status: "mixed",
      canonical_meaning_id: "mixed_adaptive_pace",
      confidence: "high",
      is_mixed: true,
      is_abstaining: false,
      evidence_summary: "양간의 결단력과 신중한 지지/십이운성의 상황별 조율",
      contributing_sources: ["day_master_polarity", "twelve_stages"],
    };
  } else if (hasSwiftIndicators) {
    decision_pace = "swift_initiative";
    dimension_evaluations["decision_pace"] = {
      value: decision_pace,
      status: "supported",
      canonical_meaning_id: "swift_initiative",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "양간 및 왕성한 십이운성 기반의 즉각적 추진력",
      contributing_sources: ["day_master_polarity", "twelve_stages"],
    };
  } else if (hasDeliberateIndicators) {
    decision_pace = "deliberate_evaluator";
    dimension_evaluations["decision_pace"] = {
      value: decision_pace,
      status: "supported",
      canonical_meaning_id: "deliberate_evaluator",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "음간 및 수/토 오행 기반의 심사숙고형 의사결정",
      contributing_sources: ["day_master_polarity", "dominant_element"],
    };
  } else if (hasAnchorIndicators) {
    decision_pace = "steady_anchor";
    dimension_evaluations["decision_pace"] = {
      value: decision_pace,
      status: "supported",
      canonical_meaning_id: "steady_anchor",
      confidence: "medium",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "토 오행 및 신강 구조 기반의 안정적 템포 유지",
      contributing_sources: ["dominant_earth", "strong_daymaster"],
    };
  } else {
    decision_pace = "neutral_unspecified";
    dimension_evaluations["decision_pace"] = {
      value: decision_pace,
      status: "abstained",
      canonical_meaning_id: null,
      confidence: "insufficient",
      is_mixed: false,
      is_abstaining: true,
      evidence_summary: "결단 템포를 특정할 십이운성/일간 음양 신호 부재",
      contributing_sources: [],
    };
  }

  // 4. resource_governance
  let resource_governance: PersonalRelationalProfile["resource_governance"] = "neutral_unspecified";
  const hasJeongJae = (stemCounts["정재"] ?? 0) >= 1 || dayBranchTenGod === "정재" || monthBranchTenGod === "정재";
  const hasPyeonJae = (stemCounts["편재"] ?? 0) >= 1 || dayBranchTenGod === "편재" || monthBranchTenGod === "편재";

  if (hasJeongJae && hasPyeonJae) {
    resource_governance = "mixed_balanced_investor";
    dimension_evaluations["resource_governance"] = {
      value: resource_governance,
      status: "mixed",
      canonical_meaning_id: "mixed_balanced_investor",
      confidence: "high",
      is_mixed: true,
      is_abstaining: false,
      evidence_summary: "정재의 철저한 예산 관리와 편재의 과감한 투자 감각 병행",
      contributing_sources: ["ten_god_jeongjae", "ten_god_pyeonjae"],
    };
  } else if (hasJeongJae) {
    resource_governance = "diligent_steward";
    dimension_evaluations["resource_governance"] = {
      value: resource_governance,
      status: "supported",
      canonical_meaning_id: "diligent_steward",
      confidence: isElementRooted("earth", allBranches) ? "high" : "medium",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "정재 기반의 안정적 자산 수호 및 계획적 재정 운용",
      contributing_sources: ["ten_god_jeongjae"],
    };
  } else if (hasPyeonJae) {
    resource_governance = "opportunity_investor";
    dimension_evaluations["resource_governance"] = {
      value: resource_governance,
      status: "supported",
      canonical_meaning_id: "opportunity_investor",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "편재 기반의 기회 포착형 자원 확장 및 유연한 분배",
      contributing_sources: ["ten_god_pyeonjae"],
    };
  } else if (totalFood >= 1.5 && totalPeer >= 1.5) {
    resource_governance = "flexible_distributor";
    dimension_evaluations["resource_governance"] = {
      value: resource_governance,
      status: "supported",
      canonical_meaning_id: "flexible_distributor",
      confidence: "medium",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "식상 및 비겁 기반의 유연한 자원 순환 및 분배",
      contributing_sources: ["ten_god_food_peer"],
    };
  } else {
    resource_governance = "neutral_unspecified";
    dimension_evaluations["resource_governance"] = {
      value: resource_governance,
      status: "abstained",
      canonical_meaning_id: null,
      confidence: "insufficient",
      is_mixed: false,
      is_abstaining: true,
      evidence_summary: "재정 운용 성향을 특정할 정재/편재 신호 부재",
      contributing_sources: [],
    };
  }

  // 5. solitude_autonomy
  let solitude_autonomy: PersonalRelationalProfile["solitude_autonomy"] = "neutral_unspecified";
  const hasSolitudeSignals = totalPeer >= 1.5 || hasWonjin || hasGwaegang || dayBranchTenGod === "비견";
  const hasClosenessSignals = totalInseong >= 2 || hasCombine || dayBranchTenGod === "정인";

  if (hasSolitudeSignals && hasClosenessSignals) {
    solitude_autonomy = "mixed_solitude_intimacy";
    dimension_evaluations["solitude_autonomy"] = {
      value: solitude_autonomy,
      status: "mixed",
      canonical_meaning_id: "mixed_solitude_intimacy",
      confidence: "high",
      is_mixed: true,
      is_abstaining: false,
      evidence_summary: "높은 독립성 요구와 정서적 밀착 욕구의 주기적 교차",
      contributing_sources: ["solitude_signals", "closeness_signals"],
    };
  } else if (hasSolitudeSignals) {
    solitude_autonomy = "high_solitude_needed";
    dimension_evaluations["solitude_autonomy"] = {
      value: solitude_autonomy,
      status: "supported",
      canonical_meaning_id: "high_solitude_needed",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "비겁 및 신살(괴강/원진) 기반의 절대적 개인 영역 확보 필요",
      contributing_sources: ["ten_god_peer", "shinsal_intra"],
    };
  } else if (hasClosenessSignals) {
    solitude_autonomy = "high_closeness_seeking";
    dimension_evaluations["solitude_autonomy"] = {
      value: solitude_autonomy,
      status: "supported",
      canonical_meaning_id: "high_closeness_seeking",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "인성 및 합(Combine) 구조 기반의 일체감 있는 친밀성 추구",
      contributing_sources: ["ten_god_inseong", "intra_combine"],
    };
  } else if (totalPeer >= 1.0 && totalInseong >= 1.0) {
    solitude_autonomy = "balanced_proximity";
    dimension_evaluations["solitude_autonomy"] = {
      value: solitude_autonomy,
      status: "supported",
      canonical_meaning_id: "balanced_proximity",
      confidence: "medium",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "비겁과 인성의 균형에 기반한 적정 거리감 유지",
      contributing_sources: ["ten_god_peer_inseong"],
    };
  } else {
    solitude_autonomy = "neutral_unspecified";
    dimension_evaluations["solitude_autonomy"] = {
      value: solitude_autonomy,
      status: "abstained",
      canonical_meaning_id: null,
      confidence: "insufficient",
      is_mixed: false,
      is_abstaining: true,
      evidence_summary: "고독 자율성을 특정할 비겁/원진/괴강/인성 신호 부재",
      contributing_sources: [],
    };
  }

  // 6. conflict_decompression
  let conflict_decompression: PersonalRelationalProfile["conflict_decompression"] = "neutral_unspecified";
  const hasCoolingSignals = hasWonjin || hasClash || (stemCounts["편인"] ?? 0) >= 1 || dayBranchTenGod === "편인";
  const hasClarifierSignals = totalGwan >= 1 || (stemCounts["상관"] ?? 0) >= 1 || dayBranchTenGod === "상관";

  if (hasCoolingSignals && hasClarifierSignals) {
    conflict_decompression = "mixed_cooling_clarifier";
    dimension_evaluations["conflict_decompression"] = {
      value: conflict_decompression,
      status: "mixed",
      canonical_meaning_id: "mixed_cooling_clarifier",
      confidence: "high",
      is_mixed: true,
      is_abstaining: false,
      evidence_summary: "초기 감정 냉각(동굴) 후 명확한 논리적 시비 판별(명료화)",
      contributing_sources: ["intra_friction", "ten_god_gwan_sangwan"],
    };
  } else if (hasCoolingSignals) {
    conflict_decompression = "solitude_cooling_needed";
    dimension_evaluations["conflict_decompression"] = {
      value: conflict_decompression,
      status: "supported",
      canonical_meaning_id: "solitude_cooling_needed",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "마찰 발생 시 즉각적 충돌 회피 및 단독 사유 공간 필요",
      contributing_sources: ["intra_friction", "ten_god_pyeonin"],
    };
  } else if (hasClarifierSignals) {
    conflict_decompression = "immediate_clarifier";
    dimension_evaluations["conflict_decompression"] = {
      value: conflict_decompression,
      status: "supported",
      canonical_meaning_id: "immediate_clarifier",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "갈등을 지체 없이 사실과 기준에 입각하여 직접 소통 해결",
      contributing_sources: ["ten_god_gwan", "ten_god_sangwan"],
    };
  } else if (totalInseong >= 1.5 && (stemCounts["정인"] ?? 0) >= 1 && !hasClash && !hasWonjin) {
    conflict_decompression = "harmonious_absorber";
    dimension_evaluations["conflict_decompression"] = {
      value: conflict_decompression,
      status: "supported",
      canonical_meaning_id: "harmonious_absorber",
      confidence: "medium",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "정인 기반의 원만한 갈등 완충 및 수용 태도",
      contributing_sources: ["ten_god_jeongin"],
    };
  } else {
    conflict_decompression = "neutral_unspecified";
    dimension_evaluations["conflict_decompression"] = {
      value: conflict_decompression,
      status: "abstained",
      canonical_meaning_id: null,
      confidence: "insufficient",
      is_mixed: false,
      is_abstaining: true,
      evidence_summary: "갈등 감압을 특정할 충/원진/편인/상관 신호 부재",
      contributing_sources: [],
    };
  }

  // 7. pressure_response
  let pressure_response: PersonalRelationalProfile["pressure_response"] = "neutral_unspecified";
  const hasFighterSignals =
    isStrongDayMaster &&
    ((stemCounts["편관"] ?? 0) >= 1 || hasGwaegang || stages.some((s) => s === "제왕" || s === "건록"));
  const hasVulnerableSignals =
    !isStrongDayMaster &&
    ((stemCounts["편관"] ?? 0) >= 1 || stages.some((s) => ["절", "사", "묘", "쇠"].includes(s)));

  if (hasFighterSignals && hasVulnerableSignals) {
    pressure_response = "mixed_pressure_response";
    dimension_evaluations["pressure_response"] = {
      value: pressure_response,
      status: "mixed",
      canonical_meaning_id: "mixed_pressure_response",
      confidence: "high",
      is_mixed: true,
      is_abstaining: false,
      evidence_summary: "초기 단호한 돌파력 발휘 후 누적된 피로에 따른 앵커 요구",
      contributing_sources: ["daymaster_strength", "pyeongwan", "stages"],
    };
  } else if (hasFighterSignals) {
    pressure_response = "resolute_crisis_fighter";
    dimension_evaluations["pressure_response"] = {
      value: pressure_response,
      status: "supported",
      canonical_meaning_id: "resolute_crisis_fighter",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "신강한 일간 및 편관/괴강 기반의 위기 정면 돌파력",
      contributing_sources: ["daymaster_strength", "pyeongwan", "shinsal"],
    };
  } else if (hasVulnerableSignals) {
    pressure_response = "stress_vulnerable_anchor_needed";
    dimension_evaluations["pressure_response"] = {
      value: pressure_response,
      status: "supported",
      canonical_meaning_id: "stress_vulnerable_anchor_needed",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "편관의 압박과 쇠약한 운성으로 인한 든든한 외부 지지 요구",
      contributing_sources: ["pyeongwan", "weak_stages"],
    };
  } else if (totalFood >= 1.5 && isDayMasterRooted) {
    pressure_response = "adaptive_pacing";
    dimension_evaluations["pressure_response"] = {
      value: pressure_response,
      status: "supported",
      canonical_meaning_id: "adaptive_pacing",
      confidence: "medium",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "식상과 뿌리 있는 일간 기반의 유연한 스트레스 완충",
      contributing_sources: ["ten_god_food", "rooted_daymaster"],
    };
  } else {
    pressure_response = "neutral_unspecified";
    dimension_evaluations["pressure_response"] = {
      value: pressure_response,
      status: "abstained",
      canonical_meaning_id: null,
      confidence: "insufficient",
      is_mixed: false,
      is_abstaining: true,
      evidence_summary: "위기 및 압박 반응을 특정할 신강/편관/괴강 신호 부재",
      contributing_sources: [],
    };
  }

  // 8. support_giving_style
  let support_giving_style: PersonalRelationalProfile["support_giving_style"] = "neutral_unspecified";
  const hasNurture = totalInseong >= 1 || (stemCounts["식신"] ?? 0) >= 1;
  const hasTroubleshoot = totalWealth >= 1 || totalGwan >= 1;

  if (hasNurture && hasTroubleshoot) {
    support_giving_style = "mixed_nurturing_troubleshooter";
    dimension_evaluations["support_giving_style"] = {
      value: support_giving_style,
      status: "mixed",
      canonical_meaning_id: "mixed_nurturing_troubleshooter",
      confidence: "high",
      is_mixed: true,
      is_abstaining: false,
      evidence_summary: "따뜻한 정서적 공감과 실질적인 문제 해결책 제시의 조화",
      contributing_sources: ["ten_god_inseong_food", "ten_god_wealth_gwan"],
    };
  } else if (hasNurture) {
    support_giving_style = "nurturing_empath";
    dimension_evaluations["support_giving_style"] = {
      value: support_giving_style,
      status: "supported",
      canonical_meaning_id: "nurturing_empath",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "인성/식신 기반의 무조건적 지지와 따뜻한 정서적 품어줌",
      contributing_sources: ["ten_god_inseong_food"],
    };
  } else if (hasTroubleshoot) {
    support_giving_style = "practical_troubleshooter";
    dimension_evaluations["support_giving_style"] = {
      value: support_giving_style,
      status: "supported",
      canonical_meaning_id: "practical_troubleshooter",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "재관 기반의 현실적인 솔루션 제공과 구체적 행동 지원",
      contributing_sources: ["ten_god_wealth_gwan"],
    };
  } else if (totalPeer >= 2.0 && totalFood === 0 && totalInseong === 0) {
    support_giving_style = "silent_standby";
    dimension_evaluations["support_giving_style"] = {
      value: support_giving_style,
      status: "supported",
      canonical_meaning_id: "silent_standby",
      confidence: "medium",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "비겁 주도 및 식인 부재에 따른 담백한 대기형 지지",
      contributing_sources: ["ten_god_peer_dominant"],
    };
  } else {
    support_giving_style = "neutral_unspecified";
    dimension_evaluations["support_giving_style"] = {
      value: support_giving_style,
      status: "abstained",
      canonical_meaning_id: null,
      confidence: "insufficient",
      is_mixed: false,
      is_abstaining: true,
      evidence_summary: "지원 양식을 특정할 인성/식신/재관 신호 부재",
      contributing_sources: [],
    };
  }

  // 9. criticism_sensitivity
  let criticism_sensitivity: PersonalRelationalProfile["criticism_sensitivity"] = "neutral_unspecified";
  const hasHighDefensive =
    ((stemCounts["상관"] ?? 0) >= 1 && totalGwan >= 1) ||
    (stemCounts["편관"] ?? 0) >= 1 ||
    hasWonjin;
  const hasGrowthMindset =
    isStrongDayMaster &&
    ((stemCounts["정관"] ?? 0) >= 1 || (stemCounts["정인"] ?? 0) >= 1);

  if (hasHighDefensive && hasGrowthMindset) {
    criticism_sensitivity = "mixed_sensitive_direct";
    dimension_evaluations["criticism_sensitivity"] = {
      value: criticism_sensitivity,
      status: "mixed",
      canonical_meaning_id: "mixed_sensitive_direct",
      confidence: "high",
      is_mixed: true,
      is_abstaining: false,
      evidence_summary: "논리적 피드백은 수용하나 태도와 말투에 민감하게 방어 반응",
      contributing_sources: ["sangwan_gwan", "jeonggwan_strong"],
    };
  } else if (hasHighDefensive) {
    criticism_sensitivity = "high_defensive_cushion_needed";
    dimension_evaluations["criticism_sensitivity"] = {
      value: criticism_sensitivity,
      status: "supported",
      canonical_meaning_id: "high_defensive_cushion_needed",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "상관견관/편관/원진 구조에 따른 비판 앞 방어적 긴장 고조",
      contributing_sources: ["sangwan_gwan", "pyeongwan", "wonjin"],
    };
  } else if (hasGrowthMindset) {
    criticism_sensitivity = "growth_mindset_direct";
    dimension_evaluations["criticism_sensitivity"] = {
      value: criticism_sensitivity,
      status: "supported",
      canonical_meaning_id: "growth_mindset_direct",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "정관/정인 및 신강 구조 기반의 건설적 피드백 수용력",
      contributing_sources: ["jeonggwan", "jeongin", "daymaster_strength"],
    };
  } else if (isStrongDayMaster && totalInseong >= 1.5 && !hasWonjin && !hasHighDefensive) {
    criticism_sensitivity = "calm_filtering";
    dimension_evaluations["criticism_sensitivity"] = {
      value: criticism_sensitivity,
      status: "supported",
      canonical_meaning_id: "calm_filtering",
      confidence: "medium",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "신강 일간 및 인성 완충 기반의 감정 분리 및 합리적 여과",
      contributing_sources: ["strong_daymaster", "ten_god_inseong"],
    };
  } else {
    criticism_sensitivity = "neutral_unspecified";
    dimension_evaluations["criticism_sensitivity"] = {
      value: criticism_sensitivity,
      status: "abstained",
      canonical_meaning_id: null,
      confidence: "insufficient",
      is_mixed: false,
      is_abstaining: true,
      evidence_summary: "비판 민감성을 특정할 상관견관/편관/원진 신호 부재",
      contributing_sources: [],
    };
  }

  // 10. intimacy_expression_style
  let intimacy_expression_style: PersonalRelationalProfile["intimacy_expression_style"] = "neutral_unspecified";
  const hasPassionate =
    hasDohwa || dominantElement === "fire" || dayBranchTenGod === "상관" || dayBranchTenGod === "편재";
  const hasIndependent =
    dayBranchTenGod === "비견" || dayBranchTenGod === "편인" || hasWonjin;

  if (hasPassionate && hasIndependent) {
    intimacy_expression_style = "mixed_passionate_independent";
    dimension_evaluations["intimacy_expression_style"] = {
      value: intimacy_expression_style,
      status: "mixed",
      canonical_meaning_id: "mixed_passionate_independent",
      confidence: "high",
      is_mixed: true,
      is_abstaining: false,
      evidence_summary: "강한 정서적 열정과 독립적 영역에 대한 고수가 공존",
      contributing_sources: ["dohwa_fire", "daybranch_peer_pyeonin"],
    };
  } else if (hasPassionate) {
    intimacy_expression_style = "passionate_intensity";
    dimension_evaluations["intimacy_expression_style"] = {
      value: intimacy_expression_style,
      status: "supported",
      canonical_meaning_id: "passionate_intensity",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "도화/화오행/일지 식재 기반의 생동감 넘치는 애정 표현",
      contributing_sources: ["dohwa", "dominant_fire", "daybranch_ten_god"],
    };
  } else if (hasIndependent) {
    intimacy_expression_style = "independent_space_valuing";
    dimension_evaluations["intimacy_expression_style"] = {
      value: intimacy_expression_style,
      status: "supported",
      canonical_meaning_id: "independent_space_valuing",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "일지 비견/편인 및 원진 기반의 담백하고 자율적인 거리감 선호",
      contributing_sources: ["daybranch_ten_god", "wonjin"],
    };
  } else if (dayBranchTenGod === "정인" || dayBranchTenGod === "정재" || (hasCombine && totalInseong >= 1.0)) {
    intimacy_expression_style = "warm_grounded_devotion";
    dimension_evaluations["intimacy_expression_style"] = {
      value: intimacy_expression_style,
      status: "supported",
      canonical_meaning_id: "warm_grounded_devotion",
      confidence: "medium",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "일지 정재/정인 또는 합(Combine) 구조 기반의 안정적 헌신",
      contributing_sources: ["daybranch_ten_god", "intra_combine"],
    };
  } else {
    intimacy_expression_style = "neutral_unspecified";
    dimension_evaluations["intimacy_expression_style"] = {
      value: intimacy_expression_style,
      status: "abstained",
      canonical_meaning_id: null,
      confidence: "insufficient",
      is_mixed: false,
      is_abstaining: true,
      evidence_summary: "애정 표현 양식을 특정할 도화/일지 십성/화오행 신호 부재",
      contributing_sources: [],
    };
  }

  // 11. structure_spontaneity
  let structure_spontaneity: PersonalRelationalProfile["structure_spontaneity"] = "neutral_unspecified";
  const hasStructure =
    (stemCounts["정관"] ?? 0) >= 1 || (stemCounts["정재"] ?? 0) >= 1 || dayBranchTenGod === "정관" || monthBranchTenGod === "정관";
  const hasSpontaneous =
    totalFood >= 1 || (stemCounts["편재"] ?? 0) >= 1 || dayBranchTenGod === "상관";

  if (hasStructure && hasSpontaneous) {
    structure_spontaneity = "mixed_structured_spontaneous";
    dimension_evaluations["structure_spontaneity"] = {
      value: structure_spontaneity,
      status: "mixed",
      canonical_meaning_id: "mixed_structured_spontaneous",
      confidence: "high",
      is_mixed: true,
      is_abstaining: false,
      evidence_summary: "명확한 원칙적 프레임워크와 창의적 유연성의 상호 보완",
      contributing_sources: ["structure_signals", "spontaneous_signals"],
    };
  } else if (hasStructure) {
    structure_spontaneity = "disciplined_framework_driven";
    dimension_evaluations["structure_spontaneity"] = {
      value: structure_spontaneity,
      status: "supported",
      canonical_meaning_id: "disciplined_framework_driven",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "정관/정재 기반의 체계적인 루틴과 규칙 중심 생활",
      contributing_sources: ["ten_god_jeonggwan_jeongjae"],
    };
  } else if (hasSpontaneous) {
    structure_spontaneity = "spontaneous_creative_flow";
    dimension_evaluations["structure_spontaneity"] = {
      value: structure_spontaneity,
      status: "supported",
      canonical_meaning_id: "spontaneous_creative_flow",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "식상/편재 기반의 즉흥적 호기심과 직관적 몰입",
      contributing_sources: ["ten_god_food_pyeonjae"],
    };
  } else if (hasStructure && totalFood >= 0.5) {
    structure_spontaneity = "balanced_pragmatist";
    dimension_evaluations["structure_spontaneity"] = {
      value: structure_spontaneity,
      status: "supported",
      canonical_meaning_id: "balanced_pragmatist",
      confidence: "medium",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "정관/정재 프레임과 식상의 유연성이 결합된 실용적 조율",
      contributing_sources: ["ten_god_structure", "ten_god_food"],
    };
  } else {
    structure_spontaneity = "neutral_unspecified";
    dimension_evaluations["structure_spontaneity"] = {
      value: structure_spontaneity,
      status: "abstained",
      canonical_meaning_id: null,
      confidence: "insufficient",
      is_mixed: false,
      is_abstaining: true,
      evidence_summary: "구조화 및 즉흥성을 특정할 정관/정재/식상 신호 부재",
      contributing_sources: [],
    };
  }

  // 12. boundary_defense_strength
  let boundary_defense_strength: PersonalRelationalProfile["boundary_defense_strength"] = "neutral_unspecified";
  const hasSovereign =
    totalPeer >= 1.5 ||
    hasGwaegang ||
    stages.some((s) => s === "건록" || s === "제왕") ||
    isStrongDayMaster;
  const hasPorous =
    totalInseong >= 2 && totalPeer === 0 && !isStrongDayMaster;

  if (hasSovereign && hasPorous) {
    boundary_defense_strength = "mixed_sovereignty_diplomatic";
    dimension_evaluations["boundary_defense_strength"] = {
      value: boundary_defense_strength,
      status: "mixed",
      canonical_meaning_id: "mixed_sovereignty_diplomatic",
      confidence: "high",
      is_mixed: true,
      is_abstaining: false,
      evidence_summary: "강한 주체적 자존심과 타인의 감정에 대한 높은 공감의 양면성",
      contributing_sources: ["sovereign_signals", "porous_signals"],
    };
  } else if (hasSovereign) {
    boundary_defense_strength = "uncompromising_sovereignty";
    dimension_evaluations["boundary_defense_strength"] = {
      value: boundary_defense_strength,
      status: "supported",
      canonical_meaning_id: "uncompromising_sovereignty",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "신강 일간 및 비겁/괴강 기반의 확고한 경계선 및 주체성",
      contributing_sources: ["peer", "gwaegang", "strong_daymaster"],
    };
  } else if (hasPorous) {
    boundary_defense_strength = "porous_empathy";
    dimension_evaluations["boundary_defense_strength"] = {
      value: boundary_defense_strength,
      status: "supported",
      canonical_meaning_id: "porous_empathy",
      confidence: "high",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "인성 과다 및 비겁 부재에 따른 감정 전이 및 유약한 경계",
      contributing_sources: ["excess_inseong", "no_peer"],
    };
  } else if (totalGwan >= 1.0 && totalInseong >= 1.0) {
    boundary_defense_strength = "tactful_diplomatic";
    dimension_evaluations["boundary_defense_strength"] = {
      value: boundary_defense_strength,
      status: "supported",
      canonical_meaning_id: "tactful_diplomatic",
      confidence: "medium",
      is_mixed: false,
      is_abstaining: false,
      evidence_summary: "관인상생 구조에 기반한 원만하고 외교적인 경계선 유지",
      contributing_sources: ["ten_god_gwan_inseong"],
    };
  } else {
    boundary_defense_strength = "neutral_unspecified";
    dimension_evaluations["boundary_defense_strength"] = {
      value: boundary_defense_strength,
      status: "abstained",
      canonical_meaning_id: null,
      confidence: "insufficient",
      is_mixed: false,
      is_abstaining: true,
      evidence_summary: "경계 방어를 특정할 비겁/괴강/신강/관인 신호 부재",
      contributing_sources: [],
    };
  }

  return {
    expression_style,
    recognition_need,
    decision_pace,
    resource_governance,
    solitude_autonomy,
    conflict_decompression,
    pressure_response,
    support_giving_style,
    criticism_sensitivity,
    intimacy_expression_style,
    structure_spontaneity,
    boundary_defense_strength,
    dimension_evaluations,
  };
}
