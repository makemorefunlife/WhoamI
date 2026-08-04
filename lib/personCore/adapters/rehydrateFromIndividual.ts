/**
 * Batch 4 — Rehydrate IndividualSajuChart → legacy consumer shapes.
 *
 * Rules:
 * - Read facts only from IndividualSajuChart
 * - Reference Dictionary lookups for display metadata only
 * - Do NOT call calculateSajuBundle / buildChartContext / analyze*
 */

import {
  REF_EARTHLY_BRANCHES,
  REF_HEAVENLY_STEMS,
  REF_HIDDEN_STEMS,
  REF_RELATION_RULES,
  REF_SHINSAL,
  REF_TEN_GODS,
  REF_TWELVE_STAGES,
} from "@/lib/hardcoded/sajuReferenceData";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { ChartContext, ChartPillar } from "@/lib/saju/chartContext";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import { ELEMENT_KO } from "@/lib/saju/elements";
import { RELATION_TYPE_IDS } from "../individualSaju/constants";
import type {
  ElementCode,
  IndividualSajuChart,
  RelationFact,
} from "../individualSaju/types";
import { LEGACY_SAJU_ENGINE_ID } from "../individualSaju/constants";
import type {
  JohuClimateSnapshot,
  RelationDynamicsEntry,
  SajuMasterJson,
  SajuShinsalHit,
  SajuSpecialSignalFlag,
  StrengthBalanceSnapshot,
  TenGodPillarEntry,
  TwelveStageEntry,
  YongsinEstimateSnapshot,
} from "../types/sajuMaster";
import { SAJU_MASTER_JSON_VERSION } from "../schemaVersion";

const SLOT_TO_LABEL: Record<string, string> = {
  year: "년주",
  month: "월주",
  day: "일주",
  hour: "시주",
};

const TYPE_ID_TO_KO: Record<string, string> = Object.fromEntries(
  Object.entries(RELATION_TYPE_IDS).map(([ko, id]) => [id, ko]),
);

const STRENGTH_LABEL_BY_TOKEN: Record<
  IndividualSajuChart["strength"]["label_token"],
  string
> = {
  shin_gang: "신강(혼자서도 잘 버티는 타입)",
  shin_yak: "신약(주변 지지·공감이 필요한 타입)",
  jung_hwa: "중화(상황에 따라 유연하게 기운이 오감)",
};

const SPECIAL_SIGNAL_NAME: Record<string, string> = {
  dohwa: "도화(홍염·함지)",
  yeokma: "역마살",
  wonjin: "원진살",
  guimun: "귀문관살",
};

function pillarBySlot(chart: IndividualSajuChart, slot: string) {
  return chart.pillars.find((p) => p.slot === slot);
}

function hangulPillars(chart: IndividualSajuChart) {
  return {
    yearPillar: pillarBySlot(chart, "year")?.pillar_hangul ?? "",
    monthPillar: pillarBySlot(chart, "month")?.pillar_hangul ?? "",
    dayPillar: pillarBySlot(chart, "day")?.pillar_hangul ?? "",
    hourPillar: pillarBySlot(chart, "hour")?.pillar_hangul ?? "",
  };
}

/** Assemble ChartContext from stored codes — no hangul→code remapping. */
export function rehydrateChartContextFromIndividual(
  chart: IndividualSajuChart,
): ChartContext {
  const ordered = ["year", "month", "day", "hour"] as const;
  const pillars: ChartPillar[] = ordered.map((slot) => {
    const p = pillarBySlot(chart, slot)!;
    return {
      name: SLOT_TO_LABEL[slot]!,
      pillar: p.pillar_hangul,
      stemCode: p.stem.code,
      branchCode: p.branch.code,
    };
  });

  const stemCodes = new Set(pillars.map((p) => p.stemCode));
  const branchCodes = new Set(pillars.map((p) => p.branchCode));
  const day = pillars.find((p) => p.name === "일주")!;
  const month = pillars.find((p) => p.name === "월주")!;
  const year = pillars.find((p) => p.name === "년주")!;
  const hour = pillars.find((p) => p.name === "시주")!;

  return {
    pillars,
    stemCodes,
    branchCodes,
    dayStemCode: day.stemCode,
    dayBranchCode: day.branchCode,
    monthStemCode: month.stemCode,
    monthBranchCode: month.branchCode,
    yearStemCode: year.stemCode,
    yearBranchCode: year.branchCode,
    hourStemCode: hour.stemCode,
    hourBranchCode: hour.branchCode,
    dayPillar: day.pillar,
  };
}

function lookupRelationPresentation(rel: RelationFact): {
  type: string;
  name: string;
  interpretation: string;
} {
  const typeKo = TYPE_ID_TO_KO[rel.type_id] ?? rel.type_id;
  if (rel.reference_id?.startsWith("relation:")) {
    const id = Number(rel.reference_id.slice("relation:".length));
    const rule = REF_RELATION_RULES.find((r) => r.id === id);
    if (rule) {
      return {
        type: typeKo,
        name: rule.description ?? `${rel.codes.join("")}${typeKo}`,
        interpretation: rule.meaning_ko ?? "",
      };
    }
  }
  // wonjin / guimun — no REF row; legacy kept these out of relation_dynamics
  return {
    type: typeKo,
    name: `${rel.codes.join("-")}:${typeKo}`,
    interpretation: "",
  };
}

/**
 * Legacy sajuJson omits 원진/귀문 from relations (they live in special_signals).
 * Filter them out for byte-compatible relation lists.
 */
function legacyCompatibleRelations(
  chart: IndividualSajuChart,
): NonNullable<SajuDataForIntegrated["relations"]> {
  return chart.relations_intra
    .filter(
      (r) =>
        r.type_id !== RELATION_TYPE_IDS.원진 &&
        r.type_id !== RELATION_TYPE_IDS.귀문,
    )
    .map((r) => {
      const pres = lookupRelationPresentation(r);
      return {
        type: pres.type,
        name: pres.name,
        interpretation: pres.interpretation,
      };
    });
}

function dayHiddenForLegacy(chart: IndividualSajuChart) {
  const day = pillarBySlot(chart, "day");
  return (day?.hidden_stems ?? []).map((h) => {
    const ref = REF_HIDDEN_STEMS.find(
      (r) =>
        r.branch_code === h.branch_code &&
        r.stem_code === h.stem.code &&
        r.layer_type === h.layer_type,
    );
    return {
      stem_code: h.stem.code,
      meaning_ko: ref?.meaning_ko ?? null,
    };
  });
}

/** Individual → legacy SajuDataForIntegrated (display via REF). */
export function rehydrateSajuDataFromIndividual(
  chart: IndividualSajuChart,
): SajuDataForIntegrated {
  const pillars = hangulPillars(chart);
  const dayStem = REF_HEAVENLY_STEMS.find(
    (r) => r.code === chart.day_master.stem.code,
  );
  const dayBranch = REF_EARTHLY_BRANCHES.find(
    (r) => r.code === chart.day_master.day_branch.code,
  );
  const dayStage = pillarBySlot(chart, "day")?.twelve_stage;
  const stageRef = dayStage
    ? REF_TWELVE_STAGES.find((r) => r.code === dayStage.code)
    : null;

  return {
    saju: pillars,
    dayStemData: {
      kor_name: dayStem?.kor_name,
      metaphor_ko: dayStem?.metaphor_ko ?? null,
      strength_ko: dayStem?.strength_ko ?? null,
      weakness_ko: dayStem?.weakness_ko ?? null,
      advice_ko: dayStem?.advice_ko ?? null,
    },
    dayBranchData: {
      kor_name: dayBranch?.kor_name,
      meaning_ko: dayBranch?.meaning_ko ?? null,
      strength_ko: dayBranch?.strength_ko ?? null,
      weakness_ko: dayBranch?.weakness_ko ?? null,
      advice_ko: dayBranch?.advice_ko ?? null,
    },
    hiddenStemsData: dayHiddenForLegacy(chart),
    tenGods: chart.pillars.map((p) => {
      const god = REF_TEN_GODS.find((r) => r.code === p.stem_ten_god.code);
      return {
        pillar: SLOT_TO_LABEL[p.slot],
        godCode: p.stem_ten_god.code,
        godData: god
          ? {
              kor_name: god.kor_name,
              meaning_ko: god.meaning_ko,
              relationship_ko: god.relationship_ko,
            }
          : null,
      };
    }),
    twelveStageData: stageRef
      ? {
          kor_name: stageRef.kor_name,
          meaning_ko: stageRef.meaning_ko ?? null,
        }
      : null,
    growthStages: chart.pillars.map((p) => {
      const stage = REF_TWELVE_STAGES.find(
        (r) => r.code === p.twelve_stage.code,
      );
      return {
        pillar: SLOT_TO_LABEL[p.slot],
        stageData: stage
          ? {
              kor_name: stage.kor_name,
              meaning_ko: stage.meaning_ko ?? null,
            }
          : null,
      };
    }),
    relations: legacyCompatibleRelations(chart),
    shinsals: chart.shinsal_hits.map((h) => {
      const numeric =
        h.reference_id.startsWith("shinsal:") &&
        /^\d+$/.test(h.reference_id.slice("shinsal:".length))
          ? Number(h.reference_id.slice("shinsal:".length))
          : null;
      const row =
        (numeric != null
          ? REF_SHINSAL.find((r) => r.id === numeric)
          : null) ??
        REF_SHINSAL.find((r) => r.name_ko === h.slug.replace(/_/g, "")) ??
        REF_SHINSAL.find((r) => r.name_ko.replace(/\s+/g, "_") === h.slug);
      return {
        name_ko: row?.name_ko ?? h.slug,
        name_hanja: row?.name_hanja ?? null,
        category: h.category ?? row?.category ?? null,
        meaning_ko: row?.meaning_ko ?? null,
        strength_ko: row?.strength_ko ?? null,
        weakness_ko: row?.weakness_ko ?? null,
        advice_ko: row?.advice_ko ?? null,
      };
    }),
  };
}

/** Individual → legacy SajuChartProvenance */
export function rehydrateProvenanceFromIndividual(
  chart: IndividualSajuChart,
): SajuChartProvenance {
  const dayStem = REF_HEAVENLY_STEMS.find(
    (r) => r.code === chart.day_master.stem.code,
  );
  const pillars = hangulPillars(chart);
  return {
    birthDate: chart.birth.birth_date,
    chartTime: chart.birth.chart_time,
    birthTimeUnknown: chart.birth.birth_time_unknown,
    pillars: {
      year: pillars.yearPillar,
      month: pillars.monthPillar,
      day: pillars.dayPillar,
      hour: pillars.hourPillar,
    },
    dayStemCode: chart.day_master.stem.code,
    dayStemKor: dayStem?.kor_name ?? chart.day_master.stem.code,
    dayStemMetaphor: dayStem?.metaphor_ko ?? "",
    engine: LEGACY_SAJU_ENGINE_ID,
    validationOk: chart.validation.ok,
    validationNotes: chart.validation.notes,
  };
}

export type LegacySajuInputsFromIndividual = {
  sajuJson: SajuDataForIntegrated;
  provenance: SajuChartProvenance;
  chartContext: ChartContext;
};

export function legacySajuInputsFromIndividual(
  chart: IndividualSajuChart,
): LegacySajuInputsFromIndividual {
  return {
    sajuJson: rehydrateSajuDataFromIndividual(chart),
    provenance: rehydrateProvenanceFromIndividual(chart),
    chartContext: rehydrateChartContextFromIndividual(chart),
  };
}

function strengthSnapshot(
  chart: IndividualSajuChart,
): StrengthBalanceSnapshot {
  const label = STRENGTH_LABEL_BY_TOKEN[chart.strength.label_token];
  const dayEl = chart.day_master.element;
  return {
    label,
    note: `일간 ${ELEMENT_KO[dayEl] ?? dayEl} 기준 — 받치는 기운(동기·자원) ${chart.strength.support_score} vs 소모·압박 기운 ${Math.round(chart.strength.drain_score)}`,
  };
}

function yongsinSnapshot(
  chart: IndividualSajuChart,
): YongsinEstimateSnapshot {
  const yong = chart.favorable_elements.yongsin[0];
  const gi = chart.favorable_elements.gisin[0];
  const counts = chart.five_elements.surface_counts;
  return {
    yongsin_candidates: yong
      ? [
          `${ELEMENT_KO[yong] ?? yong} — 부족한 기운, 관계에서 채우고 싶은 에너지`,
        ]
      : [],
    gisin_candidates: gi
      ? [
          `${ELEMENT_KO[gi] ?? gi} — 과한 기운, 과부하·고집·예민함으로 나올 수 있음`,
        ]
      : [],
    confidence: chart.favorable_elements.confidence === "medium" ? "medium" : "low",
    note: `오행 분포 기반 후보 (약: ${yong ? counts[yong as ElementCode] : "?"}, 강: ${gi ? counts[gi as ElementCode] : "?"}) — 확정 아님`,
  };
}

function johuSnapshot(chart: IndividualSajuChart): JohuClimateSnapshot {
  return {
    heat_score: chart.johu.heat_score,
    moisture_score: chart.johu.moisture_score,
    temperature_band: chart.johu.temperature_band,
    moisture_band: chart.johu.moisture_band,
    element_counts: { ...chart.five_elements.surface_counts },
  };
}

function specialSignalsFromIndividual(
  chart: IndividualSajuChart,
): SajuSpecialSignalFlag[] {
  return chart.special_signals.map((s) => ({
    key: s.signal_id as SajuSpecialSignalFlag["key"],
    name_ko: SPECIAL_SIGNAL_NAME[s.signal_id] ?? String(s.signal_id),
    possessed: s.possessed,
    evidence: s.evidence.map((e) => e.detail || e.codes.join("-")),
  }));
}

function shinsalHitsFromIndividual(chart: IndividualSajuChart): SajuShinsalHit[] {
  return chart.shinsal_hits.map((h) => {
    const numeric =
      h.reference_id.startsWith("shinsal:") &&
      /^\d+$/.test(h.reference_id.slice("shinsal:".length))
        ? Number(h.reference_id.slice("shinsal:".length))
        : null;
    const row =
      (numeric != null
        ? REF_SHINSAL.find((r) => r.id === numeric)
        : null) ?? REF_SHINSAL.find((r) => r.name_ko.replace(/\s+/g, "_") === h.slug);
    return {
      name_ko: row?.name_ko ?? h.slug,
      name_hanja: row?.name_hanja ?? null,
      category: h.category ?? row?.category ?? null,
      possessed: true as const,
      meaning_ko: row?.meaning_ko ?? null,
    };
  });
}

function relationDynamicsFromIndividual(
  chart: IndividualSajuChart,
): RelationDynamicsEntry[] {
  return chart.relations_intra
    .filter(
      (r) =>
        r.type_id !== RELATION_TYPE_IDS.원진 &&
        r.type_id !== RELATION_TYPE_IDS.귀문,
    )
    .map((r) => {
      const pres = lookupRelationPresentation(r);
      return {
        type: pres.type,
        name: pres.name,
        interpretation: pres.interpretation,
        priority: r.priority,
        codes: [...r.codes],
      };
    });
}

/**
 * Individual → SajuMasterJson **without** domain signal packs.
 * Domain packs stay on legacy dual-write (not reconstituted here).
 */
export function rehydrateSajuMasterFromIndividual(
  chart: IndividualSajuChart,
): Omit<SajuMasterJson, "domain_signals"> & {
  domain_signals?: SajuMasterJson["domain_signals"];
} {
  const day = pillarBySlot(chart, "day")!;
  const month = pillarBySlot(chart, "month")!;
  const dayStem = REF_HEAVENLY_STEMS.find(
    (r) => r.code === chart.day_master.stem.code,
  );
  const monthStem = REF_HEAVENLY_STEMS.find((r) => r.code === month.stem.code);

  const ten_gods: TenGodPillarEntry[] = chart.pillars.map((p) => {
    const god = REF_TEN_GODS.find((r) => r.code === p.stem_ten_god.code);
    return {
      pillar_slot: p.slot,
      god_code: p.stem_ten_god.code,
      god_kor_name: god?.kor_name ?? null,
    };
  });

  const twelve_stages: TwelveStageEntry[] = chart.pillars.map((p) => {
    const stage = REF_TWELVE_STAGES.find((r) => r.code === p.twelve_stage.code);
    return {
      pillar_slot: p.slot,
      branch_code: p.twelve_stage.branch_code,
      stage_code: p.twelve_stage.code,
      stage_kor_name: stage?.kor_name ?? null,
      meaning_ko: stage?.meaning_ko ?? null,
    };
  });

  const dayHangul = day.pillar_hangul;
  const monthHangul = month.pillar_hangul;

  return {
    schema_version: SAJU_MASTER_JSON_VERSION,
    engine_version: LEGACY_SAJU_ENGINE_ID,
    birth: {
      birth_date: chart.birth.birth_date,
      chart_time: chart.birth.chart_time,
      birth_time_unknown: chart.birth.birth_time_unknown,
    },
    pillars: chart.pillars.map((p) => ({
      slot: p.slot,
      label_ko: p.label_ko,
      pillar_hangul: p.pillar_hangul,
      stem_code: p.stem.code,
      branch_code: p.branch.code,
    })),
    stem_focus: {
      day_stem_code: chart.day_master.stem.code,
      day_stem_hangul: dayHangul.charAt(0) || dayStem?.kor_name || "",
      day_stem_kor_name: dayStem?.kor_name ?? null,
      month_stem_code: month.stem.code,
      month_stem_hangul: monthHangul.charAt(0) || monthStem?.kor_name || "",
      month_stem_kor_name: monthStem?.kor_name ?? null,
      day_branch_code: chart.day_master.day_branch.code,
      day_branch_hangul: dayHangul.charAt(1) || "",
    },
    johu_climate: johuSnapshot(chart),
    strength_balance: strengthSnapshot(chart),
    yongsin_estimate: yongsinSnapshot(chart),
    hidden_stems: (day.hidden_stems ?? []).map((h, order) => {
      const ref = REF_HIDDEN_STEMS.find(
        (r) =>
          r.branch_code === h.branch_code &&
          r.stem_code === h.stem.code &&
          r.layer_type === h.layer_type,
      );
      const stemRow = REF_HEAVENLY_STEMS.find((r) => r.code === h.stem.code);
      return {
        stem_code: h.stem.code,
        stem_hangul: stemRow?.kor_name ?? null,
        meaning_ko: ref?.meaning_ko ?? null,
        order,
      };
    }),
    special_signals: specialSignalsFromIndividual(chart),
    shinsal_hits: shinsalHitsFromIndividual(chart),
    twelve_stages,
    ten_gods,
    relation_dynamics: relationDynamicsFromIndividual(chart),
    // domain_signals intentionally omitted — not reconstitutable without engine
    validation: {
      ok: chart.validation.ok,
      notes: chart.validation.notes,
    },
  };
}
