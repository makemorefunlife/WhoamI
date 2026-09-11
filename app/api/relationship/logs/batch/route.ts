import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { readJsonBodyLimited, isUuid } from "@/lib/security/requestValidation";
import { listRelationshipAnalysisLogsBatch } from "@/lib/relationship/analysisLog";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";

export const runtime = "nodejs";

const MAX_RELATIONSHIP_IDS = 50;

/**
 * Batched analysis-log feed for the relationship hub — one call for the
 * viewer's N most recent logs across every relationship, instead of the
 * hub firing one GET /api/relationship/logs per relationship (see
 * lib/relationship/hubAnalysisFeed.ts's doc comment: that per-relationship
 * fan-out was a real felt-latency issue once someone had more than a
 * handful of connections).
 */
export async function POST(req: Request) {
  try {
    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;

    const viewerReportId = typeof body.viewerReportId === "string" ? body.viewerReportId.trim() : "";
    const limitRaw = Number(body.limit ?? 5);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, Math.trunc(limitRaw))) : 5;
    const requestedIds = Array.isArray(body.relationshipReportIds)
      ? [...new Set(body.relationshipReportIds.filter((id): id is string => typeof id === "string" && isUuid(id)))]
      : [];

    if (!viewerReportId || !isUuid(viewerReportId)) {
      return NextResponse.json({ error: "invalid viewerReportId" }, { status: 400 });
    }
    if (requestedIds.length === 0) {
      return NextResponse.json({ logs: [] });
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();
    const ownership = await assertOwnedReportAccess(supabase, viewerReportId, userId);
    if (ownership.error) return ownership.error;

    const capped = requestedIds.slice(0, MAX_RELATIONSHIP_IDS);
    const { data: rrRows, error: rrErr } = await supabase
      .from("relationship_reports")
      .select("id, report_id_a, report_id_b")
      .in("id", capped);

    if (rrErr) {
      return NextResponse.json({ error: "조회 실패" }, { status: 500 });
    }

    // Only relationships the viewer actually participates in — never trust
    // client-submitted ids alone, same guarantee assertOwnedViewerParticipantAccess
    // gives the single-relationship route, just batched into one query here.
    const validIds = (rrRows ?? [])
      .filter((rr) => rr.report_id_a === viewerReportId || rr.report_id_b === viewerReportId)
      .map((rr) => rr.id as string);

    const logs = await listRelationshipAnalysisLogsBatch(supabase, validIds, viewerReportId, limit);

    return NextResponse.json({ logs });
  } catch (e) {
    console.error("relationship/logs/batch POST: unexpected", e);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
