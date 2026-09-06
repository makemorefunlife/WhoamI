import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locale";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";

/**
 * Abandoned-lock cutoff — comfortably past the premium route's own
 * maxDuration (300s), so a request that crashed/timed out before releasing
 * its lock doesn't permanently deadlock that (relationship, kind, locale).
 */
const STALE_LOCK_MS = 6 * 60 * 1000;

export type AcquireLockResult =
  | { ok: true; lockId: string }
  | { ok: false; reason: "in_progress" }
  | { ok: false; reason: "error" };

/**
 * Acquire the single in-flight generation slot for one
 * (relationship_report_id, kind, locale) triple. Never blocks a different
 * kind or locale for the same relationship — each gets its own lock row.
 *
 * `kind`/`locale` are typed as the canonical union types (RelationshipKind /
 * Locale), not raw strings — callers must pass already-normalized values
 * (parseRelationshipKind's result, the route's already-resolved `locale`),
 * never a client-supplied string directly. This is what keeps a product
 * name like "marriage" from ever reaching this table as a lock key instead
 * of the canonical "cohabitation" (see relationshipKind.ts's
 * MARRIAGE_PRODUCT_KIND comment) — enforced again at the DB layer by this
 * table's own CHECK constraints as defense in depth.
 */
export async function acquireRelationshipPremiumGenerationLock(
  supabase: SupabaseClient,
  params: {
    relationshipReportId: string;
    kind: RelationshipKind;
    locale: Locale;
    requestedByReportId: string;
  },
): Promise<AcquireLockResult> {
  const { relationshipReportId, kind, locale, requestedByReportId } = params;

  const first = await supabase
    .from("relationship_premium_generation_locks")
    .insert({
      relationship_report_id: relationshipReportId,
      kind,
      locale,
      requested_by_report_id: requestedByReportId,
    })
    .select("id")
    .maybeSingle();

  if (!first.error && first.data?.id) {
    return { ok: true, lockId: first.data.id as string };
  }

  // 23505 = unique_violation on (relationship_report_id, kind, locale) —
  // someone else is already generating this exact target. Check whether
  // that lock is stale (its holder crashed/timed out without releasing)
  // and, if so, steal it via a conditional UPDATE — itself atomic under
  // Postgres row locking, so two concurrent steal attempts can't both win.
  if (first.error?.code === "23505") {
    const staleCutoff = new Date(Date.now() - STALE_LOCK_MS).toISOString();
    const stolen = await supabase
      .from("relationship_premium_generation_locks")
      .update({
        started_at: new Date().toISOString(),
        requested_by_report_id: requestedByReportId,
      })
      .eq("relationship_report_id", relationshipReportId)
      .eq("kind", kind)
      .eq("locale", locale)
      .lt("started_at", staleCutoff)
      .select("id")
      .maybeSingle();

    if (!stolen.error && stolen.data?.id) {
      return { ok: true, lockId: stolen.data.id as string };
    }
    if (stolen.error) {
      return { ok: false, reason: "error" };
    }
    // 0 rows: the existing lock isn't stale yet — a real in-flight generation.
    return { ok: false, reason: "in_progress" };
  }

  // Any other insert error (network/DB blip) is a real failure, not a
  // confirmed "someone else is generating" — surfaced distinctly so the
  // route doesn't tell the user to wait for a generation that was never
  // actually started.
  return { ok: false, reason: "error" };
}

/** Releases by lock id (never by key) so a stolen-and-reacquired lock is never deleted by its original holder. */
export async function releaseRelationshipPremiumGenerationLock(
  supabase: SupabaseClient,
  lockId: string,
): Promise<void> {
  await supabase
    .from("relationship_premium_generation_locks")
    .delete()
    .eq("id", lockId);
}
