import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { isV2SurveyCompleteForReport } from "@/lib/v2/survey/dbCompletion";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { isPsychSurveyRequired } from "@/lib/i18n/localePolicy";
import { decideFriendAddReadiness } from "@/lib/relationship/friendAddReadiness";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * What the viewer still needs before adding a friend (see
 * lib/relationship/friendAddReadiness.ts). Never looks at purchases.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const locale = resolveRequestLocale({
      bodyLanguage: url.searchParams.get("locale"),
      headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
    });
    const surveyRequired = isPsychSurveyRequired(locale);
    const { userId } = await auth();
    const reportIdParam = url.searchParams.get("reportId")?.trim() || "";
    const facts = { signedIn: Boolean(userId), reportId: null as string | null, hasBirthDate: false, surveyComplete: false, surveyRequired };
    if (!userId || !reportIdParam) {
      return NextResponse.json({ readiness: decideFriendAddReadiness(facts), surveyRequired }, { headers: { "Cache-Control": "no-store" } });
    }
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const access = await assertOwnedReportAccess(supabase, reportIdParam, userId, locale);
    if (!access.error) {
      const { data } = await supabase.from("reports").select("birth_date").eq("id", reportIdParam).maybeSingle();
      facts.reportId = reportIdParam;
      facts.hasBirthDate = Boolean((data as { birth_date: string | null } | null)?.birth_date);
      facts.surveyComplete = await isV2SurveyCompleteForReport(supabase, reportIdParam);
    } else if (access.error.status !== 404 && access.error.status !== 403) {
      return access.error;
    }
    return NextResponse.json({ readiness: decideFriendAddReadiness(facts), surveyRequired }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    logServerError("relationship/viewer-readiness", e, "internal_error");
    return NextResponse.json({ error: "request failed" }, { status: 500 });
  }
}
