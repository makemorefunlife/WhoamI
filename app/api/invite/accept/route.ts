import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

function makeToken() {
  return `invite_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** 친구 초대 생성 (accept 경로) — 발신 리포트 소유자·게스트만 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reportId = body.reportId?.trim();

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 없습니다." },
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
      reportId,
      userId,
    );
    if (access.error) return access.error;

    const inviteToken = makeToken();

    const { data, error } = await supabase
      .from("invites")
      .insert([
        {
          from_report_id: reportId,
          invite_token: inviteToken,
          invite_type: "relationship",
          status: "open",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      invite: data,
    });
  } catch (error) {
    console.error("invite create error:", error);

    return NextResponse.json(
      { error: "초대 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
