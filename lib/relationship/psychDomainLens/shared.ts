import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import {
  buildPsychMatchResult,
  psychMatchAxisLabel,
  type PsychMatchAxisResult,
  type PsychMatchResult,
} from "@/lib/relationship/psychMatch";
import { buildNeutralV2Profile } from "@/lib/v2/survey/neutralProfile";
import type { CurrentSelfProfile, SecondaryAxisKey } from "@/lib/v2/survey/types";
import type { DomainNarrativeCopy, DomainPsychHighlight, DomainPsychLens } from "./types";
import type { Locale } from "@/lib/i18n/locale";

export type DomainAxisMeta = {
  topic: string;
  section_hint: string;
  section_key: string;
};

export function psychHasSurvey(psych: PsychMasterJson): boolean {
  return psych.survey_source === "v2_10q";
}

export function profileFromPsychMaster(psych: PsychMasterJson): CurrentSelfProfile {
  const base = buildNeutralV2Profile();
  return {
    ...base,
    secondary_axes: { ...psych.secondary_axes },
  };
}

export function buildPsychMatchFromMasters(
  psychA: PsychMasterJson,
  psychB: PsychMasterJson,
): PsychMatchResult {
  return buildPsychMatchResult({
    profileA: profileFromPsychMaster(psychA),
    profileB: profileFromPsychMaster(psychB),
  });
}

export function scoreLean(
  scoreA: number,
  scoreB: number,
): "a_high" | "b_high" | "even" {
  const gap = Math.abs(scoreA - scoreB);
  if (gap < 10) return "even";
  return scoreA > scoreB ? "a_high" : "b_high";
}

function homeAxisInterestScore(row: PsychMatchAxisResult): number {
  let score = row.gap;
  if (row.match_type === "tension") score += 35;
  else if (row.match_type === "complementary") score += 12;
  else score += 4;
  return score;
}

export function pickDomainHighlights(
  axisResults: PsychMatchAxisResult[],
  domainAxes: Partial<Record<SecondaryAxisKey, DomainAxisMeta>>,
  max = 4,
): PsychMatchAxisResult[] {
  const homeRows = axisResults.filter((row) => domainAxes[row.axis_key]);
  const ranked = [...homeRows].sort(
    (a, b) => homeAxisInterestScore(b) - homeAxisInterestScore(a),
  );

  const picked: PsychMatchAxisResult[] = [];
  const usedSectionKeys = new Set<string>();

  for (const row of ranked) {
    if (picked.length >= max) break;
    const cfg = domainAxes[row.axis_key]!;
    if (picked.length >= 1 && usedSectionKeys.has(cfg.section_key)) continue;
    picked.push(row);
    usedSectionKeys.add(cfg.section_key);
  }

  if (picked.length < max) {
    for (const row of ranked) {
      if (picked.length >= max) break;
      if (picked.some((p) => p.axis_key === row.axis_key)) continue;
      picked.push(row);
    }
  }

  return picked.slice(0, max);
}

/**
 * `locale` defaults to Korean so every pre-existing caller that doesn't pass
 * it keeps rendering exactly as before.
 */
export function buildDomainPsychLens(params: {
  psychMatch: PsychMatchResult;
  domainAxes: Partial<Record<SecondaryAxisKey, DomainAxisMeta>>;
  introTension: string;
  introDefault: string;
  lensTitle: string;
  chartNote: string;
  resolveCopy: (
    row: PsychMatchAxisResult,
    meta: DomainAxisMeta,
  ) => DomainNarrativeCopy;
  maxHighlights?: number;
  locale?: Locale;
}): DomainPsychLens {
  const locale = params.locale ?? "ko-KR";
  const highlights: DomainPsychHighlight[] = pickDomainHighlights(
    params.psychMatch.axis_results,
    params.domainAxes,
    params.maxHighlights ?? 4,
  ).map((row) => {
    const meta = params.domainAxes[row.axis_key]!;
    const copy = params.resolveCopy(row, meta);
    return {
      axis_key: row.axis_key,
      axis_label: psychMatchAxisLabel(row.axis_key, locale),
      gap: row.gap,
      match_type: row.match_type,
      topic: meta.topic,
      section_hint: meta.section_hint,
      hook: copy.hook,
      narrative: copy.narrative,
    };
  });

  const hasTension = highlights.some((h) => h.match_type === "tension");

  return {
    lens_title: params.lensTitle,
    chart_note: params.chartNote,
    intro_line: hasTension ? params.introTension : params.introDefault,
    highlights,
  };
}

export function buildDomainPsychBundle(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  buildLens: (psychMatch: PsychMatchResult) => DomainPsychLens,
) {
  if (!psychA || !psychB) return null;
  if (!psychHasSurvey(psychA) || !psychHasSurvey(psychB)) return null;
  const psych_match = buildPsychMatchFromMasters(psychA, psychB);
  return {
    psych_match,
    psych_lens: buildLens(psych_match),
  };
}
