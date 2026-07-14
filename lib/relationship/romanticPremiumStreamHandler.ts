import type OpenAI from "openai";
import { logServerError } from "@/lib/security/safeLog";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  runRomanticSajuDeepAnalysisStreaming,
  type RomanticSajuDeepRunParams,
} from "@/lib/prompts/relationshipPremium/romanticSajuDeep";
import { persistRomanticPremiumResult } from "@/lib/relationship/persistRomanticPremiumResult";
import {
  encodePremiumStreamLine,
  ROMANTIC_PREMIUM_STREAM_CONTENT_TYPE,
  type RomanticPremiumStreamComplete,
} from "@/lib/relationship/premiumStream";
import {
  RELATIONSHIP_PREMIUM_ANALYSIS_FAILED_MESSAGE,
  RELATIONSHIP_PREMIUM_STREAM_ABORTED_MESSAGE,
} from "@/lib/relationship/relationshipPremiumGuard";
import type { ResultPremiumByKind } from "@/lib/relationship/relationshipKind";

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

export function createRomanticPremiumStreamResponse(
  openai: OpenAI,
  params: {
    analysisParams: RomanticSajuDeepRunParams;
    relationshipReportId: string;
    viewerReportId: string;
    byKind: ResultPremiumByKind;
    supabase: SupabaseClient;
  },
  options?: { abortSignal?: AbortSignal },
): Response {
  const abortSignal = options?.abortSignal;
  let streamClosed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (chunk: Uint8Array) => {
        if (streamClosed) return;
        try {
          controller.enqueue(chunk);
        } catch {
          streamClosed = true;
        }
      };
      const closeStream = () => {
        if (streamClosed) return;
        streamClosed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const onClientAbort = () => {
        closeStream();
      };
      abortSignal?.addEventListener("abort", onClientAbort, { once: true });

      try {
        if (abortSignal?.aborted) {
          return;
        }

        const payload = await runRomanticSajuDeepAnalysisStreaming(
          openai,
          params.analysisParams,
          {
            onPrelude: (prelude) => {
              if (abortSignal?.aborted) return;
              enqueue(
                encodePremiumStreamLine({
                  type: "prelude",
                  ...prelude,
                }),
              );
            },
            onDelta: (content) => {
              if (abortSignal?.aborted || !content) return;
              enqueue(encodePremiumStreamLine({ type: "delta", content }));
            },
          },
          { abortSignal },
        );

        if (abortSignal?.aborted) {
          return;
        }

        const persist = await persistRomanticPremiumResult(params.supabase, {
          relationshipReportId: params.relationshipReportId,
          viewerReportId: params.viewerReportId,
          byKind: params.byKind,
          romanticPayload: payload,
        });

        if (!persist.ok) {
          enqueue(
            encodePremiumStreamLine({
              type: "error",
              message: persist.userMessage,
            }),
          );
          closeStream();
          return;
        }

        const complete: RomanticPremiumStreamComplete = {
          type: "complete",
          relationship_kind: "romantic",
          result_premium: payload,
        };
        enqueue(encodePremiumStreamLine(complete));
        closeStream();
      } catch (e) {
        if (isAbortError(e) || abortSignal?.aborted) {
          console.info("romanticPremiumStreamHandler: client disconnected");
          closeStream();
          return;
        }
        logServerError("romanticPremiumStreamHandler:", e, "internal_error");
        enqueue(
          encodePremiumStreamLine({
            type: "error",
            message: RELATIONSHIP_PREMIUM_ANALYSIS_FAILED_MESSAGE,
          }),
        );
        closeStream();
      } finally {
        abortSignal?.removeEventListener("abort", onClientAbort);
      }
    },
    cancel() {
      streamClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": ROMANTIC_PREMIUM_STREAM_CONTENT_TYPE,
      "Cache-Control": "no-store",
    },
  });
}

export { RELATIONSHIP_PREMIUM_STREAM_ABORTED_MESSAGE };
