import { NextResponse } from "next/server";
import { logServerError } from "@/lib/security/safeLog";
import {
  getEssenceSelfLiteSystemPrompt,
  buildEssenceSelfLiteUserPrompt,
} from "@/lib/v2/prompts/essenceSelfLite";
import { normalizeLocale } from "@/lib/i18n/locale";
import { polishKoStringTree } from "@/lib/i18n/koToneGuards";
import { buildEssenceSelfLiteFallback } from "@/lib/v2/lite/fallbackEssence";
import { runLiteLlmJson } from "@/lib/v2/lite/runLiteLlm";
import type { EssenceSelfLiteReport } from "@/lib/v2/lite/types";
import {
  buildEssenceSelfLiteInput,
  type EssenceSelfLiteInputPayload,
} from "@/lib/v2/saju/essenceLiteInput";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  birthDate?: string;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
  language?: string;
  /** 클라이언트에서 미리 빌드한 입력 (선택) */
  essence_self_lite_input?: EssenceSelfLiteInputPayload;
};

/** docs/v2/prompt/02_Innate_Self_Lite_Prompt.md */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const birthDate = body.birthDate?.trim();
    if (!birthDate && !body.essence_self_lite_input) {
      return NextResponse.json(
        { error: "birthDate 또는 essence_self_lite_input이 필요합니다." },
        { status: 400 },
      );
    }

    const liteInput =
      body.essence_self_lite_input ??
      buildEssenceSelfLiteInput({
        birthDate: birthDate!,
        birthTime: body.birthTime ?? null,
        birthTimeUnknown: body.birthTimeUnknown === true,
      });

    const language = normalizeLocale(body.language);

    let report: EssenceSelfLiteReport;
    try {
      report = await runLiteLlmJson<EssenceSelfLiteReport>([
        { role: "system", content: getEssenceSelfLiteSystemPrompt(language) },
        {
          role: "user",
          content: buildEssenceSelfLiteUserPrompt({
            essence_self_lite_input: liteInput,
            language,
          }),
        },
      ]);
      report.report_type = "essence_self_lite";
      report.language = language;
    } catch (e) {
      logServerError("v2/lite/essence LLM fallback:", e, "internal_error");
      report = buildEssenceSelfLiteFallback(liteInput);
    }

    if (language === "ko-KR") {
      report = polishKoStringTree(report);
    }

    return NextResponse.json({ ok: true, report, source: "essence_self_lite" });
  } catch (e) {
    logServerError("v2/lite/essence:", e, "internal_error");
    return NextResponse.json(
      { error: "request failed" },
      { status: 500 },
    );
  }
}
