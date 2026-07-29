export {
  FORBIDDEN_ENTRY_KEYS,
  REFERENCE_DICTIONARY_SOURCE,
  REFERENCE_DICTIONARY_VERSION,
} from "./constants";
export type { DictionaryCategory } from "./constants";

export type {
  FieldBucket,
  FieldClassification,
  LocalizedText,
  ReferenceAliases,
  ReferenceDictionary,
  ReferenceDisplay,
  ReferenceEntry,
  ReferenceLimits,
  ReferenceProvenance,
} from "./types";

export {
  buildReferenceDictionary,
  getReferenceDictionary,
  resetReferenceDictionaryCache,
} from "./buildDictionary";

export {
  listByCategory,
  lookupReference,
  lookupReferences,
  requireReference,
} from "./lookup";

export { assertDictionaryPurity, assertEntryPurity } from "./purity";

export {
  FIELD_CLASSIFICATIONS,
  REFERENCE_SOURCE_INVENTORY,
} from "./inventory";
