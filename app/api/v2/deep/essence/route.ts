import { auth } from "@clerk/nextjs/server";
import { logServerError } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import { runSlimIntegratedReport } from "@/lib/v1/slim/runSlimIntegratedReport";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { readPersonalDeepRows, savePersonalDeepAnalysis } from "@/lib/report/reportAnalyses";
import { decidePersonalDeepPost, decidePersonalDeepView } from "@/lib/report/personalDeepEssenceView";
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
  isPersonalPremiumGenerationInProgress,
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
  /**
   * Must be true: generation (and the credit it uses) only happens from the
   * explicit "generate" button. Opening, refreshing or switching language
   * uses GET, which never generates or charges.
   */
  confirmGenerate?: boolean;
  /** Explicit, confirmed "generate again" for a language that already has a report. */
  regenerate?: boolean;
  /** @deprecated old clients; treated as `regenerate` only together with confirmGenerate. */
  forceRegenerate?: boolean;
};

/**
 * GET ?reportId= -- read only. Returns this language's saved report state:
 *   ready | legacy_unknown (previous report, language not recorded) |
 *   not_generated | in_progress. Never generates, never touches credits.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const locale = resolveRequestLocale({
      bodyLanguage: url.searchParams.get("locale") ?? undefined,
      headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
    });
    const messages = getMessages(locale);
    const reportId = url.searchParams.get("reportId")?.trim();
    if (!reportId) {
      return NextResponse.json({ error: messages.errors.reportIdRequired }, { status: 400 });
    }
    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();
    const { userId } = await auth();
    const access = await assertOwnedReportAccess(supabase, reportId, userId, locale);
    if (access.error) return access.error;

    const rows = await readPersonalDeepRows(supabase, reportId);
    if (!rows) {
      return NextResponse.json({ error: messages.errors.analysisFailed }, { status: 503 });
    }
    const view = decidePersonalDeepView({ locale, ...rows });
    const headers = { "Cache-Control": "no-store" };
    if (view.state === "not_generated" || view.state === "legacy_unknown") {
      const inProgress = await isPersonalPremiumGenerationInProgress(supabase, reportId, locale);
      if (inProgress) {
        return NextResponse.json({ ok: true, locale, state: "in_progress", otherLocales: view.otherLocales }, { headers });
      }
    }
    return NextResponse.json({ ok: true, locale, ...view }, { headers });
  } catch (e) {
    logServerError("v2/deep/essence:get", e, "internal_error");
    return NextResponse.json({ error: "request failed" }, { status: 500 });
  }
}

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

    // Generation only from the explicit button (see GET for viewing).
    if (body.confirmGenerate !== true) {
      return NextResponse.json(
        { error: messages.errors.analysisFailed, code: "confirm_required" },
        { status: 400 },
      );
    }
    const regenerate = body.regenerate === true || body.forceRegenerate === true;

    // Read-before-generate: a saved report for THIS language is returned as-is
    // with no charge (re-open, refresh, a second click after the first
    // finished). Only an explicit, confirmed regenerate replaces it, and the
    // previous copy is archived (save_personal_deep_analysis).
    const rows = await readPersonalDeepRows(supabase, reportId);
    if (!rows) {
      return NextResponse.json({ error: messages.errors.analysisFailed }, { status: 503 });
    }
    const first = decidePersonalDeepPost(decidePersonalDeepView({ locale, ...rows }), { regenerate });
    if (!first.generate) {
      return NextResponse.json({ ok: true, locale, state: "ready", generated: false, slim_v1: first.slim_v1 });
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
      // A request that finished between our read and taking the lock already
      // saved this language's report: return it, no second generation/charge.
      if (!regenerate) {
        const again = await readPersonalDeepRows(supabase, reportId);
        const recheck = again ? decidePersonalDeepPost(decidePersonalDeepView({ locale, ...again }), { regenerate: false }) : null;
        if (recheck && !recheck.generate) {
          return NextResponse.json({ ok: true, locale, state: "ready", generated: false, slim_v1: recheck.slim_v1 });
        }
      }

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
          savePersonalDeepAnalysis(supabase, {
            reportId,
            locale,
            content: JSON.stringify({ locale, slim_v1 }),
            metadata: { locale, has_survey: Boolean(body.surveyAnswers || body.currentSelfProfile) },
            reason: first.reason,
          }),
        consumeCredit: () => consumeCredit(supabase, generationRequestId),
        releaseCredit: () => releaseCredit(supabase, generationRequestId),
        log: (tag, error, code) => logServerError(tag, error, code),
      });

      if (outcome.kind === "ok") {
        return NextResponse.json({ ok: true, locale, state: "ready", generated: true, slim_v1: outcome.slim_v1 });
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
