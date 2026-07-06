import { auth } from "@clerk/nextjs/server";
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
import { astrologyLocationFingerprint } from "@/lib/report/resolveAstrologyCoordinates";
import { syncReportBirthCoordinates } from "@/lib/report/syncReportBirthCoordinates";
import { buildSurveyOnlyUserInputForReport } from "@/lib/report/surveyForLlmFromReportId";
import { isV2SurveyCompleteForReport } from "@/lib/v2/survey/dbCompletion";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";
export const maxDuration = 120;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

/** 무료 모드 LLM — app/api/llm/route.ts 와 동일 톤의 축약 프롬프트 */
async function runFreeAnalysis(userInput: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const hookTemplates = [
    "이거 그냥 재미로 볼 수 있는데, 생각보다 꽤 정확하게 나온다",
    "이거 가볍게 시작해도 생각보다 설명이 잘 되는 편이다",
  ];
  const randomHook =
    hookTemplates[Math.floor(Math.random() * hookTemplates.length)];

  const prompt = `
${randomHook}

너는 사람을 아주 잘 읽고, 상대가 바로 이해할 말로 짚어주는 분석가야.
친한 친구한테 말하듯, 짧고 또렷하게 말해.

[분량]
- 네 문단 모두 짧게: 문단당 대략 2~4문장.
- 문장 끝은 구어체 (~거야, ~쪽이야, ~느낌이야). "~다" 로만 딱딱하게 끝내지 마.

[형식]
- 리스트 기호 금지. 문단만. 네 문단 사이 빈 줄 하나.
- 별표(**)·마크다운 강조 기호는 출력하지 마라. 평문만.

[입력 데이터]
${userInput}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "너는 사람을 정확하게 읽는 분석가다. 짧고 읽기 쉬운 문장으로, 친구한테 말하듯 써라. 기호나 리스트 형식은 쓰지 마라. 별표나 마크다운 강조는 쓰지 마라.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.55,
    max_tokens: 2500,
  });

  const text = completion.choices[0]?.message.content?.trim();
  return text || null;
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

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 필요합니다." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(supabaseUrl, serviceKey);

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

    const has_premium =
      report.payment_status === "paid" || report.plan_type === "paid";
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
          console.info(
            `[astrology-coords] reportId=${reportId} detail=quick-backfill-synced`,
          );
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
            basic_result = await runFreeAnalysis(userInput);
            if (basic_result) {
              const saved = await writePersistedBasicAnalysis(
                supabase,
                reportId,
                basic_result,
                { model: "gpt-4o-mini", source: "my_report_get" },
              );
              if (!saved) {
                console.warn(
                  "basic analysis generated but DB save failed:",
                  reportId,
                );
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
        console.info(
          `[premium-report] reportId=${reportId} source=regeneration detail=api-integrated-and-detailed-survey-cleared`,
        );
      } else {
        premium_result = analysesBundle.integrated;
        if (premium_result) {
          integrated_from_db = true;
          console.info(
            `[premium-report] reportId=${reportId} source=db detail=api-quick-read-integrated`,
          );
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
      name: report.name?.trim() ?? "탐사자",
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
    console.error("GET /api/my/report:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "조회 실패" },
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(supabaseUrl, serviceKey);

    const { userId } = await auth();
    const access = await assertGuestOrOwnerReportAccess(
      supabase,
      reportId,
      userId,
    );
    if (access.error) return access.error;

    const { data: report, error: repErr } = await supabase
      .from("reports")
      .select("id, payment_status, plan_type")
      .eq("id", reportId)
      .maybeSingle();

    if (repErr || !report) {
      return NextResponse.json(
        { error: "리포트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const has_premium =
      report.payment_status === "paid" || report.plan_type === "paid";
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
      console.info(
        `[premium-report] reportId=${reportId} source=${existingAstrology.content ? "db" : "generation"} detail=api-post-astrology`,
      );
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
      console.info(
        `[premium-report] reportId=${reportId} source=${existingDetailed ? "db" : "generation"} detail=api-post-detailed-survey`,
      );
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
      console.info(
        `[premium-report] reportId=${reportId} source=${existing ? "db" : "generation"} detail=api-post-integrated`,
      );
    }

    return NextResponse.json({ ok: true, report_id: reportId });
  } catch (e) {
    console.error("POST /api/my/report:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "저장 실패" },
      { status: 500 },
    );
  }
}
