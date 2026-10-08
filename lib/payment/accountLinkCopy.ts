import type { Locale } from "@/lib/i18n/locale";
import type { MessageCatalog } from "@/lib/i18n/messages";

/**
 * One source for the "link this purchase to an account" wording, used by the
 * purchase email, the success page and the claim page, so the three always
 * say the same thing for the same order (product + locale come from the
 * server-side order row).
 *
 * Single Personal is NOT here: it is used without an account (purchase-email
 * verification), see lib/payment/guestPersonal.ts.
 */
export type AccountLinkGroup = "relationship" | "triple" | "pass" | "membership";

const GROUPS: Record<string, AccountLinkGroup> = {
  kr_relationship_premium: "relationship",
  us_relationship_premium: "relationship",
  us_additional_relationship: "relationship",
  kr_relationship_triple: "triple",
  kr_insight_pass_30d: "pass",
  us_insight_pass_30d: "pass",
  us_annual_membership: "membership",
};

export function accountLinkGroup(planId: string | null | undefined): AccountLinkGroup | null {
  return (planId && GROUPS[planId]) || null;
}

export const PASS_DAYS = 30;

/**
 * End of a 30-day pass: purchase (approval) time + 30 days -- the same
 * instant the granted credit lots expire at, because the claim re-anchors
 * them to approved_at (claim_paid_guest_toss_order). Linking later never
 * restarts it.
 */
export function passEndsAt(approvedAt: string | null | undefined): string | null {
  if (!approvedAt) return null;
  const t = Date.parse(approvedAt);
  return Number.isFinite(t) ? new Date(t + PASS_DAYS * 24 * 60 * 60 * 1000).toISOString() : null;
}

/** Date as shown to buyers: KR in Asia/Seoul, US in UTC (labelled). */
export function formatPurchaseDate(iso: string | null, locale: Locale): string {
  const d = iso ? new Date(iso) : new Date();
  return locale === "ko-KR"
    ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" }).format(d)
    : `${new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" }).format(d)} (UTC)`;
}

export type AccountLinkCopy = {
  group: AccountLinkGroup;
  title: string;
  body: string;
  /** Plan-specific extra lines (Triple usage, pass end date). */
  extras: string[];
  emailLine: string;
  primaryCta: string;
  secondaryCta: string;
  footers: string[];
};

export function accountLinkCopy(
  messages: MessageCatalog,
  locale: Locale,
  planId: string | null | undefined,
  opts: { maskedEmail?: string | null; approvedAt?: string | null } = {},
): AccountLinkCopy | null {
  const group = accountLinkGroup(planId);
  if (!group) return null;
  const t = messages.payments.accountLink;
  const extras: string[] = [];
  let title: string;
  let body: string;
  if (group === "relationship" || group === "triple") {
    title = t.relationshipTitle;
    body = t.relationshipBody;
    if (group === "triple") extras.push(t.tripleExtra);
  } else if (group === "pass") {
    title = t.passTitle;
    body = t.passBody;
    const ends = passEndsAt(opts.approvedAt);
    if (ends) extras.push(t.passEnds(formatPurchaseDate(ends, locale)));
  } else {
    title = t.membershipTitle;
    body = t.membershipBody;
  }
  return {
    group,
    title,
    body,
    extras,
    emailLine: opts.maskedEmail ? t.emailLine(opts.maskedEmail) : t.emailLineNoMask,
    primaryCta: t.primaryCta,
    secondaryCta: t.secondaryCta,
    footers: [t.footerNoCharge, t.footerFree],
  };
}

/** "Your pass is on the account" screen (member purchase or guest link), per plan. */
export function linkedCopy(messages: MessageCatalog, planId: string | null | undefined): { title: string; body: string; cta: string } {
  const p = messages.payments;
  const group = accountLinkGroup(planId);
  if (group === "relationship" || group === "triple") {
    return { title: p.accountLink.linkedRelationshipTitle, body: p.accountLink.linkedRelationshipBody, cta: p.accountLink.linkedCtaRelationship };
  }
  if (group === "pass") {
    return { title: p.accountLink.linkedPassTitle, body: p.accountLink.linkedPassBody, cta: p.accountLink.linkedCtaPass };
  }
  return { title: p.memberGrantedTitle, body: p.memberGrantedBody, cta: p.startAnalysisCta };
}
