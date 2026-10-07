import { ROUTES, relationshipHubRoute, withReportId } from "@/constants/routes";
import { isPsychSurveyRequired } from "@/lib/i18n/localePolicy";
import type { Locale } from "@/lib/i18n/locale";
import type { ReportSession } from "@/lib/home/reportSession";

/**
 * Where "start my analysis" goes after a purchase is linked to the account.
 * Reuses the existing entry rules (lib/routing/resolveEntryDestination.ts,
 * lib/i18n/localePolicy.ts) instead of a fixed /analysis route:
 *
 *  - an explicit return path from the page that opened checkout wins (e.g.
 *    the Personal deep page that was waiting for a credit);
 *  - no report yet            -> home (its start flow creates the report);
 *  - survey required (en-US) and not done -> survey for that report;
 *  - no birth data yet        -> birth onboarding for that report;
 *  - Personal / pass / membership -> Personal deep analysis (autostart=1,
 *    the same entry StitchLiteResultPanel uses);
 *  - Relationship / Triple / add-on -> relationship hub for that report.
 *
 * Returns a locale-agnostic path (callers localize it).
 */
const RELATIONSHIP_PLANS = new Set([
  "kr_relationship_premium",
  "kr_relationship_triple",
  "us_relationship_premium",
  "us_additional_relationship",
]);

export function postPurchaseDestination(params: {
  planId: string | null | undefined;
  locale: Locale;
  session: Pick<ReportSession, "reportId" | "surveyCompleted" | "birthDate"> | null;
  explicitReturnPath?: string | null;
}): string {
  const explicit = params.explicitReturnPath;
  if (explicit && explicit.startsWith("/") && !explicit.startsWith("//") && explicit !== ROUTES.accountBilling) {
    return explicit;
  }
  const reportId = params.session?.reportId?.trim() ?? "";
  if (!reportId) return ROUTES.home;
  const surveyDone = !isPsychSurveyRequired(params.locale) || params.session?.surveyCompleted === true;
  if (!surveyDone) return withReportId(ROUTES.surveyV2, reportId);
  if (!params.session?.birthDate?.trim()) return withReportId(ROUTES.onboardingBirth, reportId);
  if (params.planId && RELATIONSHIP_PLANS.has(params.planId)) return relationshipHubRoute(reportId);
  return `${ROUTES.blueprint}/${encodeURIComponent(reportId)}/essence/deep?autostart=1`;
}
