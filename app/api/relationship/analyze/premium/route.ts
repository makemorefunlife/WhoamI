import { buildAstrologyApiRequestFromReport } from "@/lib/report/buildAstrologyApiRequest";
import { fetchReportWithBirthCoords } from "@/lib/report/fetchReportWithBirthCoords";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getPatternSummaryForReport } from "@/lib/relationship/surveyPatterns";
import { buildRelationshipPremiumPrompt } from "@/lib/prompts/relationshipPremium";
import { runRomanticSajuDeepAnalysis } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import { parseJsonObject } from "@/lib/relationship/parseLlmJson";
import { normalizeRelationshipPerspectives } from "@/lib/relationship/normalizeRelationshipPerspectives";
import { insertRelationshipAnalysisLog } from "@/lib/relationship/analysisLog";
import {
  hasPremiumCacheForKind,
  parseRelationshipKind,
  type ResultPremiumByKind,
} from "@/lib/relationship/relationshipKind";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import {
  fetchRelationshipReportByIdSafe,
  updateRelationshipReportSafe,
} from "@/lib/relationship/relationshipReportQuery";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { getAppOrigin } from "@/lib/relationship/appOrigin";
import {
  loadSajuBundleFromReport,
  type SajuChartProvenance,
} from "@/lib/saju/loadSajuBundleFromReport";
import { resolveBirthTimeForCharts } from "@/lib/v2/onboarding/resolveBirthChartInput";

export const runtime = "nodejs";
export const maxDuration = 300;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function sajuBriefFromProvenance(p: SajuChartProvenance): string {
  return [
    `팔자: ${p.pillars.year} ${p.pillars.month} ${p.pillars.day} ${p.pillars.hour}`,
    `일간: ${p.dayStemKor}(${p.dayStemMetaphor})`,
    p.birthTimeUnknown ? "출생시간 미상→12:00 시주" : `출생시각 ${p.chartTime}`,
  ].join(" | ");
}

function loadSajuForReport(report: {
  birth_date: string | null;
  birth_time: string | null;
}): {
  sajuJson: SajuDataForIntegrated;
  provenance: SajuChartProvenance;
} | null {
  return loadSajuBundleFromReport({
    birth_date: report.birth_date,
    birth_time: report.birth_time,
  });
}

function chartBirthTime(report: {
  birth_date: string | null;
  birth_time: string | null;
}): string {
  return resolveBirthTimeForCharts({
    birthTime: report.birth_time,
    birthTimeUnknown: !report.birth_time?.trim(),
  }).chartTime;
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

async function fetchAstroJson(
  origin: string,
  report: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  if (!report.birth_date) return null;
  let body: ReturnType<typeof buildAstrologyApiRequestFromReport>["body"];
  try {
    ({ body } = buildAstrologyApiRequestFromReport(report));
  } catch {
    return null;
  }
  const res = await fetch(`${origin}/api/astrology`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
    const viewerReportId =
      typeof body.viewer_report_id === "string"
        ? body.viewer_report_id.trim()
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

    const supabase = createServiceRoleClient(url, serviceKey);

    const { row: rr, error: rrErr } = await fetchRelationshipReportByIdSafe(
      supabase,
      relationshipReportId,
    );

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

    const byKind = (rr.result_premium_by_kind ?? {}) as ResultPremiumByKind;
    const kind = parseRelationshipKind(
      (body as { relationship_kind?: unknown }).relationship_kind,
      parseRelationshipKind(rr.relationship_kind),
    );
    const forceRegenerate =
      (body as { force_regenerate?: unknown }).force_regenerate === true;

    if (
      !forceRegenerate &&
      hasPremiumCacheForKind(byKind, rr.result_premium, kind)
    ) {
      const cached = byKind[kind] ?? rr.result_premium;
      return NextResponse.json({
        relationship_kind: kind,
        result_premium: cached,
      });
    }

    const fetchA = await fetchReportWithBirthCoords(
      supabase,
      rr.report_id_a,
      "payment_status",
    );
    const fetchB = await fetchReportWithBirthCoords(
      supabase,
      rr.report_id_b,
      "payment_status",
    );

    const repA = fetchA.report;
    const repB = fetchB.report;

    if (fetchA.error || fetchB.error || !repA || !repB) {
      return NextResponse.json(
        { error: "양쪽 리포트 정보를 불러오지 못했습니다." },
        { status: 400 },
      );
    }

    const birthOkRomantic = (r: typeof repA) =>
      Boolean(r.birth_date?.trim() && r.birth_place?.trim());

    const birthOkPremium = (r: typeof repA) =>
      Boolean(r.birth_date && r.birth_time && r.birth_place?.trim());

    if (kind === "romantic") {
      if (!birthOkRomantic(repA) || !birthOkRomantic(repB)) {
        return NextResponse.json(
          {
            error:
              "양쪽 모두 생년월일·출생지가 있어야 연인 심화 분석이 가능합니다.",
          },
          { status: 400 },
        );
      }
    } else if (!birthOkPremium(repA) || !birthOkPremium(repB)) {
      return NextResponse.json(
        {
          error:
            "양쪽 모두 생년월일·시간·출생지가 있어야 심화 관계 분석이 가능합니다.",
        },
        { status: 400 },
      );
    }

    const labelA = String(repA.name ?? "").trim() || "첫 번째 사람";
    const labelB = String(repB.name ?? "").trim() || "두 번째 사람";

    const origin = getAppOrigin();

    if (kind === "romantic") {
      const loadedA = loadSajuForReport({
        birth_date: String(repA.birth_date ?? ""),
        birth_time:
          repA.birth_time != null ? String(repA.birth_time) : null,
      });
      const loadedB = loadSajuForReport({
        birth_date: String(repB.birth_date ?? ""),
        birth_time:
          repB.birth_time != null ? String(repB.birth_time) : null,
      });
      if (!loadedA || !loadedB) {
        return NextResponse.json(
          { error: "사주 계산에 실패해 연인 심화 분석을 할 수 없습니다." },
          { status: 400 },
        );
      }

      const romanticPayload = await runRomanticSajuDeepAnalysis(openai, {
        nicknameA: labelA,
        nicknameB: labelB,
        birthA: {
          date: String(repA.birth_date ?? ""),
          time: chartBirthTime({
            birth_date: String(repA.birth_date ?? ""),
            birth_time:
              repA.birth_time != null ? String(repA.birth_time) : null,
          }),
          place: String(repA.birth_place ?? "").trim(),
        },
        birthB: {
          date: String(repB.birth_date ?? ""),
          time: chartBirthTime({
            birth_date: String(repB.birth_date ?? ""),
            birth_time:
              repB.birth_time != null ? String(repB.birth_time) : null,
          }),
          place: String(repB.birth_place ?? "").trim(),
        },
        sajuJsonA: loadedA.sajuJson,
        sajuJsonB: loadedB.sajuJson,
        sajuProvenanceA: loadedA.provenance,
        sajuProvenanceB: loadedB.provenance,
      });

      const nextByKind: ResultPremiumByKind = {
        ...byKind,
        romantic: romanticPayload,
      };

      const { error: upErr } = await updateRelationshipReportSafe(
        supabase,
        relationshipReportId,
        {
          result_premium_by_kind: nextByKind,
          relationship_kind: kind,
        },
        { result_premium: romanticPayload },
      );

      if (upErr) {
        console.error("relationship/analyze/premium romantic update:", upErr);
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }

      if (viewerReportId) {
        await insertRelationshipAnalysisLog(supabase, {
          relationshipReportId,
          viewerReportId,
          relationshipKind: kind,
          analysisLevel: "premium",
          resultFormat: ROMANTIC_SAJU_DEEP_FORMAT,
          payload: romanticPayload,
        });
      }

      return NextResponse.json({
        relationship_kind: kind,
        result_premium: romanticPayload,
      });
    }

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

    const loadedA = loadSajuForReport({
      birth_date: String(repA.birth_date ?? ""),
      birth_time: repA.birth_time != null ? String(repA.birth_time) : null,
    });
    const loadedB = loadSajuForReport({
      birth_date: String(repB.birth_date ?? ""),
      birth_time: repB.birth_time != null ? String(repB.birth_time) : null,
    });
    const [astroA, astroB] = await Promise.all([
      fetchAstroJson(origin, repA),
      fetchAstroJson(origin, repB),
    ]);

    const sajuTextA = loadedA
      ? sajuBriefFromProvenance(loadedA.provenance)
      : "(사주 계산 없음)";
    const sajuTextB = loadedB
      ? sajuBriefFromProvenance(loadedB.provenance)
      : "(사주 계산 없음)";
    const astroTextA = astroBrief(astroA);
    const astroTextB = astroBrief(astroB);

    const userPrompt = buildRelationshipPremiumPrompt({
      kind: kind,
      myPatternsBlock: blockA,
      partnerPatternsBlock: blockB,
      nicknameA: labelA,
      nicknameB: labelB,
      reportIdA: rr.report_id_a,
      reportIdB: rr.report_id_b,
      mySaju: `[${rr.report_id_a}] ${sajuTextA}`,
      partnerSaju: `[${rr.report_id_b}] ${sajuTextB}`,
      myAstrology: `[${rr.report_id_a}] ${astroTextA}`,
      partnerAstrology: `[${rr.report_id_b}] ${astroTextB}`,
    });

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
    const nextByKind: ResultPremiumByKind = {
      ...byKind,
      [kind]: payload,
    };

    const { error: upErr } = await updateRelationshipReportSafe(
      supabase,
      relationshipReportId,
      {
        result_premium_by_kind: nextByKind,
        relationship_kind: kind,
        ...(kind === "friendship" ? { result_premium: payload } : {}),
      },
      { result_premium: payload },
    );

    if (upErr) {
      console.error("relationship/analyze/premium update:", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    if (viewerReportId) {
      await insertRelationshipAnalysisLog(supabase, {
        relationshipReportId,
        viewerReportId,
        relationshipKind: kind,
        analysisLevel: "premium",
        resultFormat: "relationship_4axis_premium_v1",
        payload,
      });
    }

    return NextResponse.json({
      relationship_kind: kind,
      result_premium: payload,
    });
  } catch (e) {
    console.error("relationship/analyze/premium:", e);
    return NextResponse.json(
      { error: "관계 심화 분석 실패" },
      { status: 500 },
    );
  }
}
