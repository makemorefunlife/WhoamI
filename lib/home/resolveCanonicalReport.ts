import type { SupabaseClient } from "@supabase/supabase-js";
import { countHubRelationshipSummary } from "@/lib/relationship/hubRelationshipSummary";
import { isV2SurveyCompleteForReport } from "@/lib/v2/survey/dbCompletion";
import { logServerError } from "@/lib/security/safeLog";
import {
  extractSafeErrorShape,
  formatSafeErrorShape,
} from "@/lib/security/errorShape";

export type CanonicalReportRow = {
  id: string;
  name: string | null;
  clerk_user_id: string | null;
  created_at: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  entitlement: string | null;
  report_type: string | null;
};

const REPORT_SELECT =
  "id, name, clerk_user_id, created_at, birth_date, birth_time, birth_place, entitlement, report_type";

/** Manually-added friend proxy reports (app/api/relationship/manual/route.ts) share
 *  the adder's clerk_user_id but must never be treated as "my" canonical report —
 *  same value fetchOwnedReports excludes at the query level. */
const PARTNER_MANUAL_REPORT_TYPE = "partner_manual";

function isEligibleForCanonicalReport(
  row: Pick<CanonicalReportRow, "report_type">,
): boolean {
  return row.report_type !== PARTNER_MANUAL_REPORT_TYPE;
}

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
    // /api/report/create already applies this same exclusion to its own
    // owned-report lookup.
    .neq("report_type", PARTNER_MANUAL_REPORT_TYPE)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    // Structural-only diagnostic: property names + short scalar code/status
    // fields, never message/details/hint — same bounded shape used for the
    // report/create insert-failure diagnostics.
    console.error(
      "[error-shape]",
      "context=resolveCanonicalReport.owned",
      ...formatSafeErrorShape(extractSafeErrorShape(error)),
      `sha=${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}`,
    );
    logServerError("resolveCanonicalReport.owned", error);
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
    logServerError("resolveCanonicalReport.byId", error);
    return null;
  }
  return (data as CanonicalReportRow | null) ?? null;
}

/**
 * 로그인 사용자의 대표 report — 본인 소유 행만 후보.
 * orphan/guest claim 없음.
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
    } else if (hintReport.clerk_user_id !== clerkUserId) {
      invalidHint = true;
      hintReport = null;
    } else if (!isEligibleForCanonicalReport(hintReport)) {
      // Same eligibility rule as fetchOwnedReports — a hint pointing at a
      // partner_manual proxy report must not be treated as valid self-report
      // evidence either (it would otherwise still enter candidateMap below
      // and could win the completed-survey / relationship-count scoring).
      invalidHint = true;
      hintReport = null;
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
    .map((x) => x.report);

  if (completed.length > 0) {
    const withRelationships = await Promise.all(
      completed.map(async (report) => ({
        report,
        summary: await countHubRelationshipSummary(supabase, report.id),
      })),
    );

    withRelationships.sort((a, b) => {
      const aRel = a.summary.completed + a.summary.pending;
      const bRel = b.summary.completed + b.summary.pending;
      if (aRel !== bRel) return bRel - aRel;

      const aHasBirth = Boolean(a.report.birth_date?.trim());
      const bHasBirth = Boolean(b.report.birth_date?.trim());
      if (aHasBirth !== bHasBirth) return aHasBirth ? -1 : 1;

      if (reportIdHint) {
        if (a.report.id === reportIdHint && b.report.id !== reportIdHint) {
          return -1;
        }
        if (b.report.id === reportIdHint && a.report.id !== reportIdHint) {
          return 1;
        }
      }

      return sortByNewest(a.report, b.report);
    });

    const pick = withRelationships[0]!.report;
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
