import { NextResponse } from "next/server";
import {
  INNATE_SELF_LITE_SYSTEM,
  buildInnateSelfLiteUserPrompt,
} from "@/lib/v2/prompts/innateSelfLite";
import { buildInnateSelfLiteFallback } from "@/lib/v2/lite/fallbackInnate";
import { runLiteLlmJson } from "@/lib/v2/lite/runLiteLlm";
import type { InnateSelfLiteReport } from "@/lib/v2/lite/types";
import {
  buildInnateSelfLiteInput,
  type InnateSelfLiteInputPayload,
} from "@/lib/v2/saju/innateLiteInput";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  birthDate?: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  language?: string;
  /** 클라이언트에서 미리 빌드한 입력 (선택) */
  innate_self_lite_input?: InnateSelfLiteInputPayload;
};

/** docs/v2/prompt/02_Innate_Self_Lite_Prompt.md */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const birthDate = body.birthDate?.trim();
    if (!birthDate && !body.innate_self_lite_input) {
      return NextResponse.json(
        { error: "birthDate 또는 innate_self_lite_input이 필요합니다." },
        { status: 400 },
      );
    }

    const liteInput =
      body.innate_self_lite_input ??
      buildInnateSelfLiteInput({
        birthDate: birthDate!,
        birthTime: body.birthTime ?? null,
        birthTimeUnknown: body.birthTimeUnknown === true,
      });

    let report: InnateSelfLiteReport;
    try {
      report = await runLiteLlmJson<InnateSelfLiteReport>([
        { role: "system", content: INNATE_SELF_LITE_SYSTEM },
        {
          role: "user",
          content: buildInnateSelfLiteUserPrompt({
            innate_self_lite_input: liteInput,
            language: body.language ?? "ko",
          }),
        },
      ]);
      report.report_type = "innate_self_lite";
      report.language = body.language ?? "ko";
    } catch (e) {
      console.warn("v2/lite/innate LLM fallback:", e);
      report = buildInnateSelfLiteFallback(liteInput);
    }

    return NextResponse.json({ ok: true, report, source: "innate_self_lite" });
  } catch (e) {
    console.error("v2/lite/innate:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "분석 실패" },
      { status: 500 },
    );
  }
}
