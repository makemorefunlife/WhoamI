import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function makeToken() {
  return `invite_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 없습니다." },
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
