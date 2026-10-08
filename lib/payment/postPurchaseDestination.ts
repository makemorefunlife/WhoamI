import { ROUTES, relationshipHubRoute, withReportId } from "@/constants/routes";
import { isPsychSurveyRequired } from "@/lib/i18n/localePolicy";
import type { Locale } from "@/lib/i18n/locale";
import type { ReportSession } from "@/lib/home/reportSession";
import { accountLinkGroup } from "@/lib/payment/accountLinkCopy";
import {
  decideFriendAddReadiness,
  friendAddReturnPath,
  selfProfileStepPath,
} from "@/lib/relationship/friendAddReadiness";

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
 *  - Relationship / Triple / add-on -> the relationship flow: missing own
 *    details first (same rules as "add a friend",
 *    lib/relationship/friendAddReadiness.ts), then back to adding / inviting
 *    someone; already complete -> relationship hub;
 *  - 30-day pass -> the existing "where to start" chooser on home
 *    (personal / relationship / Decision Journal).
 *
 * Returns a locale-agnostic path (callers localize it).
 */
const RELATIONSHIP_PLANS = new Set([
  "kr_relationship_premium",
  "kr_relationship_triple",
  "us_relationship_premium",
  "us_additional_relationship",
]);

type Params = {
  planId: string | null | undefined;
  locale: Locale;
  session: Pick<ReportSession, "reportId" | "surveyCompleted" | "birthDate"> | null;
  explicitReturnPath?: string | null;
};

/**
 * path: where to go now. selfProfileReturn: when the path is a "fill in your
 * own details" step, the hub path to come back to afterwards (callers store
 * it with setSelfProfileReturn; the details pages consume it).
 */
export function resolvePostPurchase(params: Params): { path: string; selfProfileReturn: string | null } {
  const explicit = params.explicitReturnPath;
  if (explicit && explicit.startsWith("/") && !explicit.startsWith("//") && explicit !== ROUTES.accountBilling) {
    return { path: explicit, selfProfileReturn: null };
  }
  const group = accountLinkGroup(params.planId);
  if (group === "pass") return { path: `${ROUTES.home}?start=choice`, selfProfileReturn: null };
  if (group === "relationship" || group === "triple") {
    const reportId = params.session?.reportId?.trim() || null;
    const surveyRequired = isPsychSurveyRequired(params.locale);
    const readiness = decideFriendAddReadiness({
      signedIn: true,
      reportId,
      hasBirthDate: Boolean(params.session?.birthDate?.trim()),
      surveyComplete: params.session?.surveyCompleted === true,
      surveyRequired,
    });
    if (readiness.status === "no_profile") {
      return { path: `${ROUTES.home}?start=self`, selfProfileReturn: friendAddReturnPath(null) };
    }
    const step = selfProfileStepPath(readiness, surveyRequired);
    if (step) return { path: step, selfProfileReturn: friendAddReturnPath(reportId) };
    return { path: relationshipHubRoute(reportId as string), selfProfileReturn: null };
  }
  return { path: postPurchaseDestinationLegacy(params), selfProfileReturn: null };
}

export function postPurchaseDestination(params: Params): string {
  return resolvePostPurchase(params).path;
}

function postPurchaseDestinationLegacy(params: Params): string {
  const reportId = params.session?.reportId?.trim() ?? "";
  if (!reportId) return ROUTES.home;
  const surveyDone = !isPsychSurveyRequired(params.locale) || params.session?.surveyCompleted === true;
  if (!surveyDone) return withReportId(ROUTES.surveyV2, reportId);
  if (!params.session?.birthDate?.trim()) return withReportId(ROUTES.onboardingBirth, reportId);
  if (params.planId && RELATIONSHIP_PLANS.has(params.planId)) return relationshipHubRoute(reportId);  // (handled above)
  return `${ROUTES.blueprint}/${encodeURIComponent(reportId)}/essence/deep?autostart=1`;
}
