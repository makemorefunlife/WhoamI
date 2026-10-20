import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";
import { isSurveyV2AnswersComplete } from "@/lib/v2/survey/completion";

/**
 * "Which of your saved details should we use?" (2026-10-20, decisions 1-3).
 *
 * Only for an account whose self reports are grouped (reports.
 * merged_into_report_id). The main report's own values are the current ones;
 * a grouped report can offer DIFFERENT saved birth details or a DIFFERENT
 * complete survey. Nothing changes until the account owner picks one:
 *   - birth: the main report's previous details go to report_birth_history
 *     first, then the picked ones are written. The birth-date correction
 *     counter is not touched (decision 2: integration is not a correction).
 *   - survey: the picked answers are ADDED as the newest survey row of the
 *     main report (survey rows are append-only; the old one stays).
 * Reports already made are not changed or regenerated.
 */

export type BirthValue = {
  birthDate: string;
  birthTime: string | null;
  birthPlace: string | null;
};

export type ProfileChoices = {
  mainReportId: string;
  birth: { current: BirthValue | null; options: (BirthValue & { sourceReportId: string })[] };
  survey: { hasCurrent: boolean; options: { sourceReportId: string; answeredAt: string | null }[] };
};

type ReportRow = {
  id: string;
  clerk_user_id: string | null;
  report_type: string | null;
  merged_into_report_id: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  birth_latitude?: number | null;
  birth_longitude?: number | null;
  birth_timezone?: number | null;
};

const BASE = "id, clerk_user_id, report_type, merged_into_report_id, birth_date, birth_time, birth_place";
const COORDS = "birth_latitude, birth_longitude, birth_timezone";

function birthKey(b: { birth_date: string | null; birth_time: string | null; birth_place: string | null }): string {
  return [b.birth_date ?? "", (b.birth_time ?? "").trim(), (b.birth_place ?? "").trim()].join("|");
}

function toBirth(r: ReportRow): BirthValue | null {
  if (!r.birth_date) return null;
  return { birthDate: r.birth_date, birthTime: r.birth_time, birthPlace: r.birth_place };
}

function parseAnswers(raw: unknown): Record<string, unknown> | null {
  let a: unknown = raw;
  if (typeof a === "string") {
    try {
      a = JSON.parse(a);
    } catch {
      return null;
    }
  }
  return a && typeof a === "object" && !Array.isArray(a) ? (a as Record<string, unknown>) : null;
}

function surveyComplete(a: Record<string, unknown> | null): boolean {
  if (!a) return false;
  if (a.survey_source === "v2_10q") return true;
  if (a.v2_profile && typeof a.v2_profile === "object") return true;
  const s: Record<string, string> = {};
  for (const [k, v] of Object.entries(a)) if (typeof v === "string") s[k] = v;
  return isSurveyV2AnswersComplete(s);
}

function surveyKey(a: Record<string, unknown>): string {
  return ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"]
    .map((q) => String(a[q] ?? "").trim().toUpperCase())
    .join("|");
}

async function latestSurvey(
  supabase: SupabaseClient,
  reportId: string,
): Promise<{ id: string; answers: Record<string, unknown> | null; created_at: string | null } | null> {
  const { data, error } = await supabase
    .from("survey_responses")
    .select("id, answers, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1);
  if (error) return null;
  const row = (data ?? [])[0] as { id: string; answers: unknown; created_at: string | null } | undefined;
  return row ? { id: row.id, answers: parseAnswers(row.answers), created_at: row.created_at } : null;
}

async function loadGroup(
  supabase: SupabaseClient,
  clerkUserId: string,
  mainReportId: string,
): Promise<{ main: ReportRow; members: ReportRow[] } | null> {
  const { data: main, error } = await supabase.from("reports").select(BASE).eq("id", mainReportId).maybeSingle();
  if (error || !main) return null;
  const m = main as ReportRow;
  if (m.clerk_user_id !== clerkUserId || m.report_type !== "self" || m.merged_into_report_id) return null;
  const { data: members, error: mErr } = await supabase
    .from("reports")
    .select(BASE)
    .eq("merged_into_report_id", mainReportId)
    .eq("clerk_user_id", clerkUserId)
    .eq("report_type", "self");
  if (mErr) return null;
  return { main: m, members: (members ?? []) as ReportRow[] };
}

/** Saved values of the grouped reports that DIFFER from the main report's. */
export async function loadProfileChoices(
  supabase: SupabaseClient,
  params: { clerkUserId: string; mainReportId: string },
): Promise<ProfileChoices | null> {
  const g = await loadGroup(supabase, params.clerkUserId, params.mainReportId);
  if (!g) return null;
  const currentKey = g.main.birth_date ? birthKey(g.main) : null;
  const seen = new Set<string>(currentKey ? [currentKey] : []);
  const birthOptions: ProfileChoices["birth"]["options"] = [];
  for (const r of g.members) {
    const b = toBirth(r);
    if (!b) continue;
    const k = birthKey(r);
    if (seen.has(k)) continue;
    seen.add(k);
    birthOptions.push({ ...b, sourceReportId: r.id });
  }
  const mainSurvey = await latestSurvey(supabase, g.main.id);
  const hasCurrent = surveyComplete(mainSurvey?.answers ?? null);
  const seenSurvey = new Set<string>(hasCurrent && mainSurvey?.answers ? [surveyKey(mainSurvey.answers)] : []);
  const surveyOptions: ProfileChoices["survey"]["options"] = [];
  for (const r of g.members) {
    const s = await latestSurvey(supabase, r.id);
    if (!s?.answers || !surveyComplete(s.answers)) continue;
    const k = surveyKey(s.answers);
    if (seenSurvey.has(k)) continue;
    seenSurvey.add(k);
    surveyOptions.push({ sourceReportId: r.id, answeredAt: s.created_at });
  }
  return {
    mainReportId: g.main.id,
    birth: { current: toBirth(g.main), options: birthOptions },
    survey: { hasCurrent, options: surveyOptions },
  };
}

export type ChooseResult = "chosen" | "same" | "not_allowed" | "no_value" | "error";

async function logEvent(
  supabase: SupabaseClient,
  row: { clerk_user_id: string; event: string; report_id: string; source_report_id: string; survey_response_id?: string | null },
): Promise<void> {
  const { error } = await supabase.from("account_profile_events").insert({ ...row, actor: "user" });
  if (error) logServerError("profileChoices.log", error, "insert_failed");
}

/** The owner picks a grouped report's saved birth details for the main report. */
export async function chooseBirthFromGrouped(
  supabase: SupabaseClient,
  params: { clerkUserId: string; mainReportId: string; sourceReportId: string },
): Promise<ChooseResult> {
  const g = await loadGroup(supabase, params.clerkUserId, params.mainReportId);
  if (!g) return "not_allowed";
  const src = g.members.find((m) => m.id === params.sourceReportId);
  if (!src) return "not_allowed";
  if (!src.birth_date) return "no_value";
  if (g.main.birth_date && birthKey(g.main) === birthKey(src)) return "same";

  // Full rows (with coordinates when the columns exist).
  let withCoords = true;
  let res: { data: unknown; error: { message?: string } | null } = await supabase
    .from("reports")
    .select(`${BASE}, ${COORDS}`)
    .in("id", [g.main.id, src.id]);
  if (res.error) {
    withCoords = false;
    res = await supabase.from("reports").select(BASE).in("id", [g.main.id, src.id]);
  }
  if (res.error) return "error";
  const rows = (res.data ?? []) as ReportRow[];
  const main = rows.find((r) => r.id === g.main.id);
  const source = rows.find((r) => r.id === src.id);
  if (!main || !source) return "error";

  if (main.birth_date) {
    const { error: hErr } = await supabase.from("report_birth_history").insert({
      report_id: main.id,
      birth_date: main.birth_date,
      birth_time: main.birth_time,
      birth_place: main.birth_place,
      birth_latitude: withCoords ? (main.birth_latitude ?? null) : null,
      birth_longitude: withCoords ? (main.birth_longitude ?? null) : null,
      birth_timezone: withCoords ? (main.birth_timezone ?? null) : null,
      reason: "account_profile_choice",
      source_report_id: source.id,
    });
    // Never replace saved details without keeping the previous ones.
    if (hErr) {
      logServerError("profileChoices.birth_history", hErr, "insert_failed");
      return "error";
    }
  }

  const patch: Record<string, unknown> = {
    birth_date: source.birth_date,
    birth_time: source.birth_time,
    birth_place: source.birth_place,
  };
  if (withCoords) {
    patch.birth_latitude = source.birth_latitude ?? null;
    patch.birth_longitude = source.birth_longitude ?? null;
    patch.birth_timezone = source.birth_timezone ?? null;
  }
  // Optimistic: only if the main report still holds what was archived.
  let q = supabase.from("reports").update(patch).eq("id", main.id).eq("clerk_user_id", params.clerkUserId);
  q = main.birth_date ? q.eq("birth_date", main.birth_date) : q.is("birth_date", null);
  const { data: upd, error: uErr } = await q.select("id");
  if (uErr) {
    logServerError("profileChoices.birth_update", uErr, "update_failed");
    return "error";
  }
  if (!Array.isArray(upd) || upd.length === 0) return "error";
  await logEvent(supabase, {
    clerk_user_id: params.clerkUserId,
    event: "birth_chosen",
    report_id: main.id,
    source_report_id: source.id,
  });
  return "chosen";
}

/** The owner picks a grouped report's complete survey for the main report (added as newest row). */
export async function chooseSurveyFromGrouped(
  supabase: SupabaseClient,
  params: { clerkUserId: string; mainReportId: string; sourceReportId: string },
): Promise<ChooseResult> {
  const g = await loadGroup(supabase, params.clerkUserId, params.mainReportId);
  if (!g) return "not_allowed";
  if (!g.members.some((m) => m.id === params.sourceReportId)) return "not_allowed";
  const src = await latestSurvey(supabase, params.sourceReportId);
  if (!src?.answers || !surveyComplete(src.answers)) return "no_value";
  const cur = await latestSurvey(supabase, g.main.id);
  if (cur?.answers && surveyComplete(cur.answers) && surveyKey(cur.answers) === surveyKey(src.answers)) return "same";
  const { data, error } = await supabase
    .from("survey_responses")
    .insert({ report_id: g.main.id, answers: src.answers })
    .select("id")
    .single();
  if (error || !data) {
    logServerError("profileChoices.survey_insert", error, "insert_failed");
    return "error";
  }
  await logEvent(supabase, {
    clerk_user_id: params.clerkUserId,
    event: "survey_chosen",
    report_id: g.main.id,
    source_report_id: params.sourceReportId,
    survey_response_id: (data as { id: string }).id,
  });
  return "chosen";
}
