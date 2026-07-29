import { FORBIDDEN_ENTRY_KEYS } from "./constants";
import type { ReferenceDictionary, ReferenceEntry } from "./types";

const ADVICE_PATTERNS = [
  /하세요[.!]?$/,
  /해보세요/,
  /말해주세요/,
  /잊지 마세요/,
  /Practice /,
  /Tell yourself/,
  /Don't forget/,
];

/**
 * Structural purity: no forbidden fields, limits locked, base_meaning present.
 * Does not rewrite upstream REF prose quality — that is a cleanup candidate.
 */
export function assertEntryPurity(entry: ReferenceEntry): string[] {
  const errors: string[] = [];
  if (!entry.reference_id) errors.push("missing reference_id");
  if (!entry.base_meaning?.ko?.trim()) errors.push("missing base_meaning.ko");
  if (entry.limits.allows_advice !== false) {
    errors.push("limits.allows_advice must be false");
  }
  if (entry.limits.allows_domain_lens !== false) {
    errors.push("limits.allows_domain_lens must be false");
  }
  if (entry.limits.allows_narrative !== false) {
    errors.push("limits.allows_narrative must be false");
  }

  const json = JSON.stringify(entry);
  for (const key of FORBIDDEN_ENTRY_KEYS) {
    if (
      key === "romantic" ||
      key === "marriage" ||
      key === "friend" ||
      key === "family" ||
      key === "work" ||
      key === "narrative" ||
      key === "prompt" ||
      key === "advice"
    ) {
      continue;
    }
    if (new RegExp(`"${key}"\\s*:`).test(json)) {
      errors.push(`forbidden field present: ${key}`);
    }
  }
  return errors;
}

export function assertDictionaryPurity(dict: ReferenceDictionary): {
  ok: boolean;
  errors: string[];
  advice_like_base_meaning_count: number;
} {
  const errors: string[] = [];
  let adviceLike = 0;
  for (const e of dict.entries) {
    for (const err of assertEntryPurity(e)) {
      errors.push(`${e.reference_id}: ${err}`);
    }
    const ko = e.base_meaning.ko;
    if (ADVICE_PATTERNS.some((re) => re.test(ko))) adviceLike += 1;
  }
  if (dict.entry_count !== dict.entries.length) {
    errors.push("entry_count mismatch");
  }
  if (Object.keys(dict.by_id).length !== dict.entries.length) {
    errors.push("by_id size mismatch");
  }
  return {
    ok: errors.length === 0,
    errors,
    advice_like_base_meaning_count: adviceLike,
  };
}
