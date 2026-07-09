import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(url, serviceKey);
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, name });
  } catch (e) {
    console.error("relationship/partner-name:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "저장 실패" },
      { status: 500 },
    );
  }
}
