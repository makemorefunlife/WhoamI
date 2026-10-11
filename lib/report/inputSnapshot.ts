import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";

/**
 * "Which info was this report made from?" (2026-10-11)
 *
 * Saved with every NEW Personal deep / relationship deep report. Holds only a
 * one-way fingerprint of the inputs (birth date/time/place + which saved
 * survey answer set) and the time -- never the raw birth data -- so a
 * relationship report never reveals the other person's details. Later the
 * current fingerprint is compared to show "made with your earlier info".
 * Old reports without a snapshot just show they reflect the info at the time.
 */
export type InputSnapshot = {
  v: 1;
  captured_at: string;
  /** Combined fingerprint of every person's inputs, in report-id order. */
  fp: string;
  /** Per person: survey present at generation (no answers stored). */
  has_survey: boolean[];
};

export type ReportInputFacts = {
  reportId: string;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  survey_id: string | null;
};

export async function loadReportInputFacts(
  supabase: SupabaseClient,
  reportId: string,
): Promise<ReportInputFacts | null> {
  const [rep, survey] = await Promise.all([
    supabase.from("reports").select("birth_date, birth_time, birth_place").eq("id", reportId).maybeSingle(),
    supabase
      .from("survey_responses")
      .select("id")
      .eq("report_id", reportId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1),
  ]);
  if (rep.error || survey.error) {
    logServerError("inputSnapshot.load", rep.error ?? survey.error, "db_select_failed");
    return null;
  }
  const r = (rep.data ?? {}) as { birth_date?: string | null; birth_time?: string | null; birth_place?: string | null };
  return {
    reportId,
    birth_date: r.birth_date ?? null,
    birth_time: r.birth_time ?? null,
    birth_place: r.birth_place ?? null,
    survey_id: ((survey.data ?? [])[0]?.id as string | undefined) ?? null,
  };
}

export function fingerprintInputs(people: ReportInputFacts[]): string {
  const raw = people
    .map((p) => [p.reportId, p.birth_date ?? "", p.birth_time ?? "", p.birth_place ?? "", p.survey_id ?? ""].join("|"))
    .join("||");
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

export function buildInputSnapshot(people: ReportInputFacts[], now = new Date()): InputSnapshot {
  return {
    v: 1,
    captured_at: now.toISOString(),
    fp: fingerprintInputs(people),
    has_survey: people.map((p) => Boolean(p.survey_id)),
  };
}

export function parseInputSnapshot(raw: unknown): InputSnapshot | null {
  const s = raw as Partial<InputSnapshot> | null | undefined;
  if (!s || s.v !== 1 || typeof s.fp !== "string" || typeof s.captured_at !== "string") return null;
  return { v: 1, fp: s.fp, captured_at: s.captured_at, has_survey: Array.isArray(s.has_survey) ? s.has_survey : [] };
}

/** What the screen shows: when it was made, and whether my info changed since. */
export function describeSnapshot(
  snapshot: InputSnapshot | null,
  current: ReportInputFacts[] | null,
): { generatedAt: string | null; inputsChanged: boolean | null } {
  if (!snapshot) return { generatedAt: null, inputsChanged: null };
  if (!current) return { generatedAt: snapshot.captured_at, inputsChanged: null };
  return { generatedAt: snapshot.captured_at, inputsChanged: fingerprintInputs(current) !== snapshot.fp };
}
