import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreditType } from "@/lib/credits/creditEngine";
import type { Locale } from "@/lib/i18n/locale";
import { logServerError } from "@/lib/security/safeLog";

/**
 * Read-only "what can I use here" view of a user's credit lots (2026-10-11,
 * IA v2 stage 5). Display only -- reserve_credit stays the only real gate,
 * and it already spends only lots of the request's language or lots with no
 * language (D-2: older lots keep their any-language scope).
 *
 *   thisLanguage  lots bought for the language of this screen
 *   shared        lots with no language (older purchases, promo, admin, gift)
 *                 -- usable in every language
 *   otherLanguage lots bought for the other language (not usable here)
 *   triple        what is left of Relationship Triple purchases
 *   pass          credits that came with a 30-day pass (+ its end date)
 */
export type CreditLotRow = {
  remaining: number;
  amount: number;
  expires_at: string | null;
  locale?: string | null;
  reference_id: string | null;
};

export type CreditBreakdown = {
  usableHere: { remaining: number; soonestExpiresAt: string | null };
  thisLanguage: number;
  shared: number;
  otherLanguage: number;
  triple: { remaining: number; total: number; expiresAt: string | null } | null;
  pass: { remaining: number; expiresAt: string | null } | null;
};

const TRIPLE_PLANS = new Set(["kr_relationship_triple"]);
const PASS_PLANS = new Set(["kr_insight_pass_30d", "us_insight_pass_30d"]);

function soonest(rows: CreditLotRow[]): string | null {
  const dates = rows.map((r) => r.expires_at).filter((d): d is string => Boolean(d)).sort();
  return dates[0] ?? null;
}

/** Pure: rows must already be the currently valid lots (not expired). */
export function summarizeCreditLots(
  rows: CreditLotRow[],
  locale: Locale,
  planByReference: Map<string, string>,
): CreditBreakdown {
  const live = rows.filter((r) => r.remaining > 0);
  const mine = live.filter((r) => r.locale === locale);
  const shared = live.filter((r) => !r.locale);
  const other = live.filter((r) => r.locale && r.locale !== locale);
  const usable = [...mine, ...shared];
  const plan = (r: CreditLotRow) => (r.reference_id ? planByReference.get(r.reference_id) : undefined);

  // Triple: count every Triple lot (incl. used-up ones that have not expired) for "x of y left".
  const tripleAll = rows.filter((r) => TRIPLE_PLANS.has(plan(r) ?? ""));
  const passLive = live.filter((r) => PASS_PLANS.has(plan(r) ?? ""));
  const sum = (xs: CreditLotRow[], k: "remaining" | "amount") => xs.reduce((s, r) => s + r[k], 0);

  return {
    usableHere: { remaining: sum(usable, "remaining"), soonestExpiresAt: soonest(usable) },
    thisLanguage: sum(mine, "remaining"),
    shared: sum(shared, "remaining"),
    otherLanguage: sum(other, "remaining"),
    triple: tripleAll.length
      ? { remaining: sum(tripleAll, "remaining"), total: sum(tripleAll, "amount"), expiresAt: soonest(tripleAll.filter((r) => r.remaining > 0)) }
      : null,
    pass: passLive.length ? { remaining: sum(passLive, "remaining"), expiresAt: soonest(passLive) } : null,
  };
}

export async function loadCreditBreakdown(
  supabase: SupabaseClient,
  clerkUserId: string,
  creditType: CreditType,
  locale: Locale,
): Promise<CreditBreakdown> {
  const nowIso = new Date().toISOString();
  // credit_lots.locale arrives with 20261009120000; without it every lot is "shared".
  const cols = "remaining, amount, expires_at, locale, reference_id";
  const read = (select: string) =>
    supabase
      .from("credit_lots")
      .select(select)
      .eq("clerk_user_id", clerkUserId)
      .eq("credit_type", creditType)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`);
  let res = await read(cols);
  if (res.error && /locale/.test(res.error.message ?? "")) {
    res = await read("remaining, amount, expires_at, reference_id");
  }
  if (res.error) logServerError("creditBreakdown", res.error, "lots_read_failed");
  const rows = ((res.data ?? []) as unknown as CreditLotRow[]).map((r) => ({ ...r, locale: r.locale ?? null }));

  const refs = [...new Set(rows.map((r) => r.reference_id).filter((x): x is string => Boolean(x)))];
  const planByReference = new Map<string, string>();
  if (refs.length) {
    const [kr, us] = await Promise.all([
      supabase.from("kr_purchase_grants").select("id, plan_id").in("id", refs),
      supabase.from("us_purchase_grants").select("id, plan_id").in("id", refs),
    ]);
    for (const g of [...((kr.data ?? []) as { id: string; plan_id: string }[]), ...((us.data ?? []) as { id: string; plan_id: string }[])]) {
      planByReference.set(g.id, g.plan_id);
    }
  }
  return summarizeCreditLots(rows, locale, planByReference);
}
