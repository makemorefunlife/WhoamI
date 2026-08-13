import { auth } from "@clerk/nextjs/server";
import { logServerError } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { runSlimIntegratedReport } from "@/lib/v1/slim/runSlimIntegratedReport";
import type { SlimV1ReportResult } from "@/lib/v1/slim/types";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import {
  readPersistedDeepEssenceAnalysis,
  writePersistedDeepEssenceAnalysis,
} from "@/lib/report/reportAnalyses";
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
  /** Explicit user-initiated "Regenerate" — bypasses the stored read-before-generate reuse below. */
  forceRegenerate?: boolean;
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

    // Read-before-generate: this report is a paid, "lifetime access" feature —
    // reuse the stored copy instead of re-invoking the LLM on every view.
    // report_analyses has no locale column, so the stored copy is only reused
    // when its recorded locale matches the current request; a locale switch
    // regenerates (and overwrites the single stored row for this report).
    const stored = body.forceRegenerate
      ? null
      : await readPersistedDeepEssenceAnalysis(supabase, reportId);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { locale: string; slim_v1: SlimV1ReportResult };
        if (parsed.locale === locale && parsed.slim_v1) {
          return NextResponse.json({ ok: true, locale, slim_v1: parsed.slim_v1 });
        }
      } catch (e) {
        logServerError("v2/deep/essence:stored_parse", e, "invalid_json");
      }
    }

    const slim_v1 = await runSlimIntegratedReport({
      birthDate,
      birthTime: body.birthTime ?? null,
      birthTimeUnknown: body.birthTimeUnknown === true,
      birthPlace: body.birthPlace ?? null,
      surveyAnswers: body.surveyAnswers ?? null,
      currentSelfProfile: body.currentSelfProfile ?? null,
      locale,
    });

    await writePersistedDeepEssenceAnalysis(
      supabase,
      reportId,
      JSON.stringify({ locale, slim_v1 }),
      { locale },
    );

    return NextResponse.json({ ok: true, locale, slim_v1 });
  } catch (e) {
    logServerError("v2/deep/essence:", e, "internal_error");
    return NextResponse.json(
      { error: "request failed" },
      { status: 500 },
    );
  }
}
