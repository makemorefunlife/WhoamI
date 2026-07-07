import { NextResponse } from "next/server";
import {
  isRelationshipFavorite,
  setRelationshipFavorite,
} from "@/lib/relationship/analysisLog";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(url, serviceKey);
    const favorited = await isRelationshipFavorite(
      supabase,
      viewerReportId,
      relationshipReportId,
    );

    return NextResponse.json({ favorited });
  } catch (e) {
    console.error("relationship/favorite GET:", e);
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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(url, serviceKey);

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

    if (
      rr.report_id_a !== viewerReportId &&
      rr.report_id_b !== viewerReportId
    ) {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }

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
    console.error("relationship/favorite POST:", e);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
