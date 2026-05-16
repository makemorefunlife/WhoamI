/** Clerk UserResource 호환 — 홈·리포트 표시 이름 */
export type ClerkUserLike = {
  fullName?: string | null;
  firstName?: string | null;
  primaryEmailAddress?: { emailAddress?: string } | null;
} | null | undefined;

/**
 * 표시 이름: fullName → firstName → 이메일 @ 앞부분 → "나"
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
