import { localeToPathPrefix, type Locale } from "@/lib/i18n/locale";

const DEFAULT_MESSAGE = "함께 관계 분석을 받아보자.";

/**
 * `locale` must be the SHARER's own current locale — the link should open
 * on whichever site (en-US or ko-KR) the person sharing it is using, not
 * whatever the recipient's browser happens to default to. Without a path
 * prefix, every invite/connect link silently opened on the en-US default
 * regardless of which site it was generated from.
 */
export function buildInviteUrl(token: string, locale: Locale, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${localeToPathPrefix(locale)}/invite?token=${encodeURIComponent(token)}`;
}

/** Personal connect link (separate, persistent, reusable system) -> /connect. */
export function buildConnectUrl(token: string, locale: Locale, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${localeToPathPrefix(locale)}/connect?token=${encodeURIComponent(token)}`;
}

export function inviteShareText(url: string): string {
  return `${DEFAULT_MESSAGE}\n${url}`;
}

export async function copyInviteLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

export function openWhatsAppShare(url: string) {
  const text = encodeURIComponent(inviteShareText(url));
  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
}

/** iMessage / SMS */
export function openSmsShare(url: string) {
  const body = encodeURIComponent(inviteShareText(url));
  window.location.href = `sms:?&body=${body}`;
}

export function openGoogleChatShare(url: string) {
  const text = encodeURIComponent(inviteShareText(url));
  window.open(
    `https://mail.google.com/chat/u/0/#chat/new?message=${text}`,
    "_blank",
    "noopener,noreferrer",
  );
}

export async function nativeShareInvite(url: string): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share({
      title: "친구 초대",
      text: DEFAULT_MESSAGE,
      url,
    });
    return true;
  } catch {
    return false;
  }
}
