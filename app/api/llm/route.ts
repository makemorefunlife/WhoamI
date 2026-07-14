export const runtime = "nodejs";
export const maxDuration = 300;

import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  INTEGRATED_SYSTEM_PROMPT,
  buildIntegratedPhase1UserPrompt,
  buildIntegratedPhase2UserPrompt,
} from "../../../lib/prompts/integratedPremiumReport";
import { assertPremiumLlmAccess } from "../../../lib/report/llmPaymentGuard";
import { assertOwnedReportAccess } from "../../../lib/report/assertOwnedReportAccess";
import {
  createRouteSupabaseClient,
  SERVER_SUPABASE_CONFIG_ERROR,
} from "../../../lib/supabase/serverClient";
import { sajuDataToIntegratedSummary } from "../../../lib/report/formatEssenceAnalysisForIntegrated";
import { runIntegratedPremiumLlm } from "../../../lib/report/runIntegratedPremiumLlm";
import {
  enforceRateLimit,
  rateLimitResponse,
} from "../../../lib/security/rateLimit";
import {
  MAX_LLM_INPUT_CHARS,
  readJsonBodyLimited,
  requireUuid,
  stripClientTrustFields,
} from "../../../lib/security/requestValidation";
import { logServerError } from "../../../lib/security/safeLog";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const parsed = await readJsonBodyLimited(req, 256 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = stripClientTrustFields(
      (parsed.body && typeof parsed.body === "object"
        ? parsed.body
        : {}) as Record<string, unknown>,
    );
    const mode = body.mode;

    // ============================================================
    // 🔥 모드 1: 설문 세부 해석 (detailed_survey)
    // ============================================================
    if (mode === "detailed_survey") {
      return Response.json(
        {
          error:
            "detailed_survey(18문항) 모드는 종료되었습니다. v2 블루프린트를 이용해 주세요.",
        },
        { status: 410 },
      );
    }

    // ============================================================
    // 🔥 모드 2: 통합 보고서 (integrated)
    // ============================================================
    if (mode === "integrated") {
      const idCheck = requireUuid(body.reportId, "reportId");
      if (!idCheck.ok) return idCheck.response;

      const limited = enforceRateLimit("llm", userId);
      if (!limited.ok) return rateLimitResponse(limited);

      const supabase = createRouteSupabaseClient();
      if (!supabase) {
        return Response.json(
          { error: SERVER_SUPABASE_CONFIG_ERROR },
          { status: 500 },
        );
      }

      const access = await assertOwnedReportAccess(
        supabase,
        idCheck.value,
        userId,
      );
      if (access.error) return access.error;

      const guard = await assertPremiumLlmAccess(idCheck.value, "integrated");
      if (guard) return guard;

      const { detailedSurvey, sajuData, astrologyText, stream: wantStream } =
        body as {
          detailedSurvey?: unknown;
          sajuData?: unknown;
          astrologyText?: string | null;
          stream?: boolean;
        };

      const surveyLen =
        typeof detailedSurvey === "string"
          ? detailedSurvey.length
          : detailedSurvey != null
            ? JSON.stringify(detailedSurvey).length
            : 0;
      const sajuLen =
        sajuData == null
          ? 0
          : typeof sajuData === "string"
            ? sajuData.length
            : JSON.stringify(sajuData).length;
      const astroLen =
        typeof astrologyText === "string" ? astrologyText.trim().length : 0;

      if (
        surveyLen > MAX_LLM_INPUT_CHARS ||
        sajuLen > MAX_LLM_INPUT_CHARS ||
        astroLen > MAX_LLM_INPUT_CHARS
      ) {
        return Response.json({ error: "input too large" }, { status: 400 });
      }

      console.info("[premium-pipeline] server stage=integrated_llm_inputs", {
        survey_chars: surveyLen,
        saju_chars: sajuLen,
        astrology_chars: astroLen,
        stream: wantStream === true,
      });

      const surveyAnalysis =
        typeof detailedSurvey === "string"
          ? detailedSurvey
          : JSON.stringify(detailedSurvey ?? null, null, 2);
      const sajuSummary = sajuDataToIntegratedSummary(sajuData);
      const astrologyInterpretation =
        typeof astrologyText === "string" && astrologyText.trim()
          ? astrologyText.trim()
          : "(없음)";

      const phase1User = buildIntegratedPhase1UserPrompt(
        surveyAnalysis,
        sajuSummary,
        astrologyInterpretation,
      );

      const phase1Messages: ChatCompletionMessageParam[] = [
        { role: "system", content: INTEGRATED_SYSTEM_PROMPT },
        { role: "user", content: phase1User },
      ];

      const useStream = wantStream === true;

      if (useStream) {
        const encoder = new TextEncoder();
        const streamOut = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              let acc = "";
              const s1 = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: phase1Messages,
                temperature: 0.65,
                max_tokens: 8192,
                stream: true,
              });
              for await (const chunk of s1) {
                const c = chunk.choices[0]?.delta?.content ?? "";
                if (c) {
                  acc += c;
                  controller.enqueue(encoder.encode(c));
                }
              }
              controller.enqueue(encoder.encode("\n\n—\n\n"));
              const excerpt = acc.length > 12000 ? acc.slice(-12000) : acc;
              const phase2User = buildIntegratedPhase2UserPrompt(
                surveyAnalysis,
                sajuSummary,
                astrologyInterpretation,
                excerpt,
              );
              const s2 = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: INTEGRATED_SYSTEM_PROMPT },
                  { role: "user", content: phase2User },
                ],
                temperature: 0.65,
                max_tokens: 8192,
                stream: true,
              });
              for await (const chunk of s2) {
                const c = chunk.choices[0]?.delta?.content ?? "";
                if (c) controller.enqueue(encoder.encode(c));
              }
              controller.close();
            } catch (e) {
              controller.error(
                e instanceof Error ? e : new Error(String(e)),
              );
            }
          },
        });

        return new Response(streamOut, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      }

      const integrated = await runIntegratedPremiumLlm({
        surveyAnalysis,
        sajuSummary,
        astrologyInterpretation,
      });
      return Response.json({ report: integrated.report });
    }

    return Response.json(
      { error: "지원하지 않는 mode입니다. mode=integrated 를 사용하세요." },
      { status: 400 },
    );
  } catch (error) {
    logServerError("llm", error);
    return Response.json({ error: "LLM error" }, { status: 500 });
  }
}
