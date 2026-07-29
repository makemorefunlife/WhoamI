/**
 * Sprint 1 inventory — field classification of existing reference sources.
 * Read-only documentation artifact used by tests + cleanup report.
 */

import type { FieldClassification } from "./types";

export const REFERENCE_SOURCE_INVENTORY = [
  "lib/hardcoded/sajuReferenceData.ts (REF_*)",
  "lib/hardcoded/ref_heavenly_stems.json",
  "lib/hardcoded/ref_earthly_branches.json",
  "lib/hardcoded/ref_hidden_stems.json",
  "lib/hardcoded/ref_ten_gods.json",
  "lib/hardcoded/ref_twelve_stages.json",
  "lib/hardcoded/ref_ten_god_rules.json",
  "lib/hardcoded/ref_twelve_stage_rules.json",
  "lib/hardcoded/ref_shinsal.json",
  "lib/hardcoded/ref_relation_rules.json",
  "lib/saju/elements.ts (ELEMENT_KO / GENERATES / OVERCOMES)",
  "lib/personCore/individualSaju/constants.ts (nobles, strength, johu methods, relation types, special signals)",
  "lib/personCore/individualSaju/refIds.ts (stable reference_id scheme)",
  "docs/v2/saju/06_Saju_Lite_Interpretation_Dictionary.md",
  "docs/v2/saju/08_Self_Analysis_Signal_Mapping.md",
] as const;

/** A=base meaning B=display C=SSOT D=CE E=delete */
export const FIELD_CLASSIFICATIONS: FieldClassification[] = [
  // stems
  { source: "REF_HEAVENLY_STEMS", field: "code", bucket: "C_remain_ssot", note: "identity code; also dictionary key" },
  { source: "REF_HEAVENLY_STEMS", field: "kor_name/hanja/eng_name/order_no", bucket: "B_display_metadata", note: "aliases/display" },
  { source: "REF_HEAVENLY_STEMS", field: "element/yin_yang", bucket: "C_remain_ssot", note: "also mirrored on StemRef in SSOT" },
  { source: "REF_HEAVENLY_STEMS", field: "metaphor_ko/en", bucket: "B_display_metadata", note: "symbol alias only in dictionary" },
  { source: "REF_HEAVENLY_STEMS", field: "strength_*/weakness_*", bucket: "D_move_to_context_engine", note: "trait packs — not dictionary base" },
  { source: "REF_HEAVENLY_STEMS", field: "advice_*", bucket: "E_delete_or_ignore", note: "forbidden in dictionary" },
  { source: "REF_HEAVENLY_STEMS", field: "created_at", bucket: "E_delete_or_ignore", note: "ops metadata" },

  // branches
  { source: "REF_EARTHLY_BRANCHES", field: "meaning_ko/en", bucket: "A_dictionary_base_meaning", note: "primary base meaning" },
  { source: "REF_EARTHLY_BRANCHES", field: "metaphor_ko/en", bucket: "B_display_metadata", note: "symbol" },
  { source: "REF_EARTHLY_BRANCHES", field: "season/zodiac_en/order_no", bucket: "B_display_metadata", note: "display + SSOT season on BranchRef" },
  { source: "REF_EARTHLY_BRANCHES", field: "strength_*/weakness_*/advice_*", bucket: "D_move_to_context_engine", note: "advice → E; traits → CE" },

  // hidden stems
  { source: "REF_HIDDEN_STEMS", field: "branch_code/stem_code/layer_type/display_order", bucket: "C_remain_ssot", note: "composition facts" },
  { source: "REF_HIDDEN_STEMS", field: "meaning_*/strength_*/weakness_*/advice_*", bucket: "D_move_to_context_engine", note: "personality prose excluded from dictionary" },

  // ten gods
  { source: "REF_TEN_GODS", field: "meaning_ko/en", bucket: "A_dictionary_base_meaning", note: "classical definition" },
  { source: "REF_TEN_GODS", field: "category/display_order/names", bucket: "B_display_metadata", note: "aliases + category_tag" },
  { source: "REF_TEN_GODS", field: "strength_*/weakness_*/advice_*", bucket: "D_move_to_context_engine", note: "excluded" },
  { source: "REF_TEN_GODS", field: "relationship_ko/en", bucket: "D_move_to_context_engine", note: "role tags / domain-adjacent — not base dictionary" },

  // twelve stages
  { source: "REF_TWELVE_STAGES", field: "meaning_ko/en", bucket: "A_dictionary_base_meaning", note: "stage definition" },
  { source: "REF_TWELVE_STAGES", field: "energy_level", bucket: "B_display_metadata", note: "also on TwelveStageRef" },
  { source: "REF_TWELVE_STAGES", field: "strength_*/weakness_*/advice_*", bucket: "D_move_to_context_engine", note: "excluded" },

  // rules tables
  { source: "REF_TEN_GOD_RULES", field: "*", bucket: "C_remain_ssot", note: "calculation rules — engine/SSOT, not dictionary prose" },
  { source: "REF_TWELVE_STAGE_RULES", field: "*", bucket: "C_remain_ssot", note: "calculation rules" },

  // shinsal
  { source: "REF_SHINSAL", field: "meaning_ko/en", bucket: "A_dictionary_base_meaning", note: "imported; purification cleanup candidate" },
  { source: "REF_SHINSAL", field: "names/category/display_order", bucket: "B_display_metadata", note: "aliases" },
  { source: "REF_SHINSAL", field: "calculation_type/value/target_branch", bucket: "C_remain_ssot", note: "engine rules" },
  { source: "REF_SHINSAL", field: "strength_*/weakness_*/advice_*", bucket: "E_delete_or_ignore", note: "forbidden in dictionary" },

  // relations
  { source: "REF_RELATION_RULES", field: "relation_type/codes/priority/description", bucket: "A_dictionary_base_meaning", note: "pair entry uses description + type base only" },
  { source: "REF_RELATION_RULES", field: "meaning_ko/en", bucket: "D_move_to_context_engine", note: "interpretive pair prose — not imported" },
  { source: "REF_RELATION_RULES", field: "result_code/result_element", bucket: "C_remain_ssot", note: "engine outcome fields" },

  // elements / individual constants
  { source: "elements.ts", field: "ELEMENT_KO", bucket: "B_display_metadata", note: "labels; dictionary has element:* base" },
  { source: "elements.ts", field: "ELEMENT_GENERATES/OVERCOMES", bucket: "C_remain_ssot", note: "deterministic rules" },
  { source: "elements.ts", field: "elementInteraction()", bucket: "D_move_to_context_engine", note: "explanatory sentences" },
  { source: "individualSaju/constants", field: "strength/johu/gongmang methods", bucket: "C_remain_ssot", note: "method ids on facts" },
  { source: "individualSaju/constants", field: "NOBLE_*/SPECIAL_*/RELATION_TYPE_IDS", bucket: "A_dictionary_base_meaning", note: "dictionary keys + curated bases" },

  // docs
  { source: "06_Saju_Lite_Interpretation_Dictionary.md", field: "*", bucket: "D_move_to_context_engine", note: "user insight dictionary — not Reference Dictionary" },
  { source: "08_Self_Analysis_Signal_Mapping.md", field: "*", bucket: "D_move_to_context_engine", note: "personal lens mapping" },
];
