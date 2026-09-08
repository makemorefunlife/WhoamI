import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locale";
import { releaseCredit } from "@/lib/credits/creditEngine";
import { logServerError } from "@/lib/security/safeLog";

const STALE_LOCK_MS = 6 * 60 * 1000;

export type AcquirePersonalLockResult =
  | { ok: true; lockId: string }
  | { ok: false; reason: "in_progress" }
  | { ok: false; reason: "error" };

/**
 * DB-backed multi-instance atomic generation lock for Personal Premium.
 * Guarantees that across all Vercel serverless instances, only ONE request
 * can hold the slot for a given (reportId, locale) pair.
 */
export async function acquirePersonalPremiumGenerationLock(
  supabase: SupabaseClient,
  params: {
    reportId: string;
    locale: Locale;
    generationRequestId: string;
  },
): Promise<AcquirePersonalLockResult> {
  const { reportId, locale, generationRequestId } = params;

  const first = await supabase
    .from("personal_premium_generation_locks")
    .insert({
      report_id: reportId,
      locale,
      current_request_id: generationRequestId,
    })
    .select("id")
    .maybeSingle();

  if (!first.error && first.data?.id) {
    return { ok: true, lockId: first.data.id as string };
  }

  if (first.error && first.error.code !== "23505") {
    logServerError("personalPremiumGenerationLock.acquire", first.error, "lock_db_error");
  }

  // 23505 = unique_violation on (report_id, locale) — someone else is currently generating.
  if (first.error?.code === "23505") {
    const staleCutoff = new Date(Date.now() - STALE_LOCK_MS).toISOString();

    const previous = await supabase
      .from("personal_premium_generation_locks")
      .select("current_request_id")
      .eq("report_id", reportId)
      .eq("locale", locale)
      .maybeSingle();
    const previousRequestId = previous.data?.current_request_id as string | undefined;

    const stolen = await supabase
      .from("personal_premium_generation_locks")
      .update({
        started_at: new Date().toISOString(),
        current_request_id: generationRequestId,
      })
      .eq("report_id", reportId)
      .eq("locale", locale)
      .lt("started_at", staleCutoff)
      .select("id")
      .maybeSingle();

    if (!stolen.error && stolen.data?.id) {
      if (previousRequestId && previousRequestId !== generationRequestId) {
        await releaseCredit(supabase, previousRequestId).catch(() => {});
      }
      return { ok: true, lockId: stolen.data.id as string };
    }
    if (stolen.error) {
      return { ok: false, reason: "error" };
    }
    return { ok: false, reason: "in_progress" };
  }

  return { ok: false, reason: "error" };
}

/**
 * Releases by lock id AND current_request_id together — never by id alone.
 */
export async function releasePersonalPremiumGenerationLock(
  supabase: SupabaseClient,
  lockId: string,
  generationRequestId: string,
): Promise<void> {
  await supabase
    .from("personal_premium_generation_locks")
    .delete()
    .eq("id", lockId)
    .eq("current_request_id", generationRequestId);
}

/**
 * Checks if the request still owns the generation lock before saving result / consuming credit.
 */
export async function stillOwnsPersonalPremiumGenerationLock(
  supabase: SupabaseClient,
  lockId: string,
  generationRequestId: string,
): Promise<boolean> {
  const res = await supabase
    .from("personal_premium_generation_locks")
    .select("id")
    .eq("id", lockId)
    .eq("current_request_id", generationRequestId)
    .maybeSingle();

  return !res.error && !!res.data;
}
