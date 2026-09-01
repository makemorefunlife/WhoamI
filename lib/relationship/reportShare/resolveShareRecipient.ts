export type RelationshipReportParticipants = {
  report_id_a: string;
  report_id_b: string;
};

/**
 * Pure participant check for the report-sharing owner flow: `ownerReportId`
 * must actually be one of the two participants of `rr`, and the recipient
 * is always the *other* one — never an arbitrary third party. Zero I/O so
 * it's exhaustively unit-testable on its own.
 */
export function resolveShareRecipient(
  rr: RelationshipReportParticipants,
  ownerReportId: string,
): string | null {
  if (rr.report_id_a === ownerReportId) return rr.report_id_b;
  if (rr.report_id_b === ownerReportId) return rr.report_id_a;
  return null;
}
