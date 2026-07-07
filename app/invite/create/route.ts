import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/serverClient";

function makeToken() {
  return `invite_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: Request) {
  try {
    const { reportId } = await req.json();

    if (!reportId) {
      return NextResponse.json({ error: "reportId 없음" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    // 🔥 이미 초대한 적 있는지 체크 (1회 제한)
    const { data: existing } = await supabase
      .from("invites")
      .select("*")
      .eq("from_report_id", reportId)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "이미 친구 초대를 사용했습니다." },
        { status: 400 },
      );
    }

    const inviteToken = makeToken();

    const { data, error } = await supabase
      .from("invites")
      .insert([
        {
          from_report_id: reportId,
          invite_token: inviteToken,
          status: "open",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invite: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "초대 생성 오류" }, { status: 500 });
  }
}
