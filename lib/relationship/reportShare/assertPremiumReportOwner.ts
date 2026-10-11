import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import { assertShareOwnerAccess } from "@/lib/relationship/reportShare/assertShareOwnerAccess";

export type OwnedPremiumReportRef = {
  id: string;
  relationship_report_id: string;
  owner_report_id: string;
  kind: string;
  locale: string;
};

/**
 * Share create / revoke / status gate (2026-10-11): the caller must be the
 * CREATOR of the exact report -- not just a participant of the relationship.
 *   1. assertShareOwnerAccess: caller owns ownerReportId, which is a
 *      participant; resolves the other participant as the only recipient.
 *   2. the relationship_premium_reports row (by id, or by
 *      relationship+ownerReport+kind+locale) has owner_report_id =
 *      ownerReportId AND owner_clerk_user_id = the signed-in user.
 * Legacy reports (no creator record) never pass step 2, so nobody can open a
 * NEW share on them (existing legacy share rows are left untouched).
 */
export async function assertPremiumReportOwner(
  supabase: SupabaseClient,
  params: {
    userId: string | null;
    relationshipReportId: string;
    ownerReportId: string;
    kind: string;
    locale: Locale | string;
    premiumReportId?: string | null;
  },
): Promise<
  | { recipientReportId: string; report: OwnedPremiumReportRef; error?: undefined }
  | { recipientReportId?: undefined; report?: undefined; error: NextResponse }
> {
  const locale = normalizeLocale(params.locale ?? DEFAULT_LOCALE);
  const messages = getMessages(locale);
  const base = await assertShareOwnerAccess(
    supabase,
    params.userId,
    params.relationshipReportId,
    params.ownerReportId,
    locale,
  );
  if (base.error) return { error: base.error };

  let q = supabase
    .from("relationship_premium_reports")
    .select("id, relationship_report_id, owner_report_id, owner_clerk_user_id, kind, locale")
    .eq("relationship_report_id", params.relationshipReportId)
    .eq("owner_report_id", params.ownerReportId);
  q = params.premiumReportId
    ? q.eq("id", params.premiumReportId)
    : q.eq("kind", params.kind).eq("locale", locale);
  const { data, error } = await q.maybeSingle();
  if (error) {
    return { error: NextResponse.json({ error: messages.errors.generic }, { status: 503 }) };
  }
  const row = data as (OwnedPremiumReportRef & { owner_clerk_user_id: string }) | null;
  if (!row || !params.userId || row.owner_clerk_user_id !== params.userId) {
    return {
      error: NextResponse.json(
        { error: messages.relationshipMap.reportShare.notOwner, code: "not_report_owner" },
        { status: 403 },
      ),
    };
  }
  return {
    recipientReportId: base.recipientReportId,
    report: {
      id: row.id,
      relationship_report_id: row.relationship_report_id,
      owner_report_id: row.owner_report_id,
      kind: row.kind,
      locale: row.locale,
    },
  };
}
