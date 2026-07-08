export const ROUTES = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  surveyV2: "/survey-v2",
  surveyV2Complete: "/survey-v2/complete",
  onboardingBirth: "/onboarding/birth",
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
  invite: "/invite",
} as const;

export function withReportId(path: string, reportId?: string | null): string {
  const id = reportId?.trim();
  if (!id) return path;
  const q = new URLSearchParams({ reportId: id });
  return `${path}?${q.toString()}`;
}

export function blueprintRoute(reportId?: string | null): string {
  return withReportId(ROUTES.blueprint, reportId);
}

export function relationshipHubRoute(reportId?: string | null): string {
  const id = reportId?.trim();
  if (!id) return ROUTES.relationships;
  const q = new URLSearchParams({ myReportId: id });
  return `${ROUTES.relationships}?${q.toString()}`;
}

export function relationshipDetailRoute(params: {
  relationshipReportId: string;
  viewerReportId?: string | null;
  kind?: string | null;
  autostart?: boolean;
}): string {
  const q = new URLSearchParams();
  if (params.viewerReportId?.trim()) q.set("viewer", params.viewerReportId.trim());
  if (params.kind?.trim()) q.set("kind", params.kind.trim());
  if (params.autostart === true) q.set("autostart", "1");
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return `${ROUTES.relationship}/${encodeURIComponent(params.relationshipReportId)}${suffix}`;
}

