import { NextResponse } from "next/server";
import { logServerError } from "@/lib/security/safeLog";
import {
  CURRENT_SELF_LITE_SYSTEM,
  buildCurrentSelfLiteUserPrompt,
} from "@/lib/v2/prompts/currentSelfLite";
import { buildCurrentSelfLiteFallback } from "@/lib/v2/lite/fallbackCurrent";
import { runLiteLlmJson } from "@/lib/v2/lite/runLiteLlm";
import type { CurrentSelfLiteReport } from "@/lib/v2/lite/types";
import { buildLiteInterpretationHints } from "@/lib/v2/survey/scorer";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  profile?: CurrentSelfProfile;
  language?: string;
};

/** docs/v2/prompt/01_Current_Self_Lite_Prompt.md */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const profile = body.profile;
    if (!profile?.primary_axes) {
      return NextResponse.json(
        { error: "Current Self profile이 필요합니다." },
        { status: 400 },
      );
    }

    const hints = buildLiteInterpretationHints(profile);

    let report: CurrentSelfLiteReport;
    try {
      report = await runLiteLlmJson<CurrentSelfLiteReport>([
        { role: "system", content: CURRENT_SELF_LITE_SYSTEM },
        {
          role: "user",
          content: buildCurrentSelfLiteUserPrompt({
            profile,
            hints,
            language: body.language ?? "ko",
          }),
        },
      ]);
      report.report_type = "current_self_lite";
      report.language = body.language ?? "ko";
    } catch (e) {
      logServerError("v2/lite/current LLM fallback:", e, "internal_error");
      report = buildCurrentSelfLiteFallback(profile);
    }

    return NextResponse.json({ ok: true, report, source: "current_self_lite" });
  } catch (e) {
    logServerError("v2/lite/current:", e, "internal_error");
    return NextResponse.json(
      { error: "request failed" },
      { status: 500 },
    );
  }
}
