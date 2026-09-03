/** Clerk UserResource 호환 — 홈·리포트 표시 이름 */
export type ClerkUserLike = {
  fullName?: string | null;
  firstName?: string | null;
  primaryEmailAddress?: { emailAddress?: string } | null;
  externalAccounts?: readonly unknown[] | null;
  publicMetadata?: Record<string, unknown> | null;
} | null | undefined;

/**
 * Canonical display name: user.publicMetadata.displayName (Clerk-side,
 * independent of any reports row — see displayNameSync.ts). Empty/missing
 * → null, never a placeholder string, so callers can tell "not set yet"
 * apart from an actual value.
 */
export function getPublicDisplayName(user: ClerkUserLike): string | null {
  const raw = user?.publicMetadata?.displayName;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/**
 * 표시 이름: fullName → firstName → 이메일 @ 앞부분 → "나"
 *
 * publicMetadata.displayName이 없을 때만 쓰는 폴백/최초 시드용 — 설정된
 * displayName을 이 값이 다시 덮어써서는 안 됨 (see displayNameSync.ts).
 */
export function resolveClerkDisplayName(user: ClerkUserLike): string {
  const fullName = user?.fullName?.trim();
  if (fullName) return fullName;

  const firstName = user?.firstName?.trim();
  if (firstName) return firstName;

  const email = user?.primaryEmailAddress?.emailAddress?.trim();
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }

  return "나";
}

/** Google 등 OAuth로 가입한 계정인지 — externalAccounts가 하나라도 있으면 true. */
export function hasOAuthAccount(user: ClerkUserLike): boolean {
  return Boolean(user?.externalAccounts && user.externalAccounts.length > 0);
}
