import type { SupabaseClient } from "@supabase/supabase-js";
import { createInviteToken } from "@/lib/security/inviteToken";

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
