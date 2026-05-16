import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { buildHomeResume } from "@/lib/home/homeResume";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";

/**
 * 홈 로그인 사용자 resume — report 복구, 설문 상태, 관계 허브 요약을 한 번에 반환
 * GET ?reportId=  (optional localStorage 힌트)
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const reportIdHint = new URL(req.url).searchParams.get("reportId")?.trim();
    const supabase = createServiceRoleClient(url, serviceKey);
    const payload = await buildHomeResume(
      supabase,
      userId,
      reportIdHint || undefined,
    );

    return NextResponse.json(payload);
  } catch (e) {
    console.error("home/resume:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "조회 실패" },
      { status: 500 },
    );
  }
}
