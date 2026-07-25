import { auth } from "@clerk/nextjs/server";
import { logServerError, logServerEvent, maskId } from "@/lib/security/safeLog";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { assertGuestOrOwnerReportAccess } from "@/lib/report/assertGuestOrOwnerReportAccess";
import {
  deleteReportAnalysis,
  readPersistedAnalysesBatch,
  readPersistedAstrologyAnalysisWithMeta,
  readPersistedDetailedSurveyAnalysis,
  readPersistedIntegratedAnalysis,
  writePersistedBasicAnalysis,
  writePersistedAstrologyAnalysis,
  writePersistedDetailedSurveyAnalysis,
  writePersistedIntegratedAnalysis,
} from "@/lib/report/reportAnalyses";
import { writePremiumAccessCache } from "@/lib/report/premiumAccessCache";
import { logAstrologyCache } from "@/lib/report/astrologyCoordLog";
import { decidePersistedAstrologyReuse } from "@/lib/report/astrologyCacheValidation";
import { fetchReportWithBirthCoords } from "@/lib/report/fetchReportWithBirthCoords";
import { isReportPremium } from "@/lib/report/isReportPremium";
import { astrologyLocationFingerprint } from "@/lib/report/resolveAstrologyCoordinates";
import { syncReportBirthCoordinates } from "@/lib/report/syncReportBirthCoordinates";
import { buildSurveyOnlyUserInputForReport } from "@/lib/report/surveyForLlmFromReportId";
import { isV2SurveyCompleteForReport } from "@/lib/v2/survey/dbCompletion";
import type { Locale } from "@/lib/i18n/locale";
import {
  buildLlmOutputLocaleInstruction,
  resolveRequestLocale,
} from "@/lib/i18n/llmLocale";
import { polishKoTone } from "@/lib/i18n/koToneGuards";

export const runtime = "nodejs";
export const maxDuration = 120;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

/** Free-mode LLM — compact essay tone (paired with /api/llm) */
async function runFreeAnalysis(
  userInput: string,
  locale: Locale,
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const hookTemplates = [
    "You can take this lightly — but it often lands more accurately than expected.",
    "Even if you start casually, the read tends to explain you surprisingly well.",
  ];
  const randomHook =
    hookTemplates[Math.floor(Math.random() * hookTemplates.length)];

  const prompt = `
${randomHook}

You are an analyst who reads people accurately and names patterns so the reader gets it immediately.
Write like a close friend — short and clear.

[Length]
- Four short paragraphs: about 2–4 sentences each.
- Casual spoken endings; avoid stiff formal report closures.

[Format]
- No list markers. Paragraphs only. One blank line between the four paragraphs.
- No asterisks (**) or markdown emphasis — plain text only.

[Input data]
${userInput}
`;

  const system = `You are an analyst who reads people accurately. Write short, easy sentences like a friend. No bullets or list formatting. No asterisks or markdown emphasis.

${buildLlmOutputLocaleInstruction(locale)}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: system,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.55,
    max_tokens: 2500,
  });

  const text = completion.choices[0]?.message.content?.trim();
  if (!text) return null;
  return locale === "ko-KR" ? polishKoTone(text).text : text;
}

/**
 * GET ?reportId=uuid&quick=1&regenerate=1
 * - DB(report_analyses.basic) 우선, 없을 때만 LLM 1회 생성 후 저장
 * - quick=1: LLM 호출 없음 (DB/legacy 캐시만)
 * - regenerate=1: basic 행 삭제 후 재생성 (full 요청 시만)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reportId = url.searchParams.get("reportId")?.trim();
    const quick = url.searchParams.get("quick") === "1";
    const regenerate = url.searchParams.get("regenerate") === "1";
    const regenerateIntegrated =
      url.searchParams.get("regenerateIntegrated") === "1";
    const locale = resolveRequestLocale({
      bodyLanguage: url.searchParams.get("language") ?? url.searchParams.get("locale"),
      headerLanguage: req.headers.get("x-aha-locale"),
    });

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 필요합니다." },
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

    const {
      report,
      error: repErr,
      birthCoordColumnsAvailable,
    } = await fetchReportWithBirthCoords(supabase, reportId);

    if (repErr || !report) {
      return NextResponse.json(
        { error: "리포트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const has_premium = isReportPremium(report);
    writePremiumAccessCache(reportId, has_premium);

    const [has_survey, analysesBundle] = await Promise.all([
      isV2SurveyCompleteForReport(supabase, reportId),
      has_premium
        ? readPersistedAnalysesBatch(supabase, reportId)
        : Promise.resolve({
            basic: null,
            integrated: null,
            detailed_survey: null,
            astrology: { content: null, metadata: null },
          }),
    ]);

    let basic_result: string | null = null;
    let basic_error: string | null = null;
    let basic_from_db = false;
    let premium_result: string | null = null;
    let integrated_from_db = false;
    let detailed_survey_result: string | null = null;
    let detailed_survey_from_db = false;
    let astrology_result: string | null = null;
    let astrology_from_db = false;
    let astrology_location_key: string | null = null;

    if (
      quick &&
      has_premium &&
      birthCoordColumnsAvailable &&
      report.birth_place?.trim()
    ) {
      const latMissing =
        report.birth_latitude == null || report.birth_longitude == null;
      if (latMissing) {
        const syncResult = await syncReportBirthCoordinates(
          supabase,
          reportId,
          report.birth_place,
        );
        if (syncResult === "synced") {
          const { data: refreshed } = await supabase
            .from("reports")
            .select("birth_latitude, birth_longitude, birth_timezone")
            .eq("id", reportId)
            .maybeSingle();
          if (refreshed) {
            Object.assign(report, refreshed);
          }
          logServerEvent("my/report", "coords_backfill_synced", {
            reportId: maskId(reportId),
          });
        }
      }
    }

    astrology_location_key = astrologyLocationFingerprint({
      birth_place: report.birth_place,
      birth_latitude: report.birth_latitude,
      birth_longitude: report.birth_longitude,
      birth_timezone: report.birth_timezone,
    });

    if (has_survey) {
      if (regenerate) {
        await deleteReportAnalysis(supabase, reportId, "basic");
      }

      basic_result = regenerate
        ? null
        : analysesBundle.basic;
      if (basic_result) {
        basic_from_db = true;
      }

      if (!basic_result && !quick) {
        if (!process.env.OPENAI_API_KEY) {
          basic_error = "missing_openai_key";
        } else {
          const userInput = await buildSurveyOnlyUserInputForReport(
            supabase,
            reportId,
          );
          if (userInput) {
            basic_result = await runFreeAnalysis(userInput, locale);
            if (basic_result) {
              const saved = await writePersistedBasicAnalysis(
                supabase,
                reportId,
                basic_result,
                { model: "gpt-4o-mini", source: "my_report_get" },
              );
              if (!saved) {
                logServerError("my/report", undefined, "basic_save_failed");
              }
            } else {
              basic_error = "generation_failed";
            }
          } else {
            basic_error = "survey_input_missing";
          }
        }
      }
    }

    if (has_premium) {
      if (regenerateIntegrated) {
        await deleteReportAnalysis(supabase, reportId, "integrated");
        await deleteReportAnalysis(supabase, reportId, "detailed_survey");
        premium_result = null;
        detailed_survey_result = null;
        logServerEvent("my/report", "premium_cleared_for_regen", {
          reportId: maskId(reportId),
        });
      } else {
        premium_result = analysesBundle.integrated;
        if (premium_result) {
          integrated_from_db = true;
          logServerEvent("my/report", "integrated_from_db", {
            reportId: maskId(reportId),
          });
        }
        detailed_survey_result = analysesBundle.detailed_survey;
        if (detailed_survey_result) {
          detailed_survey_from_db = true;
        }
      }

      const persistedAstro = analysesBundle.astrology;
      const storedFp =
        typeof persistedAstro.metadata?.location_fingerprint === "string"
          ? persistedAstro.metadata.location_fingerprint
          : null;

      if (persistedAstro.content) {
        const reuseDecision = decidePersistedAstrologyReuse(
          storedFp,
          astrology_location_key,
        );

        if (reuseDecision.action === "reuse") {
          astrology_result = persistedAstro.content;
          astrology_from_db = true;
          logAstrologyCache(reportId, "astrology_reused");
        } else if (reuseDecision.action === "invalidate") {
          await deleteReportAnalysis(supabase, reportId, "astrology");
          logAstrologyCache(
            reportId,
            "astrology_invalidated_location",
            `reason=${reuseDecision.reason} stored=${storedFp ?? "none"} current=${astrology_location_key}`,
          );
        }
      }
    }

    return NextResponse.json({
      report_id: report.id,
      name:
        typeof report.name === "string" && report.name.trim()
          ? report.name.trim()
          : "탐사자",
      has_premium,
      has_survey,
      basic_result,
      basic_error,
      basic_from_db,
      basic_pending: has_survey && !basic_result && quick,
      premium_result,
      integrated_from_db,
      detailed_survey_result,
      detailed_survey_from_db,
      astrology_result,
      astrology_from_db,
      astrology_location_key,
      result_paths: {
        blueprint: `/blueprint-preview?reportId=${encodeURIComponent(reportId)}`,
        relationships: `/relationships?myReportId=${encodeURIComponent(reportId)}`,
        decision: `/decision`,
      },
    });
  } catch (e) {
    logServerError("GET /api/my/report:", e, "internal_error");
    return NextResponse.json(
      { error: "request failed" },
      { status: 500 },
    );
  }
}

/**
 * POST { reportId, integrated?, detailedSurvey?, astrology? } — report_analyses 저장
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      reportId?: string;
      integrated?: string;
      detailedSurvey?: string;
      astrology?: string;
      astrologyLocationFingerprint?: string;
    };
    const reportId = body.reportId?.trim();
    const integrated = body.integrated?.trim();
    const detailedSurvey = body.detailedSurvey?.trim();
    const astrology = body.astrology?.trim();
    const astrologyLocationFingerprintValue =
      body.astrologyLocationFingerprint?.trim();

    if (!reportId || (!integrated && !detailedSurvey && !astrology)) {
      return NextResponse.json(
        {
          error:
            "reportId와 integrated, detailedSurvey, astrology 중 하나 이상이 필요합니다.",
        },
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

    const { data: report, error: repErr } = await supabase
      .from("reports")
      .select("id, entitlement")
      .eq("id", reportId)
      .maybeSingle();

    if (repErr || !report) {
      return NextResponse.json(
        { error: "리포트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const has_premium = isReportPremium(report);
    if (!has_premium) {
      return NextResponse.json(
        { error: "심화 리포트는 결제 후 저장할 수 있습니다." },
        { status: 403 },
      );
    }

    if (astrology) {
      const existingAstrology = await readPersistedAstrologyAnalysisWithMeta(
        supabase,
        reportId,
      );
      const savedAstrology = await writePersistedAstrologyAnalysis(
        supabase,
        reportId,
        astrology,
        {
          source: "premium_pipeline",
          ...(astrologyLocationFingerprintValue
            ? { location_fingerprint: astrologyLocationFingerprintValue }
            : {}),
        },
      );
      if (!savedAstrology) {
        return NextResponse.json(
          { error: "astrology 저장에 실패했습니다." },
          { status: 500 },
        );
      }
      logServerEvent("my/report", "astrology_saved", {
        reportId: maskId(reportId),
      });
    }

    if (detailedSurvey) {
      const existingDetailed = await readPersistedDetailedSurveyAnalysis(
        supabase,
        reportId,
      );
      const savedDetailed = await writePersistedDetailedSurveyAnalysis(
        supabase,
        reportId,
        detailedSurvey,
        { source: "premium_pipeline" },
      );
      if (!savedDetailed) {
        return NextResponse.json(
          { error: "detailed_survey 저장에 실패했습니다." },
          { status: 500 },
        );
      }
      logServerEvent("my/report", "detailed_survey_saved", {
        reportId: maskId(reportId),
      });
    }

    if (integrated) {
      const existing = await readPersistedIntegratedAnalysis(supabase, reportId);
      const saved = await writePersistedIntegratedAnalysis(
        supabase,
        reportId,
        integrated,
        { source: "premium_pipeline" },
      );

      if (!saved) {
        return NextResponse.json(
          { error: "integrated 저장에 실패했습니다." },
          { status: 500 },
        );
      }
      logServerEvent("my/report", "integrated_saved", {
        reportId: maskId(reportId),
      });
    }

    return NextResponse.json({ ok: true, report_id: reportId });
  } catch (e) {
    logServerError("POST /api/my/report:", e, "internal_error");
    return NextResponse.json(
      { error: "request failed" },
      { status: 500 },
    );
  }
}
