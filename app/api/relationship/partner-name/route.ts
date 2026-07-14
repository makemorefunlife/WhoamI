import { auth } from "@clerk/nextjs/server";
import { logServerError } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import { fetchRelationshipReportRowsForReportId } from "@/lib/relationship/fetchReportsWhereParticipant";

export const runtime = "nodejs";

type Body = {
  partnerReportId?: string;
  viewerReportId?: string;
  name?: string;
};

/** 직접 입력 친구(partner_manual) 이름을 DB reports.name에 저장 */
export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const partnerReportId = body.partnerReportId?.trim();
    const viewerReportId = body.viewerReportId?.trim();
    const name = body.name?.trim().slice(0, 10);

    if (!partnerReportId || !viewerReportId || !name) {
      return NextResponse.json(
        { error: "partnerReportId, viewerReportId, name이 필요합니다." },
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

    const { data: partner } = await supabase
      .from("reports")
      .select("id, report_type")
      .eq("id", partnerReportId)
      .maybeSingle();

    if (!partner?.id || partner.report_type !== "partner_manual") {
      return NextResponse.json(
        { error: "직접 입력 친구만 이름을 변경할 수 있어요." },
        { status: 400 },
      );
    }

    const rows = await fetchRelationshipReportRowsForReportId(
      supabase,
      viewerReportId,
    );
    const linked = rows.some(
      (r) =>
        r.report_id_a === partnerReportId || r.report_id_b === partnerReportId,
    );
    if (!linked) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { error } = await supabase
      .from("reports")
      .update({ name })
      .eq("id", partnerReportId);

    if (error) {
      return NextResponse.json({ error: "request failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, name });
  } catch (e) {
    logServerError("relationship/partner-name:", e, "internal_error");
    return NextResponse.json(
      { error: "request failed" },
      { status: 500 },
    );
  }
}
