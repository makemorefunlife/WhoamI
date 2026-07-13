import type { PersonCoreRelationMetaPayload } from "@/lib/personCore/mappers/buildPersonCoreRelationMeta";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchResult, PsychMatchType } from "@/lib/relationship/psychMatch";
import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import { COHABITATION_CHART_NOTE } from "./cohabitationCopyTables";
import type { DomainPsychHighlight, DomainPsychLens, DomainPsychMatchBundle } from "./types";

/** 동거 캐시 JSON 호환 — `home_psych_lens` */
export type LegacyHomePsychLens = {
  intro_line: string;
  highlights: Array<{
    axis_key: SecondaryAxisKey;
    axis_label: string;
    gap: number;
    match_type: PsychMatchType;
    home_topic: string;
    section_hint: string;
    hook: string;
    narrative: string;
  }>;
};

export type ReportPsychMeta = {
  psych_match?: PsychMatchResult | null;
  psych_lens?: DomainPsychLens | null;
  /** 동거 레거시 meta — `psych_lens` 없을 때 폴백 */
  home_psych_lens?: LegacyHomePsychLens | null;
  person_core?: PersonCoreRelationMetaPayload | null;
};

function legacyHomeLensToDomain(home: LegacyHomePsychLens): DomainPsychLens {
  return {
    lens_title: "🏠 동거에서 특히 눈에 띄는 축",
    chart_note: COHABITATION_CHART_NOTE,
    intro_line: home.intro_line,
    highlights: home.highlights.map(
      (h): DomainPsychHighlight => ({
        axis_key: h.axis_key,
        axis_label: h.axis_label,
        gap: h.gap,
        match_type: h.match_type,
        topic: h.home_topic,
        section_hint: h.section_hint,
        hook: h.hook,
        narrative: h.narrative,
      }),
    ),
  };
}

export function resolveReportPsychDisplay(
  meta: ReportPsychMeta | undefined,
  buildBundle: (
    psychA: PsychMasterJson,
    psychB: PsychMasterJson,
  ) => DomainPsychMatchBundle | null,
): DomainPsychMatchBundle | null {
  if (meta?.psych_match && meta.psych_lens) {
    return {
      psych_match: meta.psych_match,
      psych_lens: meta.psych_lens,
    };
  }
  if (meta?.psych_match && meta.home_psych_lens) {
    return {
      psych_match: meta.psych_match,
      psych_lens: legacyHomeLensToDomain(meta.home_psych_lens),
    };
  }
  if (meta?.psych_match) {
    const pc = meta.person_core;
    if (pc?.psych_a && pc?.psych_b) {
      const built = buildBundle(pc.psych_a, pc.psych_b);
      if (built) {
        return {
          psych_match: meta.psych_match,
          psych_lens: built.psych_lens,
        };
      }
    }
    return null;
  }
  const pc = meta?.person_core;
  if (pc?.psych_a && pc?.psych_b) {
    return buildBundle(pc.psych_a, pc.psych_b);
  }
  return null;
}

export function swapPsychAxisForViewer<
  T extends { score_a: number; score_b: number },
>(axisResults: T[], viewerIsReportA: boolean): T[] {
  if (viewerIsReportA) return axisResults;
  return axisResults.map((row) => ({
    ...row,
    score_a: row.score_b,
    score_b: row.score_a,
  }));
}
