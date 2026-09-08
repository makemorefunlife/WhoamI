import type { SupabaseClient } from "@supabase/supabase-js";
import { createInviteToken } from "@/lib/security/inviteToken";
import { partnerNameFromReportRow } from "@/lib/relationship/resolvePartnerDisplayName";

/**
 * Get-or-create the current user's one persistent, reusable connect link.
 * Never creates a second row for the same report — the table's PK is
 * report_id, so this is a plain upsert-if-missing.
 */
export async function getOrCreatePersonalConnectLink(
  supabase: SupabaseClient,
  reportId: string,
): Promise<{ token: string }> {
  const { data: existing } = await supabase
    .from("personal_connect_links")
    .select("token")
    .eq("report_id", reportId)
    .maybeSingle();

  if (existing?.token) {
    return { token: existing.token };
  }

  const token = createInviteToken();
  const { data: inserted, error } = await supabase
    .from("personal_connect_links")
    .insert({ report_id: reportId, token })
    .select("token")
    .single();

  if (error) {
    // Lost a race with a concurrent create for the same report — read back
    // whichever token actually won, rather than erroring the user out.
    const { data: raced } = await supabase
      .from("personal_connect_links")
      .select("token")
      .eq("report_id", reportId)
      .maybeSingle();
    if (raced?.token) return { token: raced.token };
    throw error;
  }

  return { token: inserted.token };
}

/** Rotate to a brand-new token; the old one stops resolving immediately. */
export async function resetPersonalConnectLink(
  supabase: SupabaseClient,
  reportId: string,
): Promise<{ token: string }> {
  const token = createInviteToken();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("personal_connect_links")
    .upsert(
      { report_id: reportId, token, reset_at: nowIso },
      { onConflict: "report_id" },
    )
    .select("token")
    .single();

  if (error) throw error;
  return { token: data.token };
}

/**
 * Resolve a connect link token to its owner's display name — shared by
 * /api/connect/resolve (client-side landing page copy) and
 * app/connect/page.tsx's generateMetadata (server-side OG/share preview),
 * so both surfaces agree on exactly what a token resolves to.
 *
 * Returns `undefined` for an unknown/reset token (callers must not
 * distinguish that from "never existed" — see /api/connect/resolve's doc
 * comment on not leaking which tokens are real) vs `null` for a *valid*
 * token whose owner has only a generic/empty name — these are not the same
 * thing: a valid token with no real name is still a valid connect link, just
 * one that needs the caller's own fallback ("a friend").
 */
export async function resolveConnectLinkOwnerName(
  supabase: SupabaseClient,
  token: string,
): Promise<string | null | undefined> {
  const { data: link } = await supabase
    .from("personal_connect_links")
    .select("report_id")
    .eq("token", token)
    .maybeSingle();
  if (!link) return undefined;

  const { data: report } = await supabase
    .from("reports")
    .select("name")
    .eq("id", link.report_id)
    .maybeSingle();

  return partnerNameFromReportRow(report?.name);
}
