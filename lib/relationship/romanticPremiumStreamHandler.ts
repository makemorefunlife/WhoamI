import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  runRomanticSajuDeepAnalysisStreaming,
  type RomanticSajuDeepRunParams,
} from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { insertRelationshipAnalysisLog } from "@/lib/relationship/analysisLog";
import {
  encodePremiumStreamLine,
  ROMANTIC_PREMIUM_STREAM_CONTENT_TYPE,
  type RomanticPremiumStreamComplete,
} from "@/lib/relationship/premiumStream";
import type { ResultPremiumByKind } from "@/lib/relationship/relationshipKind";
import { updateRelationshipReportSafe } from "@/lib/relationship/relationshipReportQuery";

export function createRomanticPremiumStreamResponse(
  openai: OpenAI,
  params: {
    analysisParams: RomanticSajuDeepRunParams;
    relationshipReportId: string;
    viewerReportId: string;
    kind: "romantic";
    byKind: ResultPremiumByKind;
    supabase: SupabaseClient;
  },
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (chunk: Uint8Array) => controller.enqueue(chunk);
      try {
        const payload = await runRomanticSajuDeepAnalysisStreaming(
          openai,
          params.analysisParams,
          {
            onPrelude: (prelude) => {
              enqueue(
                encodePremiumStreamLine({
                  type: "prelude",
                  ...prelude,
                }),
              );
            },
            onDelta: (content) => {
              if (!content) return;
              enqueue(encodePremiumStreamLine({ type: "delta", content }));
            },
          },
        );

        const romanticPayload = payload;
        const nextByKind: ResultPremiumByKind = {
          ...params.byKind,
          romantic: romanticPayload,
        };

        const { error: upErr } = await updateRelationshipReportSafe(
          params.supabase,
          params.relationshipReportId,
          {
            result_premium_by_kind: nextByKind,
            relationship_kind: params.kind,
          },
          { result_premium: romanticPayload },
        );

        if (upErr) {
          enqueue(
            encodePremiumStreamLine({
              type: "error",
              message: upErr.message,
            }),
          );
          controller.close();
          return;
        }

        if (params.viewerReportId) {
          await insertRelationshipAnalysisLog(params.supabase, {
            relationshipReportId: params.relationshipReportId,
            viewerReportId: params.viewerReportId,
            relationshipKind: params.kind,
            analysisLevel: "premium",
            resultFormat: ROMANTIC_SAJU_DEEP_FORMAT,
            payload: romanticPayload,
          });
        }

        const complete: RomanticPremiumStreamComplete = {
          type: "complete",
          relationship_kind: "romantic",
          result_premium: romanticPayload,
        };
        enqueue(encodePremiumStreamLine(complete));
        controller.close();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "관계 심화 분석 스트림 실패";
        console.error("romanticPremiumStreamHandler:", e);
        enqueue(encodePremiumStreamLine({ type: "error", message }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": ROMANTIC_PREMIUM_STREAM_CONTENT_TYPE,
      "Cache-Control": "no-store",
    },
  });
}
