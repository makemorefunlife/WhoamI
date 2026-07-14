import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export type ReportOwnerRow = {
  id: string;
  clerk_user_id?: string | null;
};

const UNAUTH = { error: "unauthorized" } as const;
const FORBIDDEN = { error: "forbidden" } as const;
const NOT_FOUND = { error: "not found" } as const;
const UNAVAILABLE = { error: "temporarily unavailable" } as const;

/**
 * Read-only report ownership check.
 * - No INSERT/UPDATE/claim side effects.
 * - Guest UUID capability is fail-closed until signed guest session exists.
 * - Clerk user must own the report (clerk_user_id === userId).
 */
export async function assertOwnedReportAccess(
  supabase: SupabaseClient,
  reportId: string,
  userId: string | null,
): Promise<
  | { report: ReportOwnerRow; error?: undefined }
  | { report?: undefined; error: NextResponse }
> {
  const id = typeof reportId === "string" ? reportId.trim() : "";
  if (!id) {
    return {
      error: NextResponse.json({ error: "invalid request" }, { status: 400 }),
    };
  }

  if (!userId) {
    return {
      error: NextResponse.json(UNAUTH, { status: 401 }),
    };
  }

  const { data: report, error: repErr } = await supabase
    .from("reports")
    .select("id, clerk_user_id")
    .eq("id", id)
    .maybeSingle();

  if (repErr) {
    console.info("[ownership] report_lookup_failed");
    return {
      error: NextResponse.json(UNAVAILABLE, { status: 503 }),
    };
  }
  if (!report?.id) {
    return {
      error: NextResponse.json(NOT_FOUND, { status: 404 }),
    };
  }

  const ownerId = (report as ReportOwnerRow).clerk_user_id;
  if (ownerId == null || ownerId !== userId) {
    return {
      error: NextResponse.json(FORBIDDEN, { status: 403 }),
    };
  }

  return { report: report as ReportOwnerRow };
}

function assertParticipant(
  viewerReportId: string,
  reportIdA: string,
  reportIdB: string,
): NextResponse | null {
  const id = viewerReportId.trim();
  if (!id) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (id !== reportIdA && id !== reportIdB) {
    return NextResponse.json(FORBIDDEN, { status: 403 });
  }
  return null;
}

/**
 * Relationship PII APIs: Clerk owns viewer report AND viewer is participant.
 */
export async function assertOwnedViewerParticipantAccess(
  supabase: SupabaseClient,
  userId: string | null,
  viewerReportId: string,
  reportIdA: string,
  reportIdB: string,
): Promise<NextResponse | null> {
  const ownership = await assertOwnedReportAccess(
    supabase,
    viewerReportId,
    userId,
  );
  if (ownership.error) return ownership.error;
  return assertParticipant(viewerReportId, reportIdA, reportIdB);
}

/**
 * @deprecated Prefer assertOwnedReportAccess.
 * Fail-closed: no guest UUID, no auto-claim.
 */
export async function assertGuestOrOwnerReportAccess(
  supabase: SupabaseClient,
  reportId: string,
  userId: string | null,
): Promise<
  | { report: ReportOwnerRow; error?: undefined }
  | { report?: undefined; error: NextResponse }
> {
  return assertOwnedReportAccess(supabase, reportId, userId);
}
