import {
  ROUTES,
  blueprintRoute,
  relationshipHubRoute,
  withReportId,
} from "@/constants/routes";
import type { ReportSession } from "@/lib/home/reportSession";
import { hasResultsDashboardPrerequisites } from "@/lib/v2/results/canShowResultsDashboard";

export type EntryIntent =
  | "home"
  | "blueprint"
  | "relationships"
  | "decision"
  | "survey"
  | "survey-complete"
  | "birth"
  | "relationship-detail";

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

  if (params.intent === "home") {
    if (!params.isSignedIn || !reportId) return null;
    if (
      hasResultsDashboardPrerequisites(
        reportId,
        params.session?.surveyCompleted === true,
        params.session?.birthDate ?? null,
      )
    ) {
      return blueprintRoute(reportId);
    }
    return null;
  }

  if (!reportId) {
    return ROUTES.home;
  }

  if (params.intent === "survey") {
    return null;
  }

  if (params.intent === "survey-complete") {
    if (!surveyDone) return ROUTES.home;
    if (hasBirth) return blueprintRoute(reportId);
    return null;
  }

  if (params.intent === "blueprint") {
    if (!surveyDone) return withReportId(ROUTES.surveyV2, reportId);
    if (!hasBirth) return withReportId(ROUTES.surveyV2Complete, reportId);
    return null;
  }

  if (params.intent === "relationships") {
    if (!surveyDone) return withReportId(ROUTES.surveyV2, reportId);
    if (!hasBirth) return withReportId(ROUTES.surveyV2Complete, reportId);
    return relationshipHubRoute(reportId);
  }

  if (params.intent === "decision") {
    return ROUTES.decision;
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

