import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/** 해당 리포트에서 이미 만든 초대(친구 초대권 사용)가 있는지 */
export async function GET(req: Request) {
  try {
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim();
    if (!reportId) {
      return NextResponse.json(
        { used: false, error: "reportId가 필요합니다." },
        { status: 400 },
      );
    }

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
