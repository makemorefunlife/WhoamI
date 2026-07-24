/**
 * Shared newest-first ordering for hub / relationship_reports timestamps.
 * Missing or invalid ISO strings sort as epoch 0 (last in descending order).
 */

export function isoTimestampMs(value: string | null | undefined): number {
  if (typeof value !== "string" || !value.trim()) return 0;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
}

/** Descending by ISO timestamp (newest first). */
export function compareIsoTimestampDesc(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  return isoTimestampMs(b) - isoTimestampMs(a);
}

export function sortByIsoTimestampDesc<T>(
  items: readonly T[],
  getTimestamp: (item: T) => string | null | undefined,
  compareTieBreak: (a: T, b: T) => number,
): T[] {
  return [...items].sort((a, b) => {
    const byTime = compareIsoTimestampDesc(getTimestamp(a), getTimestamp(b));
    if (byTime !== 0) return byTime;
    return compareTieBreak(a, b);
  });
}

export function compareStringTieBreakDesc(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? 1 : -1;
}
