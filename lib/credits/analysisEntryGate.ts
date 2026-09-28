/**
 * Client-side ROUTING decision for a paid-analysis entry point ("open
 * Personal Analysis" etc.): skip checkout when the caller already holds a
 * usable credit of the matching type, show checkout otherwise.
 *
 * Reads the canonical remaining balance exactly as /api/account/entitlements
 * reports it (credit_lots.remaining summed over non-expired lots, per
 * credit_type) -- never purchase history. This only decides which screen to
 * show; the real entitlement gate is still reserve_credit inside the
 * generation route, which consumes the credit only when a report is actually
 * generated (so opening the page consumes nothing).
 */
import type { CreditType } from "@/lib/credits/creditEngine";

export type EntitlementsRemainingSummary = {
  personal?: { remaining?: number | null } | null;
  relationship?: { remaining?: number | null } | null;
};

export type AnalysisEntryDecision = "open_analysis" | "open_checkout";

export function remainingCreditsFor(
  summary: EntitlementsRemainingSummary | null | undefined,
  creditType: CreditType,
): number {
  const n = summary?.[creditType]?.remaining;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * `summary` null/undefined (not signed in, or the entitlements request
 * failed) falls back to checkout -- today's behavior -- so a transient read
 * failure can never hand out a paid analysis without a credit.
 */
export function resolveAnalysisEntry(
  summary: EntitlementsRemainingSummary | null | undefined,
  creditType: CreditType,
): AnalysisEntryDecision {
  return remainingCreditsFor(summary, creditType) > 0 ? "open_analysis" : "open_checkout";
}

export type RelationshipEntryState =
  /** A generated report for this kind exists -> show it; no checkout, no credit. */
  | "saved_report"
  /** No report yet and a credit (or unenforced env) -> the one CTA generates. */
  | "generate"
  /** No report and no usable credit -> the one CTA opens the purchase selector. */
  | "purchase"
  /** This kind's saved report is still loading -> show no CTA yet. */
  | "loading";

/**
 * Single source for which ONE state/CTA the Relationship deep section shows.
 * `remaining` is the canonical balance from /api/account/entitlements
 * (null = not known yet). `creditExhausted` is set when the generation route
 * itself answered 402 (reserve_credit refused) -- the server's word always
 * wins over a stale or unknown balance. Only generation (reserve_credit at
 * the canonical point) ever spends a credit; this never does.
 */
export function resolveRelationshipEntryState(params: {
  hasSavedReport: boolean;
  kindLoaded: boolean;
  creditExhausted: boolean;
  remaining: number | null;
  creditEnforced: boolean;
}): RelationshipEntryState {
  if (params.hasSavedReport) return "saved_report";
  if (!params.kindLoaded) return "loading";
  if (params.creditExhausted) return "purchase";
  if (params.creditEnforced && params.remaining !== null && params.remaining <= 0) {
    return "purchase";
  }
  return "generate";
}
