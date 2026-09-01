import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { fetchRelationshipReportByIdSafe } from "@/lib/relationship/relationshipReportQuery";
import { resolveShareRecipient } from "@/lib/relationship/reportShare/resolveShareRecipient";

/**
 * Report-sharing owner check: the caller must own `ownerReportId`, and
 * `ownerReportId` must actually be a participant of `relationshipReportId`
 * (prevents sharing someone else's relationship report). Resolves the other
 * participant as the only valid share recipient.
 */
export async function assertShareOwnerAccess(
  supabase: SupabaseClient,
  userId: string | null,
  relationshipReportId: string,
  ownerReportId: string,
  locale?: Locale | string,
): Promise<
  | { recipientReportId: string; error?: undefined }
  | { recipientReportId?: undefined; error: NextResponse }
> {
  const messages = getMessages(normalizeLocale(locale ?? DEFAULT_LOCALE));

  const ownership = await assertOwnedReportAccess(supabase, ownerReportId, userId, locale);
  if (ownership.error) return { error: ownership.error };

  const { row: rr, error } = await fetchRelationshipReportByIdSafe(
    supabase,
    relationshipReportId,
  );
  if (error || !rr) {
    return {
      error: NextResponse.json({ error: messages.errors.notFound }, { status: 404 }),
    };
  }
  const recipientReportId = resolveShareRecipient(rr, ownerReportId);
  if (!recipientReportId) {
    return {
      error: NextResponse.json({ error: messages.errors.forbidden }, { status: 403 }),
    };
  }

  return { recipientReportId };
}
