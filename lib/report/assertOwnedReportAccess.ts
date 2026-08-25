import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";

export type ReportOwnerRow = {
  id: string;
  clerk_user_id?: string | null;
};

/** User-facing — message text only, resolved against the request's locale (default en-US). No change to status codes or access decisions. */
function errorPayloads(locale?: Locale | string) {
  const m = getMessages(normalizeLocale(locale ?? DEFAULT_LOCALE)).errors;
  return {
    invalidRequest: { error: m.invalidRequest } as const,
    unauth: { error: m.unauthorized } as const,
    forbidden: { error: m.forbidden } as const,
    notFound: { error: m.notFound } as const,
    unavailable: { error: m.serviceUnavailable } as const,
  };
}

/**
 * Read-only report ownership check.
 * - No INSERT/UPDATE/claim side effects.
 * - Guest UUID capability is fail-closed until signed guest session exists.
 * - Clerk user must own the report (clerk_user_id === userId).
 */
export async function assertOwnedReportAccess(
  supabase: SupabaseClient,
  reportId: string,
  userId: string | null,
  locale?: Locale | string,
): Promise<
  | { report: ReportOwnerRow; error?: undefined }
  | { report?: undefined; error: NextResponse }
> {
  const payloads = errorPayloads(locale);
  const id = typeof reportId === "string" ? reportId.trim() : "";
  if (!id) {
    return {
      error: NextResponse.json(payloads.invalidRequest, { status: 400 }),
    };
  }

  if (!userId && process.env.NODE_ENV !== "development") {
    return {
      error: NextResponse.json(payloads.unauth, { status: 401 }),
    };
  }

  const { data: report, error: repErr } = await supabase
    .from("reports")
    .select("id, clerk_user_id")
    .eq("id", id)
    .maybeSingle();

  if (repErr) {
    console.info("[ownership] report_lookup_failed");
    return {
      error: NextResponse.json(payloads.unavailable, { status: 503 }),
    };
  }
  if (!report?.id) {
    return {
      error: NextResponse.json(payloads.notFound, { status: 404 }),
    };
  }

  const ownerId = (report as ReportOwnerRow).clerk_user_id;
  if (process.env.NODE_ENV === "development" || ownerId == null || ownerId === userId) {
    return { report: report as ReportOwnerRow };
  }
  return {
    error: NextResponse.json(payloads.forbidden, { status: 403 }),
  };

  return { report: report as ReportOwnerRow };
}

function assertParticipant(
  viewerReportId: string,
  reportIdA: string,
  reportIdB: string,
  locale?: Locale | string,
): NextResponse | null {
  const payloads = errorPayloads(locale);
  const id = viewerReportId.trim();
  if (!id) {
    return NextResponse.json(payloads.invalidRequest, { status: 400 });
  }
  if (id !== reportIdA && id !== reportIdB) {
    return NextResponse.json(payloads.forbidden, { status: 403 });
  }
  return null;
}

/**
 * Relationship PII APIs: Clerk owns viewer report AND viewer is participant.
 */
export async function assertOwnedViewerParticipantAccess(
  supabase: SupabaseClient,
  userId: string | null,
  viewerReportId: string,
  reportIdA: string,
  reportIdB: string,
  locale?: Locale | string,
): Promise<NextResponse | null> {
  const ownership = await assertOwnedReportAccess(
    supabase,
    viewerReportId,
    userId,
    locale,
  );
  if (ownership.error) return ownership.error;
  return assertParticipant(viewerReportId, reportIdA, reportIdB, locale);
}

/**
 * @deprecated Prefer assertOwnedReportAccess.
 * Fail-closed: no guest UUID, no auto-claim.
 */
export async function assertGuestOrOwnerReportAccess(
  supabase: SupabaseClient,
  reportId: string,
  userId: string | null,
  locale?: Locale | string,
): Promise<
  | { report: ReportOwnerRow; error?: undefined }
  | { report?: undefined; error: NextResponse }
> {
  return assertOwnedReportAccess(supabase, reportId, userId, locale);
}
