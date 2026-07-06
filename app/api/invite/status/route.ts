import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

/** 해당 리포트에서 이미 만든 초대(친구 초대권 사용)가 있는지 — 소유자·게스트만 */
export async function GET(req: Request) {
  try {
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim();
    if (!reportId) {
      return NextResponse.json(
        { used: false, error: "reportId가 필요합니다." },
        { status: 400 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ used: false, error: "server_config" });
    }

    const supabase = createServiceRoleClient(url, serviceKey);
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      reportId,
      userId,
    );
    if (access.error) return access.error;

    const { data, error } = await supabase
      .from("invites")
      .select("id")
      .eq("from_report_id", reportId)
      .limit(1);

    if (error) {
      console.error("invite/status:", error);
      return NextResponse.json({ used: false });
    }

    return NextResponse.json({ used: (data?.length ?? 0) > 0 });
  } catch (e) {
    console.error("invite/status:", e);
    return NextResponse.json({ used: false });
  }
}
