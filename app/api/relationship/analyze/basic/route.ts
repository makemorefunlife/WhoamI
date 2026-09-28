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
import {
  buildRelationshipBasicPrompt,
  buildRelationshipBasicResponseSchema,
} from "@/lib/prompts/relationshipAnalysis";
import { describePerspectivesShape } from "@/lib/relationship/describePerspectivesShape";
import { getMessages } from "@/lib/i18n/messages";
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
import { resolveRelationshipPairLabels } from "@/lib/relationship/resolveRelationshipPairLabels";
import { assertOwnedViewerParticipantAccess } from "@/lib/report/assertOwnedReportAccess";
import {
  enforceRateLimit,
  rateLimitResponse,
  releaseRateLimitSlot,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 120;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  // Header-based until the body is read; every user-facing error below comes
  // from the i18n message files for the request locale (never hardcoded copy,
  // never internal terms such as "LLM").
  let messages = getMessages(
    resolveRequestLocale({
      bodyLanguage: null,
      headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
    }),
  );
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: messages.errors.unauthorized }, { status: 401 });
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
    messages = getMessages(locale);

    if (!relationshipReportId || !viewerReportId) {
      return NextResponse.json(
        { error: messages.errors.relationshipIdsRequired },
        { status: 400 },
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
        { error: messages.errors.serviceUnavailable },
        { status: 503 },
      );
    }
    if (!rr?.id) {
      return NextResponse.json(
        { error: messages.errors.notFound },
        { status: 404 },
      );
    }

    const accessGuard = await assertOwnedViewerParticipantAccess(
      supabase,
      userId,
      viewerReportId,
      rr.report_id_a,
      rr.report_id_b,
      locale,
    );
    if (accessGuard) return accessGuard;

    const clerkUser = await currentUser();

    const [{ data: repA }, { data: repB }] = await Promise.all([
      supabase
        .from("reports")
        .select("id, name, report_type, clerk_user_id")
        .eq("id", rr.report_id_a)
        .maybeSingle(),
      supabase
        .from("reports")
        .select("id, name, report_type, clerk_user_id")
        .eq("id", rr.report_id_b)
        .maybeSingle(),
    ]);

    // Canonical names (same rule as the report page): the other person's
    // own account nickname is used for a connected partner -- previously
    // only reports.name was read, so every connected partner reached the
    // prompt (and the stored nicknames) as the fallback "Partner".
    const { labelA, labelB } = await resolveRelationshipPairLabels({
      viewerReportId,
      reportIdA: rr.report_id_a,
      reportIdB: rr.report_id_b,
      repA,
      repB,
      viewerClerkUser: clerkUser,
      locale,
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
          locale,
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
        locale,
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
      // code is purely additive -- the human-readable `error` message is
      // unchanged for any existing caller that only reads that field. It
      // lets a caller (useRelationshipDetail's auto-generation effect)
      // distinguish "no survey data yet, nothing to generate" from a real
      // failure, without guessing from the error string. No LLM call is
      // made on this path either way.
      return NextResponse.json(
        {
          error: messages.errors.relationshipSurveyIncomplete,
          code: "survey_incomplete",
        },
        { status: 400 },
      );
    }

    // Consume only when about to call the model (not on cache/validation paths).
    const limited = await enforceRateLimit("relationship_basic", userId);
    if (!limited.ok) {
      return rateLimitResponse(limited);
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

    let completion;
    try {
      completion = await openai.chat.completions.create({
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
        // Structured Outputs: the model must return exactly this shape --
        // both perspective keys, all four axes, every field and type. With
        // plain json_object the model could return valid JSON of the wrong
        // shape, which normalizeRelationshipPerspectives rightly rejects.
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "relationship_basic_perspectives",
            strict: true,
            schema: buildRelationshipBasicResponseSchema(rr.report_id_a, rr.report_id_b),
          },
        },
      });
    } catch (e) {
      await releaseRateLimitSlot("relationship_basic", userId);
      throw e;
    }

    const choice = completion.choices[0];
    const raw = choice?.message.content?.trim() ?? "";
    // Content-free diagnostics for any generation failure below, so the
    // cause is visible in server logs (finish reason, output size, refusal,
    // and which field/axis was wrong) without logging generated text.
    const genMeta = `finish=${choice?.finish_reason ?? "none"} out_tokens=${completion.usage?.completion_tokens ?? "?"} refusal=${choice?.message.refusal ? "yes" : "no"} locale=${locale}`;
    let parsed: { perspectives?: Record<string, unknown> } | null = null;
    try {
      parsed = raw ? parseJsonObject<{ perspectives?: Record<string, unknown> }>(raw) : null;
    } catch {
      parsed = null;
    }
    if (!parsed?.perspectives) {
      await releaseRateLimitSlot("relationship_basic", userId);
      logServerError("relationship/analyze/basic", null, `generation_unparseable ${genMeta}`);
      return NextResponse.json(
        { error: messages.errors.analysisFailed },
        { status: 502 },
      );
    }

    const normalized = normalizeRelationshipPerspectives(
      parsed,
      rr.report_id_a,
      rr.report_id_b,
      labelA,
      labelB,
      locale,
    );
    if (!normalized) {
      await releaseRateLimitSlot("relationship_basic", userId);
      logServerError(
        "relationship/analyze/basic",
        null,
        `generation_shape_invalid ${genMeta} ${describePerspectivesShape(parsed, rr.report_id_a, rr.report_id_b)}`,
      );
      return NextResponse.json(
        { error: messages.errors.analysisFailed },
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
      await releaseRateLimitSlot("relationship_basic", userId);
      console.error("relationship/analyze/basic update failed");
      return NextResponse.json(
        { error: messages.errors.relationshipSaveFailed },
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
      { error: messages.errors.analysisFailed },
      { status: 500 },
    );
  }
}
