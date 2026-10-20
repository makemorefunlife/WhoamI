import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError, logServerEvent, maskId } from "@/lib/security/safeLog";

/**
 * Birth details already SAVED on another of the same account's own reports.
 *
 * Found on production (2026-10-19): one account had two "self" reports --
 * report A (survey answered, no birth details, chosen as the account's main
 * report) and report B (birth details saved, no survey). The account screens
 * showed B's details through a browser copy carried over to A, while the
 * server checks (friend-add readiness) read A and found none.
 *
 * Copies the details to the target report only when ALL of these hold:
 *  - the signed-in account owns the target report;
 *  - the target report has no birth date (never replaces saved info; the
 *    update itself is conditional on birth_date being empty);
 *  - the account's other "self" reports that have birth details all hold the
 *    SAME details (date, time, place) -- if they differ, nothing is copied and
 *    the person decides.
 * Nothing comes from the browser. No report content is touched.
 */
export type RestoreBirthResult =
  | { kind: "restored"; sourceReportId: string }
  | { kind: "already_has_birth" }
  | { kind: "no_source" }
  | { kind: "conflict" }
  | { kind: "not_owner" }
  | { kind: "error" };

type Row = {
  id: string;
  clerk_user_id?: string | null;
  report_type?: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  birth_latitude?: number | null;
  birth_longitude?: number | null;
  birth_timezone?: string | null;
};

const COORDS = "birth_latitude, birth_longitude, birth_timezone";
const BASE = "id, clerk_user_id, report_type, birth_date, birth_time, birth_place";

function sig(r: Row): string {
  return [String(r.birth_date ?? "").trim(), String(r.birth_time ?? "").trim(), String(r.birth_place ?? "").trim()].join("|");
}

export async function restoreBirthFromOwnedReports(
  supabase: SupabaseClient,
  params: { clerkUserId: string; reportId: string },
): Promise<RestoreBirthResult> {
  const { clerkUserId, reportId } = params;
  const { data: target, error: tErr } = await supabase
    .from("reports")
    .select("id, clerk_user_id, birth_date")
    .eq("id", reportId)
    .maybeSingle();
  if (tErr) {
    logServerError("restoreBirth", tErr, "target_read_failed");
    return { kind: "error" };
  }
  const t = target as Pick<Row, "id" | "clerk_user_id" | "birth_date"> | null;
  if (!t || t.clerk_user_id !== clerkUserId) return { kind: "not_owner" };
  if (t.birth_date && String(t.birth_date).trim()) return { kind: "already_has_birth" };

  let withCoords = true;
  let res: { data: unknown[] | null; error: { message: string } | null } = await supabase
    .from("reports")
    .select(`${BASE}, ${COORDS}`)
    .eq("clerk_user_id", clerkUserId)
    .eq("report_type", "self")
    .neq("id", reportId)
    .not("birth_date", "is", null);
  if (res.error) {
    // Environments without the coordinate columns.
    withCoords = false;
    res = await supabase
      .from("reports")
      .select(BASE)
      .eq("clerk_user_id", clerkUserId)
      .eq("report_type", "self")
      .neq("id", reportId)
      .not("birth_date", "is", null);
  }
  if (res.error) {
    logServerError("restoreBirth", res.error, "sources_read_failed");
    return { kind: "error" };
  }
  const sources = ((res.data ?? []) as Row[]).filter((r) => String(r.birth_date ?? "").trim());
  if (sources.length === 0) return { kind: "no_source" };
  if (new Set(sources.map(sig)).size > 1) {
    logServerEvent("restoreBirth", "conflict", { reportId: maskId(reportId) });
    return { kind: "conflict" };
  }
  const src = sources[0];
  const patch: Record<string, unknown> = {
    birth_date: src.birth_date,
    birth_time: src.birth_time,
    birth_place: src.birth_place,
  };
  if (withCoords) {
    patch.birth_latitude = src.birth_latitude ?? null;
    patch.birth_longitude = src.birth_longitude ?? null;
    patch.birth_timezone = src.birth_timezone ?? null;
  }
  const { data: updated, error: uErr } = await supabase
    .from("reports")
    .update(patch)
    .eq("id", reportId)
    .eq("clerk_user_id", clerkUserId)
    .is("birth_date", null)
    .select("id");
  if (uErr) {
    logServerError("restoreBirth", uErr, "update_failed");
    return { kind: "error" };
  }
  if (!Array.isArray(updated) || updated.length === 0) return { kind: "already_has_birth" };
  logServerEvent("restoreBirth", "restored", { reportId: maskId(reportId), source: maskId(src.id) });
  // Same audit row the grouping step writes (no birth values). Best effort:
  // the table may not exist before migration 20261020090000.
  const { error: evErr } = await supabase.from("account_profile_events").insert({
    clerk_user_id: clerkUserId,
    event: "birth_filled",
    report_id: reportId,
    source_report_id: src.id,
    actor: "system",
  });
  if (evErr) logServerEvent("restoreBirth", "event_not_logged", { reportId: maskId(reportId) });
  return { kind: "restored", sourceReportId: src.id };
}
