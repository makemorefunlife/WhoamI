import type { Locale } from "@/lib/i18n/locale";
import { localizedPath } from "@/lib/i18n/locale";

/** Locale-agnostic path constants (always without `/kr`). */
export const ROUTES = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  surveyV2: "/survey-v2",
  surveyV2Complete: "/survey-v2/complete",
  onboardingBirth: "/onboarding/birth",
  inviteBirth: "/invite-birth",
  blueprint: "/blueprint-preview",
  relationships: "/relationships",
  relationship: "/relationship",
  decision: "/decision",
  decisionHistory: "/decision/history",
  account: "/account",
  accountProfile: "/account/profile",
  accountBilling: "/account/billing",
  about: "/about",
  pricing: "/pricing",
  howItWorks: "/how-it-works",
  faq: "/faq",
  contact: "/contact",
  terms: "/terms",
  privacy: "/privacy",
  refund: "/refund",
  doNotSell: "/do-not-sell",
  legalConsent: "/onboarding/legal-consent",
  invite: "/invite",
  connect: "/connect",
  thankYou: "/thank-you",
} as const;

/** Prefix path for a locale (`/kr/...` or unprefixed). */
export function routeForLocale(path: string, locale: Locale): string {
  return localizedPath(path, locale);
}

export function withReportId(path: string, reportId?: string | null): string {
  const id = reportId?.trim();
  if (!id) return path;
  const q = new URLSearchParams({ reportId: id });
  return `${path}?${q.toString()}`;
}

export function blueprintRoute(reportId?: string | null): string {
  return withReportId(ROUTES.blueprint, reportId);
}

export function relationshipHubRoute(
  reportId?: string | null,
  /**
   * Relationship Discovery Flow V1: a relationship_report_id to focus
   * (auto-select the role planet + open the person preview) once the
   * Relation Map loads -- see RelationshipMapSection's
   * `focusRelationshipReportId` prop. Optional and purely additive; every
   * existing call site that only passes `reportId` is unaffected.
   */
  focusRelationshipReportId?: string | null,
): string {
  const id = reportId?.trim();
  const focus = focusRelationshipReportId?.trim();
  if (!id && !focus) return ROUTES.relationships;
  const q = new URLSearchParams();
  if (id) q.set("myReportId", id);
  if (focus) q.set("focus", focus);
  return `${ROUTES.relationships}?${q.toString()}`;
}

export function relationshipDetailRoute(params: {
  relationshipReportId: string;
  viewerReportId?: string | null;
  kind?: string | null;
  autostart?: boolean;
  locale?: Locale;
}): string {
  const q = new URLSearchParams();
  if (params.viewerReportId?.trim()) q.set("viewer", params.viewerReportId.trim());
  if (params.kind?.trim()) q.set("kind", params.kind.trim());
  if (params.autostart === true) q.set("autostart", "1");
  const suffix = q.toString() ? `?${q.toString()}` : "";
  const base = `${ROUTES.relationship}/${encodeURIComponent(params.relationshipReportId)}${suffix}`;
  return params.locale ? localizedPath(base, params.locale) : base;
}

export function blueprintRouteLocalized(
  reportId: string | null | undefined,
  locale: Locale,
): string {
  return localizedPath(blueprintRoute(reportId), locale);
}

export function relationshipHubRouteLocalized(
  reportId: string | null | undefined,
  locale: Locale,
): string {
  return localizedPath(relationshipHubRoute(reportId), locale);
}

