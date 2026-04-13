import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inviteToken =
      typeof body.inviteToken === "string" ? body.inviteToken.trim() : "";
    const reportId =
      typeof body.reportId === "string" ? body.reportId.trim() : "";

    if (!inviteToken || !reportId) {
      return NextResponse.json(
        { error: "inviteToken과 reportId가 필요합니다." },
        { status: 400 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      console.error("invite/complete: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 없음");
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("invites")
      .update({
        accepted_report_id: reportId,
        status: "complete",
      })
      .eq("invite_token", inviteToken)
      .eq("status", "open")
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("invite/complete:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "유효하지 않은 초대이거나 이미 처리되었습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("invite/complete:", e);
    return NextResponse.json(
      { error: "초대 완료 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
