"use client";

import { localizedPath, type Locale } from "@/lib/i18n/locale";
import { loadReportSession } from "@/lib/home/reportSession";
import { resolvePostPurchase } from "@/lib/payment/postPurchaseDestination";
import { setSelfProfileReturn } from "@/lib/relationship/selfProfileReturn";

/**
 * Shared "continue after the pass is on the account" step for the success
 * page (member purchase) and the claim page (guest purchase linked): reads
 * the current report state, follows the plan's route and, when the next step
 * is filling in the buyer's own details, remembers where to come back to.
 */
export async function goAfterPurchase(
  push: (href: string) => void,
  params: { planId: string | null; locale: Locale; explicitReturnPath?: string | null },
): Promise<void> {
  let session = null;
  try {
    session = await loadReportSession({ forceRefresh: true });
  } catch {
    session = null;
  }
  const next = resolvePostPurchase({ ...params, session });
  if (next.selfProfileReturn) setSelfProfileReturn(next.selfProfileReturn);
  push(localizedPath(next.path, params.locale));
}
