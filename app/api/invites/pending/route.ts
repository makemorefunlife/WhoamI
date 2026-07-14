import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logServerError } from "@/lib/security/safeLog";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";

export const runtime = "nodejs";

/** 링크만 보내고 아직 관계 행으로 연결되지 않은 열린 초대 — 본인 report만 */
export async function GET(req: Request) {
  try {
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim();
    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();
    const access = await assertOwnedReportAccess(supabase, reportId, userId);
    if (access.error) return access.error;

    const { count, error } = await supabase
      .from("invites")
      .select("id", { count: "exact", head: true })
      .eq("from_report_id", reportId)
      .eq("status", "open")
      .is("relationship_report_id", null);

    if (error) {
      logServerError("invites/pending:", error, "internal_error");
      return NextResponse.json({ error: "request failed" }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (e) {
    logServerError("invites/pending:", e, "internal_error");
    return NextResponse.json(
      { error: "request failed" },
      { status: 500 },
    );
  }
}
