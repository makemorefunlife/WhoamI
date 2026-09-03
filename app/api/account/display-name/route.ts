import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { sanitizeDisplayNameInput } from "@/lib/report/displayNameInput";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";

export const runtime = "nodejs";

/**
 * Canonical display_name read/write — user.publicMetadata.displayName on
 * Clerk's own User object. Deliberately independent of any `reports` row:
 * display name is an account attribute, not a report attribute, so it
 * must survive report recreation/deletion/future versioning untouched
 * (see the architecture audit this replaced reports.name over). Auth-only,
 * no reportId, no ownership check beyond the caller's own Clerk session.
 */
export async function GET(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: messages.errors.unauthorized }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const displayName = sanitizeDisplayNameInput(
      (user.publicMetadata as Record<string, unknown> | null)?.displayName,
    );

    return NextResponse.json({ displayName });
  } catch (e) {
    logServerError("account/display-name.get", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: messages.errors.unauthorized }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const displayName = sanitizeDisplayNameInput(body?.displayName);
    if (!displayName) {
      return NextResponse.json({ error: messages.errors.invalidRequest }, { status: 400 });
    }

    const client = await clerkClient();
    // updateUserMetadata performs a deep merge server-side — any other
    // publicMetadata keys are preserved untouched. Never use updateUser's
    // metadata param here, which replaces the whole object instead.
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { displayName },
    });

    return NextResponse.json({ ok: true, displayName });
  } catch (e) {
    logServerError("account/display-name.post", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
