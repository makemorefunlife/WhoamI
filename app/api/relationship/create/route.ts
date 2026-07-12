import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { ensureRelationshipReport } from "@/lib/relationship/createRelationshipReport";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reportIdA =
      typeof body.reportIdA === "string" ? body.reportIdA.trim() : "";
    const reportIdB =
      typeof body.reportIdB === "string" ? body.reportIdB.trim() : "";

    if (!reportIdA || !reportIdB) {
      return NextResponse.json(
        { error: "reportIdA와 reportIdB가 필요합니다." },
        { status: 400 },
      );
    }
    if (reportIdA === reportIdB) {
      return NextResponse.json(
        { error: "서로 다른 리포트여야 합니다." },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { relationshipReportId, created } = await ensureRelationshipReport(
      supabase,
      reportIdA,
      reportIdB,
    );

    return NextResponse.json({
      success: true,
      relationship_report_id: relationshipReportId,
      created,
    });
  } catch (e) {
    console.error("relationship/create:", e);
    return NextResponse.json(
      { error: "관계 레코드를 만들지 못했습니다." },
      { status: 500 },
    );
  }
}
