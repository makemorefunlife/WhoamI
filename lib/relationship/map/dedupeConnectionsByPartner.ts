import { isoTimestampMs } from "@/lib/relationship/sortByIsoTimestampDesc";

export type DedupeCandidate = {
  partnerReportId: string;
  status: "completed" | "pending";
  addedAt: string | null;
  isManual: boolean;
};

/**
 * The same partner can appear via more than one relationship_report row
 * (e.g. a stale duplicate, or a re-invite) — keep exactly one per partner,
 * preferring completed > manual > most recently added. Pure, no I/O, so an
 * existing connected person can never be double-counted on the map.
 */
export function dedupeConnectionsByPartner<T extends DedupeCandidate>(
  candidates: readonly T[],
): T[] {
  const byPartner = new Map<string, T>();
  for (const c of candidates) {
    const prev = byPartner.get(c.partnerReportId);
    if (!prev) {
      byPartner.set(c.partnerReportId, c);
      continue;
    }
    const score = (x: T) => (x.status === "completed" ? 2 : 0) + (x.isManual ? 1 : 0);
    const sC = score(c);
    const sPrev = score(prev);
    if (sC > sPrev || (sC === sPrev && isoTimestampMs(c.addedAt) > isoTimestampMs(prev.addedAt))) {
      byPartner.set(c.partnerReportId, c);
    }
  }
  return [...byPartner.values()];
}
