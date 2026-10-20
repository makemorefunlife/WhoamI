import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { restoreBirthFromOwnedReports } from "@/lib/report/restoreBirthFromOwnedReports";
import { deleteReportAnalysis } from "@/lib/report/reportAnalyses";
import { invalidatePersonCoreBlueprint } from "@/lib/personCore";

export const runtime = "nodejs";

/**
 * POST { reportId } -- signed-in owner only. Fills the report's EMPTY birth
 * details from the same account's other report where they are already saved
 * (lib/report/restoreBirthFromOwnedReports.ts). Never replaces saved details,
 * never uses browser data, never touches generated reports. Returns only a
 * result code (no birth details in the response).
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ result: "unauthorized" }, { status: 401 });
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;
    const reportId = typeof body.reportId === "string" ? body.reportId.trim() : "";
    if (!/^[0-9a-f-]{36}$/i.test(reportId)) return NextResponse.json({ result: "invalid_request" }, { status: 400 });
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const r = await restoreBirthFromOwnedReports(supabase, { clerkUserId: userId, reportId });
    if (r.kind === "restored") {
      // Same derived-cache refresh as a normal birth save.
      await deleteReportAnalysis(supabase, reportId, "astrology");
      await invalidatePersonCoreBlueprint(reportId, supabase);
    }
    const status = r.kind === "not_owner" ? 403 : r.kind === "error" ? 500 : 200;
    return NextResponse.json({ result: r.kind }, { status });
  } catch (e) {
    logServerError("report/birth/restore", e, "internal_error");
    return NextResponse.json({ result: "error" }, { status: 500 });
  }
}
