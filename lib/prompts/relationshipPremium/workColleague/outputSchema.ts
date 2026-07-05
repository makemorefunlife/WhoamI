import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";

export const WORK_COLLEAGUE_DEEP_FORMAT = "work_colleague_deep_v1" as const;

export type WorkColleagueDeepReport = {
  format: typeof WORK_COLLEAGUE_DEEP_FORMAT;
  report: WorkColleagueReportBody;
};

export function isWorkColleagueDeepReport(
  payload: unknown,
): payload is WorkColleagueDeepReport {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as WorkColleagueDeepReport;
  return (
    p.format === WORK_COLLEAGUE_DEEP_FORMAT &&
    Boolean(p.report?.snapshot_panel?.relationshipGauges?.length)
  );
}
