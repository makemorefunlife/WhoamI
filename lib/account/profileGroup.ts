import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";

/**
 * One account, several "self" reports (2026-10-20, migration
 * 20261020090000_account_self_report_grouping.sql).
 *
 * A grouped self report has reports.merged_into_report_id = the account's
 * main self report. Nothing is moved: relationships, invites, links and
 * reports stay on the grouped report. This module answers the three
 * questions the app needs:
 *
 *  - profileSourceReportId: whose birth details / survey describe this person
 *    now? (grouped self report -> main report; anything else -> itself)
 *  - groupMemberReportIds: which grouped reports belong to a main report
 *    (their relationships are shown together with the main report's)
 *  - effectiveViewerReportId: the screen passes the main report as "viewer";
 *    for a relationship that sits on a grouped report, the participant is that
 *    grouped report.
 *
 * Accounts that were never grouped (every report before the ops step, and
 * every Korean-site account that has one self report) get exactly the same
 * answers as before: the id they passed in, no members.
 * If the column does not exist yet (migration not applied), nothing changes.
 */

type GroupRow = {
  id: string;
  clerk_user_id: string | null;
  report_type: string | null;
  merged_into_report_id: string | null;
};

const SOURCE_CACHE = new WeakMap<object, Map<string, Promise<string>>>();

function cacheFor(supabase: SupabaseClient): Map<string, Promise<string>> {
  let m = SOURCE_CACHE.get(supabase as unknown as object);
  if (!m) {
    m = new Map();
    SOURCE_CACHE.set(supabase as unknown as object, m);
  }
  return m;
}

async function readGroupRow(supabase: SupabaseClient, reportId: string): Promise<GroupRow | null> {
  const { data, error } = await supabase
    .from("reports")
    .select("id, clerk_user_id, report_type, merged_into_report_id")
    .eq("id", reportId)
    .maybeSingle();
  if (error) return null; // column missing (not migrated) or read failure: no redirection
  return (data as GroupRow | null) ?? null;
}

/**
 * The report whose saved birth details and survey describe this person now.
 * A grouped self report reads from its main report (same account, enforced
 * by the DB guard); every other report reads from itself.
 */
export async function profileSourceReportId(supabase: SupabaseClient, reportId: string): Promise<string> {
  const id = reportId.trim();
  if (!id) return reportId;
  const cache = cacheFor(supabase);
  const hit = cache.get(id);
  if (hit) return hit;
  const p = (async () => {
    const row = await readGroupRow(supabase, id);
    if (row && row.report_type === "self" && row.merged_into_report_id) {
      const main = await readGroupRow(supabase, row.merged_into_report_id);
      if (main && main.report_type === "self" && main.clerk_user_id === row.clerk_user_id) {
        return main.id;
      }
    }
    return id;
  })();
  cache.set(id, p);
  return p;
}

/** Grouped self reports of a main report (same account). Empty when none / not migrated. */
export async function groupMemberReportIds(supabase: SupabaseClient, mainReportId: string): Promise<string[]> {
  const main = await readGroupRow(supabase, mainReportId);
  if (!main || main.report_type !== "self" || main.merged_into_report_id) return [];
  const { data, error } = await supabase
    .from("reports")
    .select("id")
    .eq("merged_into_report_id", mainReportId)
    .eq("clerk_user_id", main.clerk_user_id ?? "")
    .eq("report_type", "self");
  if (error) return [];
  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}

/** Main report first, then its grouped reports. */
export async function viewerGroupReportIds(supabase: SupabaseClient, mainReportId: string): Promise<string[]> {
  return [mainReportId, ...(await groupMemberReportIds(supabase, mainReportId))];
}

/**
 * The participant report to use for a relationship opened with `viewer`.
 * - viewer is one of the two participants -> viewer (unchanged behavior)
 * - viewer is a main report and one participant is grouped into it -> that
 *   grouped report (same account; the relationship row is not changed)
 * - otherwise -> viewer (the normal participant check then refuses)
 */
export async function effectiveViewerReportId(
  supabase: SupabaseClient,
  viewerReportId: string,
  reportIdA: string,
  reportIdB: string,
): Promise<string> {
  const v = viewerReportId.trim();
  if (!v || v === reportIdA || v === reportIdB) return viewerReportId;
  for (const candidate of [reportIdA, reportIdB]) {
    const row = await readGroupRow(supabase, candidate);
    if (row && row.report_type === "self" && row.merged_into_report_id === v) {
      const main = await readGroupRow(supabase, v);
      if (main && main.clerk_user_id === row.clerk_user_id) return candidate;
    }
  }
  return viewerReportId;
}

/**
 * The main report for a report of the account: a grouped self report -> its
 * main report; anything else -> itself. Used where a screen must always land
 * on the main report (account screen, friend-add readiness).
 */
export async function mainReportIdFor(supabase: SupabaseClient, reportId: string): Promise<string> {
  try {
    return await profileSourceReportId(supabase, reportId);
  } catch (e) {
    logServerError("profileGroup.main", e, "lookup_failed");
    return reportId;
  }
}

const BIRTH_FIELDS = ["birth_date", "birth_time", "birth_place", "birth_latitude", "birth_longitude", "birth_timezone"] as const;

/**
 * Same row, with the birth details of its profile source (a grouped self
 * report shows the main report's saved birth details). Only birth fields that
 * the row already carries are replaced; id, name, owner and everything else
 * stay the row's own. Rows that are not grouped come back unchanged.
 */
export async function withProfileBirth<T extends { id: string } & Record<string, unknown>>(
  supabase: SupabaseClient,
  row: T,
): Promise<T> {
  const sourceId = await profileSourceReportId(supabase, row.id);
  if (sourceId === row.id) return row;
  const fields = BIRTH_FIELDS.filter((f) => f in row);
  if (fields.length === 0) return row;
  const { data, error } = await supabase.from("reports").select(fields.join(", ")).eq("id", sourceId).maybeSingle();
  if (error || !data) return row;
  return { ...row, ...(data as unknown as Record<string, unknown>) } as T;
}
