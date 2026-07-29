/**
 * Batch 3 — parity: every deterministic legacy result must exist in IndividualSajuChart.
 */

import type { SajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import type { SajuMasterJson } from "../types/sajuMaster";
import { RELATION_TYPE_IDS } from "./constants";
import type { IndividualSajuChart } from "./types";

export type ParityIssue = {
  path: string;
  severity: "error" | "warn";
  message: string;
  legacy?: unknown;
  individual?: unknown;
};

export type ParityReport = {
  ok: boolean;
  error_count: number;
  warn_count: number;
  issues: ParityIssue[];
  checked_at: string;
};

const SLOT_BY_PILLAR: Record<string, string> = {
  년주: "year",
  월주: "month",
  일주: "day",
  시주: "hour",
};

const LEGACY_TYPE_TO_ID: Record<string, string> = {
  천간합: RELATION_TYPE_IDS.천간합,
  육합: RELATION_TYPE_IDS.육합,
  삼합: RELATION_TYPE_IDS.삼합,
  방합: RELATION_TYPE_IDS.방합,
  충: RELATION_TYPE_IDS.충,
  형: RELATION_TYPE_IDS.형,
  파: RELATION_TYPE_IDS.파,
  해: RELATION_TYPE_IDS.해,
};

function strengthTokenFromLegacyLabel(label: string): string {
  if (label.includes("신강")) return "shin_gang";
  if (label.includes("신약")) return "shin_yak";
  return "jung_hwa";
}

/**
 * Compare legacy SajuMasterJson (+ optional bundle) against IndividualSajuChart.
 * New Individual-only fields are allowed (superset). Missing legacy facts = error.
 */
export function verifyIndividualParity(params: {
  legacy: SajuMasterJson;
  individual: IndividualSajuChart;
  bundle?: SajuBundle;
}): ParityReport {
  const issues: ParityIssue[] = [];
  const { legacy, individual, bundle } = params;

  const push = (
    path: string,
    message: string,
    severity: "error" | "warn" = "error",
    extra?: { legacy?: unknown; individual?: unknown },
  ) => {
    issues.push({ path, severity, message, ...extra });
  };

  // Birth
  if (legacy.birth.birth_date !== individual.birth.birth_date) {
    push("birth.birth_date", "birth_date mismatch", "error", {
      legacy: legacy.birth.birth_date,
      individual: individual.birth.birth_date,
    });
  }
  if (legacy.birth.chart_time !== individual.birth.chart_time) {
    push("birth.chart_time", "chart_time mismatch");
  }
  if (legacy.birth.birth_time_unknown !== individual.birth.birth_time_unknown) {
    push("birth.birth_time_unknown", "birth_time_unknown mismatch");
  }

  // Pillars
  if (legacy.pillars.length !== individual.pillars.length) {
    push("pillars.length", "pillar count mismatch");
  }
  for (const lp of legacy.pillars) {
    const ip = individual.pillars.find((p) => p.slot === lp.slot);
    if (!ip) {
      push(`pillars.${lp.slot}`, "missing pillar in individual");
      continue;
    }
    if (ip.pillar_hangul !== lp.pillar_hangul) {
      push(`pillars.${lp.slot}.pillar_hangul`, "hangul mismatch", "error", {
        legacy: lp.pillar_hangul,
        individual: ip.pillar_hangul,
      });
    }
    if (ip.stem.code !== lp.stem_code) {
      push(`pillars.${lp.slot}.stem`, "stem_code mismatch");
    }
    if (ip.branch.code !== lp.branch_code) {
      push(`pillars.${lp.slot}.branch`, "branch_code mismatch");
    }
  }

  // Stem focus / day master
  if (!legacy.stem_focus) {
    push("stem_focus", "legacy stem_focus missing — cannot compare", "warn");
  } else {
    if (individual.day_master.stem.code !== legacy.stem_focus.day_stem_code) {
      push("day_master.stem", "day stem mismatch");
    }
    if (individual.day_master.day_branch.code !== legacy.stem_focus.day_branch_code) {
      push("day_master.day_branch", "day branch mismatch");
    }
  }

  // Johu / elements
  const lc = legacy.johu_climate;
  if (!lc) {
    push("johu_climate", "legacy johu_climate missing — cannot compare", "warn");
  } else {
    if (lc.heat_score !== individual.johu.heat_score) {
      push("johu.heat_score", "mismatch");
    }
    if (lc.moisture_score !== individual.johu.moisture_score) {
      push("johu.moisture_score", "mismatch");
    }
    if (lc.temperature_band !== individual.johu.temperature_band) {
      push("johu.temperature_band", "mismatch");
    }
    if (lc.moisture_band !== individual.johu.moisture_band) {
      push("johu.moisture_band", "mismatch");
    }
    for (const el of ["wood", "fire", "earth", "metal", "water"] as const) {
      if (
        (lc.element_counts?.[el] ?? 0) !==
        (individual.five_elements.surface_counts[el] ?? 0)
      ) {
        push(`five_elements.surface_counts.${el}`, "element count mismatch");
      }
    }
  }

  // Strength token vs legacy label
  if (!legacy.strength_balance?.label) {
    push(
      "strength_balance.label",
      "legacy strength_balance missing — cannot compare",
      "warn",
    );
  } else {
    const expectedToken = strengthTokenFromLegacyLabel(
      legacy.strength_balance.label,
    );
    if (individual.strength.label_token !== expectedToken) {
      push("strength.label_token", "strength class mismatch", "error", {
        legacy: legacy.strength_balance.label,
        individual: individual.strength.label_token,
      });
    }
  }

  // Yongsin: legacy stores Korean prose; individual stores element codes.
  // Check that weakest/strongest element heuristics align via five_elements.
  if (individual.favorable_elements.yongsin[0] !== individual.five_elements.weakest) {
    push(
      "favorable_elements.yongsin",
      "yongsin should equal weakest surface element",
      "warn",
    );
  }

  // Hidden stems: legacy = day branch only — must be subset of individual day pillar
  const dayPillar = individual.pillars.find((p) => p.slot === "day");
  if (!Array.isArray(legacy.hidden_stems)) {
    push("hidden_stems", "legacy hidden_stems missing — cannot compare", "warn");
  } else {
    const legacyHiddenCodes = legacy.hidden_stems.map((h) => h.stem_code).sort();
    const dayHiddenCodes = (dayPillar?.hidden_stems ?? [])
      .map((h) => h.stem.code)
      .sort();
    if (legacyHiddenCodes.join(",") !== dayHiddenCodes.join(",")) {
      // order may differ — compare as sets
      const a = new Set(legacyHiddenCodes);
      const b = new Set(dayHiddenCodes);
      const missing = [...a].filter((c) => !b.has(c));
      if (missing.length) {
        push(
          "hidden_stems.day",
          `legacy day hidden stems missing: ${missing.join(",")}`,
        );
      }
    }
  }

  // Ten gods (stem)
  for (const lt of legacy.ten_gods ?? []) {
    const ip = individual.pillars.find((p) => p.slot === lt.pillar_slot);
    if (!ip) {
      push(`ten_gods.${lt.pillar_slot}`, "pillar missing");
      continue;
    }
    if (ip.stem_ten_god.code !== lt.god_code) {
      push(`ten_gods.${lt.pillar_slot}.stem`, "stem ten god mismatch", "error", {
        legacy: lt.god_code,
        individual: ip.stem_ten_god.code,
      });
    }
  }

  // Twelve stages
  for (const ls of legacy.twelve_stages ?? []) {
    const ip = individual.pillars.find((p) => p.slot === ls.pillar_slot);
    if (!ip) {
      push(`twelve_stages.${ls.pillar_slot}`, "pillar missing");
      continue;
    }
    if (ip.twelve_stage.code !== ls.stage_code) {
      push(`twelve_stages.${ls.pillar_slot}`, "stage_code mismatch");
    }
  }

  // Relations: every legacy type must appear as type_id (원진/귀문 may be extra in individual)
  for (const lr of legacy.relation_dynamics ?? []) {
    const typeId = LEGACY_TYPE_TO_ID[lr.type];
    if (!typeId) {
      push(`relations_intra.${lr.type}`, "unknown legacy relation type", "warn");
      continue;
    }
    const found = individual.relations_intra.some((r) => r.type_id === typeId);
    if (!found) {
      push(
        `relations_intra.${typeId}`,
        `legacy relation type not found in individual`,
        "error",
        { legacy: lr },
      );
    }
  }

  // Shinsal by slug/name
  for (const ls of legacy.shinsal_hits ?? []) {
    const slug = ls.name_ko.trim().replace(/\s+/g, "_");
    const found = individual.shinsal_hits.some(
      (h) => h.slug === slug || h.evidence.some((e) => e.codes.includes(ls.name_ko)),
    );
    if (!found) {
      push(`shinsal_hits.${ls.name_ko}`, "shinsal hit missing in individual");
    }
  }

  // Special signals
  for (const ss of legacy.special_signals ?? []) {
    const ind = individual.special_signals.find((s) => s.signal_id === ss.key);
    if (!ind) {
      push(`special_signals.${ss.key}`, "signal missing");
      continue;
    }
    if (ind.possessed !== ss.possessed) {
      push(`special_signals.${ss.key}.possessed`, "possessed mismatch");
    }
  }

  // Validation
  if (legacy.validation && legacy.validation.ok !== individual.validation.ok) {
    push("validation.ok", "validation ok mismatch");
  }

  // Bundle day hidden stems parity if provided
  if (bundle) {
    const bundleCodes = bundle.hiddenStemsData.map((h) => h.stem_code).sort();
    const indCodes = (dayPillar?.hidden_stems ?? [])
      .map((h) => h.stem.code)
      .sort();
    if (bundleCodes.join(",") !== indCodes.join(",")) {
      const missing = bundleCodes.filter((c) => !indCodes.includes(c));
      if (missing.length) {
        push(
          "bundle.hiddenStemsData",
          `bundle day hidden missing in individual: ${missing.join(",")}`,
        );
      }
    }
    for (const tg of bundle.tenGods) {
      const slot = SLOT_BY_PILLAR[tg.pillar];
      const ip = individual.pillars.find((p) => p.slot === slot);
      if (ip && ip.stem_ten_god.code !== tg.godCode) {
        push(`bundle.tenGods.${tg.pillar}`, "bundle stem ten god mismatch");
      }
    }
  }

  const error_count = issues.filter((i) => i.severity === "error").length;
  const warn_count = issues.filter((i) => i.severity === "warn").length;

  return {
    ok: error_count === 0,
    error_count,
    warn_count,
    issues,
    checked_at: new Date().toISOString(),
  };
}
