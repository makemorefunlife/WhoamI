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
type ClerkProfile = { displayName: string | null; avatarUrl: string | null };

/**
 * Single batched Clerk API call per chunk, reused by both
 * resolveClerkDisplayNamesByUserId and resolveClerkProfilesByUserId — a
 * caller that wants both the name AND the avatar (list/route.ts) gets them
 * from the SAME getUserList round trip, not two.
 */
async function fetchClerkProfilesByUserId(
  clerkUserIds: (string | null | undefined)[],
  logContext: string,
): Promise<Record<string, ClerkProfile>> {
  const unique = [...new Set(clerkUserIds.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return {};

  const result: Record<string, ClerkProfile> = {};
  try {
    const client = await clerkClient();
    for (let i = 0; i < unique.length; i += MAX_BATCH) {
      const batch = unique.slice(i, i + MAX_BATCH);
      const { data } = await client.users.getUserList({
        userId: batch,
        limit: batch.length,
      });
      for (const user of data) {
        const displayName = sanitizeDisplayNameInput(
          (user.publicMetadata as Record<string, unknown> | null)?.displayName,
        );
        // hasImage gates this: Clerk always returns SOME imageUrl (a
        // generated placeholder for accounts with no real photo), and
        // showing that generated placeholder would be worse than this
        // app's own initials circle — so no real photo means no avatarUrl,
        // and callers fall back to initials exactly as before.
        const avatarUrl = user.hasImage && user.imageUrl ? user.imageUrl : null;
        result[user.id] = { displayName: displayName || null, avatarUrl };
      }
    }
  } catch (e) {
    logServerError(logContext, e, "internal_error");
    return {};
  }
  return result;
}

export async function resolveClerkDisplayNamesByUserId(
  clerkUserIds: (string | null | undefined)[],
): Promise<Record<string, string>> {
  const profiles = await fetchClerkProfilesByUserId(clerkUserIds, "resolveClerkDisplayNamesByUserId");
  const result: Record<string, string> = {};
  for (const [id, p] of Object.entries(profiles)) {
    if (p.displayName) result[id] = p.displayName;
  }
  return result;
}

/**
 * Batch-resolve BOTH the display name and a real profile photo URL (e.g.
 * the Google avatar for a Google-OAuth account) for a set of
 * clerk_user_ids, in one Clerk API call.
 *
 * IMPORTANT: never call this with a partner_manual report's clerk_user_id —
 * that id belongs to the OWNER (see this file's other doc comment and the
 * Sep 2026 name-leak fix), not the manual contact, so resolving it here
 * would show the owner's own name/photo on their friend's card.
 */
export async function resolveClerkProfilesByUserId(
  clerkUserIds: (string | null | undefined)[],
): Promise<Record<string, ClerkProfile>> {
  return fetchClerkProfilesByUserId(clerkUserIds, "resolveClerkProfilesByUserId");
}
