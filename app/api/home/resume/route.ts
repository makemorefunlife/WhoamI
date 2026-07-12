import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { buildGuestHomeResume, buildHomeResume } from "@/lib/home/homeResume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 홈 로그인 사용자 resume — report 복구, 설문 상태, 관계 허브 요약을 한 번에 반환
 * GET ?reportId=  (optional localStorage 힌트)
 */
export async function GET(req: Request) {
  try {
    const reportIdHint = new URL(req.url).searchParams.get("reportId")?.trim();
    const { userId } = await auth();

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    if (!userId) {
      if (!reportIdHint) {
        return NextResponse.json(
          { error: "로그인이 필요합니다." },
          { status: 401 },
        );
      }
      const guestPayload = await buildGuestHomeResume(supabase, reportIdHint);
      if (!guestPayload) {
        return NextResponse.json(
          { error: "이 리포트는 로그인이 필요합니다." },
          { status: 401 },
        );
      }
      return NextResponse.json(guestPayload);
    }

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
