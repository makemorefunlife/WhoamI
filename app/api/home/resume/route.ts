import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { buildHomeResume } from "@/lib/home/homeResume";
import { logServerError } from "@/lib/security/safeLog";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 홈 로그인 사용자 resume — report 복구, 설문 상태, 관계 허브 요약을 한 번에 반환
 * GET ?reportId=  (optional localStorage 힌트)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale = resolveRequestLocale({
    bodyLanguage: url.searchParams.get("language") ?? url.searchParams.get("locale"),
    headerLanguage:
      req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const reportIdHint = url.searchParams.get("reportId")?.trim();
    const { userId } = await auth();

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    if (!userId) {
      return NextResponse.json(
        { error: messages.errors.unauthorized },
        { status: 401 },
      );
    }

    const payload = await buildHomeResume(
      supabase,
      userId,
      reportIdHint || undefined,
    );

    return NextResponse.json(payload);
  } catch (e) {
    logServerError("home/resume", e);
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }
}
