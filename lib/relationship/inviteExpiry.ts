/**
 * One-time friend invites (`invites`, /invite?token=…) expire 30 days after
 * they are created if nobody used them. This is only about the unused link:
 * relationships and participant data created through an invite keep their
 * own retention rules.
 *
 * Personal connect links (/connect?token=…) are separate and do not expire.
 */
export const INVITE_TTL_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO timestamp before which an unused invite is expired. */
export function inviteExpiryCutoffIso(now: Date = new Date()): string {
  return new Date(now.getTime() - INVITE_TTL_DAYS * DAY_MS).toISOString();
}

export function isInviteExpired(createdAt: string | null | undefined, now: Date = new Date()): boolean {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  if (!Number.isFinite(t)) return false;
  return t <= now.getTime() - INVITE_TTL_DAYS * DAY_MS;
}
