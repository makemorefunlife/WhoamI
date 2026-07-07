import type { SupabaseClient } from "@supabase/supabase-js";
import { isV2SurveyCompleteForReport } from "@/lib/v2/survey/dbCompletion";

export type CanonicalReportRow = {
  id: string;
  name: string | null;
  clerk_user_id: string | null;
  created_at: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
};

const REPORT_SELECT =
  "id, name, clerk_user_id, created_at, birth_date, birth_time, birth_place";

function sortByNewest(a: CanonicalReportRow, b: CanonicalReportRow): number {
  const ta = a.created_at ? Date.parse(a.created_at) : 0;
  const tb = b.created_at ? Date.parse(b.created_at) : 0;
  return tb - ta;
}

async function fetchOwnedReports(
  supabase: SupabaseClient,
  clerkUserId: string,
): Promise<CanonicalReportRow[]> {
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_SELECT)
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("resolveCanonicalReport owned:", error);
    return [];
  }
  return (data ?? []) as CanonicalReportRow[];
}

async function fetchReportById(
  supabase: SupabaseClient,
  reportId: string,
): Promise<CanonicalReportRow | null> {
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_SELECT)
    .eq("id", reportId)
    .maybeSingle();

  if (error) {
    console.error("resolveCanonicalReport by id:", error);
    return null;
  }
  return (data as CanonicalReportRow | null) ?? null;
}

async function claimOrphanReport(
  supabase: SupabaseClient,
  reportId: string,
  clerkUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from("reports")
    .update({ clerk_user_id: clerkUserId })
    .eq("id", reportId)
    .is("clerk_user_id", null);

  if (error) {
    console.error("resolveCanonicalReport claim:", error);
  }
}

/**
 * 로그인 사용자의 대표 report — 완료된 설문이 있으면 최신 완료본 우선,
 * localStorage 힌트는 검증·연결용으로만 사용.
 */
export async function resolveCanonicalReport(
  supabase: SupabaseClient,
  clerkUserId: string,
  reportIdHint?: string,
): Promise<{ report: CanonicalReportRow | null; invalidHint: boolean }> {
  let invalidHint = false;
  const owned = await fetchOwnedReports(supabase, clerkUserId);

  let hintReport: CanonicalReportRow | null = null;
  if (reportIdHint) {
    hintReport = await fetchReportById(supabase, reportIdHint);
    if (!hintReport) {
      invalidHint = true;
    } else if (
      hintReport.clerk_user_id != null &&
      hintReport.clerk_user_id !== clerkUserId
    ) {
      invalidHint = true;
      hintReport = null;
    } else if (hintReport.clerk_user_id == null) {
      await claimOrphanReport(supabase, hintReport.id, clerkUserId);
      hintReport = { ...hintReport, clerk_user_id: clerkUserId };
    }
  }

  const candidateMap = new Map<string, CanonicalReportRow>();
  for (const r of owned) candidateMap.set(r.id, r);
  if (hintReport) candidateMap.set(hintReport.id, hintReport);

  const candidates = [...candidateMap.values()];
  if (candidates.length === 0) {
    return { report: null, invalidHint };
  }

  const scored = await Promise.all(
    candidates.map(async (report) => ({
      report,
      surveyCompleted: await isV2SurveyCompleteForReport(supabase, report.id),
    })),
  );

  const completed = scored
    .filter((x) => x.surveyCompleted)
    .map((x) => x.report)
    .sort((a, b) => {
      const aHasBirth = Boolean(a.birth_date?.trim());
      const bHasBirth = Boolean(b.birth_date?.trim());
      if (aHasBirth !== bHasBirth) return aHasBirth ? -1 : 1;
      return sortByNewest(a, b);
    });

  if (completed.length > 0) {
    const pick = completed[0]!;
    if (
      reportIdHint &&
      reportIdHint !== pick.id &&
      !completed.some((r) => r.id === reportIdHint)
    ) {
      invalidHint = true;
    }
    return { report: pick, invalidHint };
  }

  if (hintReport && !invalidHint) {
    return { report: hintReport, invalidHint: false };
  }

  const latestOwned = [...owned].sort(sortByNewest)[0] ?? null;
  if (latestOwned) {
    if (reportIdHint && reportIdHint !== latestOwned.id) {
      invalidHint = true;
    }
    return { report: latestOwned, invalidHint };
  }

  return { report: null, invalidHint };
}
