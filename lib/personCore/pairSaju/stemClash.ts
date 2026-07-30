/**
 * Stem clash (천간충) pairs — lifted from workPairAnalysis for shared Pair Fact.
 * Not yet in REF_RELATION_RULES; keep this single predicate module.
 */

const STEM_CLASH_PAIRS = new Set(
  [
    ["gap", "gyeong"],
    ["eul", "sin"],
    ["byeong", "im"],
    ["jeong", "gye"],
  ].map(([a, b]) => [a, b].sort().join("-")),
);

export function isStemClash(a: string, b: string): boolean {
  return STEM_CLASH_PAIRS.has([a, b].sort().join("-"));
}

export function stemClashPairKey(a: string, b: string): string | null {
  if (!isStemClash(a, b)) return null;
  return [a, b].sort().join("-");
}
