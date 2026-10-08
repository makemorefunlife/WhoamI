import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { GUEST_SESSION_COOKIE, resolveGuestSession } from "@/lib/payment/guestAccess";

/** Order id of the caller's valid guest access session (httpOnly cookie), else null. */
export async function guestSessionOrderId(supabase: SupabaseClient): Promise<string | null> {
  const token = (await cookies()).get(GUEST_SESSION_COOKIE)?.value ?? null;
  return resolveGuestSession(supabase, token);
}

export const ORDER_ID_RE = /^aha_[a-f0-9]{32}$/;
