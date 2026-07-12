import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";

export const runtime = "nodejs";

/** 직접 입력 친구 관계 삭제 — 허브 리포트 소유자·게스트만 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      relationshipReportId?: string;
      viewerReportId?: string;
    };
    const relationshipReportId = body.relationshipReportId?.trim();
    const viewerReportId = body.viewerReportId?.trim();

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json(
        { error: "relationshipReportId와 viewerReportId가 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      viewerReportId,
      userId,
    );
    if (access.error) return access.error;

    const { data: rr, error: rrErr } = await supabase
      .from("relationship_reports")
      .select("id, report_id_a, report_id_b")
      .eq("id", relationshipReportId)
      .maybeSingle();

    if (rrErr || !rr) {
      return NextResponse.json(
        { error: "관계를 찾지 못했습니다." },
        { status: 404 },
      );
    }

    if (rr.report_id_a !== viewerReportId) {
      return NextResponse.json(
        { error: "이 관계를 삭제할 권한이 없습니다." },
        { status: 403 },
      );
    }

    const partnerId =
      rr.report_id_a === viewerReportId ? rr.report_id_b : rr.report_id_a;

    const { data: partner, error: pErr } = await supabase
      .from("reports")
      .select("id, report_type")
      .eq("id", partnerId)
      .maybeSingle();

    if (pErr || !partner) {
      return NextResponse.json(
        { error: "상대 리포트를 찾지 못했습니다." },
        { status: 404 },
      );
    }

    if (partner.report_type !== "partner_manual") {
      return NextResponse.json(
        { error: "직접 입력한 친구만 여기서 삭제할 수 있어요." },
        { status: 400 },
      );
    }

    const { error: delRrErr } = await supabase
      .from("relationship_reports")
      .delete()
      .eq("id", relationshipReportId);

    if (delRrErr) {
      return NextResponse.json({ error: delRrErr.message }, { status: 500 });
    }

    await supabase.from("reports").delete().eq("id", partnerId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("relationship/remove:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "삭제 실패" },
      { status: 500 },
    );
  }
}
