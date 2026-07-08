import {
  ROUTES,
  blueprintRoute,
  withReportId,
} from "@/constants/routes";
import type { ReportSession } from "@/lib/home/reportSession";
import { hubRouteForIntent } from "@/lib/routing/hubRoutes";

export type EntryIntent =
  | "home"
  | "blueprint"
  | "relationships"
  | "decision"
  | "survey"
  | "survey-complete"
  | "birth"
  | "relationship-detail";

/**
 * 진입 목적지 SSOT.
 * - 허브 탭(decision/relationships/blueprint): 선행조건 없이 즉시 이동 (로그인 프리패스)
 * - 설문/출생 등 내부 플로우만 session 기반 분기
 */
export function resolveEntryDestination(params: {
  intent: EntryIntent;
  session: ReportSession | null;
  isSignedIn: boolean;
  reportIdHint?: string | null;
  viewerHint?: string | null;
}): string | null {
  const hint = params.reportIdHint?.trim() ?? "";
  const reportId = params.session?.reportId?.trim() || hint;
  const surveyDone =
    params.session?.surveyCompleted === true && Boolean(reportId);
  const hasBirth = Boolean(params.session?.birthDate?.trim());

  const hubRoute = hubRouteForIntent(params.intent, reportId || hint);
  if (hubRoute) return hubRoute;

  if (params.intent === "home") {
    return null;
  }

  if (params.intent === "survey") {
    return null;
  }

  if (!reportId) {
    return ROUTES.home;
  }

  if (params.intent === "survey-complete") {
    if (!surveyDone) return ROUTES.home;
    if (hasBirth) return blueprintRoute(reportId);
    return null;
  }

  if (params.intent === "birth") {
    if (!surveyDone) return withReportId(ROUTES.surveyV2, reportId);
    if (hasBirth) return blueprintRoute(reportId);
    return null;
  }

  if (params.intent === "relationship-detail") {
    if (!params.viewerHint?.trim()) return ROUTES.relationships;
    return null;
  }

  return null;
}
