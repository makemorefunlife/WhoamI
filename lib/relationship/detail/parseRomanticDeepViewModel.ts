import {
  isRomanticSajuDeepReport,
  type RomanticFortuneFlowResult,
  type RomanticPsychMatchResult,
  type RomanticPsychMatchType,
  type RomanticSajuDeepReport,
} from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function isPsychMatchType(v: unknown): v is RomanticPsychMatchType {
  return v === "similarity" || v === "complementary" || v === "tension";
}

function parsePsychMatch(v: unknown): RomanticPsychMatchResult | null {
  if (!isRecord(v)) return null;
  const axisResultsRaw = v.axis_results;
  const conflictTriggersRaw = v.conflict_triggers;
  if (!Array.isArray(axisResultsRaw) || !Array.isArray(conflictTriggersRaw)) return null;

  const axisResults: RomanticPsychMatchResult["axis_results"] = [];
  for (const row of axisResultsRaw) {
    if (!isRecord(row)) return null;
    if (
      typeof row.axis_key !== "string" ||
      typeof row.score_a !== "number" ||
      typeof row.score_b !== "number" ||
      typeof row.gap !== "number" ||
      !isPsychMatchType(row.match_type)
    ) {
      return null;
    }
    axisResults.push({
      axis_key: row.axis_key,
      score_a: row.score_a,
      score_b: row.score_b,
      gap: row.gap,
      match_type: row.match_type,
    });
  }

  const conflictTriggers: RomanticPsychMatchResult["conflict_triggers"] = [];
  for (const row of conflictTriggersRaw) {
    if (!isRecord(row)) return null;
    if (
      typeof row.axis_key !== "string" ||
      typeof row.gap !== "number" ||
      !isPsychMatchType(row.match_type)
    ) {
      return null;
    }
    conflictTriggers.push({
      axis_key: row.axis_key,
      gap: row.gap,
      match_type: row.match_type,
    });
  }

  return {
    axis_results: axisResults,
    conflict_triggers: conflictTriggers,
  };
}

function isFortuneRelation(v: unknown): v is "supportive" | "neutral" | "tension" {
  return v === "supportive" || v === "neutral" || v === "tension";
}

function isBranchRelation(v: unknown): v is "combine" | "clash" | "neutral" {
  return v === "combine" || v === "clash" || v === "neutral";
}

function parseFortuneFlow(v: unknown): RomanticFortuneFlowResult | null {
  if (!isRecord(v) || !isRecord(v.daewoon) || !isRecord(v.sewoon)) return null;
  const daewoon = v.daewoon;
  const sewoon = v.sewoon;
  if (
    typeof daewoon.current_year !== "number" ||
    typeof daewoon.age_band_start !== "number" ||
    typeof daewoon.daewoon_pillar !== "string" ||
    typeof daewoon.daewoon_element !== "string" ||
    !isFortuneRelation(daewoon.relationship_interaction) ||
    typeof daewoon.interaction_note !== "string"
  ) {
    return null;
  }
  if (typeof sewoon.current_year !== "number" || !Array.isArray(sewoon.years)) return null;

  const years: RomanticFortuneFlowResult["sewoon"]["years"] = [];
  for (const row of sewoon.years) {
    if (!isRecord(row)) return null;
    if (
      typeof row.year !== "number" ||
      typeof row.sewoon_pillar !== "string" ||
      !isBranchRelation(row.branch_relation)
    ) {
      return null;
    }
    years.push({
      year: row.year,
      sewoon_pillar: row.sewoon_pillar,
      branch_relation: row.branch_relation,
    });
  }

  return {
    daewoon: {
      current_year: daewoon.current_year,
      age_band_start: daewoon.age_band_start,
      daewoon_pillar: daewoon.daewoon_pillar,
      daewoon_element: daewoon.daewoon_element,
      relationship_interaction: daewoon.relationship_interaction,
      interaction_note: daewoon.interaction_note,
    },
    sewoon: {
      current_year: sewoon.current_year,
      years,
    },
  };
}

export type RomanticDeepMetaViewModel = {
  psych_match: RomanticPsychMatchResult | null;
  romantic_fortune_flow: RomanticFortuneFlowResult | null;
};

export type RomanticDeepViewModel = Omit<RomanticSajuDeepReport["report"], "meta"> & {
  meta?: Record<string, unknown> & RomanticDeepMetaViewModel;
};

export function parseRomanticDeepViewModel(v: unknown): RomanticDeepViewModel | null {
  if (!isRomanticSajuDeepReport({ report: v })) return null;
  const report = v as RomanticSajuDeepReport["report"];
  const rawMeta = isRecord(report.meta) ? report.meta : {};
  const psychMatch = parsePsychMatch(rawMeta.psych_match ?? null);
  const fortuneFlow = parseFortuneFlow(rawMeta.romantic_fortune_flow ?? null);

  return {
    ...report,
    meta: {
      ...rawMeta,
      psych_match: psychMatch,
      romantic_fortune_flow: fortuneFlow,
    },
  };
}
