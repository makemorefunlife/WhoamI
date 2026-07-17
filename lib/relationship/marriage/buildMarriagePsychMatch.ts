import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchResult, PsychMatchType } from "@/lib/relationship/psychMatch";
import { buildCohabitationPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildCohabitationPsychMatch";
import { COHABITATION_CHART_NOTE } from "@/lib/relationship/psychDomainLens/cohabitationCopyTables";
import type {
  DomainPsychHighlight,
  DomainPsychLens,
} from "@/lib/relationship/psychDomainLens/types";
import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import type { Locale } from "@/lib/i18n/locale";

/** @deprecated `psych_lens` / `DomainPsychHighlight.topic` 사용 권장 */
export type MarriageHomePsychHighlight = {
  axis_key: SecondaryAxisKey;
  axis_label: string;
  gap: number;
  match_type: PsychMatchType;
  home_topic: string;
  section_hint: string;
  hook: string;
  narrative: string;
};

/** @deprecated `DomainPsychLens` 사용 권장 — 캐시 JSON 호환용 */
export type MarriageHomePsychLens = {
  intro_line: string;
  highlights: MarriageHomePsychHighlight[];
};

export type MarriagePsychMatchBundle = {
  psych_match: PsychMatchResult;
  psych_lens: DomainPsychLens;
  /** 레거시 캐시·meta 호환 */
  home_psych_lens: MarriageHomePsychLens;
};

export function domainLensToHomePsychLens(
  lens: DomainPsychLens,
): MarriageHomePsychLens {
  return {
    intro_line: lens.intro_line,
    highlights: lens.highlights.map((h) => ({
      axis_key: h.axis_key,
      axis_label: h.axis_label,
      gap: h.gap,
      match_type: h.match_type,
      home_topic: h.topic,
      section_hint: h.section_hint,
      hook: h.hook,
      narrative: h.narrative,
    })),
  };
}

export function homePsychLensToDomain(
  home: MarriageHomePsychLens,
): DomainPsychLens {
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

export function buildMarriagePsychMatchBundle(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale = "ko-KR",
): MarriagePsychMatchBundle | null {
  const bundle = buildCohabitationPsychMatchBundle(psychA, psychB, locale);
  if (!bundle) return null;
  return {
    psych_match: bundle.psych_match,
    psych_lens: bundle.psych_lens,
    home_psych_lens: domainLensToHomePsychLens(bundle.psych_lens),
  };
}
