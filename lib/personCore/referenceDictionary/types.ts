/**
 * Reference Dictionary MVP schema.
 * Base meanings only — no advice, narrative, domain interpretation, or CE logic.
 */

import type { DictionaryCategory } from "./constants";

export type LocalizedText = {
  ko: string;
  en?: string;
};

export type ReferenceAliases = {
  kor_name?: string | null;
  hanja?: string | null;
  eng_name?: string | null;
  slug?: string | null;
  /** Short traditional symbol (e.g. stem metaphor) — not advice. */
  symbol_ko?: string | null;
  symbol_en?: string | null;
};

export type ReferenceDisplay = {
  order?: number | null;
  energy_level?: string | null;
  category_tag?: string | null;
  yin_yang?: string | null;
  element?: string | null;
  season?: string | null;
  zodiac_en?: string | null;
};

export type ReferenceProvenance = {
  source: string;
  version: string;
  upstream_ref?: string;
};

export type ReferenceLimits = {
  /** Domain product lenses must not live here. */
  allows_domain_lens: false;
  /** Actionable advice must not live here. */
  allows_advice: false;
  /** Final narrative / LLM prompt text must not live here. */
  allows_narrative: false;
};

export type ReferenceEntry = {
  reference_id: string;
  category: DictionaryCategory;
  base_meaning: LocalizedText;
  aliases: ReferenceAliases;
  display: ReferenceDisplay;
  provenance: ReferenceProvenance;
  limits: ReferenceLimits;
};

export type ReferenceDictionary = {
  schema_version: string;
  built_at: string;
  entry_count: number;
  entries: ReferenceEntry[];
  by_id: Record<string, ReferenceEntry>;
};

export type FieldBucket =
  | "A_dictionary_base_meaning"
  | "B_display_metadata"
  | "C_remain_ssot"
  | "D_move_to_context_engine"
  | "E_delete_or_ignore";

export type FieldClassification = {
  source: string;
  field: string;
  bucket: FieldBucket;
  note: string;
};
