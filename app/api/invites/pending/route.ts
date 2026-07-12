import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";

export const runtime = "nodejs";

/** 링크만 보내고 아직 관계 행으로 연결되지 않은 열린 초대 */
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

    const { count, error } = await supabase
      .from("invites")
      .select("id", { count: "exact", head: true })
      .eq("from_report_id", reportId)
      .eq("status", "open")
      .is("relationship_report_id", null);

    if (error) {
      console.error("invites/pending:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (e) {
    console.error("invites/pending:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "조회 실패" },
      { status: 500 },
    );
  }
}
