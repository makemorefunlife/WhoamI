import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import {
  handleRelationshipPremium,
  memberPremiumRequester,
} from "@/lib/relationship/premiumGenerationHandler";

export const runtime = "nodejs";
// Heavy premium generation (several LLM calls): same cap as before.
export const maxDuration = 300;

/** Member relationship deep report: own credit, per-creator save (lib/relationship/premiumGenerationHandler.ts). */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    const locale = resolveRequestLocale({
      bodyLanguage: null,
      headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
    });
    return NextResponse.json({ error: getMessages(locale).errors.unauthorized }, { status: 401 });
  }
  return handleRelationshipPremium(req, memberPremiumRequester(userId));
}
