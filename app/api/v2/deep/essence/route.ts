import { auth } from "@clerk/nextjs/server";
import { logServerError } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { runSlimIntegratedReport } from "@/lib/v1/slim/runSlimIntegratedReport";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import {
  readPersistedDeepEssenceAnalysis,
  writePersistedDeepEssenceAnalysis,
} from "@/lib/report/reportAnalyses";
import { decideStoredDeepEssenceReuse } from "@/lib/report/personalDeepEssenceReuse";
import { runPersonalDeepEssenceGeneration } from "@/lib/report/personalDeepEssenceGeneration";
import type {
  CurrentSelfProfile,
  SurveyAnswersInput,
} from "@/lib/v2/survey/types";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { reservePersonalCredit, consumeCredit, releaseCredit } from "@/lib/credits/creditEngine";
import {
  acquirePersonalPremiumGenerationLock,
  releasePersonalPremiumGenerationLock,
  stillOwnsPersonalPremiumGenerationLock,
} from "@/lib/report/personalPremiumGenerationLock";

export const runtime = "nodejs";
// Two sequential gpt-4o-mini calls (Part A -> Part B) run in parallel with
// runIntegratedPremiumLlm — a fresh generation measured at 126s in
// production just now, over the previous 120s cap, which made Vercel kill
// the function and return its own non-JSON timeout page (breaking the
// client's JSON.parse). 300s matches the other heavy premium-report routes
// (/api/llm, /api/relationship/analyze/premium) already in this codebase.
export const maxDuration = 300;

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
    const access = await assertOwnedReportAccess(
      supabase,
      reportId,
      userId,
      locale,
    );
    if (access.error) return access.error;

    // Read-before-generate: this report is a paid, "lifetime access" feature --
    // a report the user already generated is always served from the saved copy.
    // Internal generation versions / cache versions NEVER decide access
    // (see lib/report/personalDeepEssenceReuse.ts); a newer version is only
    // produced by an explicit user action (`forceRegenerate`).
    // report_analyses has no locale column, so the stored copy is only reused
    // when its recorded locale matches the current request; a locale switch
    // regenerates (and overwrites the single stored row for this report).
    const stored = body.forceRegenerate
      ? null
      : await readPersistedDeepEssenceAnalysis(supabase, reportId);
    const reuse = decideStoredDeepEssenceReuse(stored, locale);
    if (reuse.reuse) {
      return NextResponse.json({ ok: true, locale, slim_v1: reuse.slim_v1 });
    }
    if (reuse.reason === "invalid_json") {
      logServerError("v2/deep/essence:stored_parse", new Error("stored row is not valid JSON"), "invalid_json");
    }

    // DB-backed atomic lock — one in-flight slot per (reportId, locale).
    // Fails fast (409 Conflict) before credit reservation if another request is active.
    const generationRequestId = crypto.randomUUID();
    const lock = await acquirePersonalPremiumGenerationLock(supabase, {
      reportId,
      locale,
      generationRequestId,
    });

    if (!lock.ok) {
      if (lock.reason === "in_progress") {
        return NextResponse.json(
          { error: messages.errors.analysisFailed, in_progress: true },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: messages.errors.analysisFailed },
        { status: 500 },
      );
    }

    try {
      const outcome = await runPersonalDeepEssenceGeneration({
        reserveCredit: userId
          ? async () => {
              const reserve = await reservePersonalCredit(supabase, {
                clerkUserId: userId,
                reportId,
                locale,
                generationRequestId,
              });
              if (reserve.ok) return { ok: true as const };
              return {
                ok: false as const,
                reason:
                  reserve.reason === "insufficient_balance"
                    ? ("insufficient_balance" as const)
                    : ("error" as const),
              };
            }
          : null,
        generate: () =>
          runSlimIntegratedReport({
            birthDate,
            birthTime: body.birthTime ?? null,
            birthTimeUnknown: body.birthTimeUnknown === true,
            birthPlace: body.birthPlace ?? null,
            surveyAnswers: body.surveyAnswers ?? null,
            currentSelfProfile: body.currentSelfProfile ?? null,
            locale,
          }),
        stillOwnsLock: () =>
          stillOwnsPersonalPremiumGenerationLock(supabase, lock.lockId, generationRequestId),
        persist: (slim_v1) =>
          writePersistedDeepEssenceAnalysis(
            supabase,
            reportId,
            JSON.stringify({ locale, slim_v1 }),
            { locale },
          ),
        consumeCredit: () => consumeCredit(supabase, generationRequestId),
        releaseCredit: () => releaseCredit(supabase, generationRequestId),
        log: (tag, error, code) => logServerError(tag, error, code),
      });

      if (outcome.kind === "ok") {
        return NextResponse.json({ ok: true, locale, slim_v1: outcome.slim_v1 });
      }
      if (outcome.kind === "insufficient_credit") {
        return NextResponse.json(
          { error: messages.errors.insufficientCredit },
          { status: 402 },
        );
      }
      return NextResponse.json(
        { error: messages.errors.analysisFailed },
        { status: outcome.status },
      );
    } finally {
      await releasePersonalPremiumGenerationLock(
        supabase,
        lock.lockId,
        generationRequestId,
      ).catch(() => {});
    }
  } catch (e) {
    logServerError("v2/deep/essence:", e, "internal_error");
    return NextResponse.json(
      { error: "request failed" },
      { status: 500 },
    );
  }
}
