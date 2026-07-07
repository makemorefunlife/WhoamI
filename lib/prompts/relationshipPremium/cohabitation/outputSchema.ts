import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";

export const COHABITATION_DEEP_FORMAT = "cohabitation_household_deep_v1" as const;

export type CohabitationDeepReport = {
  format: typeof COHABITATION_DEEP_FORMAT;
  report: MarriageReportBody;
};

export function isCohabitationDeepReport(
  payload: unknown,
): payload is CohabitationDeepReport {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as CohabitationDeepReport;
  return (
    p.format === COHABITATION_DEEP_FORMAT &&
    Boolean(p.report?.snapshot_panel?.relationshipGauges?.length)
  );
}
