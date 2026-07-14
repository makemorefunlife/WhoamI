import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export type {
  ReportOwnerRow,
} from "@/lib/report/assertOwnedReportAccess";
export {
  assertOwnedReportAccess,
  assertOwnedViewerParticipantAccess,
  assertGuestOrOwnerReportAccess,
} from "@/lib/report/assertOwnedReportAccess";

/** Explicit claim is disabled until signed guest session exists. */
export async function assertClaimAllowed(
  _supabase: SupabaseClient,
  _reportId: string,
  _userId: string | null,
): Promise<NextResponse> {
  return NextResponse.json(
    { error: "guest claim is temporarily disabled" },
    { status: 403 },
  );
}
