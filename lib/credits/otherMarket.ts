import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locale";
import type { CreditType } from "@/lib/credits/creditEngine";

/**
 * When a generation is refused for lack of credit on this site, is there an
 * unused credit for the OTHER site? Only lots bought/issued for that market
 * (locale = the other language) count -- lots usable on both sites would
 * already have been used here. Read only; nothing is spent or moved.
 */
export async function otherMarketWithCredit(
  supabase: SupabaseClient,
  clerkUserId: string,
  creditType: CreditType,
  locale: Locale,
): Promise<Locale | null> {
  const other: Locale = locale === "en-US" ? "ko-KR" : "en-US";
  const { data, error } = await supabase
    .from("credit_lots")
    .select("remaining, expires_at")
    .eq("clerk_user_id", clerkUserId)
    .eq("credit_type", creditType)
    .eq("locale", other);
  if (error) return null;
  const now = Date.now();
  const usable = ((data ?? []) as { remaining: number; expires_at: string | null }[]).some(
    (l) => l.remaining > 0 && (!l.expires_at || Date.parse(l.expires_at) > now),
  );
  return usable ? other : null;
}
