import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";

export const runtime = "nodejs";

/** 열린 초대(보낸 요청) 취소 — 발신 리포트 소유자·게스트만 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      inviteId?: string;
      reportId?: string;
    };
    const inviteId = body.inviteId?.trim();
    const reportId = body.reportId?.trim();

    if (!inviteId || !reportId) {
      return NextResponse.json(
        { error: "inviteId와 reportId가 필요합니다." },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      reportId,
      userId,
    );
    if (access.error) return access.error;

    const { data, error } = await supabase
      .from("invites")
      .delete()
      .eq("id", inviteId)
      .eq("from_report_id", reportId)
      .eq("status", "open")
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { error: "삭제할 요청을 찾지 못했습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("invite/cancel:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "삭제 실패" },
      { status: 500 },
    );
  }
}
