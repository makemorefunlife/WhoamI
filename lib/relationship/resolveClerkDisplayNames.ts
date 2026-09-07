import { clerkClient } from "@clerk/nextjs/server";
import { sanitizeDisplayNameInput } from "@/lib/report/displayNameInput";
import { logServerError } from "@/lib/security/safeLog";

const MAX_BATCH = 100;

/**
 * Batch-resolve Clerk `publicMetadata.displayName` for a set of
 * clerk_user_ids — the canonical display name source since the Sep 2026
 * architecture change decoupled it from `reports.name` (see
 * app/api/account/display-name/route.ts's doc comment). publicMetadata is,
 * by Clerk's own design, readable across users (unlike privateMetadata),
 * which is exactly what lets a relationship's OTHER participant see this
 * account's real name — nothing in `reports.name` reflects it for a
 * self-report (that column is only ever written for `partner_manual`
 * contacts, which have no Clerk account at all).
 *
 * Best-effort: a Clerk API failure resolves to an empty map rather than
 * throwing, so a partner name always still falls back to
 * resolvePartnerDisplayName's existing report/log/generic chain.
 */
export async function resolveClerkDisplayNamesByUserId(
  clerkUserIds: (string | null | undefined)[],
): Promise<Record<string, string>> {
  const unique = [...new Set(clerkUserIds.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return {};

  const result: Record<string, string> = {};
  try {
    const client = await clerkClient();
    for (let i = 0; i < unique.length; i += MAX_BATCH) {
      const batch = unique.slice(i, i + MAX_BATCH);
      const { data } = await client.users.getUserList({
        userId: batch,
        limit: batch.length,
      });
      for (const user of data) {
        const name = sanitizeDisplayNameInput(
          (user.publicMetadata as Record<string, unknown> | null)?.displayName,
        );
        if (name) result[user.id] = name;
      }
    }
  } catch (e) {
    logServerError("resolveClerkDisplayNamesByUserId", e, "internal_error");
    return {};
  }
  return result;
}
