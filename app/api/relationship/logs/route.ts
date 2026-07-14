import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { listRelationshipAnalysisLogs } from "@/lib/relationship/analysisLog";
import { assertOwnedViewerParticipantAccess } from "@/lib/report/assertOwnedReportAccess";

export const runtime = "nodejs";

/** 관계 분석 이력 목록 */
export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const relationshipReportId = sp.get("relationshipReportId")?.trim();
    const viewerReportId = sp.get("viewerReportId")?.trim();
    const limitRaw = Number(sp.get("limit") ?? "30");
    const offsetRaw = Number(sp.get("offset") ?? "0");
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(100, Math.trunc(limitRaw)))
      : 30;
    const offset = Number.isFinite(offsetRaw)
      ? Math.max(0, Math.trunc(offsetRaw))
      : 0;

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json(
        { error: "relationshipReportId와 viewerReportId가 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { data: rr } = await supabase
      .from("relationship_reports")
      .select("report_id_a, report_id_b")
      .eq("id", relationshipReportId)
      .maybeSingle();

    if (!rr) {
      return NextResponse.json(
        { error: "관계 분석을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const { userId } = await auth();
    const accessGuard = await assertOwnedViewerParticipantAccess(
      supabase,
      userId,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
    );
    if (accessGuard) return accessGuard;

    const logs = await listRelationshipAnalysisLogs(
      supabase,
      relationshipReportId,
      viewerReportId,
      limit + 1,
      offset,
    );

    const hasMore = logs.length > limit;
    const sliced = hasMore ? logs.slice(0, limit) : logs;
    const nextOffset = offset + sliced.length;

    return NextResponse.json({ logs: sliced, hasMore, nextOffset });
  } catch (e) {
    console.error("relationship/logs GET: unexpected");
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
