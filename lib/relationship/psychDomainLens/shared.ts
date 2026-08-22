import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import {
  buildPsychMatchResult,
  psychMatchAxisLabel,
  type PsychMatchAxisResult,
  type PsychMatchResult,
  type PsychMatchType,
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

/**
 * Name-explicit attribution sentence for a highlighted axis — replaces the
 * abstract, name-free `hook` question ("한 명은 X, 다른 한 명은 Y인가요?")
 * that every domain's `*_AXIS_COPY` table currently returns. The `narrative`
 * field is left untouched (it's already declarative/actionable prose, not a
 * rhetorical question, so it doesn't need names to make sense).
 *
 * Deliberately domain-agnostic and content-free: it only names who leans
 * which way on an axis, it does not know or invent *why* — that's still
 * `narrative`'s job. Uses the codebase's dual-particle convention
 * ("이(가)"/"은(는)"/"와(과)") so it reads correctly for any name without
 * needing Korean-particle-selection logic.
 */
export function buildAxisAttributionSentence(params: {
  axisLabel: string;
  matchType: PsychMatchType;
  lean: "even" | "a_high" | "b_high";
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string {
  const { axisLabel, matchType, lean, nameA, nameB } = params;
  const locale = params.locale ?? "ko-KR";
  const isEn = locale === "en-US";

  if (matchType === "tension") {
    return isEn
      ? `On ${axisLabel}, ${nameA} and ${nameB} tend to handle it differently, which is where friction tends to show up.`
      : `${axisLabel}에서는 ${nameA}와(과) ${nameB}가(이) 서로 다른 방식을 쓰는 편이라 부딪히기 쉬워요.`;
  }
  if (matchType === "similarity" || matchType === "resonance") {
    return isEn
      ? `On ${axisLabel}, ${nameA} and ${nameB} tend to handle it the same way, which makes this an easy fit.`
      : `${axisLabel}에서는 ${nameA}와(과) ${nameB} 모두 비슷한 방식이라 잘 맞는 편이에요.`;
  }
  // complementary
  if (lean === "a_high") {
    return isEn
      ? `On ${axisLabel}, ${nameA} tends to lead more, while ${nameB} tends to hang back.`
      : `${axisLabel}에서는 ${nameA}이(가) 더 뚜렷하게 나서는 편이고, ${nameB}는(은) 상대적으로 힘을 빼는 편이에요.`;
  }
  if (lean === "b_high") {
    return isEn
      ? `On ${axisLabel}, ${nameB} tends to lead more, while ${nameA} tends to hang back.`
      : `${axisLabel}에서는 ${nameB}이(가) 더 뚜렷하게 나서는 편이고, ${nameA}는(은) 상대적으로 힘을 빼는 편이에요.`;
  }
  return isEn
    ? `On ${axisLabel}, ${nameA} and ${nameB} tend to take on different roles rather than one leading.`
    : `${axisLabel}에서는 ${nameA}와(과) ${nameB}가(이) 서로 다른 역할을 맡는 편이에요.`;
}

/**
 * Rewrites a resolved DomainPsychLens's highlight hooks in place (returns a
 * new array) to be name-explicit, by cross-referencing each highlight's
 * axis_key against the full (already viewer-oriented) axisResults to find
 * that axis's score_a/score_b lean. Call this from each domain's ViewModel
 * `buildPsychRadarSection` — a pure display-time transform, so it works
 * uniformly whether `psych_lens` came from a fresh build or a cached report.
 */
export function nameExplicitHighlights(
  highlights: DomainPsychHighlight[],
  axisResults: PsychMatchAxisResult[],
  nameA: string,
  nameB: string,
  locale?: Locale,
): DomainPsychHighlight[] {
  const byAxis = new Map(axisResults.map((row) => [row.axis_key, row]));
  return highlights.map((h) => {
    const row = byAxis.get(h.axis_key);
    const lean = row ? scoreLean(row.score_a, row.score_b) : "even";
    return {
      ...h,
      hook: buildAxisAttributionSentence({
        axisLabel: h.axis_label,
        matchType: h.match_type,
        lean,
        nameA,
        nameB,
        locale,
      }),
    };
  });
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
