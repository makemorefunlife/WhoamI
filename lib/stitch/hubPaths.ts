import { ROUTES, blueprintRoute, relationshipHubRoute } from "@/constants/routes";

/** Stitch 앱 허브 간 이동 경로 — reportId는 localStorage 폴백 */

export function readStoredReportId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("reportId")?.trim() ?? "";
}

export function blueprintPath(reportId?: string): string {
  return blueprintRoute(reportId ?? readStoredReportId());
}

export function relationHubPath(reportId?: string): string {
  return relationshipHubRoute(reportId ?? readStoredReportId());
}

export const DECISION_HUB_PATH = ROUTES.decision;
export const DECISION_HUB_LABEL = "결정";
