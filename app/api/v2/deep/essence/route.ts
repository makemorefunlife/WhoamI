import { auth } from "@clerk/nextjs/server";
import { logServerError } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { runSlimIntegratedReport } from "@/lib/v1/slim/runSlimIntegratedReport";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import type {
  CurrentSelfProfile,
  SurveyAnswersInput,
} from "@/lib/v2/survey/types";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = {
  reportId?: string;
  birthDate?: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  birthPlace?: string | null;
  surveyAnswers?: SurveyAnswersInput | null;
  currentSelfProfile?: CurrentSelfProfile | null;
  language?: string;
  locale?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const locale = resolveRequestLocale({
      bodyLanguage: body.language ?? body.locale,
      headerLanguage:
        req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
    });
    const messages = getMessages(locale);
    const reportId = body.reportId?.trim();
    const birthDate = body.birthDate?.trim();

    if (!reportId) {
      return NextResponse.json(
        { error: messages.errors.reportIdRequired },
        { status: 400 },
      );
    }
    if (!birthDate) {
      return NextResponse.json(
        { error: messages.errors.birthDateRequired },
        { status: 400 },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      reportId,
      userId,
    );
    if (access.error) return access.error;

    const slim_v1 = await runSlimIntegratedReport({
      birthDate,
      birthTime: body.birthTime ?? null,
      birthTimeUnknown: body.birthTimeUnknown === true,
      birthPlace: body.birthPlace ?? null,
      surveyAnswers: body.surveyAnswers ?? null,
      currentSelfProfile: body.currentSelfProfile ?? null,
      locale,
    });

    return NextResponse.json({ ok: true, locale, slim_v1 });
  } catch (e) {
    logServerError("v2/deep/essence:", e, "internal_error");
    return NextResponse.json(
      { error: "request failed" },
      { status: 500 },
    );
  }
}
