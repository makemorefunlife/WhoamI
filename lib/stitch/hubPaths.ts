/** Stitch 앱 허브 간 이동 경로 — reportId는 localStorage 폴백 */

export function readStoredReportId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("reportId")?.trim() ?? "";
}

export function blueprintPath(reportId?: string): string {
  const id = (reportId ?? readStoredReportId()).trim();
  return id
    ? `/blueprint-preview?reportId=${encodeURIComponent(id)}`
    : "/blueprint-preview";
}

export function relationHubPath(reportId?: string): string {
  const id = (reportId ?? readStoredReportId()).trim();
  return id
    ? `/relationships?myReportId=${encodeURIComponent(id)}`
    : "/relationships";
}

export const DECISION_HUB_PATH = "/decision";
export const DECISION_HUB_LABEL = "결정";
