import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeLocale, type Locale } from "@/lib/i18n/locale";
import { getResultBasicLocale } from "@/lib/relationship/resultBasicLocale";
import { logServerError } from "@/lib/security/safeLog";

/**
 * Free relationship result, per language (2026-10-20, decision 5; migration
 * 20261020110000_relationship_basic_results_by_locale.sql).
 *
 * relationship_reports.result_basic = the ORIGINAL (one language, never
 * rewritten once it exists). relationship_basic_results = results made from
 * scratch in another language, only when the person asks for it.
 *
 * Which one a screen in language L shows:
 *   1. a row made in L                                   -> that row
 *   2. the original, if it was made in L                 -> the original
 *   3. the original, if its language was never recorded -> the original as it
 *      is (shown as before; its language is not guessed)
 *   4. the original was made in the other language       -> nothing, plus
 *      `otherLocale` so the screen can offer "Create in L"
 */

export type BasicPick =
  | { kind: "locale_row"; result: Record<string, unknown> }
  | { kind: "original"; result: Record<string, unknown> }
  | { kind: "other_locale_only"; otherLocale: Locale }
  | { kind: "none" };

export function hasPerspectives(v: unknown): v is Record<string, unknown> & { perspectives: Record<string, unknown> } {
  const p = (v as { perspectives?: unknown } | null)?.perspectives;
  return p != null && typeof p === "object";
}

export function pickBasicForLocale(input: {
  original: unknown;
  localeRow: unknown;
  locale: Locale | string;
}): BasicPick {
  const locale = normalizeLocale(input.locale);
  if (hasPerspectives(input.localeRow)) return { kind: "locale_row", result: input.localeRow };
  if (hasPerspectives(input.original)) {
    const orig = getResultBasicLocale(input.original);
    if (orig === null || orig === locale) return { kind: "original", result: input.original };
    return { kind: "other_locale_only", otherLocale: orig };
  }
  return { kind: "none" };
}

/** The row made in `locale`, or null (none / table not there yet / read error). */
export async function readBasicResultForLocale(
  supabase: SupabaseClient,
  relationshipReportId: string,
  locale: Locale | string,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("relationship_basic_results")
    .select("result")
    .eq("relationship_report_id", relationshipReportId)
    .eq("locale", normalizeLocale(locale))
    .maybeSingle();
  if (error || !data) return null;
  const r = (data as { result: unknown }).result;
  return r && typeof r === "object" ? (r as Record<string, unknown>) : null;
}

/** Saves a result made in `locale` (never touches the original). */
export async function saveBasicResultForLocale(
  supabase: SupabaseClient,
  relationshipReportId: string,
  locale: Locale | string,
  result: Record<string, unknown>,
  reason: string,
): Promise<boolean> {
  const { error } = await supabase.rpc("save_relationship_basic_result", {
    p_relationship_report_id: relationshipReportId,
    p_locale: normalizeLocale(locale),
    p_result: result,
    p_reason: reason,
  });
  if (error) {
    logServerError("basicResultByLocale.save", error, "rpc_failed");
    return false;
  }
  return true;
}
