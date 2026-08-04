import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import {
  parseBirthDate,
  parseBirthTime,
  readJsonBodyLimited,
} from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";

export async function POST(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage:
      req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const parsed = await readJsonBodyLimited(req);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as Record<string, unknown>;

    const birthDate = parseBirthDate(body.birthDate);
    if (!birthDate.ok) return birthDate.response;
    const birthTime = parseBirthTime(body.birthTime);
    if (!birthTime.ok) return birthTime.response;

    const limited = await enforceRateLimit("saju", userId);
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

    const birthTimeUnknown =
      body.birthTimeUnknown === true || !birthTime.value;

    const bundle = calculateSajuBundle({
      birthDate: birthDate.value,
      birthTime: birthTime.value ?? undefined,
      birthTimeUnknown,
    });

    return NextResponse.json(toV1SajuApiPayload(bundle));
  } catch (error) {
    logServerError("saju", error);
    return NextResponse.json(
      { error: messages.errors.generic },
      { status: 500 },
    );
  }
}
