import { NextResponse } from "next/server";
import { logServerError } from "@/lib/security/safeLog";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
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
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { polishKoStringTree } from "@/lib/i18n/koToneGuards";
import { polishEnStringTree } from "@/lib/i18n/enToneGuards";
import { resolveViewerDisplayName } from "@/lib/relationship/viewerFirstDisplay";
import { assertOwnedViewerParticipantAccess } from "@/lib/report/assertOwnedReportAccess";
import { enforceRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 120;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

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
    );
    const locale = resolveRequestLocale({
      bodyLanguage:
        (body as { language?: unknown }).language ??
        (body as { locale?: unknown }).locale,
      headerLanguage:
        req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
    });

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json(
        { error: "relationship_report_id와 viewer_report_id가 필요합니다." },
        { status: 400 },
      );
    }

    const limited = enforceRateLimit("relationship_basic", userId);
    if (!limited.ok) {
      return NextResponse.json(
        { error: limited.error },
        {
          status: limited.status,
          headers: limited.retryAfterSec
            ? { "Retry-After": String(limited.retryAfterSec) }
            : undefined,
        },
      );
    }

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { data: rr, error: rrErr } = await supabase
      .from("relationship_reports")
      .select("id, report_id_a, report_id_b, result_basic")
      .eq("id", relationshipReportId)
      .maybeSingle();

    if (rrErr) {
      console.info("[relationship/analyze/basic] relationship_lookup_failed");
      return NextResponse.json(
        { error: "관계 기본 분석을 처리할 수 없습니다." },
        { status: 503 },
      );
    }
    if (!rr?.id) {
      return NextResponse.json(
        { error: "관계 분석을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const accessGuard = await assertOwnedViewerParticipantAccess(
      supabase,
      userId,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
    );
    if (accessGuard) return accessGuard;

    const clerkUser = await currentUser();

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

    const labelA = resolveViewerDisplayName({
      reportName: repA?.name,
      clerkFirstName:
        viewerReportId === rr.report_id_a ? clerkUser?.firstName : undefined,
      clerkFullName:
        viewerReportId === rr.report_id_a ? clerkUser?.fullName : undefined,
      fallback:
        viewerReportId === rr.report_id_a ? "나" : "첫 번째 사람",
    });
    const labelB = resolveViewerDisplayName({
      reportName: repB?.name,
      clerkFirstName:
        viewerReportId === rr.report_id_b ? clerkUser?.firstName : undefined,
      clerkFullName:
        viewerReportId === rr.report_id_b ? clerkUser?.fullName : undefined,
      fallback:
        viewerReportId === rr.report_id_b ? "나" : "두 번째 사람",
    });

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
          const migratedWithLocale = { ...migrated, locale };
          const { error: migErr } = await supabase
            .from("relationship_reports")
            .update({
              result_basic: migratedWithLocale as unknown as Record<string, unknown>,
              updated_at: new Date().toISOString(),
            })
            .eq("id", relationshipReportId);
          if (!migErr) {
            return NextResponse.json({ result_basic: migratedWithLocale });
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
        const patchedWithLocale = { ...patched, locale };
        const { error: fixErr } = await supabase
          .from("relationship_reports")
          .update({
            result_basic: patchedWithLocale as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          })
          .eq("id", relationshipReportId);
        if (!fixErr) {
          return NextResponse.json({ result_basic: patchedWithLocale });
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
      locale,
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Output one valid JSON object only. No markdown or code fences. Follow the user prompt locale instruction for prose language.",
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

    const toned =
      locale === "ko-KR"
        ? polishKoStringTree(normalized)
        : polishEnStringTree(normalized);
    const payload = { ...toned, locale };

    const { error: upErr } = await supabase
      .from("relationship_reports")
      .update({
        result_basic: payload as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", relationshipReportId);

    if (upErr) {
      console.error("relationship/analyze/basic update failed");
      return NextResponse.json(
        { error: "관계 기본 분석을 처리할 수 없습니다." },
        { status: 503 },
      );
    }

    await insertRelationshipAnalysisLog(supabase, {
      relationshipReportId,
      viewerReportId,
      relationshipKind,
      analysisLevel: "basic",
      resultFormat: "relationship_4axis_v1",
      payload,
    });

    return NextResponse.json({ result_basic: payload });
  } catch (e) {
    logServerError("relationship/analyze/basic:", e, "internal_error");
    return NextResponse.json(
      { error: "관계 기본 분석 실패" },
      { status: 500 },
    );
  }
}
