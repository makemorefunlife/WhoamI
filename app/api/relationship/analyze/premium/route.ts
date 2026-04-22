import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { getPatternSummaryForReport } from "@/lib/relationship/surveyPatterns";
import {
  buildRelationshipBasicPrompt,
  buildRelationshipPremiumExtraBlock,
} from "@/lib/prompts/relationshipAnalysis";
import { parseJsonObject } from "@/lib/relationship/parseLlmJson";
import { normalizeRelationshipPerspectives } from "@/lib/relationship/normalizeRelationshipPerspectives";
import { getAppOrigin } from "@/lib/relationship/appOrigin";

export const runtime = "nodejs";
export const maxDuration = 300;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function sajuBrief(j: Record<string, unknown> | null): string {
  if (!j?.saju) return "(사주 계산 없음)";
  const s = j.saju as Record<string, string>;
  const parts = [
    `팔자: ${s.yearPillar} ${s.monthPillar} ${s.dayPillar} ${s.hourPillar}`,
    (j.dayStemData as { metaphor_ko?: string } | undefined)?.metaphor_ko,
    (j.dayBranchData as { meaning_ko?: string } | undefined)?.meaning_ko,
  ].filter(Boolean);
  return parts.join(" | ").slice(0, 4500);
}

function astroBrief(j: Record<string, unknown> | null): string {
  if (!j) return "(점성 없음)";
  if (typeof j.interpretation === "string" && j.interpretation.trim()) {
    return j.interpretation.trim().slice(0, 3500);
  }
  const raw = j.raw as { sun?: string; moon?: string; rising?: string } | undefined;
  if (raw) {
    return `태양·달·상승 톤: ${raw.sun ?? ""}, ${raw.moon ?? ""}, ${raw.rising ?? ""}`;
  }
  return "(점성 데이터 없음)";
}

async function fetchSajuJson(
  origin: string,
  report: {
    birth_date: string | null;
    birth_time: string | null;
    birth_place: string | null;
  },
): Promise<Record<string, unknown> | null> {
  if (!report.birth_date || !report.birth_time) return null;
  const res = await fetch(`${origin}/api/saju`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      birthDate: report.birth_date,
      birthTime: report.birth_time,
      birthPlace: report.birth_place ?? "",
    }),
  });
  if (!res.ok) return null;
  return (await res.json()) as Record<string, unknown>;
}

async function fetchAstroJson(
  origin: string,
  report: {
    birth_date: string | null;
    birth_time: string | null;
    birth_place: string | null;
  },
): Promise<Record<string, unknown> | null> {
  if (!report.birth_date) return null;
  const d = new Date(report.birth_date);
  const [hh, mm] = String(report.birth_time ?? "12:0").split(":");
  const res = await fetch(`${origin}/api/astrology`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: Number.parseInt(hh ?? "12", 10) || 12,
      minute: Number.parseInt(mm ?? "0", 10) || 0,
      latitude: 37.5665,
      longitude: 126.978,
      timezone: 9,
      birthPlace: report.birth_place ?? "",
    }),
  });
  if (!res.ok) return null;
  return (await res.json()) as Record<string, unknown>;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const relationshipReportId =
      typeof body.relationship_report_id === "string"
        ? body.relationship_report_id.trim()
        : "";

    if (!relationshipReportId) {
      return NextResponse.json(
        { error: "relationship_report_id가 필요합니다." },
        { status: 400 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "서버 설정이 필요합니다." },
        { status: 500 },
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: rr, error: rrErr } = await supabase
      .from("relationship_reports")
      .select(
        "id, report_id_a, report_id_b, analysis_type, result_basic, result_premium",
      )
      .eq("id", relationshipReportId)
      .maybeSingle();

    if (rrErr || !rr) {
      return NextResponse.json(
        { error: "관계 분석을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (rr.analysis_type !== "premium") {
      return NextResponse.json(
        {
          error:
            "심화 분석은 결제·업그레이드 후에 실행할 수 있습니다.",
        },
        { status: 403 },
      );
    }

    if (rr.result_premium && (rr.result_premium as { perspectives?: unknown }).perspectives) {
      return NextResponse.json({ result_premium: rr.result_premium });
    }

    const { data: repA, error: eA } = await supabase
      .from("reports")
      .select("id, name, birth_date, birth_time, birth_place, payment_status")
      .eq("id", rr.report_id_a)
      .maybeSingle();

    const { data: repB, error: eB } = await supabase
      .from("reports")
      .select("id, name, birth_date, birth_time, birth_place, payment_status")
      .eq("id", rr.report_id_b)
      .maybeSingle();

    if (eA || eB || !repA || !repB) {
      return NextResponse.json(
        { error: "양쪽 리포트 정보를 불러오지 못했습니다." },
        { status: 400 },
      );
    }

    const birthOk = (r: typeof repA) =>
      Boolean(r.birth_date && r.birth_time && r.birth_place?.trim());

    if (!birthOk(repA) || !birthOk(repB)) {
      return NextResponse.json(
        {
          error:
            "양쪽 모두 생년월일·시간·출생지가 있어야 심화 관계 분석이 가능합니다.",
        },
        { status: 400 },
      );
    }

    const labelA = repA.name?.trim() || "첫 번째 사람";
    const labelB = repB.name?.trim() || "두 번째 사람";

    const [blockA, blockB] = await Promise.all([
      getPatternSummaryForReport(supabase, rr.report_id_a),
      getPatternSummaryForReport(supabase, rr.report_id_b),
    ]);

    if (!blockA || !blockB) {
      return NextResponse.json(
        { error: "설문 패턴이 없어 심화 분석을 할 수 없습니다." },
        { status: 400 },
      );
    }

    const origin = getAppOrigin();

    const [sajuJsonA, sajuJsonB, astroA, astroB] = await Promise.all([
      fetchSajuJson(origin, repA),
      fetchSajuJson(origin, repB),
      fetchAstroJson(origin, repA),
      fetchAstroJson(origin, repB),
    ]);

    const sajuTextA = sajuBrief(sajuJsonA);
    const sajuTextB = sajuBrief(sajuJsonB);
    const astroTextA = astroBrief(astroA);
    const astroTextB = astroBrief(astroB);

    const premiumBlob = buildRelationshipPremiumExtraBlock(
      `[${rr.report_id_a}] ${sajuTextA}`,
      `[${rr.report_id_b}] ${sajuTextB}`,
      `[${rr.report_id_a}] ${astroTextA}`,
      `[${rr.report_id_b}] ${astroTextB}`,
    );

    const basePrompt = buildRelationshipBasicPrompt(
      blockA,
      blockB,
      labelA,
      labelB,
      rr.report_id_a,
      rr.report_id_b,
    );

    const userPrompt = `${basePrompt}

${premiumBlob}

## 심화 규칙
- 각 축의 insights 두 줄은 필요하면 각각 2~3문장까지 확장 가능 ("~다" 종결 금지).
- actions 두 줄은 여전히 **당장 할 수 있는 구체 행동**만.
- 사주·출생 맥락은 일상 문장으로만 녹이고, 직접 인용체는 쓰지 않기.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "출력은 유효한 JSON 한 덩어리만. 한국어. markdown·코드펜스 금지.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.55,
      max_tokens: 6000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message.content?.trim() ?? "";
    const parsed = parseJsonObject<{ perspectives?: Record<string, unknown> }>(
      raw,
    );
    if (!parsed.perspectives) {
      return NextResponse.json(
        { error: "LLM 응답 형식이 올바르지 않습니다." },
        { status: 502 },
      );
    }

    const normalized = normalizeRelationshipPerspectives(
      parsed,
      rr.report_id_a,
      rr.report_id_b,
      labelA,
      labelB,
    );
    if (!normalized) {
      return NextResponse.json(
        { error: "LLM이 두 사람 시점 데이터를 만들지 못했습니다." },
        { status: 502 },
      );
    }

    const payload = normalized;

    const { error: upErr } = await supabase
      .from("relationship_reports")
      .update({
        result_premium: payload as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", relationshipReportId);

    if (upErr) {
      console.error("relationship/analyze/premium update:", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ result_premium: payload });
  } catch (e) {
    console.error("relationship/analyze/premium:", e);
    return NextResponse.json(
      { error: "관계 심화 분석 실패" },
      { status: 500 },
    );
  }
}
