import type { DictionaryCategory } from "./constants";
import { getReferenceDictionary } from "./buildDictionary";
import type { ReferenceDictionary, ReferenceEntry } from "./types";

export function lookupReference(
  referenceId: string,
  dict: ReferenceDictionary = getReferenceDictionary(),
): ReferenceEntry | null {
  return dict.by_id[referenceId] ?? null;
}

export function lookupReferences(
  referenceIds: string[],
  dict: ReferenceDictionary = getReferenceDictionary(),
): ReferenceEntry[] {
  const out: ReferenceEntry[] = [];
  for (const id of referenceIds) {
    const hit = dict.by_id[id];
    if (hit) out.push(hit);
  }
  return out;
}

export function listByCategory(
  category: DictionaryCategory,
  dict: ReferenceDictionary = getReferenceDictionary(),
): ReferenceEntry[] {
  return dict.entries.filter((e) => e.category === category);
}

export function requireReference(
  referenceId: string,
  dict: ReferenceDictionary = getReferenceDictionary(),
): ReferenceEntry {
  const hit = lookupReference(referenceId, dict);
  if (!hit) {
    throw new Error(`Reference Dictionary miss: ${referenceId}`);
  }
  return hit;
}
