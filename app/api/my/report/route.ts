import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildSurveyOnlyUserInputForReport } from "@/lib/report/surveyForLlmFromReportId";
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

[입력 데이터]
${userInput}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "너는 사람을 정확하게 읽는 분석가다. 짧고 읽기 쉬운 문장으로, 친구한테 말하듯 써라. 기호나 리스트 형식은 쓰지 마라.",
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
 * GET ?reportId=uuid&quick=1
 * - quick=1 이면 LLM 호출 없이 메타만 (빠른 로드)
 */
export async function GET(req: Request) {
  try {
    const reportId = new URL(req.url).searchParams.get("reportId")?.trim();
    const quick = new URL(req.url).searchParams.get("quick") === "1";

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 필요합니다." },
        { status: 400 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 Supabase 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createServiceRoleClient(url, serviceKey);

    const { data: report, error: repErr } = await supabase
      .from("reports")
      .select(
        "id, name, payment_status, plan_type, birth_date, birth_time, birth_place",
      )
      .eq("id", reportId)
      .maybeSingle();

    if (repErr || !report) {
      return NextResponse.json(
        { error: "리포트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const { data: surveyRow } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("report_id", reportId)
      .limit(1);

    const has_survey = Boolean(surveyRow && surveyRow.length > 0);
    const has_premium =
      report.payment_status === "paid" || report.plan_type === "paid";

    let basic_result: string | null = null;
    let premium_result: string | null = null;

    if (has_survey && !quick) {
      const userInput = await buildSurveyOnlyUserInputForReport(
        supabase,
        reportId,
      );
      if (userInput) {
        basic_result = await runFreeAnalysis(userInput);
      }
    }

    if (has_premium) {
      premium_result = null;
    }

    return NextResponse.json({
      report_id: report.id,
      name: report.name?.trim() ?? "탐사자",
      has_premium,
      has_survey,
      basic_result,
      premium_result,
      result_paths: {
        basic: `/result?id=${encodeURIComponent(reportId)}&view=basic`,
        full: `/report?id=${encodeURIComponent(reportId)}&view=premium`,
        payment: `/payment?reportId=${encodeURIComponent(reportId)}`,
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
