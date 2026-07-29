/** Reference Dictionary MVP — stable base meanings only. */

export const REFERENCE_DICTIONARY_VERSION =
  "reference_dictionary_v1" as const;

export const REFERENCE_DICTIONARY_SOURCE =
  "lib/hardcoded/sajuReferenceData + curated structural bases" as const;

/** Fields that must never appear on a Dictionary entry. */
export const FORBIDDEN_ENTRY_KEYS = [
  "advice_ko",
  "advice_en",
  "strength_ko",
  "strength_en",
  "weakness_ko",
  "weakness_en",
  "relationship_ko",
  "relationship_en",
  "narrative",
  "prompt",
  "romantic",
  "marriage",
  "friend",
  "family",
  "work",
] as const;

export type DictionaryCategory =
  | "element"
  | "stem"
  | "branch"
  | "ten_god"
  | "twelve_stage"
  | "hidden_layer"
  | "hidden_stem"
  | "relation_type"
  | "relation_pair"
  | "shinsal"
  | "noble"
  | "special_signal"
  | "strength"
  | "johu_temp"
  | "johu_moist"
  | "pillar_slot"
  | "gongmang";
