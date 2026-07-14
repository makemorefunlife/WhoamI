import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import {
  isRelationshipFavorite,
  setRelationshipFavorite,
} from "@/lib/relationship/analysisLog";
import { assertOwnedViewerParticipantAccess } from "@/lib/report/assertOwnedReportAccess";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const relationshipReportId = sp.get("relationshipReportId")?.trim();
    const viewerReportId = sp.get("viewerReportId")?.trim();

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

    const favorited = await isRelationshipFavorite(
      supabase,
      viewerReportId,
      relationshipReportId,
    );

    return NextResponse.json({ favorited });
  } catch (e) {
    console.error("relationship/favorite GET: unexpected");
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const relationshipReportId =
      typeof body.relationship_report_id === "string"
        ? body.relationship_report_id.trim()
        : "";
    const viewerReportId =
      typeof body.viewer_report_id === "string"
        ? body.viewer_report_id.trim()
        : "";
    const favorited = body.favorited === true;

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json(
        { error: "relationship_report_id와 viewer_report_id가 필요합니다." },
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

    const ok = await setRelationshipFavorite(
      supabase,
      viewerReportId,
      relationshipReportId,
      favorited,
    );

    if (!ok) {
      return NextResponse.json({ error: "저장 실패" }, { status: 500 });
    }

    return NextResponse.json({ favorited });
  } catch (e) {
    console.error("relationship/favorite POST: unexpected");
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
