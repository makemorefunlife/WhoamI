import { NextResponse } from "next/server";
import { logServerError } from "@/lib/security/safeLog";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { buildRelationshipHubList } from "@/lib/relationship/hubList";

export type { HubRowKind } from "@/lib/relationship/hubList";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage:
      req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const sp = new URL(req.url).searchParams;
    const reportId = sp.get("reportId")?.trim();
    if (!reportId) {
      return NextResponse.json(
        { error: messages.errors.reportIdRequired },
        { status: 400 },
      );
    }

    const limitRaw = sp.get("limit");
    const limit =
      limitRaw != null && limitRaw !== ""
        ? Math.min(50, Math.max(1, Number.parseInt(limitRaw, 10) || 3))
        : undefined;
    const formatSimple = sp.get("format") === "simple";
    const scope = sp.get("scope")?.trim() ?? "all";
    const favoritesOnly = sp.get("favoritesOnly") === "true";
    const includeWaiting = sp.get("includeWaiting") === "true";

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();
    const access = await assertOwnedReportAccess(supabase, reportId, userId, locale);
    if (access.error) return access.error;

    const built = await buildRelationshipHubList(supabase, {
      reportId,
      locale,
      limit,
      formatSimple,
      scope,
      favoritesOnly,
      includeWaiting,
    });
    if (!built.ok) return NextResponse.json(built.body, { status: built.status });
    return NextResponse.json(built.body);
  } catch (e) {
    logServerError("relationship/list:", e, "internal_error");
    return NextResponse.json(
      { error: messages.errors.generic },
      { status: 500 },
    );
  }
}
