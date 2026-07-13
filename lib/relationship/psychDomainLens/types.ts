import type { PsychMatchResult, PsychMatchType } from "@/lib/relationship/psychMatch";
import type { SecondaryAxisKey } from "@/lib/v2/survey/types";

export type DomainPsychHighlight = {
  axis_key: SecondaryAxisKey;
  axis_label: string;
  gap: number;
  match_type: PsychMatchType;
  topic: string;
  section_hint: string;
  hook: string;
  narrative: string;
};

export type DomainPsychLens = {
  intro_line: string;
  highlights: DomainPsychHighlight[];
  lens_title: string;
  chart_note: string;
};

export type DomainPsychMatchBundle = {
  psych_match: PsychMatchResult;
  psych_lens: DomainPsychLens;
};

export type DomainNarrativeCopy = {
  hook: string;
  narrative: string;
};
