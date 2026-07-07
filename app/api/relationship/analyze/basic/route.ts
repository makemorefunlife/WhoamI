import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  buildFallbackPatternSummary,
  getPatternSummaryForReport,
  getSurveyAnswersForReport,
} from "@/lib/relationship/surveyPatterns";
import { buildRelationshipBasicPrompt } from "@/lib/prompts/relationshipAnalysis";
import { parseJsonObject } from "@/lib/relationship/parseLlmJson";
import { formatResultBasicForIntegratedContext } from "@/lib/relationship/formatResultBasicForIntegratedContext";
import {
  hasCompletePerspectives,
  normalizeRelationshipPerspectives,
  perspectiveHasLegacyAxes,
} from "@/lib/relationship/normalizeRelationshipPerspectives";
import { insertRelationshipAnalysisLog } from "@/lib/relationship/analysisLog";
import { parseRelationshipKind } from "@/lib/relationship/relationshipKind";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const runtime = "nodejs";
export const maxDuration = 120;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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
    const relationshipKind = parseRelationshipKind(
      (body as { relationship_kind?: unknown }).relationship_kind,
      "unspecified",
    );

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

    const { data: rr, error: rrErr } = await supabase
      .from("relationship_reports")
      .select("id, report_id_a, report_id_b, result_basic")
      .eq("id", relationshipReportId)
      .maybeSingle();

    if (rrErr || !rr) {
      return NextResponse.json(
        { error: "관계 분석을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const [{ data: repA }, { data: repB }] = await Promise.all([
      supabase
        .from("reports")
        .select("id, name")
        .eq("id", rr.report_id_a)
        .maybeSingle(),
      supabase
        .from("reports")
        .select("id, name")
        .eq("id", rr.report_id_b)
        .maybeSingle(),
    ]);

    const labelA = repA?.name?.trim() || "첫 번째 사람";
    const labelB = repB?.name?.trim() || "두 번째 사람";

    const basicComplete = hasCompletePerspectives(
      rr.result_basic,
      rr.report_id_a,
      rr.report_id_b,
    );
    /** 구조상 완전해도 축 텍스트가 비어 통합 리포트에 넣을 수 없는 경우 재생성 */
    const integratesForLlm =
      formatResultBasicForIntegratedContext(
        rr.result_basic,
        rr.report_id_a,
      ) != null ||
      formatResultBasicForIntegratedContext(
        rr.result_basic,
        rr.report_id_b,
      ) != null;

    if (basicComplete && integratesForLlm) {
      const perspectives = (
        rr.result_basic as { perspectives: Record<string, unknown> }
      ).perspectives;
      const sliceA = perspectives[rr.report_id_a];
      const sliceB = perspectives[rr.report_id_b];
      const needsLegacyUpgrade =
        perspectiveHasLegacyAxes(sliceA) ||
        perspectiveHasLegacyAxes(sliceB);

      if (needsLegacyUpgrade) {
        const migrated = normalizeRelationshipPerspectives(
          { perspectives },
          rr.report_id_a,
          rr.report_id_b,
          labelA,
          labelB,
        );
        if (migrated) {
          const { error: migErr } = await supabase
            .from("relationship_reports")
            .update({
              result_basic: migrated as unknown as Record<string, unknown>,
              updated_at: new Date().toISOString(),
            })
            .eq("id", relationshipReportId);
          if (!migErr) {
            return NextResponse.json({ result_basic: migrated });
          }
        }
      }

      return NextResponse.json({ result_basic: rr.result_basic });
    }

    if (
      rr.result_basic &&
      (rr.result_basic as { perspectives?: unknown }).perspectives
    ) {
      const patched = normalizeRelationshipPerspectives(
        {
          perspectives: (rr.result_basic as { perspectives: Record<string, unknown> })
            .perspectives,
        },
        rr.report_id_a,
        rr.report_id_b,
        labelA,
        labelB,
      );
      if (patched) {
        const { error: fixErr } = await supabase
          .from("relationship_reports")
          .update({
            result_basic: patched as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          })
          .eq("id", relationshipReportId);
        if (!fixErr) {
          return NextResponse.json({ result_basic: patched });
        }
      }
    }

    let [blockA, blockB] = await Promise.all([
      getPatternSummaryForReport(supabase, rr.report_id_a),
      getPatternSummaryForReport(supabase, rr.report_id_b),
    ]);

    if (!blockA) {
      const ans = await getSurveyAnswersForReport(supabase, rr.report_id_a);
      if (ans) blockA = buildFallbackPatternSummary(ans);
    }
    if (!blockB) {
      const ans = await getSurveyAnswersForReport(supabase, rr.report_id_b);
      if (ans) blockB = buildFallbackPatternSummary(ans);
    }

    if (!blockA || !blockB) {
      const missing =
        !blockA && !blockB
          ? `${labelA}, ${labelB} 양쪽`
          : !blockA
            ? `${labelA} 쪽`
            : `${labelB} 쪽`;
      return NextResponse.json(
        {
          error: `${missing} 설문 데이터를 찾지 못했어요. 각자 이 리포트로 설문을 마쳤는지 확인해 주세요.`,
        },
        { status: 400 },
      );
    }

    const userPrompt = buildRelationshipBasicPrompt(
      blockA,
      blockB,
      labelA,
      labelB,
      rr.report_id_a,
      rr.report_id_b,
    );

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
      max_tokens: 4096,
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
        result_basic: payload as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", relationshipReportId);

    if (upErr) {
      console.error("relationship/analyze/basic update:", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    if (viewerReportId) {
      await insertRelationshipAnalysisLog(supabase, {
        relationshipReportId,
        viewerReportId,
        relationshipKind,
        analysisLevel: "basic",
        resultFormat: "relationship_4axis_v1",
        payload,
      });
    }

    return NextResponse.json({ result_basic: payload });
  } catch (e) {
    console.error("relationship/analyze/basic:", e);
    return NextResponse.json(
      { error: "관계 기본 분석 실패" },
      { status: 500 },
    );
  }
}
